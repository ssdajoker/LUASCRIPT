double square(double value) {
  return value * value;
}

int sqrt(double value) {
  return 4;
}

void main() {
  double total = 0;
  for (double i = 1; i <= 3; i = i + 1) {
    total = total + square(i);
  }
  print("dart_for_math");
  print(sqrt(total + 2));
}
