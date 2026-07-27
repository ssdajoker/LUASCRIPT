"""
MIRROR V3: Tier 2 Python Showcase
Category: Type System
Module: type_constraints.py
Purpose: Demonstrate type constraints and validation
"""

from typing import Union, TypeVar, Callable


T = TypeVar('T')


class ConstrainedValue:
    """Value with type constraints"""
    def __init__(self, value: Union[int, str], value_type: type):
        if not isinstance(value, value_type):
            raise TypeError(f"Expected {value_type}, got {type(value)}")
        self.value = value
        self.value_type = value_type
    
    def get(self) -> Union[int, str]:
        return self.value


class BoundedInt:
    """Integer with min/max bounds"""
    def __init__(self, value: int, min_val: int = 0, max_val: int = 100):
        if not (min_val <= value <= max_val):
            raise ValueError(f"Value {value} outside bounds [{min_val}, {max_val}]")
        self.value = value
        self.min = min_val
        self.max = max_val
    
    def get(self) -> int:
        return self.value


def validate_number(n: int, min_val: int = -100, max_val: int = 100) -> bool:
    """Validate number within constraints"""
    return min_val <= n <= max_val


result = {
    "constrained_int": ConstrainedValue(42, int).get(),
    "bounded_value": BoundedInt(50, 0, 100).get(),
    "validate_valid": validate_number(50),
    "validate_invalid": validate_number(200, 0, 100),
    "constraints_active": True,
}

if __name__ == "__main__":
    print(result)
