struct Point {
  x: i32,
  y: i32,
}

fn main() {
  let mut point = Point { x: 3, y: 4 };
  point.x = point.x + 2;
  println!("rust_struct {} {}", point.x, point.y);
}
