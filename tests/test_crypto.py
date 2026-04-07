import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

import unittest
import base64
from crypto import (
    generate_aes_key, aes_encrypt, aes_decrypt,
    generate_rsa_keypair, rsa_encrypt_key, rsa_decrypt_key,
    sha256_hash,
)


class TestAESGCM(unittest.TestCase):

    def test_encrypt_decrypt_roundtrip(self):
        key = generate_aes_key()
        plaintext = b"TR330006100519786457841326"
        enc = aes_encrypt(key, plaintext)
        dec = aes_decrypt(key, enc['ciphertext'], enc['iv'], enc['auth_tag'])
        self.assertEqual(plaintext, dec)

    def test_iv_is_unique_per_call(self):
        key = generate_aes_key()
        enc1 = aes_encrypt(key, b"same data")
        enc2 = aes_encrypt(key, b"same data")
        self.assertNotEqual(enc1['iv'], enc2['iv'])

    def test_key_is_256_bit(self):
        key = generate_aes_key()
        self.assertEqual(len(key), 32)

    def test_tampered_ciphertext_raises(self):
        key = generate_aes_key()
        enc = aes_encrypt(key, b"secret data")
        ct = base64.b64decode(enc['ciphertext'])
        tampered = base64.b64encode(bytes([ct[0] ^ 0xFF]) + ct[1:]).decode()
        with self.assertRaises(Exception):
            aes_decrypt(key, tampered, enc['iv'], enc['auth_tag'])

    def test_tampered_auth_tag_raises(self):
        key = generate_aes_key()
        enc = aes_encrypt(key, b"secret data")
        tag = base64.b64decode(enc['auth_tag'])
        tampered_tag = base64.b64encode(bytes([tag[0] ^ 0xFF]) + tag[1:]).decode()
        with self.assertRaises(Exception):
            aes_decrypt(key, enc['ciphertext'], enc['iv'], tampered_tag)


class TestRSA2048(unittest.TestCase):

    def setUp(self):
        self.private_pem, self.public_pem = generate_rsa_keypair()

    def test_key_size_is_2048(self):
        from cryptography.hazmat.primitives import serialization
        from cryptography.hazmat.backends import default_backend
        key = serialization.load_pem_private_key(
            self.private_pem.encode(), password=None, backend=default_backend()
        )
        self.assertEqual(key.key_size, 2048)

    def test_encrypt_decrypt_aes_key(self):
        aes_key = generate_aes_key()
        encrypted = rsa_encrypt_key(self.public_pem, aes_key)
        decrypted = rsa_decrypt_key(self.private_pem, encrypted)
        self.assertEqual(aes_key, decrypted)

    def test_wrong_private_key_fails(self):
        aes_key = generate_aes_key()
        encrypted = rsa_encrypt_key(self.public_pem, aes_key)
        other_private, _ = generate_rsa_keypair()
        with self.assertRaises(Exception):
            rsa_decrypt_key(other_private, encrypted)


class TestSHA256(unittest.TestCase):

    def test_hash_is_64_hex_chars(self):
        self.assertEqual(len(sha256_hash(b"test")), 64)

    def test_hash_is_deterministic(self):
        data = b"same input"
        self.assertEqual(sha256_hash(data), sha256_hash(data))

    def test_tamper_changes_hash(self):
        self.assertNotEqual(sha256_hash(b"original"), sha256_hash(b"tampered"))


class TestHybridFlow(unittest.TestCase):

    def test_full_encrypt_decrypt_cycle(self):
        private_pem, public_pem = generate_rsa_keypair()
        plaintext = b"5412345678901234"

        aes_key = generate_aes_key()
        enc = aes_encrypt(aes_key, plaintext)
        encrypted_key = rsa_encrypt_key(public_pem, aes_key)

        recovered_key = rsa_decrypt_key(private_pem, encrypted_key)
        result = aes_decrypt(recovered_key, enc['ciphertext'], enc['iv'], enc['auth_tag'])
        self.assertEqual(plaintext, result)

    def test_integrity_hash_detects_tampering(self):
        aes_key = generate_aes_key()
        enc = aes_encrypt(aes_key, b"sensitive data")
        original_hash = sha256_hash(base64.b64decode(enc['ciphertext']))

        ct = base64.b64decode(enc['ciphertext'])
        tampered_ct = base64.b64encode(bytes([ct[0] ^ 0xFF]) + ct[1:]).decode()
        tampered_hash = sha256_hash(base64.b64decode(tampered_ct))

        self.assertNotEqual(original_hash, tampered_hash)


if __name__ == '__main__':
    unittest.main()
