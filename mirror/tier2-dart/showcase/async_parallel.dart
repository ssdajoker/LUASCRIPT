// MIRROR V3: Tier 2 Dart Showcase
// Category: Async & Control Flow
// Module: async_parallel.dart

Future<List<T>> executeParallel<T>(List<Future<T> Function()> tasks) async {
  final futures = tasks.map((task) => task()).toList();
  return Future.wait(futures);
}

Future<int> Function() createTask(int value, int multiplier) {
  return () async => Future.value(value * multiplier);
}

Future<Map<String, dynamic>> batchExecute(List<int> items) async {
  final tasks = items.map((x) => createTask(x, 2)).toList();
  final results = await executeParallel(tasks);
  return {
    'items': items,
    'results': results,
    'count': results.length,
  };
}

void main() async {
  final tasks = [
    createTask(10, 2),
    createTask(20, 3),
    createTask(30, 4),
  ];
  
  final results = await executeParallel(tasks);
  final batchResults = await batchExecute([5, 10, 15]);
  
  final result = <String, dynamic>{
    'taskResults': results,
    'result1': results[0],
    'result2': results[1],
    'result3': results[2],
    'batchCount': batchResults['count'],
    'parallelActive': true,
  };
  print(result);
}
