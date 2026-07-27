"""
MIRROR V3: Tier 2 Python Showcase
Category: Optimization
Module: perf_benchmark.py
Purpose: Demonstrate performance benchmarking
"""

import time
from typing import Callable, Any


def measure_time(func: Callable, *args, iterations: int = 1000) -> dict:
    """Measure function execution time"""
    start = time.perf_counter()
    
    for _ in range(iterations):
        func(*args)
    
    end = time.perf_counter()
    elapsed = (end - start) * 1000  # Convert to ms
    
    return {
        "elapsed_ms": round(elapsed, 3),
        "iterations": iterations,
        "per_call_us": round(elapsed * 1000 / iterations, 2),
    }


def simple_operation(x: int) -> int:
    """Simple operation"""
    return x * 2


def complex_operation(x: int) -> int:
    """Complex operation"""
    result = 0
    for i in range(10):
        result += x * i
    return result


def optimized_operation(x: int) -> int:
    """Optimized operation"""
    return x * 10 * 9 // 2  # Closed form


simple_bench = measure_time(simple_operation, 100, iterations=10000)
complex_bench = measure_time(complex_operation, 100, iterations=1000)
optimized_bench = measure_time(optimized_operation, 100, iterations=10000)

result = {
    "simple_elapsed": simple_bench["elapsed_ms"],
    "complex_elapsed": complex_bench["elapsed_ms"],
    "optimized_elapsed": optimized_bench["elapsed_ms"],
    "simple_per_call": simple_bench["per_call_us"],
    "benchmarking_active": True,
}

if __name__ == "__main__":
    print(result)
