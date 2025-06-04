import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt

app = Flask(__name__)

# Configuração do Banco de Dados
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL", "mysql+pymysql://root:12345@db/tcc")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False


# Configuração de Segurança
app.config['SECRET_KEY'] = os.getenv("SECRET_KEY", "uma-chave-secreta-muito-segura")

# Configuração do Flask-Mail
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False
app.config['MAIL_USERNAME'] = os.getenv("MAIL_USERNAME")  # Variável de ambiente
app.config['MAIL_PASSWORD'] = os.getenv("MAIL_PASSWORD")  # Variável de ambiente
app.config['MAIL_DEFAULT_SENDER'] = app.config['MAIL_USERNAME']
app.config['SECRET_KEY'] = '5v6£>Yq6*%8678R?\6S7'

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
