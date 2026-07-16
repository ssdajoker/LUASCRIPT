// MIRROR V3: Tier 2 Dart Showcase
// Category: Async & Control Flow
// Module: async_errhandling.dart

Future<Map<String, dynamic>> tryCatch<T>(
  Future<T> Function() tryFunc, {
  Future<void> Function(Exception)? catchFunc,
}) async {
  try {
    final result = await tryFunc();
    return {'success': true, 'value': result};
  } on Exception catch (e) {
    if (catchFunc != null) {
      await catchFunc(e);
    }
    return {'success': false, 'error': e.toString()};
  }
}

Future<int> riskyOperation(int value) async {
  if (value < 0) {
    throw Exception('negative value');
  }
  return value * 2;
}

Future<Map<String, dynamic>> divideSafe(int a, int b) async {
  try {
    if (b == 0) throw Exception('division by zero');
    return {'result': a ~/ b, 'success': true};
  } catch (e) {
    return {'result': null, 'success': false, 'error': e.toString()};
  }
}

void main() async {
  final result1 = await tryCatch(() => riskyOperation(10));
  final result2 = await tryCatch(() => riskyOperation(-5));
  final divideOk = await divideSafe(10, 2);
  final divideError = await divideSafe(10, 0);
  
  final result = <String, dynamic>{
    'success1': result1['success'],
    'value1': result1['value'],
    'success2': result2['success'],
    'divideOk': divideOk['result'],
    'divideErrorHandled': !divideError['success'],
    'errorHandlingActive': true,
  };
  print(result);
}
