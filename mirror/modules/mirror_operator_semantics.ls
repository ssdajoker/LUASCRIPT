let a = 10;
let b = 3;
let add = a + b;
let sub = a - b;
let mul = a * b;
let div = a / b;

let eq = a === 10;
let ne = a !== 5;
let lt = a < 20;
let le = a <= 10;
let gt = a > 5;
let ge = a >= 10;

let and1 = true && true;
let and2 = true && false;
let or1 = false || true;
let or2 = false || false;

let resultAdd = add === 13;
let resultMul = mul === 30;
let resultEq = eq && ne && lt;

console.log("mirror_operator_semantics", resultAdd, resultMul, resultEq, and1, and2, or1, or2);
