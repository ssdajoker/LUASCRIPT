// MIRROR V3: Tier 2 Dart Showcase
// Category: Optimization
// Module: perf_benchmark.dart

Map<String, dynamic> measureTime(Function func, {int iterations = 1000}) {
  final start = DateTime.now().millisecondsSinceEpoch;
  
  for (int i = 0; i < iterations; i++) {
    func();
  }
  
  final elapsed = (DateTime.now().millisecondsSinceEpoch - start).toDouble();
  
  return {
    'elapsedMs': elapsed,
    'iterations': iterations,
    'perCallUs': (elapsed * 1000 / iterations),
  };
}

int simpleOperation(int x) => x * 2;

int complexOperation(int x) {
  int result = 0;
  for (int i = 0; i < 10; i++) {
    result += x * i;
  }
  return result;
}

int optimizedOperation(int x) => (x * 10 * 9 ~/ 2);

void main() {
  final simpleBench = measureTime(() => simpleOperation(100), iterations: 10000);
  final complexBench = measureTime(() => complexOperation(100), iterations: 1000);
  final optimizedBench = measureTime(() => optimizedOperation(100), iterations: 10000);
  
  final result = <String, dynamic>{
    'simpleElapsed': simpleBench['elapsedMs'],
    'complexElapsed': complexBench['elapsedMs'],
    'optimizedElapsed': optimizedBench['elapsedMs'],
    'benchmarkingActive': true,
  };
  print(result);
}
