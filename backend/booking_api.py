from flask_restful import Resource
from flask import request
from flask_security import auth_token_required, roles_required, current_user
from datetime import datetime
from database import db
from models import parking_lot, parking_spot, reserve_parking_spot
from utils import api_response, handle_errors
from cache import cache
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import io
import base64


def make_cache_key():
   
    if current_user.is_authenticated:
        return f"user_summary_{current_user.id}"
    return "user_summary_guest"

class UserDashboardAPI(Resource):
    @auth_token_required
    @roles_required('user')
    @handle_errors
    def get(self):
        bookings = reserve_parking_spot.query.filter_by(user_id=current_user.id).all()
        bookings_data = []
        for b in bookings:
            spot = parking_spot.query.get(b.parking_spot_id)
            
            lot = parking_lot.query.get(spot.lot_id) if spot else None
            
            bookings_data.append({
                'id': b.id, 'parking_spot_id': b.parking_spot_id,
                'spot_number': spot.spot_number if spot else 'N/A',
                'lot_name': lot.prime_location_name if lot else 'N/A',
                'vehicle_number': b.vehicle_number,
                'parking_time': b.parking_time.isoformat() if b.parking_time else None,
                'leaving_time': b.leaving_time.isoformat() if b.leaving_time else None,
                'total_cost': b.total_cost, 'status': 'completed' if b.leaving_time else 'active'
            })

        lots = parking_lot.query.all()
        lots_data = [{
            'id': l.id, 'prime_location_name': l.prime_location_name,
            'address': l.address, 'pin_code': l.pin_code, 'price': l.price,
            'maximum_number_of_spots': l.maximum_number_of_spots,
            'available_spots': l.available_spots
        } for l in lots]

        return api_response(data={
            'bookings': bookings_data, 'parking_lots': lots_data,
            'user': {'id': current_user.id, 'username': current_user.username, 'email': current_user.email}
        }, message='Dashboard data retrieved.')

class BookingAPI(Resource):
    @auth_token_required
    @roles_required('user')
    @handle_errors
    def post(self):
        data = request.get_json() or {}
        lot_id, v_num = data.get('lot_id'), data.get('vehicle_number')
        
        if not lot_id or not v_num or not v_num.strip():
            return api_response(message='Lot ID and Vehicle Number required.', status=400)
        
        spot = parking_spot.query.filter_by(lot_id=lot_id, status="Unoccupied").first()
        if not spot: return api_response(message='No spots available.', status=404)
        
        lot = parking_lot.query.get(lot_id)
        
       
        new_booking = reserve_parking_spot(
            vehicle_number=v_num.strip(), parking_time=datetime.now(),
            user_id=current_user.id, parking_spot_id=spot.id,
            parking_cost_per_hour=lot.price
        )
        spot.status, lot.available_spots = "Occupied", lot.available_spots - 1
        db.session.add(new_booking)
        db.session.commit()
        
       
        cache.delete(f"user_summary_{current_user.id}")
        
        return api_response(data={'booking_id': new_booking.id}, message='Booked successfully!', status=201)

class ReleaseBookingAPI(Resource):
    @auth_token_required
    @roles_required('user')
    @handle_errors
    def post(self, booking_id):
        b = reserve_parking_spot.query.get(booking_id)
        if not b: return api_response(message='Not found.', status=404)
        if b.user_id != current_user.id: return api_response(message='Unauthorized.', status=403)
        if b.leaving_time: return api_response(message='Already released.', status=400)
        
        end = datetime.now()
        dur = (end - b.parking_time).total_seconds()
        b.leaving_time, b.total_duration = end, dur
        b.total_cost = round((dur / 3600) * b.parking_cost_per_hour, 2)
        
        spot = parking_spot.query.get(b.parking_spot_id)
        if spot: 
            spot.status = "Unoccupied"
           
            lot = parking_lot.query.get(spot.lot_id)
            if lot: lot.available_spots += 1
            
        db.session.commit()
        
       
        cache.delete(f"user_summary_{current_user.id}")
        
        return api_response(data={'total_cost': b.total_cost}, message='Released successfully.')

    @auth_token_required
    @roles_required('user')
    @handle_errors
    def get(self, booking_id):
        b = reserve_parking_spot.query.get(booking_id)
        if not b: return api_response(message='Not found.', status=404)
        if b.user_id != current_user.id: return api_response(message='Unauthorized.', status=403)
        
        end = b.leaving_time or datetime.now()
        dur = (end - b.parking_time).total_seconds()
        cost = b.total_cost or round((dur / 3600) * b.parking_cost_per_hour, 2)
        
        return api_response(data={
            'booking_id': b.id, 'vehicle_number': b.vehicle_number,
            'parking_time': b.parking_time.isoformat(), 'leaving_time': end.isoformat(),
            'total_duration_seconds': dur, 'total_cost': cost,
            'cost_per_hour': b.parking_cost_per_hour
        })

class UserSummaryAPI(Resource):
    @auth_token_required
    @roles_required('user')
    @cache.cached(timeout=5, key_prefix=make_cache_key) 
    @handle_errors
    def get(self):
        uid = current_user.id
        all_b = reserve_parking_spot.query.filter_by(user_id=uid).all()
        active = [b for b in all_b if not b.leaving_time]
        
        bookings_data = []
        for b in all_b:
            spot = parking_spot.query.get(b.parking_spot_id)
          
            lot = parking_lot.query.get(spot.lot_id) if spot else None
            
            bookings_data.append({
                'id': b.id, 'vehicle_number': b.vehicle_number,
                'lot_name': lot.prime_location_name if lot else 'N/A',
                'spot_number': spot.spot_number if spot else 'N/A',
                'parking_time': b.parking_time.isoformat() if b.parking_time else None,
                'leaving_time': b.leaving_time.isoformat() if b.leaving_time else None,
                'total_cost': b.total_cost, 'status': 'active' if not b.leaving_time else 'completed'
            })

        has_completed = len(all_b) > len(active)

        return api_response(data={
            'user': {'username': current_user.username, 'email': current_user.email},
            'statistics': {
                'total_bookings': len(all_b), 'active_bookings': len(active),
                'completed_bookings': len(all_b) - len(active),
                'total_spent': round(sum(b.total_cost for b in all_b if b.total_cost), 2),
                'has_completed_bookings': has_completed
            },
            'bookings': bookings_data,
            'charts': {
                'reservations_by_vehicle': self._gen_chart(uid, 'count'),
                'cost_by_vehicle': self._gen_chart(uid, 'sum')
            }
        })

    def _gen_chart(self, uid, type):
        q = db.session.query(reserve_parking_spot.vehicle_number)
        
        if type == 'count':
            data = q.add_columns(db.func.count(reserve_parking_spot.id)).filter_by(user_id=uid)\
                .group_by(reserve_parking_spot.vehicle_number).all()
            if not data: return None
            
            plt.clf()
            plt.figure(figsize=(8, 6))
            my_colors = ['#D96F32', '#FFE797','#C75D2C', '#B45253']
            plt.pie([d[1] for d in data], labels=[f'Vehicle {d[0]}' for d in data], autopct='%1.1f%%', colors=my_colors)
            plt.title('Reservations by Vehicle')
            
        else:
            data = q.add_columns(db.func.sum(reserve_parking_spot.total_cost)).filter_by(user_id=uid)\
                .filter(reserve_parking_spot.total_cost.isnot(None)).group_by(reserve_parking_spot.vehicle_number).all()
            if not data: return None
            
            plt.clf()
            plt.figure(figsize=(8, 5))
            plt.bar([d[0] for d in data], [float(d[1]) for d in data], color='#D97D55')
            plt.title('Total Cost by Vehicle'); plt.xlabel('Vehicle Number'); plt.ylabel('Cost')
        
        buf = io.BytesIO()
        plt.savefig(buf, format='png', bbox_inches='tight')
        buf.seek(0)
        img = base64.b64encode(buf.read()).decode('utf-8')
        plt.close()
        return {'image': f'data:image/png;base64,{img}'}