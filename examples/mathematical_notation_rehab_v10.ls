// LUASCRIPT mathematical notation rehab V10: bare definite-integral bodies

classify_bare_integral(ok) =
  | ok === true → "bare_integral_ok"
  | _ → "bare_integral_bad"

main() =
  sine_area = ∫_{0}^{π} sin(x) dx,
  polynomial_area = ∫_{0}^{2, 1000} x² + x dx,
  offset_area = ∫_{1}^{4, 1000} 2t dt,
  checked_areas = [1..3] |> map(b → abs(∫_{0}^{b} x dx - (b² / 2)) < 0.001),
  all_ok = abs(sine_area - 2) < 0.001,
  console.log(
    "math_rehab_v10",
    all_ok,
    abs(polynomial_area - 4.6666667) < 0.01,
    abs(offset_area - 15) < 0.001,
    checked_areas,
    classify_bare_integral(all_ok)
  )

main()
