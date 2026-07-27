// LUASCRIPT mathematical notation rehab V9: definite integral differential shorthand

classify_area(area) =
  | area ≥ 9 → "large_area"
  | _ → "small_area"

main() =
  sine_area = ∫_{0}^{π}(sin(x)) dx,
  parabola_area = ∫_{0}^{3, 800}(x²) dx,
  offset_area = ∫_{1}^{4, 800}(2t) dt,
  checked_areas = [1..3] |> map(b → abs(∫_{0}^{b}(x) dx - (b² / 2)) < 0.001),
  console.log(
    "math_rehab_v9",
    abs(sine_area - 2) < 0.001,
    abs(parabola_area - 9) < 0.001,
    abs(offset_area - 15) < 0.001,
    checked_areas,
    classify_area(parabola_area)
  )

main()
