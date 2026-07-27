"""
MIRROR V3: Tier 2 Python Showcase
Category: Async & Control Flow
Module: async_errhandling.py
Purpose: Demonstrate error handling patterns
"""

from typing import Callable, Any, Tuple


def try_catch(try_func: Callable, catch_func: Callable = None) -> dict:
    """Try-catch pattern"""
    try:
        result = try_func()
        return {
            "success": True,
            "value": result,
        }
    except Exception as e:
        if catch_func:
            catch_func(e)
        return {
            "success": False,
            "error": str(e),
        }


def risky_operation(value: int) -> int:
    """Operation that might fail"""
    if value < 0:
        raise ValueError("negative value")
    return value * 2


def divide_safe(a: int, b: int) -> dict:
    """Safe division"""
    try:
        return {"result": a / b, "success": True}
    except ZeroDivisionError:
        return {"result": None, "success": False, "error": "division by zero"}


result1 = try_catch(lambda: risky_operation(10))
result2 = try_catch(lambda: risky_operation(-5))
divide_ok = divide_safe(10, 2)
divide_error = divide_safe(10, 0)

result = {
    "success_1": result1["success"],
    "value_1": result1["value"],
    "success_2": result2["success"],
    "divide_ok": divide_ok["result"],
    "divide_error_handled": not divide_error["success"],
    "error_handling_active": True,
}

if __name__ == "__main__":
    print(result)
