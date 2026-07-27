/**
 * ============================================================================
 * CLARITY SUPER-CANON SECURITY & ALGORITHM OPTIMIZATION MODULE
 * ============================================================================
 * 
 * Security hardening and algorithmic efficiency improvements
 * 
 * ============================================================================
 */

const crypto = require("crypto");

/**
 * Security Validation Layer
 */
class SecurityValidator {
  /**
   * Validate and sanitize input
   */
  static validateAndSanitize(input, schema) {
    // Type check
    if (schema.type) {
      if (typeof input !== schema.type) {
        throw new Error(`LUASCRIPT_VALIDATION_ERROR: Type mismatch: expected ${schema.type}, got ${typeof input}`);
      }
    }

    // Range check for numbers
    if (schema.type === "number") {
      if (schema.min !== undefined && input < schema.min) {
        throw new Error(`LUASCRIPT_VALIDATION_ERROR: Value ${input} below minimum ${schema.min}`);
      }
      if (schema.max !== undefined && input > schema.max) {
        throw new Error(`LUASCRIPT_VALIDATION_ERROR: Value ${input} above maximum ${schema.max}`);
      }
    }

    // Length check for strings
    if (schema.type === "string") {
      if (schema.minLength && input.length < schema.minLength) {
        throw new Error(`LUASCRIPT_VALIDATION_ERROR: String too short: ${input.length} < ${schema.minLength}`);
      }
      if (schema.maxLength && input.length > schema.maxLength) {
        throw new Error(`LUASCRIPT_VALIDATION_ERROR: String too long: ${input.length} > ${schema.maxLength}`);
      }
      if (schema.pattern && !schema.pattern.test(input)) {
        throw new Error(`LUASCRIPT_VALIDATION_ERROR: String does not match pattern: ${schema.pattern}`);
      }
    }

    // Array validation
    if (Array.isArray(input)) {
      if (schema.items) {
        for (const item of input) {
          this.validateAndSanitize(item, schema.items);
        }
      }
    }

    return input;
  }

  /**
   * Sanitize code for dangerous patterns
   */
  static sanitizeCode(code) {
    const dangerousPatterns = [
      { pattern: /eval\s*\(/gi, reason: "eval() is dangerous" },
      // Only match Function constructor, not function declarations or expressions
      { pattern: /\bnew\s+Function\s*\(/gi, reason: "Function constructor is dangerous" },
      { pattern: /Function\s*\(\s*['"]/gi, reason: "Function constructor with code string is dangerous" },
      { pattern: /setTimeout\s*\([^,]*,\s*0\)/gi, reason: "Deferred code execution" },
      { pattern: /setInterval\s*\(/gi, reason: "Repeated code execution" },
      { pattern: /__proto__/g, reason: "Prototype pollution risk" },
      { pattern: /constructor\s*\[\s*['"]proto/gi, reason: "Prototype access" }
    ];

    for (const { pattern, reason } of dangerousPatterns) {
      if (pattern.test(code)) {
        throw new Error(`LUASCRIPT_VALIDATION_ERROR: Security risk detected: ${reason}`);
      }
    }

    return code;
  }

  /**
   * Hash sensitive data
   */
  static hashData(data, algorithm = "sha256") {
    return crypto.createHash(algorithm).update(JSON.stringify(data)).digest("hex");
  }

  /**
   * Encrypt sensitive data
   */
  static encryptData(data, key) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key), iv);
    let encrypted = cipher.update(JSON.stringify(data), "utf-8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted;
  }

  /**
   * Decrypt sensitive data
   */
  static decryptData(encrypted, key) {
    const parts = encrypted.split(":");
    const iv = Buffer.from(parts[0], "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(key), iv);
    let decrypted = decipher.update(parts[1], "hex", "utf-8");
    decrypted += decipher.final("utf-8");
    return JSON.parse(decrypted);
  }

  /**
   * Validate AST structure
   */
  static validateAST(node, maxDepth = 100) {
    if (maxDepth <= 0) {
      throw new Error("AST maximum depth exceeded - possible infinite recursion");
    }

    if (!node || typeof node !== "object") {
      return true;
    }

    if (!node.type) {
      throw new Error("AST node missing required type property");
    }

    // Validate children recursively with depth limit
    for (const key in node) {
      if (Array.isArray(node[key])) {
        for (const child of node[key]) {
          if (child && typeof child === "object" && child.type) {
            this.validateAST(child, maxDepth - 1);
          }
        }
      } else if (node[key] && typeof node[key] === "object" && node[key].type) {
        this.validateAST(node[key], maxDepth - 1);
      }
    }

    return true;
  }
}

/**
 * Algorithm Optimization Utilities
 */
class AlgorithmOptimizer {
  /**
   * O(1) set membership with bloom filter fallback
   */
  static createOptimizedSet(items) {
    return new Set(items);
  }

  /**
   * Binary search on sorted array - O(log n)
   */
  static binarySearch(arr, target) {
    let left = 0, right = arr.length - 1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const midVal = arr[mid];

      if (midVal === target) return mid;
      if (midVal < target) left = mid + 1;
      else right = mid - 1;
    }

    return -1;
  }

  /**
   * Linear search with early exit - optimized for small arrays
   */
  static linearSearch(arr, predicate, maxIterations = arr.length) {
    for (let i = 0; i < Math.min(maxIterations, arr.length); i++) {
      if (predicate(arr[i], i)) return i;
    }
    return -1;
  }

  /**
   * Efficient array deduplication
   */
  static deduplicate(arr) {
    return [...new Set(arr)];
  }

  /**
   * In-place array partition (for quicksort)
   */
  static partition(arr, low, high, compare) {
    const pivot = arr[high];
    let i = low - 1;

    for (let j = low; j < high; j++) {
      if (compare(arr[j], pivot) < 0) {
        i++;
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    }

    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    return i + 1;
  }

  /**
   * Quicksort - O(n log n) average
   */
  static quickSort(arr, low = 0, high = arr.length - 1, compare = (a, b) => a < b ? -1 : 1) {
    if (low < high) {
      const pi = this.partition(arr, low, high, compare);
      this.quickSort(arr, low, pi - 1, compare);
      this.quickSort(arr, pi + 1, high, compare);
    }
    return arr;
  }

  /**
   * Merge sort - O(n log n) guaranteed
   */
  static mergeSort(arr, compare = (a, b) => a < b ? -1 : 1) {
    if (arr.length <= 1) return arr;

    const mid = Math.floor(arr.length / 2);
    const left = this.mergeSort(arr.slice(0, mid), compare);
    const right = this.mergeSort(arr.slice(mid), compare);

    return this.merge(left, right, compare);
  }

  /**
   * Merge two sorted arrays
   */
  static merge(left, right, compare) {
    const result = [];
    let i = 0, j = 0;

    while (i < left.length && j < right.length) {
      if (compare(left[i], right[j]) <= 0) {
        result.push(left[i++]);
      } else {
        result.push(right[j++]);
      }
    }

    return result.concat(left.slice(i)).concat(right.slice(j));
  }

  /**
   * Efficient array intersection
   */
  static intersection(arr1, arr2) {
    const set2 = new Set(arr2);
    return [...new Set(arr1.filter(x => set2.has(x)))];
  }

  /**
   * Efficient array difference
   */
  static difference(arr1, arr2) {
    const set2 = new Set(arr2);
    return [...new Set(arr1.filter(x => !set2.has(x)))];
  }

  /**
   * Memoized recursive function wrapper
   */
  static memoize(fn) {
    const cache = new Map();

    return function(...args) {
      const key = JSON.stringify(args);

      if (cache.has(key)) {
        return cache.get(key);
      }

      const result = fn.apply(this, args);
      cache.set(key, result);

      return result;
    };
  }

  /**
   * Tail-call optimization wrapper
   */
  static tailCall(fn) {
    return function(...args) {
      let result = { fn, args };

      while (typeof result.fn === "function") {
        result = result.fn(...result.args);
      }

      return result;
    };
  }

  /**
   * Detect cycle in graph
   */
  static detectCycle(graph) {
    const visited = new Set();
    const recursionStack = new Set();

    const hasCycle = (node) => {
      visited.add(node);
      recursionStack.add(node);

      for (const neighbor of graph.get(node) || []) {
        if (!visited.has(neighbor)) {
          if (hasCycle(neighbor)) return true;
        } else if (recursionStack.has(neighbor)) {
          return true;
        }
      }

      recursionStack.delete(node);
      return false;
    };

    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        if (hasCycle(node)) return true;
      }
    }

    return false;
  }
}

/**
 * Complexity Analyzer
 */
class ComplexityAnalyzer {
  /**
   * Analyze function time complexity
   */
  static analyzeTimeComplexity(fn, inputs) {
    const results = [];

    for (const input of inputs) {
      const start = process.hrtime.bigint();
      fn(input);
      const end = process.hrtime.bigint();

      results.push({
        inputSize: input.length || 1,
        time: Number(end - start) / 1000 // Convert to microseconds
      });
    }

    // Determine complexity class
    const complexity = this.inferComplexity(results);
    return { results, complexity };
  }

  /**
   * Infer complexity from measurements
   */
  static inferComplexity(measurements) {
    if (measurements.length < 2) return "UNKNOWN";

    // Calculate growth rate
    const rates = [];
    for (let i = 1; i < measurements.length; i++) {
      const sizeRatio = measurements[i].inputSize / measurements[i - 1].inputSize;
      const timeRatio = measurements[i].time / measurements[i - 1].time;
      rates.push(timeRatio / sizeRatio);
    }

    const avgRate = rates.reduce((a, b) => a + b) / rates.length;

    if (avgRate < 1.5) return "O(1)";
    if (avgRate < 2.5) return "O(log n)";
    if (avgRate < 3) return "O(n)";
    if (avgRate < 5) return "O(n log n)";
    if (avgRate < 10) return "O(n²)";
    return "O(n³) or worse";
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  SecurityValidator,
  AlgorithmOptimizer,
  ComplexityAnalyzer
};
