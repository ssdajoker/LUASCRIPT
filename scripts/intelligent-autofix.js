#!/usr/bin/env node
"use strict";

/**
 * 🤖 INTELLIGENT AUTO-FIXER
 * Uses AI (via Clarity Cannon CLI) to actually fix code issues
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("╔═════════════════════════════════════════════════════════════════╗");
console.log("║        🤖 INTELLIGENT AUTO-FIXER - AI-Powered Debugging        ║");
console.log("╚═════════════════════════════════════════════════════════════════╝");
console.log("");

// Check if we have gh copilot or copilot CLI
let copilotProvider = null;
try {
  execSync("gh copilot --help", { stdio: 'ignore' });
  copilotProvider = "gh";
  console.log("✅ Found: GitHub Copilot CLI (gh copilot)");
} catch {
  try {
    execSync("copilot --version", { stdio: 'ignore' });
    copilotProvider = "copilot";
    console.log("✅ Found: Copilot CLI (copilot)");
  } catch {
    console.error("❌ No copilot provider found. Install 'gh' or 'copilot' CLI.");
    process.exit(1);
  }
}

console.log("");

// ═══════════════════════════════════════════════════════════════
// STEP 1: Collect all current failures
// ═══════════════════════════════════════════════════════════════

console.log("STEP 1: Collecting test failures");
console.log("═══════════════════════════════════════════════════════════════");
console.log("");

const failures = [];

// Check harness
console.log("🔹 Checking harness...");
try {
  execSync("npm run harness", { stdio: 'pipe' });
  console.log("   ✅ Harness passes");
} catch (err) {
  const output = err.stdout?.toString() || err.stderr?.toString() || "";
  console.log("   ❌ Harness has failures");
  failures.push({
    gate: "harness",
    type: "test-failure",
    output: output.split('\n').slice(-20).join('\n')
  });
}

// Check IR validation
console.log("🔹 Checking IR validation...");
try {
  execSync("npm run ir:validate:all", { stdio: 'pipe' });
  console.log("   ✅ IR validation passes");
} catch (err) {
  const output = err.stdout?.toString() || err.stderr?.toString() || "";
  console.log("   ❌ IR validation has failures");
  
  // Extract schema errors
  const schemaErrors = output.match(/Schema validation failed.*/g);
  failures.push({
    gate: "ir-validation",
    type: "schema-error",
    output: schemaErrors ? schemaErrors.join('\n') : output.split('\n').slice(-10).join('\n')
  });
}

// Check parity
console.log("🔹 Checking parity...");
try {
  execSync("npm run test:parity", { stdio: 'pipe' });
  console.log("   ✅ Parity passes");
} catch (err) {
  const output = err.stdout?.toString() || err.stderr?.toString() || "";
  console.log("   ❌ Parity has failures");
  failures.push({
    gate: "parity",
    type: "behavior-mismatch",
    output: output.split('\n').slice(-20).join('\n')
  });
}

console.log("");
console.log(`Found ${failures.length} issue(s) to fix`);
console.log("");

if (failures.length === 0) {
  console.log("🎉 All gates passing - nothing to fix!");
  process.exit(0);
}

// ═══════════════════════════════════════════════════════════════
// STEP 2: Ask AI to analyze and suggest fixes
// ═══════════════════════════════════════════════════════════════

console.log("STEP 2: AI Analysis & Fix Generation");
console.log("═══════════════════════════════════════════════════════════════");
console.log("");

for (let i = 0; i < failures.length; i++) {
  const failure = failures[i];
  console.log(`🔧 Analyzing failure ${i + 1}/${failures.length}: ${failure.gate}`);
  console.log("");
  
  const prompt = `I have a LUASCRIPT transpiler test failure:

Gate: ${failure.gate}
Type: ${failure.type}

Error output:
${failure.output}

What specific code change do I need to make to fix this? Provide:
1. File path
2. Exact function/class name to modify
3. Brief explanation of what's wrong
4. Specific code fix (not just description)

Keep response under 200 words.`;

  console.log("   Querying AI for fix suggestion...");
  
  try {
    let aiResponse;
    if (copilotProvider === "gh") {
      aiResponse = execSync(`gh copilot suggest "${prompt.replace(/"/g, '\\"')}" --target shell`, {
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024
      });
    } else {
      aiResponse = execSync(`copilot -p "${prompt.replace(/"/g, '\\"')}"`, {
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024
      });
    }
    
    console.log("");
    console.log("   📝 AI Suggestion:");
    console.log(aiResponse.split('\n').map(line => `      ${line}`).join('\n'));
    console.log("");
    
    // Save suggestion
    failure.aiSuggestion = aiResponse;
    
  } catch (err) {
    console.log("   ⚠️  AI query failed:", err.message);
  }
}

// ═══════════════════════════════════════════════════════════════
// STEP 3: Write report
// ═══════════════════════════════════════════════════════════════

console.log("");
console.log("STEP 3: Writing fix report");
console.log("═══════════════════════════════════════════════════════════════");
console.log("");

const artifactsDir = path.join(__dirname, "..", "artifacts");
if (!fs.existsSync(artifactsDir)) {
  fs.mkdirSync(artifactsDir, { recursive: true });
}

const reportPath = path.join(artifactsDir, "ai-fix-suggestions.md");
let reportContent = `# AI Fix Suggestions\n\nGenerated: ${new Date().toISOString()}\n\n`;

for (let i = 0; i < failures.length; i++) {
  const failure = failures[i];
  reportContent += `## Issue ${i + 1}: ${failure.gate}\n\n`;
  reportContent += `**Type:** ${failure.type}\n\n`;
  reportContent += `**Error:**\n\`\`\`\n${failure.output}\n\`\`\`\n\n`;
  
  if (failure.aiSuggestion) {
    reportContent += `**AI Suggestion:**\n\n${failure.aiSuggestion}\n\n`;
  } else {
    reportContent += `**AI Suggestion:** (unavailable)\n\n`;
  }
  
  reportContent += `---\n\n`;
}

fs.writeFileSync(reportPath, reportContent);
console.log(`✅ Fix suggestions written to: ${path.relative(process.cwd(), reportPath)}`);

console.log("");
console.log("═══════════════════════════════════════════════════════════════");
console.log("NEXT STEPS:");
console.log("═══════════════════════════════════════════════════════════════");
console.log("");
console.log("1. Review the AI suggestions in artifacts/ai-fix-suggestions.md");
console.log("2. Apply the recommended code changes manually");
console.log("3. Re-run tests to verify fixes");
console.log("4. Commit working changes");
console.log("");

process.exit(failures.length > 0 ? 1 : 0);
