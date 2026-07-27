"""
MIRROR V3: Tier 2 Python Showcase
Category: Optimization
Module: perf_memoization.py
Purpose: Demonstrate generic memoization
"""

from functools import lru_cache
from typing import Callable


def memoize(func: Callable) -> Callable:
    """Generic memoization wrapper"""
    cache = {}
    
    def wrapper(*args):
        if args not in cache:
            cache[args] = func(*args)
        return cache[args]
    
    wrapper.cache = cache
    return wrapper


@lru_cache(maxsize=128)
def expensive_computation(n: int) -> int:
    """Expensive computation with built-in caching"""
    result = 0
    for i in range(n):
        result += i * i
    return result


@memoize
def custom_memoized(x: int) -> int:
    """Custom memoized function"""
    total = 0
    for i in range(x):
        total += i
    return total


result = {
    "expensive_5": expensive_computation(5),
    "expensive_10": expensive_computation(10),
    "custom_memo_100": custom_memoized(100),
    "custom_memo_200": custom_memoized(200),
    "memoization_active": True,
}

if __name__ == "__main__":
    print(result)
