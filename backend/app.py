import os
from flask import Flask, jsonify
from dotenv import load_dotenv
from database import init_db

load_dotenv()


def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///securevault.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_size': 10,
        'pool_recycle': 300,
        'pool_pre_ping': True,
    }
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-change-in-prod')

    init_db(app)

    from routes.auth_routes import auth_bp
    from routes.vault_routes import vault_bp
    app.register_blueprint(auth_bp)
    app.register_blueprint(vault_bp)

    @app.after_request
    def add_cors_headers(response):
        allowed_origin = os.getenv('FRONTEND_ORIGIN', 'http://localhost:5173')
        response.headers['Access-Control-Allow-Origin'] = allowed_origin
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, DELETE, OPTIONS'
        return response

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Kaynak bulunamadı'}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({'error': 'Bu method desteklenmiyor'}), 405

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({'error': 'Sunucu hatası'}), 500

    if os.getenv('FLASK_ENV') != 'testing':
        from scheduler import start_scheduler
        start_scheduler(app)

    return app


app = create_app()

if __name__ == '__main__':
    app.run(debug=os.getenv('FLASK_DEBUG', 'false').lower() == 'true')
