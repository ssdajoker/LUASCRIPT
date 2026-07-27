#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DESCRIPTORS = [
  "runtime_runtime.json",
  "src_transpiler.json",
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function computeSha(buffer) {
  return crypto.createHash("sha1").update(buffer).digest("hex");
}

function ensureKeys(obj, keys) {
  return keys.filter((k) => !(k in obj));
}

function verifyDescriptor(descriptorPath) {
  const descriptor = readJson(descriptorPath);
  const errors = [];
  const required = ["name", "path", "sha", "size"];
  const missing = ensureKeys(descriptor, required);
  if (missing.length) {
    errors.push(`missing required fields: ${missing.join(", ")}`);
  }

  const targetPath = path.join(process.cwd(), descriptor.path || "");
  if (!fs.existsSync(targetPath)) {
    errors.push(`target file not found: ${targetPath}`);
  } else {
    const content = fs.readFileSync(targetPath);
    const actualSha = computeSha(content);
    if (descriptor.sha && descriptor.sha !== actualSha) {
      errors.push(`sha mismatch for ${descriptor.path} (expected ${descriptor.sha}, got ${actualSha})`);
    }
    const actualSize = content.length;
    if (descriptor.size !== undefined && descriptor.size !== actualSize) {
      errors.push(`size mismatch for ${descriptor.path} (expected ${descriptor.size}, got ${actualSize})`);
    }

    if (descriptor.content) {
      try {
        const decoded = Buffer.from(descriptor.content, "base64");
        const decodedSha = computeSha(decoded);
        if (decodedSha !== descriptor.sha) {
          errors.push(`embedded content hash mismatch for ${descriptor.path} (expected ${descriptor.sha}, got ${decodedSha})`);
        }
        if (!decoded.equals(content)) {
          errors.push(`embedded content does not match on-disk file for ${descriptor.path}`);
        }
      } catch (err) {
        errors.push(`failed to decode embedded content for ${descriptor.path}: ${err.message}`);
      }
    }
  }

  return errors;
}

function main() {
  const allErrors = [];
  for (const file of DESCRIPTORS) {
    try {
      const descriptorPath = path.join(process.cwd(), file);
      const errors = verifyDescriptor(descriptorPath);
      if (errors.length) {
        allErrors.push({ file, errors });
      } else {
        console.log(`✅ ${file} verified`);
      }
    } catch (err) {
      allErrors.push({ file, errors: [err.message] });
    }
  }

  if (allErrors.length) {
    console.error("Runtime config verification failed:");
    for (const entry of allErrors) {
      console.error(`- ${entry.file}:`);
      entry.errors.forEach((e) => console.error(`  • ${e}`));
    }
    process.exit(1);
  }
}

main();
