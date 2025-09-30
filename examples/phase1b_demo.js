
// LUASCRIPT Phase 1B Demo
// Demonstrates critical runtime compatibility fixes

console.log("=== LUASCRIPT Phase 1B Demo ===");

// 1. String Concatenation Fix (+ to ..)
let firstName = "John";
let lastName = "Doe";
let fullName = firstName + " " + lastName;
console.log("Full name: " + fullName);

// 2. Logical Operators Fix (|| to or, && to and)
let age = 25;
let hasLicense = true;
let canDrive = age >= 18 && hasLicense;
let needsPermission = age < 18 || !hasLicense;

console.log("Can drive: " + canDrive);
console.log("Needs permission: " + needsPermission);

// 3. Equality Operators Fix (=== to ==, !== to ~=)
let score = 100;
let isPerfect = score === 100;
let isNotZero = score !== 0;

console.log("Perfect score: " + isPerfect);
console.log("Not zero: " + isNotZero);

// 4. Runtime Library Integration
console.log("Regular log message");
console.error("This is an error message");
console.warn("This is a warning message");
console.info("This is an info message");

// 5. Complex example combining all fixes
function createGreeting(name, age) {
    let greeting = "Hello, " + name + "!";
    let ageInfo = "You are " + age + " years old.";
    
    if (age >= 18 && name !== "") {
        let message = greeting + " " + ageInfo + " You are an adult.";
        console.log(message);
        return message;
    } else {
        let message = greeting + " " + ageInfo + " You are a minor.";
        console.log(message);
        return message;
    }
}

// Test the function
createGreeting("Alice", 25);
createGreeting("Bob", 16);

console.log("=== Demo Complete ===");
