from functools import wraps
from flask import request, jsonify, g
from auth import decode_token
import jwt


def jwt_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Token gerekli'}), 401
        token = auth_header.split(' ', 1)[1]
        try:
            payload = decode_token(token)
            g.user_id = payload['sub']
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token süresi dolmuş'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Geçersiz token'}), 401
        return f(*args, **kwargs)
    return decorated
