// MIRROR V3: Tier 2 Dart Showcase
// Category: Optimization
// Module: perf_deadcode.dart

const bool enableDebug = false;
const bool enableLogging = false;
const bool enableOptimization = true;

int computeWithFeatures(int value) {
  int result = value;
  
  if (enableDebug) {
    result = result + 1000;
  }
  
  if (enableOptimization) {
    result = result * 2;
  }
  
  if (enableLogging) {
    print('Result: $result');
  }
  
  return result;
}

int optimizedPath(int x) {
  if (enableOptimization) {
    return x * 2;
  }
  return x + 1;
}

int featureBranch(Map<String, bool> features) {
  int result = 100;
  
  if (features['fast'] ?? false) {
    result = result * 5;
  } else {
    result = result + 10;
  }
  
  return result;
}

void main() {
  final result = <String, dynamic>{
    'optimized50': computeWithFeatures(50),
    'fastPath100': optimizedPath(100),
    'featureFast': featureBranch({'fast': true}),
    'featureSlow': featureBranch({'fast': false}),
    'deadCodeRemoved': !enableDebug,
  };
  print(result);
}
