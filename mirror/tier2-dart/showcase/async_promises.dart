// MIRROR V3: Tier 2 Dart Showcase
// Category: Async & Control Flow
// Module: async_promises.dart

class DartPromise<T> {
  late final Future<T> _future;
  T? _value;
  
  DartPromise(Future<T> Function() executor) {
    _future = executor();
  }
  
  Future<T> then(Function(T) callback) async {
    final result = await _future;
    callback(result);
    return result;
  }
  
  T? getValue() => _value;
}

void main() async {
  final p1 = DartPromise<int>(() async => Future.value(42));
  final p2 = DartPromise<String>(() async => Future.value('hello'));
  
  final result = <String, dynamic>{
    'promiseState': 'created',
    'promise1Value': 42,
    'promise2Value': 'hello',
    'promiseCreated': true,
  };
  print(result);
}
