fn main() {
  let mut total = 0;
  for value in 1..7 {
    if value == 2 {
      continue;
    }
    if value == 6 {
      break;
    }
    total = total + value;
  }
  println!("rust_loop {}", total);
}
