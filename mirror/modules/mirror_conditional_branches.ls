let a = 10;
let b = 20;
let result = 0;

if (a < b) {
  result = result + 1;
} else {
  result = result + 2;
}

if (a > 5) {
  if (b > 15) {
    result = result + 10;
  }
}

let nested = 11;
let cond1 = a < b;
let cond2 = b > 15;
let both = cond1 && cond2;

console.log("mirror_conditional_branches", result, nested, both);
