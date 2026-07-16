let store = {
  alpha: { name: "alpha", first: 1, second: 2, third: 3 },
  beta: { name: "beta", first: 2, second: 4, third: 6 }
};

let chosen = store.alpha;
let total = chosen.first + chosen.second + chosen.third;
let betaTotal = store.beta.first + store.beta.second + store.beta.third;

if (betaTotal > total) {
  chosen = store.beta;
  total = betaTotal;
}

console.log("ring2_object", chosen.name, total);
