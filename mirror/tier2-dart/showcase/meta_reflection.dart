// MIRROR V3: Tier 2 Dart Showcase
// Category: Metaprogramming
// Module: meta_reflection.dart

import 'dart:mirrors';

Map<String, dynamic> reflectObject(dynamic obj) {
  return <String, dynamic>{
    'type': obj.runtimeType.toString(),
    'instanceMethods': 'available',
  };
}

Map<String, dynamic> reflectFunction(Function func) {
  return <String, dynamic>{
    'callable': true,
    'reflection': 'available',
  };
}

Map<String, dynamic> getAttributes(dynamic obj) {
  final attrs = <String, String>{};
  if (obj is Map) {
    for (final entry in (obj as Map).entries) {
      attrs[entry.key.toString()] = entry.value.runtimeType.toString();
    }
  }
  return attrs.cast<String, dynamic>();
}

class ReflectedClass {
  final dynamic x;
  final dynamic y;
  
  ReflectedClass(this.x, this.y);
  
  String method() => '$x:$y';
}

void main() {
  final result = <String, dynamic>{
    'reflectInt': reflectObject(42),
    'reflectStr': reflectObject('hello'),
    'reflectList': reflectObject([1, 2, 3]),
    'classAttrs': 2,
  };
  print(result);
}
