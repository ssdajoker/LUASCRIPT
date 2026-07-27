"""
MIRROR V3: Tier 2 Python Showcase
Category: Security
Module: sec_crypto.py
Purpose: Demonstrate cryptographic patterns
"""

import hashlib
from typing import Tuple


def simple_hash(value: str) -> str:
    """Simple hash function"""
    if not isinstance(value, str):
        return ""
    
    # Use SHA256 for hashing
    return hashlib.sha256(value.encode()).hexdigest()[:16]


def verify_hash(value: str, expected_hash: str) -> bool:
    """Verify hash matches"""
    return simple_hash(value) == expected_hash


def hash_password(password: str, salt: str = "default") -> str:
    """Hash password with salt"""
    combined = f"{salt}:{password}"
    return simple_hash(combined)


def verify_password(password: str, hashed: str, salt: str = "default") -> bool:
    """Verify password against hash"""
    return hash_password(password, salt) == hashed


secret = "my_secret_key"
secret_hash = simple_hash(secret)

password = "secure_password"
password_hash = hash_password(password, "user_salt")

result = {
    "secret_hash": secret_hash,
    "verified_secret": verify_hash(secret, secret_hash),
    "verified_wrong": verify_hash("wrong", secret_hash),
    "password_hashed": len(password_hash) > 0,
    "password_verified": verify_password(password, password_hash, "user_salt"),
    "crypto_active": True,
}

if __name__ == "__main__":
    print(result)
