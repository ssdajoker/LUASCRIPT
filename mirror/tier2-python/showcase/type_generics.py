"""
MIRROR V3: Tier 2 Python Showcase
Category: Type System
Module: type_generics.py
Purpose: Demonstrate generic type patterns
"""

from typing import TypeVar, Generic, List, Optional


T = TypeVar('T')
K = TypeVar('K')
V = TypeVar('V')


class GenericBox(Generic[T]):
    """Generic box for any type"""
    def __init__(self, item: T):
        self.item = item
    
    def extract(self) -> T:
        return self.item
    
    def transform(self, func):
        return GenericBox(func(self.item))


class Pair(Generic[K, V]):
    """Generic pair/tuple wrapper"""
    def __init__(self, key: K, value: V):
        self.key = key
        self.value = value
    
    def get_key(self) -> K:
        return self.key
    
    def get_value(self) -> V:
        return self.value


def process_list(items: List[T]) -> T:
    """Process generic list"""
    return items[0] if items else None


result = {
    "box_int": GenericBox(100).extract(),
    "box_str": GenericBox("generic").extract(),
    "pair_ks": Pair("key", "string").get_key(),
    "pair_vi": Pair("value", 42).get_value(),
    "generic_active": True,
}

if __name__ == "__main__":
    print(result)
