// MIRROR V3: Tier 2 Dart Showcase
// Category: Pattern Matching
// Module: pattern_nested.dart

Map<String, dynamic> matchNestedHash(Map<String, dynamic>? data) {
  if (data == null) return {'found': false};
  
  final user = data['user'];
  if (user is Map) {
    final profile = user['profile'];
    if (profile is Map) {
      final name = profile['name'] ?? 'unknown';
      return {'found': true, 'name': name};
    }
  }
  return {'found': false};
}

Map<String, dynamic>? matchNestedList(List<dynamic> data) {
  if (data.isNotEmpty && data[0] is List) {
    final first = data[0] as List;
    if (first.isNotEmpty) {
      return {'outer': first, 'inner': first[0]};
    }
  }
  return null;
}

void traverseStructure(dynamic obj, {int depth = 0}) {
  if (depth > 3) return;
  
  if (obj is Map) {
    obj.forEach((k, v) {
      if (v is Map || v is List) {
        traverseStructure(v, depth: depth + 1);
      }
    });
  } else if (obj is List) {
    for (final item in obj) {
      if (item is Map || item is List) {
        traverseStructure(item, depth: depth + 1);
      }
    }
  }
}

void main() {
  final result = <String, dynamic>{
    'nestedHashFound': matchNestedHash({'user': {'profile': {'name': 'Alice'}}}),
    'nestedHashNotfound': matchNestedHash({'data': 'simple'}),
    'nestedList': matchNestedList([[1, 2, 3], 4, 5]),
    'traversed': 'done',
  };
  print(result);
}
