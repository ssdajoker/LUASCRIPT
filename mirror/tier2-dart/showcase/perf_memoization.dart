// MIRROR V3: Tier 2 Dart Showcase
// Category: Optimization
// Module: perf_memoization.dart

Function memoize(Function func) {
  final cache = <String, dynamic>{};
  return (List<dynamic> args) {
    final key = args.toString();
    if (!cache.containsKey(key)) {
      cache[key] = Function.apply(func, args);
    }
    return cache[key];
  };
}

int expensiveComputation(int n) {
  int result = 0;
  for (int i = 0; i < n; i++) {
    result += i * i;
  }
  return result;
}

void main() {
  final customMemoized = memoize((int x) {
    int total = 0;
    for (int i = 0; i < x; i++) {
      total += i;
    }
    return total;
  });
  
  final result = <String, dynamic>{
    'expensive5': expensiveComputation(5),
    'expensive10': expensiveComputation(10),
    'customMemo100': customMemoized([100]),
    'customMemo200': customMemoized([200]),
    'memoizationActive': true,
  };
  print(result);
}
