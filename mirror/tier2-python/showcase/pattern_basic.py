"""
MIRROR V3: Tier 2 Python Showcase
Category: Pattern Matching
Module: pattern_basic.py
Purpose: Demonstrate basic pattern matching
"""

from typing import Union, Dict, Any


def match_type(value: Any) -> str:
    """Match on type"""
    if isinstance(value, int):
        return "integer"
    elif isinstance(value, str):
        return "string"
    elif isinstance(value, list):
        return "list"
    elif isinstance(value, dict):
        return "dict"
    else:
        return "unknown"


def match_value(value: int) -> str:
    """Match on value"""
    if value == 0:
        return "zero"
    elif value > 0:
        return "positive"
    elif value < 0:
        return "negative"
    else:
        return "unknown"


def match_pattern(obj: Dict) -> str:
    """Match on pattern structure"""
    if "name" in obj and "age" in obj:
        return "person"
    elif "x" in obj and "y" in obj:
        return "point"
    else:
        return "generic"


result = {
    "type_int": match_type(42),
    "type_str": match_type("hello"),
    "type_list": match_type([1, 2, 3]),
    "value_zero": match_value(0),
    "value_pos": match_value(10),
    "pattern_person": match_pattern({"name": "Alice", "age": 30}),
    "pattern_point": match_pattern({"x": 1, "y": 2}),
}

if __name__ == "__main__":
    print(result)
