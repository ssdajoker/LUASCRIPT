// LUASCRIPT mathematical notation rehabilitation V2.
// This slice restores executable function composition and pattern branches.

double(x) = 2x;
increment(x) = x + 1;
add(a, b) = a + b;

factorial(n) =
  | n ≤ 1 → 1
  | _ → n × factorial(n - 1)

(f ∘ g)(x) = f(g(x));
(f ⊙ g)(x) = λx. f(x, g(x));

let composed = double ∘ increment;
let paired = add ⊙ increment;

console.log("math_rehab_v2", composed(4), paired(4), factorial(5));
