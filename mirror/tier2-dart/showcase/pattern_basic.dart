// MIRROR V3: Tier 2 Dart Showcase
// Category: Pattern Matching
// Module: pattern_basic.dart

String matchType(dynamic value) {
  if (value is int) return 'integer';
  if (value is String) return 'string';
  if (value is List) return 'list';
  if (value is Map) return 'map';
  return 'unknown';
}

String matchValue(int value) {
  if (value == 0) return 'zero';
  if (value > 0) return 'positive';
  return 'negative';
}

String matchPattern(Map<String, dynamic>? obj) {
  if (obj == null) return 'null';
  
  if (obj.containsKey('name') && obj.containsKey('age')) {
    return 'person';
  } else if (obj.containsKey('x') && obj.containsKey('y')) {
    return 'point';
  }
  return 'generic';
}

void main() {
  final result = <String, dynamic>{
    'typeInt': matchType(42),
    'typeStr': matchType('hello'),
    'typeList': matchType([1, 2, 3]),
    'valueZero': matchValue(0),
    'valuePos': matchValue(10),
    'patternPerson': matchPattern({'name': 'Alice', 'age': 30}),
    'patternPoint': matchPattern({'x': 1, 'y': 2}),
  };
  print(result);
}
