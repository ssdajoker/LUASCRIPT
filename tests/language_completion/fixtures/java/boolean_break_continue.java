class Main {
  static void main(String[] args) {
    System.out.println("java_bool_loop");
    int total = 0;
    boolean ready = true;
    for (int i = 0; i < 6; i = i + 1) {
      if (i == 1) {
        continue;
      }
      if (i > 4) {
        break;
      }
      if (ready && i >= 2) {
        total = total + i;
      }
    }
    System.out.println(total);
  }
}
