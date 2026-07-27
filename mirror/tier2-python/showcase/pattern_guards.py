"""
MIRROR V3: Tier 2 Python Showcase
Category: Pattern Matching
Module: pattern_guards.py
Purpose: Demonstrate pattern matching with guards
"""


def match_with_guard(value):
    """Pattern matching with guard conditions"""
    if isinstance(value, int):
        if value > 100:
            return "large_int"
        elif value > 0:
            return "small_int"
        else:
            return "non_positive"
    elif isinstance(value, str):
        if len(value) > 10:
            return "long_string"
        else:
            return "short_string"
    return "other"


def guard_check(n, condition):
    """Guard-based decision"""
    if n > 0 and condition:
        return n * 2
    elif n > 0:
        return n
    else:
        return 0


def filtered_match(items, predicate):
    """Match items with predicate guard"""
    results = []
    for item in items:
        if predicate(item):
            results.append(item)
    return results


result = {
    "guard_large": match_with_guard(150),
    "guard_small": match_with_guard(50),
    "guard_string_long": match_with_guard("this is a very long string"),
    "guard_string_short": match_with_guard("short"),
    "guard_check_true": guard_check(10, True),
    "guard_check_false": guard_check(10, False),
    "filtered_evens": filtered_match([1, 2, 3, 4, 5], lambda x: x % 2 == 0),
}

if __name__ == "__main__":
    print(result)
