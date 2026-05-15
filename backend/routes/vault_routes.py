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
    try:
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
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Belge eklenirken hata oluştu'}), 500


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


# ── RSA Dijital İmzalama ──────────────────────────────────────────────────────

@vault_bp.route('/vault/sign/<int:item_id>', methods=['POST'])
@jwt_required
def sign_document(item_id):
    try:
        item = VaultItem.query.get_or_404(item_id)
        if item.user_id != g.user_id:
            return jsonify({'error': 'Erişim reddedildi'}), 403

        user = User.query.get(g.user_id)
        item.signature = rsa_sign(user.private_key, item.sha256_hash.encode())
        item.signed_at = datetime.utcnow()
        db.session.commit()
        return jsonify({'message': 'Belge imzalandı', 'signed_at': item.signed_at.isoformat()}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'İmzalama sırasında hata oluştu'}), 500


@vault_bp.route('/vault/verify/<int:item_id>', methods=['GET'])
@jwt_required
def verify_document(item_id):
    item = VaultItem.query.get_or_404(item_id)
    if item.user_id != g.user_id:
        return jsonify({'error': 'Erişim reddedildi'}), 403
    if not item.signature:
        return jsonify({'valid': False, 'reason': 'Belge imzalanmamış'}), 200

    user = User.query.get(g.user_id)
    valid = rsa_verify(user.public_key, item.sha256_hash.encode(), item.signature)
    return jsonify({
        'valid': valid,
        'signed_by': user.email,
        'signed_at': item.signed_at.isoformat() if item.signed_at else None,
        'public_key_summary': sha256_hash(user.public_key.encode())[:16],
        'sha256': item.sha256_hash,
    }), 200


# ── Paylaşım Token'ı ──────────────────────────────────────────────────────────

@vault_bp.route('/vault/share/create/<int:item_id>', methods=['POST'])
@jwt_required
def create_share_token(item_id):
    item = VaultItem.query.get_or_404(item_id)
    if item.user_id != g.user_id:
        return jsonify({'error': 'Erişim reddedildi'}), 403
    if not item.signature:
        return jsonify({'error': 'Yalnızca imzalı belgeler paylaşılabilir'}), 400

    token = ShareToken(
        vault_item_id=item_id,
        token=str(uuid.uuid4()),
        expires_at=datetime.utcnow() + timedelta(hours=24),
    )
    db.session.add(token)
    db.session.commit()
    return jsonify({'token': token.token, 'expires_at': token.expires_at.isoformat()}), 201


@vault_bp.route('/vault/share/<string:token>', methods=['GET'])
def view_shared_document(token):
    share = ShareToken.query.filter_by(token=token).first()
    if not share:
        return jsonify({'error': 'Geçersiz token'}), 404
    if share.expires_at < datetime.utcnow():
        return jsonify({'error': 'Token süresi dolmuş'}), 410

    item = share.vault_item
    user = User.query.get(item.user_id)
    valid = rsa_verify(user.public_key, item.sha256_hash.encode(), item.signature)

    return jsonify({
        'name': item.name,
        'type': item.data_type,
        'valid': valid,
        'signed_by': user.email,
        'signed_at': item.signed_at.isoformat() if item.signed_at else None,
        'sha256': item.sha256_hash,
    }), 200
