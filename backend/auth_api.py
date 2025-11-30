from flask_restful import Resource
from flask import request
from flask_security import utils, auth_token_required
from user_datastore import user_datastore
from database import db
from models import User
from utils import api_response, handle_errors
import uuid 

class LoginAPI(Resource):
    @handle_errors
    def post(self):
        data = request.get_json() or {}
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return api_response(message='Email and password are required.', status=400)
        
        user = user_datastore.find_user(email=email)
        if not user: 
            return api_response(message='User not found.', status=404)
        
        
        if user.password != password: 
            return api_response(message='Invalid password.', status=401)
        
        utils.login_user(user)
        return api_response(data={
            'email': user.email,
            'roles': [r.name for r in user.roles],
            'auth_token': user.get_auth_token()
        }, message='Login successful.')

class LogoutAPI(Resource):
    @auth_token_required
    @handle_errors
    def post(self):
        utils.logout_user()
        return api_response(message='Logout successful.')

class RegisterAPI(Resource):
    @handle_errors
    def post(self):
        data = request.get_json() or {}
        required = ['email', 'password', 'username', 'address', 'pin_code']
        
        if len(data['pin_code']) != 6 or " " in data['pin_code']:
            return api_response(message='PinCode must be 6 digits.', status=400)
        
        if not all(k in data for k in required):
             return api_response(message='Missing required fields.', status=400)
             
        if user_datastore.find_user(email=data['email']):
            return api_response(message='User already exists.', status=409)
            
        

        user_role = user_datastore.find_role('user')
        
        
        new_user = User(
            email=data['email'], 
            password=data['password'], 
            pin_code=data['pin_code'], 
            address=data['address'],
            username=data['username'], 
            active=True,
            fs_uniquifier=str(uuid.uuid4()),       
            fs_token_uniquifier=str(uuid.uuid4()) 
        )
        new_user.roles.append(user_role)
        
        db.session.add(new_user)
        db.session.commit()
        
        return api_response(message='Registration successful.', status=201)