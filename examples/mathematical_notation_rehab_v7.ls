// LUASCRIPT mathematical notation rehab V7: braced math-native binders

classify(score) =
  | score ≥ 50 → "large"
  | _ → "small"

main() =
  square_sum = ∑_{n=1}^{5}(n²),
  reverse_order_sum = ∑^{5}_{n=1}(n),
  stepped_sum = ∑_{n=1}^{5, 2}(n),
  factorial_five = ∏_{n=1}^{5}(n),
  parabola_area = ∫_{x=0}^{3, 800}(x²),
  triangulars = [1..4] |> map(x → ∑_{n=1}^{x}(n)),
  console.log(
    "math_rehab_v7",
    square_sum,
    reverse_order_sum,
    stepped_sum,
    factorial_five,
    abs(parabola_area - 9) < 0.001,
    triangulars,
    classify(square_sum)
  )

main()
