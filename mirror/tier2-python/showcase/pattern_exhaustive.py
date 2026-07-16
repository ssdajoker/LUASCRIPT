"""
MIRROR V3: Tier 2 Python Showcase
Category: Pattern Matching
Module: pattern_exhaustive.py
Purpose: Demonstrate exhaustive pattern matching
"""

from typing import Any


def exhaustive_match(value: Any) -> str:
    """Exhaustive pattern match on all types"""
    if value is None:
        return "nil"
    elif isinstance(value, bool):
        return "boolean"
    elif isinstance(value, int):
        return "integer"
    elif isinstance(value, float):
        return "float"
    elif isinstance(value, str):
        return "string"
    elif isinstance(value, list):
        return "list"
    elif isinstance(value, dict):
        return "dictionary"
    elif isinstance(value, tuple):
        return "tuple"
    elif isinstance(value, set):
        return "set"
    elif callable(value):
        return "function"
    else:
        return "unknown"


def handle_all_types(value):
    """Handle all type cases"""
    match_type = exhaustive_match(value)
    
    if match_type == "integer":
        return value * 2
    elif match_type == "string":
        return value.upper()
    elif match_type == "list":
        return len(value)
    elif match_type == "dictionary":
        return list(value.keys())
    elif match_type == "function":
        return "callable"
    else:
        return None


result = {
    "type_nil": exhaustive_match(None),
    "type_bool": exhaustive_match(True),
    "type_int": exhaustive_match(42),
    "type_float": exhaustive_match(3.14),
    "type_str": exhaustive_match("hello"),
    "type_list": exhaustive_match([1, 2, 3]),
    "type_dict": exhaustive_match({"a": 1}),
    "handle_int": handle_all_types(10),
    "handle_str": handle_all_types("test"),
}

if __name__ == "__main__":
    print(result)
