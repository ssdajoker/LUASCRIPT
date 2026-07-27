// LUASCRIPT mathematical notation rehabilitation V1.
// This slice restores arrow lambdas, pipelines, ranges, let-in expressions,
// implicit multiplication, exponentiation, and mathematical modulo.

scale(x) = 2x;

weighted_sum(n) =
  let values = [1..n] in
  values
    |> map(x → x² + scale(x))
    |> filter(v → v mod 2 === 0)
    |> reduce((sum, value) → sum + value, 0);

let numbers = [1..5];
let doubled = numbers |> map(x → 2x);
let oddTotal = numbers
  |> filter(n → n mod 2 === 1)
  |> reduce((sum, value) → sum + value, 0);

console.log("math_rehab", weighted_sum(4), oddTotal, doubled, length(doubled));
"pipe_log" |> console.log;
