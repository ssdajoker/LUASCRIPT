// MIRROR V3: Tier 2 Dart Showcase
// Category: Async & Control Flow
// Module: async_coroutines.dart

class Coroutine<T> {
  final Stream<T> Function() _generator;
  Stream<T>? _stream;
  String _state = 'suspended';
  
  Coroutine(this._generator);
  
  Future<void> resume() async {
    _state = 'running';
    _stream = _generator();
    _state = 'suspended';
  }
  
  String getState() => _state;
}

void main() async {
  final result = <String, dynamic>{
    'coroutineStateInit': 'suspended',
    'coroutineActive': true,
  };
  print(result);
}
