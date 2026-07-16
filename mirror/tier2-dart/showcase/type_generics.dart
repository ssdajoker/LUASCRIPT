// MIRROR V3: Tier 2 Dart Showcase
// Category: Type System
// Module: type_generics.dart

class Box<T> {
  final T _item;
  
  Box(this._item);
  
  T extract() => _item;
  
  Box<U> transform<U>(U Function(T) fn) => Box<U>(fn(_item));
}

class Pair<K, V> {
  final K key;
  final V value;
  
  Pair(this.key, this.value);
  
  K getKey() => key;
  V getValue() => value;
}

void main() {
  final result = <String, dynamic>{
    'boxInt': Box<int>(100).extract(),
    'boxStr': Box<String>('generic').extract(),
    'pairKs': Pair<String, String>('key', 'string').getKey(),
    'pairVi': Pair<String, int>('value', 42).getValue(),
    'genericActive': true,
  };
  print(result);
}
