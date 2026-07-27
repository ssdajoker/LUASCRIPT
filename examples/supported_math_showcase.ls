// Supported LUASCRIPT math showcase.
// This example intentionally uses current JS-like syntax instead of the future Unicode DSL.

function square(x) {
    return x * x;
}

function hypotenuse(a, b) {
    return Math.sqrt(square(a) + square(b));
}

let values = [1, 2, 3, 4];
let doubled = values.map(x => x * 2);
let total = doubled.reduce((sum, value) => sum + value, 0);

console.log("hypotenuse", hypotenuse(3, 4));
console.log("doubled", doubled);
console.log("total", total);
