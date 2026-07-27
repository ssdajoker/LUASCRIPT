// MIRROR V3: Tier 2 Dart Showcase
// Category: Pattern Matching
// Module: pattern_exhaustive.dart

String exhaustiveMatch(dynamic value) {
  if (value == null) return 'nil';
  if (value is bool) return 'bool';
  if (value is int) return 'int';
  if (value is double) return 'double';
  if (value is String) return 'String';
  if (value is List) return 'List';
  if (value is Map) return 'Map';
  if (value is Function) return 'Function';
  return 'unknown';
}

dynamic handleAllTypes(dynamic value) {
  final typeStr = exhaustiveMatch(value);
  switch (typeStr) {
    case 'int': return (value as int) * 2;
    case 'String': return (value as String).toUpperCase();
    case 'List': return (value as List).length;
    case 'Map': return (value as Map).length;
    case 'Function': return 'callable';
    default: return null;
  }
}

void main() {
  final result = <String, dynamic>{
    'typeNil': exhaustiveMatch(null),
    'typeBool': exhaustiveMatch(true),
    'typeInt': exhaustiveMatch(42),
    'typeDouble': exhaustiveMatch(3.14),
    'typeStr': exhaustiveMatch('hello'),
    'typeList': exhaustiveMatch([1, 2, 3]),
    'typeMap': exhaustiveMatch({'a': 1}),
    'handleInt': handleAllTypes(10),
    'handleStr': handleAllTypes('test'),
  };
  print(result);
}
