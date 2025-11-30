from flask_restful import Resource
from flask import request
from flask_security import auth_token_required, roles_required
from database import db
from models import parking_lot, parking_spot, reserve_parking_spot, User
from utils import api_response, handle_errors
from cache import cache
from datetime import datetime
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import io
import base64

class ParkingLotListAPI(Resource):
    @auth_token_required
    @roles_required('admin')
    @handle_errors
    def get(self):
        lots = parking_lot.query.all()

        data = [{
            'id': l.id, 'prime_location_name': l.prime_location_name,
            'address': l.address, 'pin_code': l.pin_code, 'price': l.price,
            'maximum_number_of_spots': l.maximum_number_of_spots,
            'available_spots': l.available_spots
        } for l in lots]
        return api_response(data=data, message='Lots retrieved.')
        
    @auth_token_required
    @roles_required('admin')
    @handle_errors
    def post(self):
        data = request.get_json() or {}
        req = ['prime_location_name', 'address', 'pin_code', 'price', 'maximum_number_of_spots']
        if not all(data.get(k) for k in req): return api_response(message='Missing fields.', status=400)
        
        if len(data['pin_code']) != 6 or " " in data['pin_code']:
            return api_response(message='PinCode must be 6 digits.', status=400)
        
        if parking_lot.query.filter_by(address=data['address']).first():
            return api_response(message='Address must be unique', status=409)
            
        new_lot = parking_lot(
            prime_location_name=data['prime_location_name'], address=data['address'],
            pin_code=data['pin_code'], price=int(data['price']),
            maximum_number_of_spots=int(data['maximum_number_of_spots']),
            available_spots=int(data['maximum_number_of_spots'])
        )
        db.session.add(new_lot)
        db.session.commit()
        
        spots = [parking_spot(status="Unoccupied", spot_number=i, lot_id=new_lot.id) 
                 for i in range(1, int(data['maximum_number_of_spots']) + 1)]
        db.session.add_all(spots)
        db.session.commit()
        
    
        cache.delete('admin_summary')
        
        return api_response(data={'id': new_lot.id}, message='Lot added.', status=201)

class ParkingLotAPI(Resource):
    @auth_token_required
    @roles_required('admin')
    @handle_errors
    def get(self, lot_id):
        lot = parking_lot.query.get(lot_id)
        if not lot: return api_response(message='Not found.', status=404)
        
        spots = parking_spot.query.filter_by(lot_id=lot_id).order_by(parking_spot.spot_number).all()
        spots_data = []
        for s in spots:
            info = {'id': s.id, 'spot_number': s.spot_number, 'status': s.status, 'booking_details': None}
            if s.status == "Occupied":
                b = reserve_parking_spot.query.filter_by(parking_spot_id=s.id, leaving_time=None).first()
                if b:
                    u = User.query.get(b.user_id)
                    info['booking_details'] = {
                        'username': u.username, 'email': u.email, 'vehicle_number': b.vehicle_number,
                        'parking_time': b.parking_time.isoformat()
                    }
            spots_data.append(info)
            
        return api_response(data={
            'id': lot.id, 'prime_location_name': lot.prime_location_name,
            'address': lot.address, 'pin_code': lot.pin_code,
            'price': lot.price,
            'maximum_number_of_spots': lot.maximum_number_of_spots,
            'available_spots': lot.available_spots, 'spots': spots_data
        })

    @auth_token_required
    @roles_required('admin')
    @handle_errors
    def put(self, lot_id):
        lot = parking_lot.query.get(lot_id)
        if not lot: return api_response(message='Not found.', status=404)
        
     
        if parking_spot.query.filter_by(lot_id=lot_id, status="Occupied").first():
            return api_response(message='Cannot edit occupied lot.', status=400)
            
        data = request.get_json() or {}
        
       
        new_address = data.get('address', lot.address)
        if new_address != lot.address:
            if parking_lot.query.filter_by(address=new_address).first():
                return api_response(message='Address must be unique', status=409)

        
        lot.prime_location_name = data.get('prime_location_name', lot.prime_location_name)
        lot.address = new_address
        lot.pin_code = data.get('pin_code', lot.pin_code)
        lot.price = int(data.get('price', lot.price))
        
        
        old_max = lot.maximum_number_of_spots
        new_max = int(data.get('maximum_number_of_spots', old_max))
        
        if new_max != old_max:
            if new_max <= 0: 
                return api_response(message="Max spots must be greater then zero", status=400)
            
            hist_count = reserve_parking_spot.query.join(parking_spot).filter(
                parking_spot.lot_id == lot_id
            ).with_entities(reserve_parking_spot.parking_spot_id).distinct().count()

            if new_max < hist_count:
                 return api_response(message='Cannot reduce size below historical usage.', status=400)

            diff = new_max - old_max
            lot.maximum_number_of_spots = new_max
            lot.available_spots = new_max 
            
            if diff > 0:
                last = parking_spot.query.filter_by(lot_id=lot_id).order_by(parking_spot.spot_number.desc()).first()
                start = (last.spot_number if last else 0) + 1
                for i in range(diff):
                    db.session.add(parking_spot(status="Unoccupied", spot_number=start + i, lot_id=lot_id))
            else:
                spots_to_del = parking_spot.query.filter_by(lot_id=lot_id).order_by(parking_spot.spot_number.desc()).limit(abs(diff)).all()
                for s in spots_to_del:
                    db.session.delete(s)
        
        db.session.commit()
        
        
        cache.delete('admin_summary')
        
        return api_response(message='Updated successfully.')

    @auth_token_required
    @roles_required('admin')
    @handle_errors
    def delete(self, lot_id):
        lot = parking_lot.query.get(lot_id)
        if not lot: return api_response(message='Not found.', status=404)
        if parking_spot.query.filter_by(lot_id=lot_id, status="Occupied").first():
            return api_response(message='Cannot delete occupied lot.', status=400)
            
       
        has_history = reserve_parking_spot.query.join(parking_spot).filter(parking_spot.lot_id == lot_id).first()
        if has_history:
            return api_response(message='Cannot delete lot with history.', status=400)
        
        parking_spot.query.filter_by(lot_id=lot_id).delete()
        db.session.delete(lot)
        db.session.commit()
        
       
        cache.delete('admin_summary')
        
        return api_response(message='Deleted successfully.')

class AdminSummaryAPI(Resource):
    @auth_token_required
    @roles_required('admin')
    @cache.cached(timeout=60, key_prefix='admin_summary')
    @handle_errors
    def get(self):
        bookings = reserve_parking_spot.query.all()
        lots = parking_lot.query.all()
        
       
        all_spots = parking_spot.query.all()
        spot_map = {s.id: s for s in all_spots}

        rev = sum(b.total_cost for b in bookings if b.total_cost)
        active = sum(1 for b in bookings if not b.leaving_time)
        
        history = []
        for b in bookings:
            s = spot_map.get(b.parking_spot_id)
            l = parking_lot.query.get(s.lot_id) if s else None
            u = User.query.get(b.user_id)
            history.append({
                'id': b.id, 'user_name': u.username if u else 'N/A',
                'vehicle_number': b.vehicle_number, 'lot_name': l.prime_location_name if l else 'N/A',
                'spot_number': s.spot_number if s else 'N/A',
                'parking_time': b.parking_time.isoformat() if b.parking_time else None,
                'status': 'completed' if b.leaving_time else 'active',
                'total_cost': b.total_cost
            })

        lot_stats = []
        for l in lots:
            # UPDATED: Filter using the spot map
            l_books = [b for b in bookings if spot_map.get(b.parking_spot_id) and spot_map[b.parking_spot_id].lot_id == l.id]
            lot_stats.append({
                'lot_id': l.id, 'lot_name': l.prime_location_name,
                'maximum_spots': l.maximum_number_of_spots, 'available_spots': l.available_spots,
                'total_bookings': len(l_books), 'active_bookings': sum(1 for b in l_books if not b.leaving_time)
            })


        def make_chart(data, title, xlabel="Lot ID"):
            if not data: return None
            
            keys = list(data.keys())
            values = list(data.values())
            
            plt.clf()
            plt.figure(figsize=(7, 5))
            
            
            plt.bar(keys, values, color='#FFA500', width=0.4) 
            
            plt.title(title)
            plt.xlabel(xlabel)
            plt.xticks(keys) 
            
            buf = io.BytesIO()
            plt.savefig(buf, format='png', bbox_inches='tight')
            buf.seek(0)
            return {'image': f'data:image/png;base64,{base64.b64encode(buf.read()).decode("utf-8")}'}

        spots_data = {l.id: l.maximum_number_of_spots for l in lots}
        rev_data = {}
        for b in bookings:
            if b.total_cost: 
                
                s = spot_map.get(b.parking_spot_id)
                if s:
                    rev_data[s.lot_id] = rev_data.get(s.lot_id, 0) + b.total_cost
        
        lot_names = {l.id: l.prime_location_name for l in lots}

        return api_response(data={
            'statistics': {
                'total_bookings': len(bookings), 
                'active_bookings': active,
                'completed_bookings': len(bookings) - active,  # <--- FIXED HERE
                'total_revenue': round(rev, 2), 
                'total_parking_lots': len(lots)
            },
            'bookings': history, 
            'lot_statistics': lot_stats,
            'revenue_by_lot': [{'lot_id': k, 'lot_name': lot_names.get(k, 'Unknown'), 'total_revenue': v} for k,v in rev_data.items()],
            'charts': {
                'max_spots_chart': make_chart(spots_data, 'Max Spots'),
                'revenue_chart': make_chart(rev_data, 'Revenue')
            }
        })