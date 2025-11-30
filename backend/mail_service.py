from smtplib import SMTP
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

SMTP_HOST = 'localhost'
SMTP_PORT = 1025
SENDER_EMAIL = 'admin@gmail.com'
SMTP_PASSWORD = ''


def send_email(to, subject, body):
    msg = MIMEMultipart()
    msg["To"] = to 
    msg["Subject"] = subject
    msg["From"] = SENDER_EMAIL
    msg.attach(MIMEText(body , 'html'))
    client = SMTP(host = SMTP_HOST , port = SMTP_PORT)
    client.send_message(msg = msg)
    client.quit()
    return True
    

    