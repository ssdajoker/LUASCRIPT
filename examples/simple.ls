// Very simple LUASCRIPT example
let message = "Hello from LUASCRIPT!";
const version = 1.0;

function greet(name) {
    return "Hello, " + name + "!";
}

fast function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(message);
console.log(greet("World"));
console.log("Fibonacci(10):", fibonacci(10));
