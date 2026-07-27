"""
MIRROR V3: Tier 2 Python Showcase
Category: Type System
Module: type_performance.py
Purpose: Demonstrate type-aware performance optimization
"""


def fast_numeric_op(a, b):
    """Fast path for numeric operations"""
    if isinstance(a, (int, float)) and isinstance(b, (int, float)):
        return a + b
    return str(a) + str(b)


def optimized_dispatch(value, operation):
    """Type-aware operation dispatch"""
    if isinstance(value, int):
        if operation == "double":
            return value * 2
        elif operation == "square":
            return value * value
    elif isinstance(value, str):
        if operation == "upper":
            return value.upper()
        elif operation == "len":
            return len(value)
    return None


result = {
    "fast_add": fast_numeric_op(10, 20),
    "fast_concat": fast_numeric_op("hello", "world"),
    "dispatch_double": optimized_dispatch(25, "double"),
    "dispatch_square": optimized_dispatch(5, "square"),
    "dispatch_upper": optimized_dispatch("test", "upper"),
}

if __name__ == "__main__":
    print(result)
