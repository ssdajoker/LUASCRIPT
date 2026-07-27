"""
MIRROR V3: Tier 2 Python Showcase
Category: Optimization
Module: perf_deadcode.py
Purpose: Demonstrate dead code elimination awareness
"""

# Feature flags
ENABLE_DEBUG = False
ENABLE_LOGGING = False
ENABLE_OPTIMIZATION = True


def compute_with_features(value: int) -> int:
    """Compute with conditional features"""
    result = value
    
    if ENABLE_DEBUG:
        # This path may be eliminated
        result = result + 1000
    
    if ENABLE_OPTIMIZATION:
        # Fast path
        result = result * 2
    
    if ENABLE_LOGGING:
        # Logging eliminated
        print(f"Result: {result}")
    
    return result


def optimized_path(x: int) -> int:
    """Direct optimized path"""
    if ENABLE_OPTIMIZATION:
        return x * 2
    else:
        return x + 1


def feature_branch(features: dict) -> int:
    """Branching based on features"""
    result = 100
    
    if features.get("fast", False):
        result = result * 5
    else:
        result = result + 10
    
    return result


result = {
    "optimized_50": compute_with_features(50),
    "fast_path_100": optimized_path(100),
    "feature_fast": feature_branch({"fast": True}),
    "feature_slow": feature_branch({"fast": False}),
    "dead_code_removed": ENABLE_DEBUG is False,
}

if __name__ == "__main__":
    print(result)
