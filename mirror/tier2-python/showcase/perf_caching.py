"""
MIRROR V3: Tier 2 Python Showcase
Category: Optimization
Module: perf_caching.py
Purpose: Demonstrate caching and memoization
"""


class CachedFibonacci:
    """Fibonacci with caching"""
    def __init__(self):
        self.cache = {}
        self.hits = 0
        self.misses = 0
    
    def compute(self, n: int) -> int:
        if n in self.cache:
            self.hits += 1
            return self.cache[n]
        
        self.misses += 1
        if n < 2:
            result = n
        else:
            result = self.compute(n - 1) + self.compute(n - 2)
        
        self.cache[n] = result
        return result
    
    def get_stats(self):
        return {
            "hits": self.hits,
            "misses": self.misses,
            "cache_size": len(self.cache)
        }


fib = CachedFibonacci()
fib_10 = fib.compute(10)
fib_20 = fib.compute(20)
stats = fib.get_stats()

result = {
    "fib_10": fib_10,
    "fib_20": fib_20,
    "cache_hits": stats["hits"],
    "cache_misses": stats["misses"],
    "cache_enabled": True,
}

if __name__ == "__main__":
    print(result)
