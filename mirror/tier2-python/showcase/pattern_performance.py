"""
MIRROR V3: Tier 2 Python Showcase
Category: Pattern Matching
Module: pattern_performance.py
Purpose: Demonstrate optimized pattern matching
"""


def fast_match(value):
    """Optimized fast path pattern matching"""
    # Fast path for common types
    t = type(value).__name__
    
    if t == 'int':
        return "fast_int"
    elif t == 'str':
        return "fast_str"
    elif t == 'list':
        return "fast_list"
    elif t == 'dict':
        return "fast_dict"
    else:
        return "other"


def optimized_dispatch(value, operation):
    """Type-optimized operation dispatch"""
    t = type(value).__name__
    
    if t == 'int' and operation == 'double':
        return value * 2
    elif t == 'str' and operation == 'upper':
        return value.upper()
    elif t == 'list' and operation == 'length':
        return len(value)
    
    return None


def batch_match(values):
    """Batch matching with type caching"""
    results = []
    type_cache = {}
    
    for v in values:
        t = type(v).__name__
        if t not in type_cache:
            type_cache[t] = 0
        type_cache[t] += 1
        results.append(fast_match(v))
    
    return {"matches": results, "type_counts": type_cache}


result = {
    "fast_int": fast_match(42),
    "fast_str": fast_match("hello"),
    "fast_list": fast_match([1, 2, 3]),
    "dispatch_double": optimized_dispatch(5, 'double'),
    "dispatch_upper": optimized_dispatch("test", 'upper'),
    "batch_count": len(batch_match([1, "a", 2, "b", 3])["matches"]),
}

if __name__ == "__main__":
    print(result)
