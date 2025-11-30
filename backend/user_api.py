from flask_restful import Resource
from flask_security import auth_token_required, roles_required
from models import User
from utils import api_response, handle_errors

class UserListAPI(Resource):
    @auth_token_required
    @roles_required('admin')
    @handle_errors
    def get(self):
        users = User.query.all()
        result = []
        for user in users:
            if 'admin' not in [r.name for r in user.roles]:
                result.append({
                    'id': user.id, 'username': user.username,
                    'email': user.email, 'address': user.address,
                    'pin_code': user.pin_code
                })
        
        return api_response(data=result, message='Users retrieved.')