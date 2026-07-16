// LUASCRIPT mathematical notation rehab V6: native symbolic binder forms

main() =
  square_sum = ∑[n = 1..5](n²),
  stepped_sum = ∑[n = 1..5, 2](n),
  factorial_five = ∏[n = 1..5](n),
  indexed_sum = ∑[i = 1..3](i),
  parabola_area = ∫[x = 0..3, 800](x²),
  console.log(
    "math_rehab_v6",
    square_sum,
    stepped_sum,
    factorial_five,
    indexed_sum,
    abs(parabola_area - 9) < 0.001
  )

main()
