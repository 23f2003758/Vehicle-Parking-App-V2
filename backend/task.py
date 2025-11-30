from celery import shared_task
from models import reserve_parking_spot, parking_lot, parking_spot, User, Role
import io
import csv
from mail_service import send_email
from flask import render_template
from datetime import datetime, timedelta
from collections import Counter

@shared_task(ignore_result=False, name="download_csv_report")
def park_csv():
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "User", "Vehicle", "Lot ID", "Spot", "Start Time", "End Time", "Cost", "Status"])

    for b in reserve_parking_spot.query.all():
        spot = parking_spot.query.get(b.parking_spot_id)
        if not spot: continue
        
        lot = parking_lot.query.get(spot.lot_id)
        if not lot: continue

        user = User.query.get(b.user_id)
        
        start = b.parking_time.strftime("%d/%m/%Y, %I:%M:%S %p") if b.parking_time else "N/A"
        end = b.leaving_time.strftime("%d/%m/%Y, %I:%M:%S %p") if b.leaving_time else "Active"
        
        writer.writerow([
            b.id, user.username if user else "Unknown", b.vehicle_number, 
            spot.lot_id, spot.spot_number if spot else "N/A",  # UPDATED: Use spot.lot_id
            start, end, 
            str(b.total_cost) if b.leaving_time else "ACTIVE",
            "COMPLETED" if b.leaving_time else "ACTIVE"
        ])
    
    return output.getvalue()

@shared_task(ignore_result=False, name="export_user_csv")
def export_user_csv(user_id):
    output = io.StringIO()
    writer = csv.writer(output)
    
   
    writer.writerow(["Lot ID", "Lot Name", "Address", "Spot Number", "Parking Time", "Leaving Time", "Total Cost", "Remarks"])

    bookings = reserve_parking_spot.query.filter_by(user_id=user_id).all()
    for b in bookings:
        spot = parking_spot.query.get(b.parking_spot_id)
        if not spot: continue
        
        lot = parking_lot.query.get(spot.lot_id)
        
       
        writer.writerow([
            spot.lot_id,                                   # UPDATED: Lot ID
            lot.prime_location_name if lot else "N/A",     # Lot Name
            lot.address if lot else "N/A",                 # Address
            spot.spot_number if spot else "N/A",           # Spot Number
            b.parking_time.strftime("%d/%m/%Y, %I:%M:%S %p") if b.parking_time else "N/A",
            b.leaving_time.strftime("%d/%m/%Y, %I:%M:%S %p") if b.leaving_time else "ACTIVE",
            str(b.total_cost) if b.leaving_time else "ACTIVE",
            "COMPLETED" if b.leaving_time else "ACTIVE"
        ])
    
    return output.getvalue()







@shared_task(ignore_result=True)
def daily_reminder(subject):
    for user in User.query.all()[1:]:
        body = render_template('daily_mail.html', username=user.username, subject=subject)
        send_email(user.email, subject, body)

@shared_task(ignore_result=True)
def send_monthly_reports():
    today = datetime.today()
    end = today.replace(hour=23, minute=59, second=59)
    start = (today - timedelta(days=30)).replace(hour=0, minute=0, second=0)
    month_name = f"Last 30 Days ({start.strftime('%b %d')} - {end.strftime('%b %d')})"
    subject = f"Your ESYPARK Summary for {month_name}"

    users = User.query.filter(~User.roles.any(Role.name == 'admin')).all()

    for user in users:
        bookings = reserve_parking_spot.query.filter(
            reserve_parking_spot.user_id == user.id,
            reserve_parking_spot.leaving_time.isnot(None),
            reserve_parking_spot.leaving_time >= start,
            reserve_parking_spot.leaving_time <= end
        ).all()

        if not bookings: continue

        total_spent = sum(b.total_cost for b in bookings if b.total_cost)
        
        
        lot_ids = []
        for b in bookings:
            s = parking_spot.query.get(b.parking_spot_id)
            if s: lot_ids.append(s.lot_id)

        most_used = "N/A"
        if lot_ids:
            common_id = Counter(lot_ids).most_common(1)[0][0]
            lot = parking_lot.query.get(common_id)
            if lot: most_used = lot.prime_location_name

        bookings_list = []
        for b in bookings:
           
            s = parking_spot.query.get(b.parking_spot_id)
            lot = parking_lot.query.get(s.lot_id) if s else None
            
            bookings_list.append({
                "lot_name": lot.prime_location_name if lot else "N/A",
                "date": b.leaving_time.strftime("%Y-%m-%d"),
                "cost": b.total_cost
            })

        body = render_template(
            'monthly_report_email.html', username=user.username, report_month=month_name,
            total_bookings=len(bookings), total_spent=total_spent,
            most_used_lot=most_used, bookings_list=bookings_list, subject=subject
        )
        send_email(user.email, subject, body)
        
    return "OK"