// MIRROR V3: Tier 2 Dart Showcase
// Category: Type System
// Module: type_advanced.dart

class GenericContainer<T> {
  final T value;
  
  GenericContainer(this.value);
  
  U map<U>(U Function(T) func) => func(value);
  
  T getValue() => value;
}

GenericContainer<int> createIntContainer() => GenericContainer<int>(42);
GenericContainer<String> createStrContainer() => GenericContainer<String>('typed');

void main() {
  final result = <String, dynamic>{
    'intContainer': createIntContainer().getValue(),
    'strContainer': createStrContainer().getValue(),
    'mappedValue': createIntContainer().map<int>((x) => x * 2),
    'genericDemo': true,
  };
  print(result);
}
