from celery import Celery, Task
from flask import Flask

def celery_init_app(app: Flask):
    """
    Initializes Celery using the 'celeryconfig.py' file and
    wraps all tasks in the Flask application context.
    """
    class FlaskTask(Task):
        def __call__(self, *args: object, **kwargs: object):
            with app.app_context():
                return self.run(*args, **kwargs)

    celery_app = Celery(app.name, task_cls=FlaskTask)
    
    
    celery_app.config_from_object('celeryconfig')
    
    
    celery_app.autodiscover_tasks(['task'])
    
    celery_app.set_default()
    app.extensions["celery"] = celery_app
    
    return celery_app


