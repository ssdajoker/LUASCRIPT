// MIRROR V3: Tier 2 Dart Showcase
// Category: Pattern Matching
// Module: pattern_guards.dart

String matchWithGuard(dynamic value) {
  if (value is int) {
    if (value > 100) return 'largeInt';
    if (value > 0) return 'smallInt';
    return 'nonPositive';
  } else if (value is String) {
    if (value.length > 10) return 'longString';
    return 'shortString';
  }
  return 'other';
}

int guardCheck(int n, bool condition) {
  if (n > 0 && condition) return n * 2;
  if (n > 0) return n;
  return 0;
}

List<T> filteredMatch<T>(List<T> items, bool Function(T) predicate) {
  return items.where(predicate).toList();
}

void main() {
  final result = <String, dynamic>{
    'guardLarge': matchWithGuard(150),
    'guardSmall': matchWithGuard(50),
    'guardStringLong': matchWithGuard('this is a very long string'),
    'guardStringShort': matchWithGuard('short'),
    'guardCheckTrue': guardCheck(10, true),
    'guardCheckFalse': guardCheck(10, false),
    'filteredEvens': filteredMatch<int>([1, 2, 3, 4, 5], (x) => x % 2 == 0),
  };
  print(result);
}
