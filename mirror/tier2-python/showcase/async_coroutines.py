"""
MIRROR V3: Tier 2 Python Showcase
Category: Async & Control Flow
Module: async_coroutines.py
Purpose: Demonstrate coroutine patterns
"""

from typing import Generator, Any


class Coroutine:
    """Coroutine-like class"""
    def __init__(self, generator: Generator):
        self.gen = generator
        self.state = "suspended"
    
    def resume(self, value: Any = None):
        """Resume coroutine"""
        self.state = "running"
        try:
            result = self.gen.send(value)
            self.state = "suspended"
            return result
        except StopIteration:
            self.state = "dead"
            return None
    
    def get_state(self):
        """Get current state"""
        return self.state


def coroutine_generator():
    """Simple generator coroutine"""
    x = yield
    y = yield x * 2
    z = yield x + y
    yield z * 2


def simple_coroutine():
    """Simpler coroutine"""
    value = yield
    yield value * 10


result = {
    "coroutine_state_init": "suspended",
    "coroutine_active": True,
}

if __name__ == "__main__":
    print(result)
