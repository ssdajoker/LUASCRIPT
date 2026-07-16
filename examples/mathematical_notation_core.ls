// LUASCRIPT mathematical notation core V0.
// This executable slice restores useful notation from the experimental showcase
// without claiming the full mathematical DSL is baseline-supported yet.

square(x) = x²;
distance(x₁, y₁, x₂, y₂) = √((x₂ − x₁)² + (y₂ − y₁)²);
scaled(value, factor) = value × factor ÷ 2;
within(value, low, high) = low ≤ value && value ≤ high;

let radius = 3;
let areaFloor = Math.floor(π × radius²);
let phiFloor = Math.floor(φ);
let dist = Math.floor(distance(0, 0, 3, 4));
let scaledValue = Math.floor(scaled(9, 4));
let comparison = within(dist, 4, 5);

console.log("math_notation", square(5), dist, scaledValue, comparison, areaFloor, phiFloor);
