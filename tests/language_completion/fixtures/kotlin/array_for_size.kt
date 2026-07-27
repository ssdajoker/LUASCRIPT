fun main() {
  val values = intArrayOf(1, 2, 3, 4)
  var total = 0
  for (value in values) {
    total = total + value
  }
  println("kotlin_array", total, values.size)
}
