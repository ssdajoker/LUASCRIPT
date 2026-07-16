// MIRROR V3: Tier 2 Dart Showcase
// Category: Type System
// Module: type_performance.dart

dynamic fastNumericOp(dynamic a, dynamic b) {
  if (a is num && b is num) {
    return a + b;
  }
  return '$a$b';
}

dynamic optimizedDispatch(dynamic value, String operation) {
  if (value is int) {
    switch (operation) {
      case 'double': return value * 2;
      case 'square': return value * value;
      default: return null;
    }
  } else if (value is String) {
    switch (operation) {
      case 'upper': return value.toUpperCase();
      case 'len': return value.length;
      default: return null;
    }
  }
  return null;
}

void main() {
  final result = <String, dynamic>{
    'fastAdd': fastNumericOp(10, 20),
    'fastConcat': fastNumericOp('hello', 'world'),
    'dispatchDouble': optimizedDispatch(25, 'double'),
    'dispatchSquare': optimizedDispatch(5, 'square'),
    'dispatchUpper': optimizedDispatch('test', 'upper'),
  };
  print(result);
}
