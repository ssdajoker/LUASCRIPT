let values = [1, 2, 3, 4];
let mapped = [1, 2, 3].map(x => x * 2);
let filtered = values.filter(x => x > 2);
let total = [1, 2, 3].reduce((sum, value) => sum + value, 0);

console.log("mapped", mapped);
console.log("filtered", filtered);
console.log("total", total);
