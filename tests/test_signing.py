import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

import unittest
from crypto import (
    generate_rsa_keypair, generate_aes_key, aes_encrypt,
    sha256_hash, rsa_sign, rsa_verify,
)
import base64


class TestRSASigning(unittest.TestCase):

    def setUp(self):
        self.private_pem, self.public_pem = generate_rsa_keypair()
        self.data = b"belge-hash-degeri-sha256"

    def test_sign_and_verify(self):
        sig = rsa_sign(self.private_pem, self.data)
        self.assertTrue(rsa_verify(self.public_pem, self.data, sig))

    def test_wrong_public_key_fails(self):
        _, other_public = generate_rsa_keypair()
        sig = rsa_sign(self.private_pem, self.data)
        self.assertFalse(rsa_verify(other_public, self.data, sig))

    def test_tampered_data_fails(self):
        sig = rsa_sign(self.private_pem, self.data)
        self.assertFalse(rsa_verify(self.public_pem, b"tampered-data", sig))

    def test_tampered_signature_fails(self):
        sig = rsa_sign(self.private_pem, self.data)
        sig_bytes = base64.b64decode(sig)
        tampered_sig = base64.b64encode(bytes([sig_bytes[0] ^ 0xFF]) + sig_bytes[1:]).decode()
        self.assertFalse(rsa_verify(self.public_pem, self.data, tampered_sig))

    def test_sign_uses_document_hash(self):
        aes_key = generate_aes_key()
        enc = aes_encrypt(aes_key, b"TR330006100519786457841326")
        doc_hash = sha256_hash(base64.b64decode(enc['ciphertext']))

        sig = rsa_sign(self.private_pem, doc_hash.encode())
        self.assertTrue(rsa_verify(self.public_pem, doc_hash.encode(), sig))


class TestSecurityScenarios(unittest.TestCase):

    def test_forged_signature_rejected(self):
        _, public_pem = generate_rsa_keypair()
        attacker_private, _ = generate_rsa_keypair()
        data = b"hedef-belge-hash"

        forged_sig = rsa_sign(attacker_private, data)
        self.assertFalse(rsa_verify(public_pem, data, forged_sig))

    def test_unauthorized_signing_different_key(self):
        _, owner_public = generate_rsa_keypair()
        other_private, _ = generate_rsa_keypair()
        data = b"belge-hash"

        sig = rsa_sign(other_private, data)
        self.assertFalse(rsa_verify(owner_public, data, sig))

    def test_modified_document_invalidates_signature(self):
        private_pem, public_pem = generate_rsa_keypair()
        aes_key = generate_aes_key()

        enc = aes_encrypt(aes_key, b"orijinal veri")
        original_hash = sha256_hash(base64.b64decode(enc['ciphertext']))
        sig = rsa_sign(private_pem, original_hash.encode())

        enc2 = aes_encrypt(aes_key, b"değiştirilmiş veri")
        new_hash = sha256_hash(base64.b64decode(enc2['ciphertext']))

        self.assertFalse(rsa_verify(public_pem, new_hash.encode(), sig))


if __name__ == '__main__':
    unittest.main()
