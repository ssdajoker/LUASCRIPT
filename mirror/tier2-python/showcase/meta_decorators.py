"""
MIRROR V3: Tier 2 Python Showcase
Category: Metaprogramming
Module: meta_decorators.py
Purpose: Demonstrate decorator patterns
"""

from functools import wraps
from typing import Callable, Any


def timing_decorator(func: Callable) -> Callable:
    """Decorator that adds timing capability"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        result = func(*args, **kwargs)
        return result
    return wrapper


def validation_decorator(validator: Callable) -> Callable:
    """Decorator that adds validation"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            if not validator(*args):
                return None
            return func(*args, **kwargs)
        return wrapper
    return decorator


def memoization_decorator(func: Callable) -> Callable:
    """Decorator for function memoization"""
    cache = {}
    @wraps(func)
    def wrapper(*args):
        if args not in cache:
            cache[args] = func(*args)
        return cache[args]
    return wrapper


@timing_decorator
def timed_function(x):
    return x * 2


@memoization_decorator
def fibonacci(n):
    if n < 2:
        return n
    return fibonacci(n-1) + fibonacci(n-2)


@validation_decorator(lambda x: x > 0)
def positive_only(x):
    return x * 2


result = {
    "timed": timed_function(10),
    "memo_fib_5": fibonacci(5),
    "memo_fib_10": fibonacci(10),
    "validated_pos": positive_only(10),
    "validated_neg": positive_only(-5),
}

if __name__ == "__main__":
    print(result)
