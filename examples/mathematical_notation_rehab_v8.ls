// LUASCRIPT mathematical notation rehab V8: native derivative and limit binders

classify_calc(score) =
  | score ≥ 12 → "steep"
  | _ → "flat"

main() =
  cubic_slope = ∂_{x=2}(x³),
  tuned_slope = ∂_{x=2, 0.0001}(x³),
  e_limit = lim_{n→∞}((1 + 1/n)^n),
  slopes = [1..3] |> map(x → abs(∂_{t=x}(t²) - 2*x) < 0.01),
  console.log(
    "math_rehab_v8",
    abs(cubic_slope - 12) < 0.01,
    abs(tuned_slope - 12) < 0.01,
    abs(e_limit - ℯ) < 0.01,
    slopes,
    classify_calc(cubic_slope)
  )

main()
