fn main() {
  let mut total = 0;
  while total < 5 {
    total = total + 1;
  }
  if total == 5 {
    println!("rust_control ready {}", total);
  } else {
    println!("rust_control bad {}", total);
  }
}
