from flask import Flask, render_template
from flask_security import Security
from flask_restful import Api
from cache import cache
from database import db
from config import config
from user_datastore import user_datastore
from celery_init import celery_init_app 
from task import daily_reminder, send_monthly_reports
from celery.schedules import crontab
from models import User

def create_app():
    app = Flask(__name__, template_folder='../frontend/templates', static_folder='../frontend/static')
    app.config.from_object(config)
    
    cache.init_app(app)
    db.init_app(app)
    
    celery_app = celery_init_app(app) 
    security = Security(app, user_datastore)
    api = Api(app, prefix="/api")
    
    with app.app_context():
        db.create_all()
        
        # Create Roles
        admin_role = user_datastore.find_or_create_role(name='admin', description='Administrator')
        user_role = user_datastore.find_or_create_role(name='user', description='User')
        
        # Create Admin
        if not user_datastore.find_user(email='admin@gmail.com'):
            user_datastore.create_user( 
                email='admin@gmail.com',
                password='admin123',                       
                username='admin',
                roles=[admin_role]   
            )
            
        db.session.commit()
        
    return app, api, celery_app
    
app, api, celery_app = create_app()

# REGISTER

from auth_api import LoginAPI, LogoutAPI, RegisterAPI

api.add_resource(LoginAPI, '/login')
api.add_resource(LogoutAPI, '/logout')
api.add_resource(RegisterAPI, '/register')

# Admin

from crud import ParkingLotListAPI, ParkingLotAPI, AdminSummaryAPI

api.add_resource(ParkingLotListAPI, '/parking-lots')
api.add_resource(ParkingLotAPI, '/parking-lots/<int:lot_id>')
api.add_resource(AdminSummaryAPI, '/admin/summary') 

# User

from user_api import UserListAPI
api.add_resource(UserListAPI, '/users')

from booking_api import UserDashboardAPI, BookingAPI, ReleaseBookingAPI, UserSummaryAPI

api.add_resource(UserDashboardAPI, '/user/dashboard')
api.add_resource(BookingAPI, '/booking')
api.add_resource(ReleaseBookingAPI, '/booking/<int:booking_id>/release')
api.add_resource(UserSummaryAPI, '/user/summary')

# Download
from download_api import AdminExportAPI, UserExportAPI, DownloadFileAPI

api.add_resource(AdminExportAPI, '/download')          
api.add_resource(DownloadFileAPI, '/download/<id>')   
api.add_resource(UserExportAPI, '/user/download')      

# --------------------------

@app.route('/')
def home():
    return render_template('index.html')

@celery_app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    sender.add_periodic_task(
        crontab(hour=22, minute=32),
        daily_reminder.s('Daily Reminder'), 
    )
    sender.add_periodic_task(
        crontab(day_of_month=30, hour=22, minute=33),
        send_monthly_reports.s(),
    )

if __name__ == '__main__':
    app.run(debug=True)