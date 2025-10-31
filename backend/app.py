from flask import Flask , render_template
from flask_security import Security
from flask_restful import Api


from database import db
from config import config
from user_datastore import user_datastore


def create_app():
    app = Flask(__name__ , template_folder='../frontend/templates' , static_folder='../frontend/static')
    app.config.from_object(config)
    
    db.init_app(app)
    security = Security(app, user_datastore)
    
    api = Api(app , prefix="/api")
    with app.app_context():
        db.create_all()
        
        admin_role = user_datastore.find_or_create_role(name='admin', description='Administrator')
        user_role = user_datastore.find_or_create_role(name='user', description='User')
        
        if not user_datastore.find_user(email='admin@gmail.com'):
            user_datastore.create_user( 
                email='admin@gmail.com',
                password='admin123',                       
                username='admin',
                roles=[admin_role]   
            )
        
        db.session.commit()
        
        return app , api
    
    
app , api  = create_app()

from auth_api import  LoginAPI , LogoutAPI , RegisterAPI
api.add_resource(LoginAPI, '/login')
api.add_resource(LogoutAPI, '/logout')
api.add_resource(RegisterAPI, '/register')


@app.route('/')
def home():
    return render_template('index.html')


if __name__ == '__main__':
    app.run(debug=True)
    
    