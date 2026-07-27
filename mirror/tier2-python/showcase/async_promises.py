"""
MIRROR V3: Tier 2 Python Showcase
Category: Async & Control Flow
Module: async_promises.py
Purpose: Demonstrate promise-like patterns
"""

from typing import Callable, Any, List


class Promise:
    """Promise-like class"""
    def __init__(self, executor: Callable):
        self.state = "pending"
        self.value = None
        self.callbacks: List[Callable] = []
        
        def resolve(result):
            if self.state == "pending":
                self.state = "fulfilled"
                self.value = result
                for callback in self.callbacks:
                    callback(result)
        
        executor(resolve)
    
    def then(self, callback: Callable) -> 'Promise':
        """Add callback"""
        if self.state == "fulfilled":
            callback(self.value)
        else:
            self.callbacks.append(callback)
        return self
    
    def get_value(self):
        """Get promise value"""
        return self.value


def create_promise_from_value(value):
    """Create resolved promise"""
    return Promise(lambda resolve: resolve(value))


p1 = Promise(lambda resolve: resolve(42))
p2 = Promise(lambda resolve: resolve("hello"))

result = {
    "promise_state": p1.state,
    "promise_value": p1.get_value(),
    "promise_2_value": p2.get_value(),
    "promise_created": True,
}

if __name__ == "__main__":
    print(result)
