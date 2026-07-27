fun main() {
  var total = 0
  while (total < 5) {
    total = total + 1
  }
  if (total == 5) {
    println("kotlin_control", "ready", total)
  } else {
    println("kotlin_control", "bad", total)
  }
}
