#!/usr/bin/env node

/**
 * @fileoverview Value Numbering for Common Subexpression Elimination
 * 
 * Purpose: Assign deterministic hashes to expressions for CSE detection.
 * 
 * Forensic Note: Conservative hashing to avoid false matches.
 * Only commutative operators explicitly allowed.
 * 
 * @module value-numbering
 * @phase 3.4
 * @task 4.2
 * @version 1.0.0
 */

class ValueNumbering {
  constructor(options = {}) {
    this.options = {
      // Only operators explicitly listed are treated as commutative
      commutativeOperators: options.commutativeOperators || new Set(["*", "&", "|", "^"]),
      includeTypes: options.includeTypes !== false,
      ...options
    };
  }

  /**
   * Compute a stable hash for an expression node
   */
  hashExpression(node) {
    return this.hashNode(node);
  }

  /**
   * Internal hashing implementation
   */
  hashNode(node) {
    if (!node || typeof node !== "object") {
      return `Literal:${String(node)}`;
    }

    switch (node.type) {
    case "Literal":
      return this.hashLiteral(node);
      
    case "Identifier":
      return `Id:${node.name}`;
      
    case "BinaryExpression":
    case "LogicalExpression":
      return this.hashBinary(node);
      
    case "UnaryExpression":
      return `Un:${node.operator}:${this.hashNode(node.argument)}`;
      
    case "CallExpression":
      return this.hashCall(node);
      
    case "MemberExpression":
      return this.hashMember(node);
      
    case "ConditionalExpression":
      return `Cond:${this.hashNode(node.test)}?${this.hashNode(node.consequent)}:${this.hashNode(node.alternate)}`;
      
    case "ArrayExpression":
      return `Arr:[${(node.elements || []).map(el => this.hashNode(el)).join(",")}]`;
      
    case "ObjectExpression":
      return this.hashObject(node);
      
    case "NewExpression":
      return `New:${this.hashNode(node.callee)}(${(node.arguments || []).map(arg => this.hashNode(arg)).join(",")})`;
      
    default:
      return `${node.type}:${this.hashUnknown(node)}`;
    }
  }

  hashLiteral(node) {
    const raw = node.raw !== undefined ? node.raw : String(node.value);
    const type = this.options.includeTypes ? typeof node.value : "any";
    return `Lit:${type}:${raw}`;
  }

  hashBinary(node) {
    const left = this.hashNode(node.left);
    const right = this.hashNode(node.right);
    const op = node.operator;

    if (this.options.commutativeOperators.has(op)) {
      const [a, b] = [left, right].sort();
      return `Bin:${op}:${a}:${b}`;
    }

    return `Bin:${op}:${left}:${right}`;
  }

  hashCall(node) {
    const callee = this.hashNode(node.callee);
    const args = (node.arguments || []).map(arg => this.hashNode(arg)).join(",");
    return `Call:${callee}(${args})`;
  }

  hashMember(node) {
    const objectHash = this.hashNode(node.object);
    if (node.computed) {
      const propHash = this.hashNode(node.property);
      return `MemC:${objectHash}[${propHash}]`;
    }

    const prop = node.property && node.property.name ? node.property.name : this.hashNode(node.property);
    return `Mem:${objectHash}.${prop}`;
  }

  hashObject(node) {
    const props = (node.properties || []).map(prop => {
      const key = prop.key && prop.key.name ? prop.key.name : this.hashNode(prop.key);
      const value = this.hashNode(prop.value);
      return `${key}:${value}`;
    });
    return `Obj:{${props.join(",")}}`;
  }

  hashUnknown(node) {
    // Best-effort hashing for unknown nodes
    const keys = Object.keys(node).filter(k => k !== "type" && k !== "loc" && k !== "range").sort();
    const parts = [];
    for (const key of keys) {
      const value = node[key];
      if (typeof value === "object") {
        parts.push(`${key}:${this.hashNode(value)}`);
      } else {
        parts.push(`${key}:${String(value)}`);
      }
    }
    return `{${parts.join(",")}}`;
  }
}

module.exports = { ValueNumbering };

// CLI
if (require.main === module) {
  const fs = require("fs");
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help")) {
    console.log(`
Value Numbering (CSE)
=====================

Usage: node value-numbering.js <ast-file.json>

Outputs stable hashes for expressions in the AST.
`);
    process.exit(0);
  }

  const astFile = args[0];
  if (!fs.existsSync(astFile)) {
    console.error(`Error: File not found: ${astFile}`);
    process.exit(1);
  }

  const ast = JSON.parse(fs.readFileSync(astFile, "utf8"));
  const numbering = new ValueNumbering();

  const hashes = [];
  const walk = (node) => {
    if (!node || typeof node !== "object") return;
    if (node.type) {
      hashes.push({ type: node.type, hash: numbering.hashExpression(node) });
    }
    for (const key in node) {
      if (key === "type" || key === "loc" || key === "range") continue;
      const child = node[key];
      if (Array.isArray(child)) child.forEach(walk);
      else if (typeof child === "object") walk(child);
    }
  };

  walk(ast);
  console.log(JSON.stringify({ total: hashes.length, hashes }, null, 2));
}
