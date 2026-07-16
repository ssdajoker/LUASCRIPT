"""
MIRROR V3: Tier 2 Python Showcase
Category: Type System
Module: type_advanced.py
Purpose: Demonstrate advanced Python type system features
"""

from typing import TypeVar, Generic, Protocol, Callable
from abc import ABC, abstractmethod


T = TypeVar('T')


class Container(Generic[T]):
    """Generic container class"""
    def __init__(self, value: T):
        self.value = value
    
    def get(self) -> T:
        return self.value
    
    def map(self, func: Callable[[T], T]) -> 'Container[T]':
        return Container(func(self.value))


class Validator(Protocol):
    """Protocol for validators"""
    def validate(self, value: Any) -> bool: ...


def create_int_container() -> Container[int]:
    """Create integer container"""
    return Container(42)


def create_str_container() -> Container[str]:
    """Create string container"""
    return Container("typed")


result = {
    "int_container": create_int_container().get(),
    "str_container": create_str_container().get(),
    "mapped_value": create_int_container().map(lambda x: x * 2).get(),
    "generic_demo": True,
}

if __name__ == "__main__":
    print(result)
