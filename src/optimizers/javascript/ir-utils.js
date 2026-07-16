"use strict";

function safeCloneIR(value, seen = new WeakMap()) {
  if (value === null || typeof value !== "object") {
    return value;
  }

  if (seen.has(value)) {
    return seen.get(value);
  }

  if (Array.isArray(value)) {
    const clone = [];
    seen.set(value, clone);
    value.forEach((item, index) => {
      clone[index] = safeCloneIR(item, seen);
    });
    return clone;
  }

  const clone = {};
  seen.set(value, clone);

  for (const key of Object.keys(value)) {
    if (key === "parent") continue;
    clone[key] = safeCloneIR(value[key], seen);
  }

  return clone;
}

function traverseIR(node, callback, parent = null, seen = new WeakSet()) {
  if (!node || typeof node !== "object") return;
  if (seen.has(node)) return;
  seen.add(node);

  callback(node, parent);

  for (const key of Object.keys(node)) {
    if (key === "parent" || key.startsWith("_")) continue;
    const child = node[key];
    if (Array.isArray(child)) {
      child.forEach((item) => traverseIR(item, callback, node, seen));
    } else if (child && typeof child === "object") {
      traverseIR(child, callback, node, seen);
    }
  }
}

module.exports = {
  safeCloneIR,
  traverseIR
};
