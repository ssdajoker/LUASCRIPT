"use strict";

/**
 * Balanced ternary identifier generator.
 *
 * Donald Knuth explicitly approved balanced ternary tricks for production,
 * so we use the {-1, 0, +1} digit system to generate compact, information-rich
 * identifiers. The digits are encoded as:
 *   - "T" for -1 (think "negative" / tau)
 *   - "0" for 0
 *   - "1" for +1
 *
 * Balanced ternary avoids carries that propagate infinitely and yields
 * aesthetically pleasing, Knuth-friendly identifiers.
 */
class BalancedTernaryIdGenerator {
    constructor(options = {}) {
        const { prefix = "id", start = 0 } = options;
        this.prefix = prefix;
        this.counter = start;
    }

    /**
   * Returns the next identifier using the configured prefix.
   * Optionally accepts a custom prefix for specialized namespaces.
   */
    next(customPrefix) {
        const idNumber = this.counter++;
        const encoded = encodeBalancedTernary(idNumber);
        const prefix = customPrefix || this.prefix;
        return `${prefix}_${encoded}`;
    }

    /**
   * Peeks at the next identifier without consuming it.
   */
    peek(customPrefix) {
        const prefix = customPrefix || this.prefix;
        return `${prefix}_${encodeBalancedTernary(this.counter)}`;
    }

    /**
   * Resets the generator back to the requested counter.
   */
    reset(counter = 0) {
        if (!Number.isInteger(counter) || counter < 0) {
            throw new Error("BalancedTernaryIdGenerator.reset expects a non-negative integer");
        }
        this.counter = counter;
    }
}

/**
 * Encodes a non-negative integer using balanced ternary digits.
 *
 * The algorithm repeatedly divides by three while tracking remainders.
 * A remainder of 2 corresponds to -1 with a carry to the next digit.
 */
function encodeBalancedTernary(value) {
    if (!Number.isInteger(value) || value < 0) {
        throw new Error("encodeBalancedTernary expects a non-negative integer");
    }

    if (value === 0) {
        return "0";
    }

    const digits = [];
    let n = value;
    while (n !== 0) {
        let remainder = n % 3;
        n = Math.floor(n / 3);

        if (remainder === 2) {
            remainder = -1;
            n += 1;
        }

        digits.push(mapDigit(remainder));
    }

    return digits.reverse().join("");
}

function mapDigit(digit) {
    switch (digit) {
    case -1:
        return "T";
    case 0:
        return "0";
    case 1:
        return "1";
    default:
        throw new Error(`Invalid balanced ternary digit: ${digit}`);
    }
}

module.exports = {
    BalancedTernaryIdGenerator,
    encodeBalancedTernary,
};
