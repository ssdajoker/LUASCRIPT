"""
MIRROR V3: Tier 2 Python Showcase
Category: Pattern Matching
Module: pattern_nested.py
Purpose: Demonstrate nested pattern matching
"""


def match_nested_dict(data):
    """Match nested dictionary patterns"""
    if isinstance(data, dict):
        if "user" in data and isinstance(data["user"], dict):
            user = data["user"]
            if "profile" in user and isinstance(user["profile"], dict):
                profile = user["profile"]
                name = profile.get("name", "unknown")
                return {"found": True, "name": name}
    return {"found": False}


def match_nested_list(data):
    """Match nested list patterns"""
    if isinstance(data, list) and len(data) > 0:
        first = data[0]
        if isinstance(first, list) and len(first) > 0:
            inner = first[0]
            return {"outer": first, "inner": inner}
    return None


def traverse_structure(obj, depth=0):
    """Traverse and match nested structures"""
    if depth > 3:
        return None
    
    if isinstance(obj, dict):
        for key, value in obj.items():
            if isinstance(value, (dict, list)):
                traverse_structure(value, depth + 1)
        return "traversed_dict"
    elif isinstance(obj, list):
        for item in obj:
            if isinstance(item, (dict, list)):
                traverse_structure(item, depth + 1)
        return "traversed_list"
    return None


result = {
    "nested_dict_found": match_nested_dict({
        "user": {"profile": {"name": "Alice"}}
    }),
    "nested_dict_notfound": match_nested_dict({"data": "simple"}),
    "nested_list": match_nested_list([[1, 2, 3], 4, 5]),
    "traversed": traverse_structure({"a": {"b": {"c": 1}}}),
}

if __name__ == "__main__":
    print(result)
