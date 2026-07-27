function add(a, b) {
    return a + b;
}

let value = add(2, 5);

console.log("add", value);

if (value > 5) {
    console.log("branch", "big");
} else {
    console.log("branch", "small");
}
