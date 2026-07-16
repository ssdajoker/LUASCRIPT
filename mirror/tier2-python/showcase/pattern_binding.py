"""
MIRROR V3: Tier 2 Python Showcase
Category: Pattern Matching
Module: pattern_binding.py
Purpose: Demonstrate pattern binding and destructuring
"""


def destructure_tuple(data):
    """Destructure tuple into components"""
    if isinstance(data, tuple) and len(data) == 3:
        a, b, c = data
        return {"first": a, "second": b, "third": c}
    return None


def destructure_dict(data):
    """Destructure dict pattern"""
    if isinstance(data, dict):
        name = data.get("name", "unknown")
        age = data.get("age", 0)
        return {"person": name, "age": age}
    return None


def destructure_list(data):
    """Destructure list pattern"""
    if isinstance(data, list) and len(data) >= 2:
        head = data[0]
        tail = data[1:]
        return {"head": head, "tail": tail}
    return None


def bind_and_match(obj):
    """Bind matched values"""
    if isinstance(obj, dict):
        x = obj.get("x")
        y = obj.get("y")
        if x is not None and y is not None:
            return {"bound_x": x, "bound_y": y, "sum": x + y}
    return None


result = {
    "tuple_destructure": destructure_tuple((1, 2, 3)),
    "dict_destructure": destructure_dict({"name": "Alice", "age": 30}),
    "list_destructure": destructure_list([10, 20, 30, 40]),
    "bind_and_match": bind_and_match({"x": 5, "y": 10}),
}

if __name__ == "__main__":
    print(result)
