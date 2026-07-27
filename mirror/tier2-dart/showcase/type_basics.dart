// MIRROR V3: Tier 2 Dart Showcase
// Category: Type System
// Module: type_basics.dart

String checkType(dynamic value) {
  if (value == null) return 'null';
  if (value is bool) return 'bool';
  if (value is int) return 'int';
  if (value is double) return 'double';
  if (value is String) return 'String';
  if (value is List) return 'List';
  if (value is Map) return 'Map';
  return 'dynamic';
}

bool isNumericType(dynamic value) {
  return value is int || value is double;
}

bool isSequenceType(dynamic value) {
  return value is List || value is String;
}

dynamic combineTypes(dynamic a, dynamic b) {
  if (a is String && b is String) return a + b;
  if (isNumericType(a) && isNumericType(b)) return a + b;
  return 'mixed';
}

void main() {
  final result = <String, dynamic>{
    'typeCheckInt': checkType(42),
    'typeCheckStr': checkType('hello'),
    'isNumericInt': isNumericType(100),
    'isNumericStr': isNumericType('text'),
    'isSequenceList': isSequenceType([1, 2, 3]),
    'combinedStrings': combineTypes('hello', 'world'),
    'combinedNumbers': combineTypes(10, 20),
  };
  print(result);
}
