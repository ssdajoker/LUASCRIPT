fn main() {
  let values = [1, 2, 3, 4];
  let mut total = 0;
  for value in values {
    total = total + value;
  }
  println!("rust_array {} {}", total, values.len());
}
