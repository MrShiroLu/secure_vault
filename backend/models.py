from datetime import datetime
from database import db


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    public_key = db.Column(db.Text, nullable=False)
    private_key = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    vault_items = db.relationship('VaultItem', backref='owner', lazy=True, cascade='all, delete-orphan')


class VaultItem(db.Model):
    __tablename__ = 'vault_items'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    data_type = db.Column(db.String(50), nullable=False)  # iban, kredi_karti, tc_kimlik, eposta, telefon
    ciphertext = db.Column(db.Text, nullable=False)
    iv = db.Column(db.String(255), nullable=False)
    auth_tag = db.Column(db.String(255), nullable=False)
    encrypted_aes_key = db.Column(db.Text, nullable=False)
    sha256_hash = db.Column(db.String(64), nullable=False)
    masked_preview = db.Column(db.String(255), nullable=False)
    signature = db.Column(db.Text, nullable=True)
    signed_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    share_tokens = db.relationship('ShareToken', backref='vault_item', lazy=True, cascade='all, delete-orphan')


class ShareToken(db.Model):
    __tablename__ = 'share_tokens'

    id = db.Column(db.Integer, primary_key=True)
    vault_item_id = db.Column(db.Integer, db.ForeignKey('vault_items.id'), nullable=False)
    token = db.Column(db.String(36), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
