// MIRROR V3: Tier 2 Dart Showcase
// Category: Type System
// Module: type_constraints.dart

class ConstrainedValue<T> {
  final T value;
  final Type valueType;
  
  ConstrainedValue(this.value, this.valueType) {
    if (value.runtimeType != valueType) {
      throw TypeError();
    }
  }
  
  T getValue() => value;
}

class BoundedInt {
  final int value;
  final int min;
  final int max;
  
  BoundedInt(this.value, {this.min = 0, this.max = 100}) {
    if (value < min || value > max) {
      throw RangeError('Value out of bounds');
    }
  }
  
  int getValue() => value;
}

bool validateNumber(int n, {int minVal = -100, int maxVal = 100}) {
  return n >= minVal && n <= maxVal;
}

void main() {
  final result = <String, dynamic>{
    'constrainedInt': ConstrainedValue<int>(42, int).getValue(),
    'boundedValue': BoundedInt(50, min: 0, max: 100).getValue(),
    'validateValid': validateNumber(50),
    'validateInvalid': validateNumber(200, maxVal: 100),
    'constraintsActive': true,
  };
  print(result);
}
