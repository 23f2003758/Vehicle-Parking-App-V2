from flask import jsonify, Response
from flask_restful import Resource
from flask_security import auth_token_required, roles_required, current_user
from celery.result import AsyncResult
from datetime import datetime
from task import park_csv, export_user_csv

class AdminExportAPI(Resource):
   
    @auth_token_required
    @roles_required('admin')
    def get(self):
        
        result = park_csv.delay()
        return jsonify({"task_id": result.id, "status": "Task submitted"})


class UserExportAPI(Resource):
   
    @auth_token_required
    @roles_required('user')
    def get(self):
        # Trigger the user specific task
        task = export_user_csv.delay(current_user.id)
        return jsonify({"task_id": task.id, "status": "Task submitted"})

class DownloadFileAPI(Resource):
   
    def get(self, id):
        result = AsyncResult(id)
        
        if result.ready():
            if result.successful():
                csv_data = result.result
                date_str = datetime.now().strftime("%Y-%m-%d")
                
                return Response(
                    csv_data,
                    mimetype="text/csv",
                    headers={"Content-disposition": f"attachment; filename=History_{date_str}.csv"}
                )
            else:
                return jsonify({"ready": True, "successful": False, "value": str(result.info)})
        else:
            return jsonify({ 
                "ready": result.ready(),
                "successful": result.successful(),
                "value": None
            })