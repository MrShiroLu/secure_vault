from flask import Blueprint, request, jsonify
from database import db
from models import User
from auth import hash_password, verify_password, generate_token, validate_field, validate_tc, luhn_check
from crypto import generate_rsa_keypair

auth_bp = Blueprint('auth', __name__)

_VALIDATORS = {
    'iban':        lambda v: validate_field('iban', v),
    'kredi_karti': lambda v: luhn_check(v),
    'eposta':      lambda v: validate_field('eposta', v),
    'tc_kimlik':   lambda v: validate_tc(v),
    'telefon':     lambda v: validate_field('telefon', v),
}


@auth_bp.route('/api/register', methods=['POST'])
def register():
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip()
    password = data.get('password', '')

    if not validate_field('eposta', email):
        return jsonify({'error': 'Geçersiz e-posta formatı'}), 400
    if len(password) < 8:
        return jsonify({'error': 'Şifre en az 8 karakter olmalı'}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Bu e-posta zaten kayıtlı'}), 409

    private_pem, public_pem = generate_rsa_keypair()
    user = User(
        email=email,
        password_hash=hash_password(password),
        public_key=public_pem,
        private_key=private_pem,
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'Kayıt başarılı'}), 201


@auth_bp.route('/api/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip()
    password = data.get('password', '')

    user = User.query.filter_by(email=email).first()
    if not user or not verify_password(password, user.password_hash):
        return jsonify({'error': 'E-posta veya şifre hatalı'}), 401

    return jsonify({'token': generate_token(user.id)}), 200
