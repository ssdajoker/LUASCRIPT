// Simple LUASCRIPT Hello World Example
let message: string = "Hello from LUASCRIPT!";
const version: float64 = 1.0;

function greet(name: string): string {
    return `Hello, ${name}! Welcome to LUASCRIPT v${version}`;
}

fast function fibonacci(n: int32): int32 {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(message);
console.log(greet("World"));
console.log("Fibonacci(10):", fibonacci(10));

// Array operations
let numbers: Array<int32> = [1, 2, 3, 4, 5];
let doubled = numbers.map(x => x * 2);
let sum = doubled.reduce((a, b) => a + b, 0);

console.log("Original:", numbers);
console.log("Doubled:", doubled);
console.log("Sum:", sum);
