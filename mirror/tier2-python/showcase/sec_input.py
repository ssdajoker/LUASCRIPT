"""
MIRROR V3: Tier 2 Python Showcase
Category: Security
Module: sec_input.py
Purpose: Demonstrate input validation patterns
"""

from typing import Union, Any


def validate_input(value: str, rules: dict) -> bool:
    """Validate input against rules"""
    if not isinstance(value, str):
        return False
    
    if rules.get("min_length") and len(value) < rules["min_length"]:
        return False
    
    if rules.get("max_length") and len(value) > rules["max_length"]:
        return False
    
    if rules.get("not_empty") and len(value) == 0:
        return False
    
    if rules.get("alphanumeric") and not value.isalnum():
        return False
    
    return True


def sanitize_input(value: str) -> str:
    """Sanitize input string"""
    if not isinstance(value, str):
        return ""
    
    # Remove dangerous characters
    dangerous = ['<', '>', '"', "'", '&', ';']
    sanitized = value
    for char in dangerous:
        sanitized = sanitized.replace(char, '')
    
    return sanitized.strip()


def validate_email(email: str) -> bool:
    """Validate email format"""
    if not isinstance(email, str):
        return False
    if '@' not in email or '.' not in email:
        return False
    return True


result = {
    "valid_hello": validate_input("hello", {"min_length": 3, "max_length": 10}),
    "invalid_short": validate_input("hi", {"min_length": 3}),
    "invalid_empty": validate_input("", {"not_empty": True}),
    "sanitized": sanitize_input("hello<script>"),
    "valid_email": validate_email("user@example.com"),
    "input_validation_active": True,
}

if __name__ == "__main__":
    print(result)
