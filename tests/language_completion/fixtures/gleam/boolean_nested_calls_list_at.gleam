pub fn double(x) {
  x * 2
}

pub fn add(a, b) {
  a + b
}

pub fn main() {
  let picked = list_at([3, 9, 4], 1)
  let ok = double(6) >= 12 && picked == 9 && !(picked == 4)
  print("gleam_v02")
  print(if ok { add(double(6), picked) } else { 0 })
  Nil
}
