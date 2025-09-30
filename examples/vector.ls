// LUASCRIPT Class Example - 3D Vector Math

class Vector3 {
    constructor(x: float32, y: float32, z: float32) {
        this.x = x || 0.0;
        this.y = y || 0.0; 
        this.z = z || 0.0;
    }
    
    magnitude(): float32 {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }
    
    normalize(): Vector3 {
        let mag = this.magnitude();
        if (mag === 0) return new Vector3(0, 0, 0);
        return new Vector3(this.x / mag, this.y / mag, this.z / mag);
    }
    
    add(other: Vector3): Vector3 {
        return new Vector3(this.x + other.x, this.y + other.y, this.z + other.z);
    }
    
    dot(other: Vector3): float32 {
        return this.x * other.x + this.y * other.y + this.z * other.z;
    }
}

// Test the Vector3 class
let v1 = new Vector3(1.0, 2.0, 3.0);
let v2 = new Vector3(4.0, 5.0, 6.0);

console.log("Vector 1:", v1);
console.log("Vector 2:", v2);
console.log("V1 magnitude:", v1.magnitude());
console.log("V2 magnitude:", v2.magnitude());

let v3 = v1.add(v2);
console.log("V1 + V2:", v3);
console.log("V1 · V2:", v1.dot(v2));

let normalized = v1.normalize();
console.log("V1 normalized:", normalized);
console.log("Normalized magnitude:", normalized.magnitude());
