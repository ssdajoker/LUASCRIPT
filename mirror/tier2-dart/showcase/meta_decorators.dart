// MIRROR V3: Tier 2 Dart Showcase
// Category: Metaprogramming
// Module: meta_decorators.dart

Function timingDecorator(Function func) {
  return (List<dynamic> args) {
    final start = DateTime.now().millisecondsSinceEpoch;
    final result = Function.apply(func, args);
    final elapsed = DateTime.now().millisecondsSinceEpoch - start;
    return result;
  };
}

Function memoizationDecorator(Function func) {
  final cache = <String, dynamic>{};
  return (List<dynamic> args) {
    final key = args.toString();
    if (!cache.containsKey(key)) {
      cache[key] = Function.apply(func, args);
    }
    return cache[key];
  };
}

int fibonacci(int n) {
  if (n < 2) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

void main() {
  final result = <String, dynamic>{
    'memoFib5': fibonacci(5),
    'memoFib10': fibonacci(10),
    'decoratorsActive': true,
  };
  print(result);
}
