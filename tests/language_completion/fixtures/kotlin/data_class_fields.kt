data class Point(var x: Int, var y: Int)

fun main() {
  var point = Point(3, 4)
  point.x = point.x + 2
  println("kotlin_record", point.x, point.y)
}
