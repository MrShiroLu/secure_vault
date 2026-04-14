import re
import bcrypt
import jwt
import os
from datetime import datetime, timedelta

# ── 5 Regex Kuralı ───────────────────────────────────────────────────────────

_PATTERNS = {
    'iban':       re.compile(r'^TR[0-9]{24}$'),
    'kredi_karti': re.compile(r'^[0-9]{16}$'),
    'eposta':     re.compile(r'^[\w.\-]+@[\w.\-]+\.[a-z]{2,}$'),
    'tc_kimlik':  re.compile(r'^[1-9][0-9]{10}$'),
    'telefon':    re.compile(r'^0[5][0-9]{9}$'),
}


def validate_field(field_type: str, value: str) -> bool:
    pattern = _PATTERNS.get(field_type)
    return bool(pattern and pattern.match(value))


def validate_tc(tc: str) -> bool:
    if not _PATTERNS['tc_kimlik'].match(tc):
        return False
    d = [int(c) for c in tc]
    d10 = ((d[0] + d[2] + d[4] + d[6] + d[8]) * 7 - (d[1] + d[3] + d[5] + d[7])) % 10
    d11 = sum(d[:10]) % 10
    return d10 == d[9] and d11 == d[10]


def luhn_check(card: str) -> bool:
    if not _PATTERNS['kredi_karti'].match(card):
        return False
    digits = [int(c) for c in card]
    for i in range(len(digits) - 2, -1, -2):
        digits[i] *= 2
        if digits[i] > 9:
            digits[i] -= 9
    return sum(digits) % 10 == 0


# ── bcrypt ───────────────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12)).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


# ── JWT ──────────────────────────────────────────────────────────────────────

def generate_token(user_id: int) -> str:
    payload = {
        'sub': user_id,
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(hours=24),
    }
    return jwt.encode(payload, os.getenv('JWT_SECRET', 'jwt-dev-secret'), algorithm='HS256')


def decode_token(token: str) -> dict:
    return jwt.decode(token, os.getenv('JWT_SECRET', 'jwt-dev-secret'), algorithms=['HS256'])
