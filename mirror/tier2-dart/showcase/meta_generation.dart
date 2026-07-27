// MIRROR V3: Tier 2 Dart Showcase
// Category: Metaprogramming
// Module: meta_generation.dart

Function generateAdder(int n) {
  return (int x) => x + n;
}

Function generateMultiplier(int n) {
  return (int x) => x * n;
}

Function composeGenerators(List<Function> generators) {
  return (int x) {
    int result = x;
    for (final gen in generators) {
      result = (gen as Function)(result) as int;
    }
    return result;
  };
}

Function metaFactory(String op, int value) {
  switch (op) {
    case 'add': return generateAdder(value);
    case 'mul': return generateMultiplier(value);
    default: return (int x) => x;
  }
}

void main() {
  final add10 = generateAdder(10);
  final mul5 = generateMultiplier(5);
  final composed = composeGenerators([
    generateAdder(5),
    generateMultiplier(2),
  ]);
  
  final result = <String, dynamic>{
    'add10to20': add10(20),
    'mul5to10': mul5(10),
    'composed30': composed(10),
    'factoryAdd': metaFactory('add', 100)(50),
    'factoryMul': metaFactory('mul', 3)(7),
  };
  print(result);
}
