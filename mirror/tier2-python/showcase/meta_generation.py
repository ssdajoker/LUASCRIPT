"""
MIRROR V3: Tier 2 Python Showcase
Category: Metaprogramming
Module: meta_generation.py
Purpose: Demonstrate code generation patterns
"""

from typing import Callable


def generate_adder(n: int) -> Callable:
    """Generate an adder function"""
    def adder(x: int) -> int:
        return x + n
    return adder


def generate_multiplier(n: int) -> Callable:
    """Generate a multiplier function"""
    def multiplier(x: int) -> int:
        return x * n
    return multiplier


def compose_generators(*generators) -> Callable:
    """Compose multiple generator functions"""
    def composed(x):
        result = x
        for gen in generators:
            result = gen(result)
        return result
    return composed


def meta_factory(op: str, value: int) -> Callable:
    """Factory for generating operations"""
    if op == "add":
        return generate_adder(value)
    elif op == "mul":
        return generate_multiplier(value)
    else:
        return lambda x: x


add_10 = generate_adder(10)
mul_5 = generate_multiplier(5)
composed = compose_generators(
    generate_adder(5),
    generate_multiplier(2)
)

result = {
    "add_10_to_20": add_10(20),
    "mul_5_to_10": mul_5(10),
    "composed_30": composed(10),
    "factory_add": meta_factory("add", 100)(50),
    "factory_mul": meta_factory("mul", 3)(7),
}

if __name__ == "__main__":
    print(result)
