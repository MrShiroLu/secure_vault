import base64
import uuid
from datetime import datetime, timedelta

from flask import Blueprint, request, jsonify, g
from database import db
from models import User, VaultItem, ShareToken
from middleware import jwt_required
from crypto import (
    generate_aes_key, aes_encrypt, aes_decrypt,
    rsa_encrypt_key, rsa_decrypt_key,
    sha256_hash, rsa_sign, rsa_verify,
)

vault_bp = Blueprint('vault', __name__)

# ── Maskeleme ─────────────────────────────────────────────────────────────────

def _mask(data_type: str, value: str) -> str:
    if data_type == 'iban' and len(value) > 6:
        return value[:4] + '**** **** **** **' + value[-2:]
    if data_type == 'kredi_karti' and len(value) >= 4:
        return '**** **** **** ' + value[-4:]
    if data_type == 'tc_kimlik':
        return '*' * 11
    if data_type == 'eposta' and '@' in value:
        local, domain = value.split('@', 1)
        return local[:2] + '***@' + domain
    if data_type == 'telefon' and len(value) >= 4:
        return value[:3] + '*** ** ' + value[-2:]
    return '***'


# ── CRUD Endpoint'leri ────────────────────────────────────────────────────────

@vault_bp.route('/vault/add', methods=['POST'])
@jwt_required
def add_document():
    data = request.get_json(silent=True) or {}
    name = (data.get('name') or '').strip()
    data_type = (data.get('type') or '').strip().lower()
    value = (data.get('value') or '').strip()

    if not name or not data_type or not value:
        return jsonify({'error': 'name, type ve value zorunlu'}), 400
    if data_type not in ('iban', 'kredi_karti', 'tc_kimlik', 'eposta', 'telefon'):
        return jsonify({'error': 'Geçersiz belge türü'}), 400

    user = User.query.get(g.user_id)

    aes_key = generate_aes_key()
    enc = aes_encrypt(aes_key, value.encode())
    encrypted_aes_key = rsa_encrypt_key(user.public_key, aes_key)
    integrity_hash = sha256_hash(base64.b64decode(enc['ciphertext']))

    item = VaultItem(
        user_id=g.user_id,
        name=name,
        data_type=data_type,
        ciphertext=enc['ciphertext'],
        iv=enc['iv'],
        auth_tag=enc['auth_tag'],
        encrypted_aes_key=encrypted_aes_key,
        sha256_hash=integrity_hash,
        masked_preview=_mask(data_type, value),
    )
    db.session.add(item)
    db.session.commit()
    return jsonify({'id': item.id, 'message': 'Belge eklendi'}), 201


@vault_bp.route('/vault/list', methods=['GET'])
@jwt_required
def list_documents():
    items = VaultItem.query.filter_by(user_id=g.user_id).all()
    return jsonify([
        {
            'id': item.id,
            'name': item.name,
            'type': item.data_type,
            'preview': item.masked_preview,
            'signed': item.signature is not None,
            'signed_at': item.signed_at.isoformat() if item.signed_at else None,
            'created_at': item.created_at.isoformat(),
        }
        for item in items
    ]), 200


@vault_bp.route('/vault/view/<int:item_id>', methods=['GET'])
@jwt_required
def view_document(item_id):
    item = VaultItem.query.get_or_404(item_id)
    if item.user_id != g.user_id:
        return jsonify({'error': 'Erişim reddedildi'}), 403

    current_hash = sha256_hash(base64.b64decode(item.ciphertext))
    if current_hash != item.sha256_hash:
        return jsonify({'error': 'Veri bütünlüğü bozulmuş'}), 409

    user = User.query.get(g.user_id)
    aes_key = rsa_decrypt_key(user.private_key, item.encrypted_aes_key)
    plaintext = aes_decrypt(aes_key, item.ciphertext, item.iv, item.auth_tag).decode()

    return jsonify({
        'id': item.id,
        'name': item.name,
        'type': item.data_type,
        'value': plaintext,
        'integrity': 'ok',
        'signed': item.signature is not None,
        'signed_at': item.signed_at.isoformat() if item.signed_at else None,
        'created_at': item.created_at.isoformat(),
    }), 200


@vault_bp.route('/vault/<int:item_id>', methods=['DELETE'])
@jwt_required
def delete_document(item_id):
    item = VaultItem.query.get_or_404(item_id)
    if item.user_id != g.user_id:
        return jsonify({'error': 'Erişim reddedildi'}), 403
    db.session.delete(item)
    db.session.commit()
    return jsonify({'message': 'Belge silindi'}), 200
