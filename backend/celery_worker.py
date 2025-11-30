from app import celery_app, app

celery_app.conf.update(app.config)
