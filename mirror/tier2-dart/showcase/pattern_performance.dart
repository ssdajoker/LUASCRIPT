// MIRROR V3: Tier 2 Dart Showcase
// Category: Pattern Matching
// Module: pattern_performance.dart

String fastMatch(dynamic value) {
  if (value is int) return 'fastInt';
  if (value is String) return 'fastStr';
  if (value is List) return 'fastList';
  if (value is Map) return 'fastMap';
  return 'other';
}

dynamic optimizedDispatch(dynamic value, String operation) {
  if (value is int) {
    switch (operation) {
      case 'double': return value * 2;
      default: return null;
    }
  } else if (value is String) {
    switch (operation) {
      case 'upper': return value.toUpperCase();
      default: return null;
    }
  } else if (value is List) {
    switch (operation) {
      case 'length': return value.length;
      default: return null;
    }
  }
  return null;
}

Map<String, dynamic> batchMatch(List<dynamic> values) {
  final results = <String>[];
  final typeCache = <String, int>{};
  
  for (final v in values) {
    final t = v.runtimeType.toString();
    typeCache[t] = (typeCache[t] ?? 0) + 1;
    results.add(fastMatch(v));
  }
  
  return {'matches': results, 'typeCounts': typeCache};
}

void main() {
  final result = <String, dynamic>{
    'fastInt': fastMatch(42),
    'fastStr': fastMatch('hello'),
    'fastList': fastMatch([1, 2, 3]),
    'dispatchDouble': optimizedDispatch(5, 'double'),
    'dispatchUpper': optimizedDispatch('test', 'upper'),
    'batchCount': batchMatch([1, 'a', 2, 'b', 3])['matches'],
  };
  print(result);
}
