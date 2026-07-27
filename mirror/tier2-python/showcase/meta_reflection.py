"""
MIRROR V3: Tier 2 Python Showcase
Category: Metaprogramming
Module: meta_reflection.py
Purpose: Demonstrate reflection and introspection
"""

import inspect
from typing import Any


def reflect_object(obj: Any) -> dict:
    """Reflect on object structure"""
    return {
        "type": type(obj).__name__,
        "class": obj.__class__.__name__,
        "module": obj.__class__.__module__,
        "dir": len(dir(obj)),
    }


def reflect_function(func) -> dict:
    """Reflect on function signature"""
    sig = inspect.signature(func)
    return {
        "name": func.__name__,
        "params": list(sig.parameters.keys()),
        "param_count": len(sig.parameters),
        "annotations": str(func.__annotations__),
    }


def get_attributes(obj) -> dict:
    """Get all attributes of object"""
    attrs = {}
    for name, value in inspect.getmembers(obj):
        if not name.startswith('_'):
            attrs[name] = type(value).__name__
    return attrs


class ReflectedClass:
    """Class for reflection"""
    def __init__(self, x: int, y: str):
        self.x = x
        self.y = y
    
    def method(self) -> str:
        return f"{self.x}:{self.y}"


result = {
    "reflect_int": reflect_object(42),
    "reflect_str": reflect_object("hello"),
    "reflect_list": reflect_object([1, 2, 3]),
    "function_params": reflect_function(reflect_object),
    "class_attrs": len(get_attributes(ReflectedClass(1, "a"))),
}

if __name__ == "__main__":
    print(result)
