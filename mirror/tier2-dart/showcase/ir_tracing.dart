// MIRROR V3: Tier 2 Dart Showcase
// Category: IR & Determinism
// Module: ir_tracing.dart

class IRTracer {
  final List<Map<String, dynamic>> _trace = [];
  
  void record(String operation, List<dynamic> inputs, dynamic output) {
    _trace.add({
      'op': operation,
      'inputs': inputs,
      'output': output,
    });
  }
  
  int tracedAdd(int a, int b) {
    final result = a + b;
    record('add', [a, b], result);
    return result;
  }
  
  int tracedMul(int a, int b) {
    final result = a * b;
    record('mul', [a, b], result);
    return result;
  }
  
  List<Map<String, dynamic>> getTrace() => _trace;
  
  int getTraceLength() => _trace.length;
}

void main() {
  final tracer = IRTracer();
  final r1 = tracer.tracedAdd(10, 20);
  final r2 = tracer.tracedMul(5, 6);
  final r3 = tracer.tracedAdd(r1, r2);
  final traceLen = tracer.getTraceLength();
  
  final result = <String, dynamic>{
    'result1': r1,
    'result2': r2,
    'result3': r3,
    'traceLength': traceLen,
    'tracingEnabled': true,
  };
  print(result);
}
