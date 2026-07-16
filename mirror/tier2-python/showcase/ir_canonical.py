"""
MIRROR V3: Tier 2 Python Showcase
Category: IR & Determinism
Module: ir_canonical.py
Purpose: Demonstrate IR canonicalization
"""

from typing import Union, Dict, Any


def canonical_form(expr: Any) -> Any:
    """Convert expression to canonical form"""
    if isinstance(expr, dict):
        if expr.get("op") == "add":
            left = canonical_form(expr.get("left"))
            right = canonical_form(expr.get("right"))
            
            if isinstance(left, (int, float)) and isinstance(right, (int, float)):
                return left + right
            
            return {"op": "add", "left": left, "right": right}
        
        elif expr.get("op") == "mul":
            left = canonical_form(expr.get("left"))
            right = canonical_form(expr.get("right"))
            
            if isinstance(left, (int, float)) and isinstance(right, (int, float)):
                return left * right
            
            return {"op": "mul", "left": left, "right": right}
    
    return expr


expr1 = {"op": "add", "left": 2, "right": 3}
expr2 = {"op": "mul", "left": 4, "right": 5}
expr3 = {"op": "add", "left": {"op": "mul", "left": 2, "right": 3}, "right": 4}

result = {
    "canon_add": canonical_form(expr1),
    "canon_mul": canonical_form(expr2),
    "canon_nested": canonical_form(expr3),
    "canonicalization_active": True,
}

if __name__ == "__main__":
    print(result)
