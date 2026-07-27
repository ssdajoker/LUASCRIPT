"""
MIRROR V3: Tier 2 Python Showcase
Category: Security
Module: sec_injection.py
Purpose: Demonstrate injection prevention
"""

import re


def escape_sql(value: str) -> str:
    """Escape SQL special characters"""
    if not isinstance(value, str):
        return ""
    
    escapes = {
        "'": "''",
        '"': '""',
        "\\": "\\\\",
    }
    
    result = value
    for char, escaped in escapes.items():
        result = result.replace(char, escaped)
    
    return result


def validate_query(query: str) -> bool:
    """Validate query for dangerous operations"""
    if not isinstance(query, str):
        return False
    
    forbidden = ["DROP", "DELETE", "UPDATE", "INSERT", "ALTER"]
    upper_query = query.upper()
    
    for keyword in forbidden:
        if keyword in upper_query:
            return False
    
    return True


def sanitize_html(content: str) -> str:
    """Sanitize HTML content"""
    if not isinstance(content, str):
        return ""
    
    # Remove script tags and dangerous attributes
    content = re.sub(r'<script[^>]*>.*?</script>', '', content, flags=re.IGNORECASE)
    content = re.sub(r'on\w+\s*=', '', content, flags=re.IGNORECASE)
    
    return content


result = {
    "escaped_quote": escape_sql("user's name"),
    "valid_select": validate_query("SELECT * FROM users"),
    "invalid_drop": validate_query("DROP TABLE users"),
    "invalid_delete": validate_query("DELETE FROM data"),
    "sanitized_html": sanitize_html("hello<script>alert(1)</script>"),
    "injection_prevention_active": True,
}

if __name__ == "__main__":
    print(result)
