from flask import jsonify, make_response
from functools import wraps

def api_response(data=None, message=None, status=200):
   
    response = {}
    if message: response['message'] = message
    if data is not None: response['data'] = data
    return make_response(jsonify(response), status)

def handle_errors(f):
   
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            print(f"Error in {f.__name__}: {str(e)}") # Log error
            return api_response(message=f"An error occurred: {str(e)}", status=500)
    return decorated