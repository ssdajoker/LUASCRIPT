pub fn accept(value) {
  if value > 3 && !(value == 5) || value == 8 { 1 } else { 0 }
}

pub fn main() {
  print("gleam_bool_v04")
  print(accept(4) + accept(5) + accept(8))
  Nil
}
