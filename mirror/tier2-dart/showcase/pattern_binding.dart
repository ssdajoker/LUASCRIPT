// MIRROR V3: Tier 2 Dart Showcase
// Category: Pattern Matching
// Module: pattern_binding.dart

Map<String, dynamic>? destructureTuple(List<dynamic> data) {
  if (data.length == 3) {
    final [a, b, c] = data;
    return {'first': a, 'second': b, 'third': c};
  }
  return null;
}

Map<String, dynamic>? destructureHash(Map<String, dynamic>? data) {
  if (data == null) return null;
  
  final name = data['name'] ?? 'unknown';
  final age = data['age'] ?? 0;
  return {'person': name, 'age': age};
}

Map<String, dynamic>? destructureList(List<dynamic> data) {
  if (data.isNotEmpty) {
    final head = data[0];
    final tail = data.sublist(1);
    return {'head': head, 'tail': tail};
  }
  return null;
}

Map<String, dynamic>? bindAndMatch(Map<String, dynamic>? obj) {
  if (obj != null && obj.containsKey('x') && obj.containsKey('y')) {
    final x = obj['x'] as int;
    final y = obj['y'] as int;
    return {'boundX': x, 'boundY': y, 'sum': x + y};
  }
  return null;
}

void main() {
  final result = <String, dynamic>{
    'tupleDestructure': destructureTuple([1, 2, 3]),
    'hashDestructure': destructureHash({'name': 'Alice', 'age': 30}),
    'listDestructure': destructureList([10, 20, 30, 40]),
    'bindAndMatch': bindAndMatch({'x': 5, 'y': 10}),
  };
  print(result);
}
