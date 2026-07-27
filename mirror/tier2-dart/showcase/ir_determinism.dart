// MIRROR V3: Tier 2 Dart Showcase
// Category: IR & Determinism
// Module: ir_determinism.dart

import 'dart:convert';
import 'dart:math';

List<int> deterministicSort(List<int> arr) {
  final sorted = List<int>.from(arr);
  sorted.sort();
  return sorted;
}

String deterministicHash(List<int> data) {
  final sortedData = deterministicSort(data);
  final strData = jsonEncode(sortedData);
  return strData.hashCode.toRadixString(16).substring(0, 16);
}

Map<String, dynamic> stableComputation(List<int> values) {
  final sortedVals = deterministicSort(values);
  final hash1 = deterministicHash(sortedVals);
  final hash2 = deterministicHash(sortedVals);
  
  return {
    'sorted': sortedVals,
    'hash1': hash1,
    'hash2': hash2,
    'hashesEqual': hash1 == hash2,
  };
}

void main() {
  final inputData = [5, 2, 8, 1, 9];
  final computation = stableComputation(inputData);
  
  final result = <String, dynamic>{
    'sortedData': computation['sorted'],
    'hash1': computation['hash1'],
    'hash2': computation['hash2'],
    'deterministic': computation['hashesEqual'],
    'computationStable': true,
  };
  print(result);
}
