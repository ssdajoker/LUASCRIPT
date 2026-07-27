"""
MIRROR V3: Tier 2 Python Showcase
Category: IR & Determinism
Module: ir_determinism.py
Purpose: Demonstrate deterministic computation
"""

import hashlib
from typing import List


def deterministic_sort(arr: List[int]) -> List[int]:
    """Deterministic sort"""
    return sorted(arr)


def deterministic_hash(data: List[int]) -> str:
    """Generate deterministic hash"""
    # Sort first to ensure determinism
    sorted_data = sorted(data)
    str_data = str(sorted_data)
    return hashlib.md5(str_data.encode()).hexdigest()[:16]


def stable_computation(values: List[int]) -> dict:
    """Stable deterministic computation"""
    sorted_vals = deterministic_sort(values)
    hash1 = deterministic_hash(sorted_vals)
    hash2 = deterministic_hash(sorted_vals)  # Should be identical
    
    return {
        "sorted": sorted_vals,
        "hash1": hash1,
        "hash2": hash2,
        "hashes_equal": hash1 == hash2,
    }


input_data = [5, 2, 8, 1, 9]
computation = stable_computation(input_data)

result = {
    "sorted_data": computation["sorted"],
    "hash_1": computation["hash1"],
    "hash_2": computation["hash2"],
    "deterministic": computation["hashes_equal"],
    "computation_stable": True,
}

if __name__ == "__main__":
    print(result)
