from database import db
from flask_security import UserMixin, RoleMixin


class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100),nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(20), nullable=False)
    address = db.Column(db.String(200))
    pin_code = db.Column(db.String(10))
    active = db.Column(db.Boolean(), default=True)
    
    fs_uniquifier = db.Column(db.String(255), unique=True, nullable=False)
    fs_token_uniquifier = db.Column(db.String(255), unique=True, nullable=False)
    
    roles = db.relationship('Role', secondary='user_roles')
    
    
    
class Role(db.Model, RoleMixin):
    id = db.Column(db.Integer(), primary_key=True)
    name = db.Column(db.String(80), unique=True)
    description = db.Column(db.String(255))
    
    
class UserRoles(db.Model):
    id = db.Column(db.Integer(), primary_key=True)
    user_id = db.Column(db.Integer(), db.ForeignKey('user.id'))
    role_id = db.Column(db.Integer(), db.ForeignKey('role.id'))
    
    
class parking_lot(db.Model):  
    id = db.Column(db.Integer(), primary_key=True)
    prime_location_name = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Integer(), nullable=False)
    address = db.Column(db.String(100),unique=True ,nullable=False)
    pin_code = db.Column(db.Integer(), nullable=False)
    maximum_number_of_spots = db.Column(db.Integer(), nullable=False)
    available_spots = db.Column(db.Integer(), nullable=False) 
    spots = db.relationship('parking_spot', backref='parking_lot')  
    
   
    
class parking_spot(db.Model):
    id = db.Column(db.Integer(), primary_key=True)
    spot_number = db.Column(db.Integer(), nullable=False)
    status = db.Column(db.String(100), nullable=False)
    lot_id = db.Column(db.Integer(), db.ForeignKey('parking_lot.id'), nullable=False)
    
   

class reserve_parking_spot(db.Model):
    id = db.Column(db.Integer(), primary_key=True)
    parking_spot_id = db.Column(db.Integer(),db.ForeignKey('parking_spot.id'), nullable=False)
    user_id = db.Column(db.Integer(), db.ForeignKey('user.id'), nullable=False)
    vehicle_number = db.Column(db.String(100), nullable=False)
    parking_time = db.Column(db.DateTime())
    leaving_time = db.Column(db.DateTime())
    parking_cost_per_hour = db.Column(db.Integer(),nullable=False)
    total_cost = db.Column(db.Integer()) 
    total_duration = db.Column(db.Integer())
    
    