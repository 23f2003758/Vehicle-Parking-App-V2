class config:
    SECRET_KEY = 'my_secret_key'
    SQLALCHEMY_DATABASE_URI = 'sqlite:///parking_management.db'
    
    SECURITY_PASSWORD_SALT = 'some_salt'
    
   
    CACHE_TYPE = 'RedisCache'
    CACHE_DEFAULT_TIMEOUT = 300
    CACHE_REDIS_URL = 'redis://localhost:6379/2'
    
    