"""
MIRROR V3: Tier 2 Python Showcase
Category: Optimization
Module: perf_constantfolding.py
Purpose: Demonstrate constant folding optimization
"""

# Compile-time constants
MULTIPLIER = 10
OFFSET = 5
MAX_VALUE = 1000
BASE_RESULT = 100


def compute_with_constants(x: int) -> int:
    """Compute using constants"""
    # These are folded at compile time
    result = x * MULTIPLIER + OFFSET
    if result > MAX_VALUE:
        result = MAX_VALUE
    return result


def optimized_constants(values):
    """Optimized computation with constants"""
    # Constant propagation
    results = []
    for v in values:
        opt = (v * MULTIPLIER) + OFFSET
        results.append(min(opt, MAX_VALUE))
    return results


def constant_table():
    """Pre-computed constant table"""
    return {
        f"value_{i}": compute_with_constants(i)
        for i in range(10)
    }


result = {
    "const_5": compute_with_constants(5),
    "const_50": compute_with_constants(50),
    "const_100": compute_with_constants(100),
    "optimized": optimized_constants([1, 2, 3, 4, 5]),
    "table_size": len(constant_table()),
}

if __name__ == "__main__":
    print(result)
