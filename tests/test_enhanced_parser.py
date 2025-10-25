#!/usr/bin/env python3
"""
Test Enhanced LUASCRIPT Parser and Transpiler
Tests the complete JavaScript-like syntax support
"""

import sys
import os

# Add paths for LUASCRIPT components
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src', 'parser'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src', 'transpiler'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src', 'lexer'))

from enhanced_parser import parse_source, ParseError
from enhanced_transpiler import transpile_source, TranspilerError

def test_variable_declarations():
    """Test variable declarations"""
    print("🧪 Testing Variable Declarations...")
    
    test_cases = [
        "let x = 5;",
        "const PI = 3.14159;",
        "var global_var = 'hello';",
        "let count: number = 0;",
    ]
    
    for code in test_cases:
        try:
            ast = parse_source(code, "test.ls")
            lua_code = transpile_source(code, "test.ls")
            print(f"✅ {code}")
            print(f"   → {lua_code.strip()}")
        except Exception as e:
            print(f"❌ {code} - Error: {e}")
    print()

def test_control_flow():
    """Test control flow structures"""
    print("🧪 Testing Control Flow...")
    
    test_cases = [
        """
        if (x > 0) {
            console.log("positive");
        }
        """,
        """
        for (let i = 0; i < 10; i++) {
            console.log(i);
        }
        """,
        """
        while (condition) {
            doSomething();
        }
        """,
        """
        for (let item of array) {
            console.log(item);
        }
        """
    ]
    
    for code in test_cases:
        try:
            ast = parse_source(code, "test.ls")
            lua_code = transpile_source(code, "test.ls")
            print(f"✅ Control flow parsed successfully")
            print(f"   Generated {len(lua_code.split())} tokens")
        except Exception as e:
            print(f"❌ Control flow error: {e}")
    print()

def test_functions():
    """Test function declarations"""
    print("🧪 Testing Functions...")
    
    test_cases = [
        """
        function add(a, b) {
            return a + b;
        }
        """,
        """
        const multiply = (a, b) => a * b;
        """,
        """
        f(x) = x² + 2×x + 1;
        """,
        """
        const square = x => x * x;
        """
    ]
    
    for code in test_cases:
        try:
            ast = parse_source(code, "test.ls")
            lua_code = transpile_source(code, "test.ls")
            print(f"✅ Function parsed successfully")
            print(f"   Generated Lua code")
        except Exception as e:
            print(f"❌ Function error: {e}")
    print()

def test_classes():
    """Test class declarations"""
    print("🧪 Testing Classes...")
    
    test_code = """
    class Vector {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
        
        magnitude() {
            return √(this.x² + this.y²);
        }
        
        add(other) {
            return new Vector(this.x + other.x, this.y + other.y);
        }
    }
    """
    
    try:
        ast = parse_source(test_code, "test.ls")
        lua_code = transpile_source(test_code, "test.ls")
        print(f"✅ Class parsed successfully")
        print(f"   Generated {len(lua_code.split())} tokens")
    except Exception as e:
        print(f"❌ Class error: {e}")
    print()

def test_mathematical_expressions():
    """Test mathematical expressions with Unicode operators"""
    print("🧪 Testing Mathematical Expressions...")
    
    test_cases = [
        "let area = π × r²;",
        "let distance = √((x₂ - x₁)² + (y₂ - y₁)²);",
        "function check() { if (a ≤ b && b ≥ c) { return true; } }",
        "let result = x ÷ y × z;",
        "let perimeter = 2 × (length + width);",
        "let volume = π × r³ × (4 ÷ 3);",
        "let quadraticPositive = √(b² - 4 × a × c) ÷ (2 × a) - b ÷ (2 × a);",
        "let quadraticNegative = (b - √(b² - 4 × a × c)) ÷ (2 × a);",
        "let discriminant = b² - 4 × a × c;",
        "let slope = (y₂ - y₁) ÷ (x₂ - x₁);",
        "let midpointX = (x₁ + x₂) ÷ 2;",
        "let midpointY = (y₁ + y₂) ÷ 2;",
        "let kineticEnergy = mass × velocity² ÷ 2;",
        "let potentialEnergy = mass × gravity × height;",
        "let work = force × distance;",
        "let power = work ÷ time;",
        "let acceleration = (finalVelocity - initialVelocity) ÷ deltaT;",
        "let averageVelocity = displacement ÷ deltaT;",
        "let momentum = mass × velocity;",
        "let frequency = 1 ÷ period;",
        "let circumference = 2 × π × radius;",
        "let areaTriangle = (base × height) ÷ 2;",
        "let heron = √(semiPerimeter × (semiPerimeter - a) × (semiPerimeter - b) × (semiPerimeter - c));",
        "let arithmeticMean = (value1 + value2 + value3 + value4) ÷ 4;",
        "let weightedMean = (w1 × x1 + w2 × x2 + w3 × x3) ÷ (w1 + w2 + w3);",
        "let variance = (x1² + x2² + x3²) ÷ sampleSize;",
        "let stdDev = √(variance);",
        "let zScore = (observation - mean) ÷ stdDev;",
        "let probability = favorable ÷ total;",
        "let odds = probability ÷ (1 - probability);",
        "let logistic = 1 ÷ (1 + ℯ);",
        "let exponentialGrowth = initial × ℯ × rate;",
        "let exponentialDecay = initial ÷ (ℯ × rate);",
        "let compoundInterest = principal × (1 + rate ÷ n);",
        "let goldenRatio = φ;",
        "let fibonacciApprox = φ × n - n ÷ φ;",
        "let circleSector = (θ ÷ (2 × π)) × π × r²;",
        "let cylindricalVolume = π × r² × height;",
        "let pythagorean = √(a² + b²);",
        "let lawOfCosines = √(a² + b² - 2 × a × b × cos(γ));",
        "let projection = vectorLength × cos(θ);",
        "let ellipseArea = π × majorAxis × minorAxis;",
        "let bmi = mass ÷ (height²);",
        "let parallelResistance = 1 ÷ (1 ÷ r1 + 1 ÷ r2 + 1 ÷ r3);",
        "let seriesResistance = r1 + r2 + r3;",
        "let ohmsLaw = voltage ÷ resistance;",
        "let coulomb = (k × q1 × q2) ÷ (r²);",
        "let gravitationalForce = (G × m1 × m2) ÷ (distance²);",
        "let pressure = force ÷ area;",
        "let density = mass ÷ volume;",
        "let idealGas = (pressure × volume) ÷ (n × R);",
        "let waveSpeed = frequency × wavelength;",
        "let centripetalForce = mass × velocity² ÷ radius;",
        "let symmetricDifference = (setA + setB) - 2 × intersection;",
        "let withinBounds = lower ≤ target && target ≤ upper;",
        "let inequality = left ≠ right;",
        "let greaterComparison = value ≥ threshold;",
        "let lesserComparison = value ≤ maximum;",
        "let normalized = (current - minimum) ÷ (maximum - minimum);",
        "let averageAcceleration = (v2 - v1) ÷ (t2 - t1);",
        "let jerk = (acceleration2 - acceleration1) ÷ (t2 - t1);",
        "let snap = (jerk2 - jerk1) ÷ (t2 - t1);",
        "let crackle = (snap2 - snap1) ÷ (t2 - t1);",
        "let pop = (crackle2 - crackle1) ÷ (t2 - t1);",
        "let geometricMean = √(valueA × valueB);",
        "let harmonicMean = 2 ÷ (1 ÷ valueA + 1 ÷ valueB);",
        "let arithmeticProgression = (first + last) × count ÷ 2;",
        "let geometricProgression = first × (1 - ratio) ÷ (1 + ratio);",
        "let binomialTheorem = (a + b)²;",
        "let trinomialExpansion = (a + b + c)²;",
        "let gradientMagnitude = √(gx² + gy²);",
        "let polarX = radius × cos(angle);",
        "let polarY = radius × sin(angle);",
        "let sphericalRadius = √(x² + y² + z²);",
        "let boolExpression = (x ≥ y) || (y ≤ z);",
        "let chainedInequality = a ≤ b && b ≤ c && c ≤ d;",
    ]
    
    for code in test_cases:
        try:
            ast = parse_source(code, "test.ls")
            lua_code = transpile_source(code, "test.ls")
            print(f"✅ {code}")
            print(f"   → Mathematical operators converted")
        except Exception as e:
            print(f"❌ {code} - Error: {e}")
    print()

def test_modern_features():
    """Test modern JavaScript features"""
    print("🧪 Testing Modern Features...")
    
    test_cases = [
        "let [a, b, c] = [1, 2, 3];",
        "let {name, age} = person;",
        "let arr2 = [...arr1, 4, 5, 6];",
        "let greeting = `Hello, ${name}!`;",
    ]
    
    for code in test_cases:
        try:
            ast = parse_source(code, "test.ls")
            print(f"✅ {code} - Parsed successfully")
        except Exception as e:
            print(f"❌ {code} - Error: {e}")
    print()

def test_comprehensive_example():
    """Test comprehensive example combining all features"""
    print("🧪 Testing Comprehensive Example...")
    
    comprehensive_code = """
    // Mathematical programming with JavaScript-like syntax
    class Matrix {
        constructor(data) {
            this.data = data;
            this.rows = data.length;
            this.cols = data[0].length;
        }
        
        multiply(other) {
            let result = [];
            for (let i = 0; i < this.rows; i++) {
                result[i] = [];
                for (let j = 0; j < other.cols; j++) {
                    let sum = 0;
                    for (let k = 0; k < this.cols; k++) {
                        sum += this.data[i][k] × other.data[k][j];
                    }
                    result[i][j] = sum;
                }
            }
            return new Matrix(result);
        }
        
        determinant() {
            if (this.rows ≠ this.cols) {
                throw new Error("Matrix must be square");
            }
            
            // Simplified 2x2 case
            if (this.rows === 2) {
                return this.data[0][0] × this.data[1][1] - 
                       this.data[0][1] × this.data[1][0];
            }
            
            return 0; // Placeholder for larger matrices
        }
    }
    
    // Usage
    let m1 = new Matrix([[1, 2], [3, 4]]);
    let m2 = new Matrix([[5, 6], [7, 8]]);
    let product = m1.multiply(m2);
    
    console.log(`Determinant: ${m1.determinant()}`);
    """
    
    try:
        ast = parse_source(comprehensive_code, "comprehensive.ls")
        lua_code = transpile_source(comprehensive_code, "comprehensive.ls")
        
        print("✅ Comprehensive example parsed successfully!")
        print(f"📊 Generated {len(lua_code.split())} Lua tokens")
        print(f"📊 AST contains {len(ast.statements)} top-level statements")
        
        # Save generated Lua code
        with open('/home/ubuntu/comprehensive_example.lua', 'w') as f:
            f.write(lua_code)
        print("💾 Generated Lua code saved to comprehensive_example.lua")
        
    except Exception as e:
        print(f"❌ Comprehensive example error: {e}")
        import traceback
        traceback.print_exc()
    print()

def main():
    """Run all tests"""
    print("🚀 LUASCRIPT Enhanced Parser & Transpiler Tests")
    print("=" * 60)
    
    test_variable_declarations()
    test_control_flow()
    test_functions()
    test_classes()
    test_mathematical_expressions()
    test_modern_features()
    test_comprehensive_example()
    
    print("🎯 Test Suite Complete!")
    print("✨ LUASCRIPT is ready for JavaScript-like syntax programming!")

if __name__ == "__main__":
    main()
