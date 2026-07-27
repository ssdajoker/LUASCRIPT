void main() {
  print("dart_bool_loop");
  var total = 0;
  var ready = true;
  for (var i = 0; i < 6; i += 1) {
    if (i == 1) {
      continue;
    }
    if (i > 4) {
      break;
    }
    if (ready && i >= 2) {
      total += i;
    }
  }
  print(total);
}
