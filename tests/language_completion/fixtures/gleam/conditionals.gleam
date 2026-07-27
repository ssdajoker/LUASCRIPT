pub fn classify(value) {
  if value > 10 { 1 } else { 0 }
}

pub fn main() {
  let marker = classify(12)
  print("gleam_conditional")
  print(marker)
  Nil
}
