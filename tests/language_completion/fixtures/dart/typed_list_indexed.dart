double adjust(double value) {
  return value + 5;
}

void main() {
  List<double> values = [2, 4, 6];
  values[1] = adjust(values[0]);
  double total = values[0] + values[1] + values[2];
  print("dart_indexed");
  print(total);
}
