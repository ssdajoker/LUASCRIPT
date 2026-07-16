// LUASCRIPT mathematical notation rehab V5: verified series and calculus helpers

π = 4 × atan(1)

main() =
  sum_squares = ∑(1, 5, n → n²),
  factorial_four = ∏(1, 4, n → n),
  parabola_area = ∫(x → x², 0, 3, 800),
  cubic_slope = derivative(x → x³, 2, 0.0001),
  e_limit = lim(n→∞, (1 + 1/n)^n),
  console.log(
    "math_rehab_v5",
    sum_squares,
    factorial_four,
    abs(parabola_area - 9) < 0.001,
    abs(cubic_slope - 12) < 0.01,
    abs(e_limit - ℯ) < 0.01
  )

main()
