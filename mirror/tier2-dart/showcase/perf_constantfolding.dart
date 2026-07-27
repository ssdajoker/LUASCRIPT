// MIRROR V3: Tier 2 Dart Showcase
// Category: Optimization
// Module: perf_constantfolding.dart

const int multiplier = 10;
const int offset = 5;
const int maxValue = 1000;
const int baseResult = 100;

int computeWithConstants(int x) {
  int result = x * multiplier + offset;
  return result > maxValue ? maxValue : result;
}

List<int> optimizedConstants(List<int> values) {
  return values.map((v) {
    int opt = (v * multiplier) + offset;
    return opt > maxValue ? maxValue : opt;
  }).toList();
}

Map<String, int> constantTable() {
  final table = <String, int>{};
  for (int i = 0; i < 10; i++) {
    table['value_$i'] = computeWithConstants(i);
  }
  return table;
}

void main() {
  final result = <String, dynamic>{
    'const5': computeWithConstants(5),
    'const50': computeWithConstants(50),
    'const100': computeWithConstants(100),
    'optimized': optimizedConstants([1, 2, 3, 4, 5]),
    'tableSize': constantTable().length,
  };
  print(result);
}
