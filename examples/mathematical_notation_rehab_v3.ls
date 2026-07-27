// LUASCRIPT mathematical notation rehabilitation V3.
// This slice restores operator sections, multiline let-in blocks, tuple
// callbacks, set union, empty set literals, and math equality in branches.

sum(data) = data |> reduce((+), 0);
mean(data) = data |> reduce((+), 0) / length(data);

pair_sums(pairs) =
  pairs
    |> map((x, y) → x + y);

stats(data) =
  let μ = mean(data),
      doubled = data |> map(x → 2x) in
  (average: μ, count: length(doubled))

choose(n) =
  | n = 0 → 10
  | _ → n + 1

let pairs = [(1, 2), (3, 4)];
let unioned = [1, 2] ∪ [2, 3];
let result = stats([2, 4, 6]);

console.log(
  "math_rehab_v3",
  sum([1..4]),
  mean([2, 4, 6]),
  pair_sums(pairs),
  result.average,
  result.count,
  length(unioned),
  choose(0),
  choose(4),
  length(∅)
);
