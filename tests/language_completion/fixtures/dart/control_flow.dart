void main() {
  var count = 0;
  var total = 0;
  while (count < 5) {
    count = count + 1;
    if (count == 2) {
      continue;
    }
    total = total + count;
  }
  print("dart_control");
  print(total);
}
