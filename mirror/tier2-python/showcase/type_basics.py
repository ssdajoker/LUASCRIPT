"""
MIRROR V3: Tier 2 Python Showcase
Category: Type System
Module: type_basics.py
Purpose: Demonstrate Python type system basics
"""

from typing import Any, Union, List, Dict, Optional


def check_type(value: Any) -> str:
    """Check and return type of value"""
    return type(value).__name__


def is_numeric(value: Any) -> bool:
    """Check if value is numeric type"""
    return isinstance(value, (int, float))


def is_sequence(value: Any) -> bool:
    """Check if value is sequence type"""
    return isinstance(value, (list, tuple, str))


def combine_types(a: Union[int, str], b: Union[int, str]) -> str:
    """Combine two typed values"""
    if isinstance(a, str) and isinstance(b, str):
        return f"{a}{b}"
    elif isinstance(a, (int, float)) and isinstance(b, (int, float)):
        return str(a + b)
    return "mixed"


result = {
    "type_check_int": check_type(42),
    "type_check_str": check_type("hello"),
    "is_numeric_int": is_numeric(100),
    "is_numeric_str": is_numeric("text"),
    "is_sequence_list": is_sequence([1, 2, 3]),
    "combined_strings": combine_types("hello", "world"),
    "combined_numbers": combine_types(10, 20),
}

if __name__ == "__main__":
    print(result)
