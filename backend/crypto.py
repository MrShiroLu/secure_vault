import os
import base64
import hashlib

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.backends import default_backend
from cryptography.exceptions import InvalidSignature


# ── AES-256-GCM ──────────────────────────────────────────────────────────────

def generate_aes_key() -> bytes:
    return os.urandom(32)


def aes_encrypt(key: bytes, plaintext: bytes) -> dict:
    iv = os.urandom(12)
    aesgcm = AESGCM(key)
    ct_with_tag = aesgcm.encrypt(iv, plaintext, None)
    ciphertext = ct_with_tag[:-16]
    auth_tag = ct_with_tag[-16:]
    return {
        "ciphertext": base64.b64encode(ciphertext).decode(),
        "iv": base64.b64encode(iv).decode(),
        "auth_tag": base64.b64encode(auth_tag).decode(),
    }


def aes_decrypt(key: bytes, ciphertext_b64: str, iv_b64: str, auth_tag_b64: str) -> bytes:
    ciphertext = base64.b64decode(ciphertext_b64)
    iv = base64.b64decode(iv_b64)
    auth_tag = base64.b64decode(auth_tag_b64)
    aesgcm = AESGCM(key)
    return aesgcm.decrypt(iv, ciphertext + auth_tag, None)


# ── RSA-2048 ─────────────────────────────────────────────────────────────────

def generate_rsa_keypair() -> tuple[str, str]:
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
        backend=default_backend(),
    )
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode()
    public_pem = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    ).decode()
    return private_pem, public_pem


def rsa_encrypt_key(public_pem: str, data: bytes) -> str:
    public_key = serialization.load_pem_public_key(public_pem.encode(), backend=default_backend())
    encrypted = public_key.encrypt(
        data,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None,
        ),
    )
    return base64.b64encode(encrypted).decode()


def rsa_decrypt_key(private_pem: str, encrypted_b64: str) -> bytes:
    private_key = serialization.load_pem_private_key(
        private_pem.encode(), password=None, backend=default_backend()
    )
    return private_key.decrypt(
        base64.b64decode(encrypted_b64),
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None,
        ),
    )


# ── SHA-256 ───────────────────────────────────────────────────────────────────

def sha256_hash(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


# ── RSA İmzalama (PKCS#1 v1.5) ───────────────────────────────────────────────

def rsa_sign(private_pem: str, data: bytes) -> str:
    private_key = serialization.load_pem_private_key(
        private_pem.encode(), password=None, backend=default_backend()
    )
    signature = private_key.sign(data, padding.PKCS1v15(), hashes.SHA256())
    return base64.b64encode(signature).decode()


def rsa_verify(public_pem: str, data: bytes, signature_b64: str) -> bool:
    public_key = serialization.load_pem_public_key(public_pem.encode(), backend=default_backend())
    try:
        public_key.verify(
            base64.b64decode(signature_b64),
            data,
            padding.PKCS1v15(),
            hashes.SHA256(),
        )
        return True
    except InvalidSignature:
        return False
