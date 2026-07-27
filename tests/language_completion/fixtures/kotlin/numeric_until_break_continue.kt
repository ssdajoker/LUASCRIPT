fun main() {
  var total = 0
  for (value in 1 until 7) {
    if (value == 2) {
      continue
    }
    if (value == 6) {
      break
    }
    total = total + value
  }
  println("kotlin_loop", total)
}
