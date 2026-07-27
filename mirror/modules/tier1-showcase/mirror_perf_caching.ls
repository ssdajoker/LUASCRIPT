function compute(x) { return x * x; }
let cached = compute(4);
let result = cached + cached;
console.log("mirror_perf_caching", result);
