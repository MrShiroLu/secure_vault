import os
from flask import Flask
from dotenv import load_dotenv
from database import init_db

load_dotenv()


def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///securevault.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-change-in-prod')

    init_db(app)
    return app


app = create_app()

if __name__ == '__main__':
    app.run(debug=True)
