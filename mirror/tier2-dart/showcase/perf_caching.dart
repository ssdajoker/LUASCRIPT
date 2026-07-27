// MIRROR V3: Tier 2 Dart Showcase
// Category: Optimization
// Module: perf_caching.dart

class CachedFibonacci {
  final Map<int, int> _cache = {};
  int _hits = 0;
  int _misses = 0;
  
  int compute(int n) {
    if (_cache.containsKey(n)) {
      _hits++;
      return _cache[n]!;
    }
    
    _misses++;
    final result = n < 2 ? n : compute(n - 1) + compute(n - 2);
    _cache[n] = result;
    return result;
  }
  
  Map<String, dynamic> getStats() => {
    'hits': _hits,
    'misses': _misses,
    'cacheSize': _cache.length,
  };
}

void main() {
  final fib = CachedFibonacci();
  final fib10 = fib.compute(10);
  final fib20 = fib.compute(20);
  final stats = fib.getStats();
  
  final result = <String, dynamic>{
    'fib10': fib10,
    'fib20': fib20,
    'cacheHits': stats['hits'],
    'cacheMisses': stats['misses'],
    'cacheEnabled': true,
  };
  print(result);
}
