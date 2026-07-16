let seed = 2;

function makeCounter(step) {
  let current = seed;

  function inner(limit) {
    let total = 0;
    while (current < limit) {
      current = current + step;
      total = total + current;
    }
    return total;
  }

  return inner;
}

let counter = makeCounter(3);
let first = counter(10);
let second = counter(16);

console.log("ring2_scope", first, second);
