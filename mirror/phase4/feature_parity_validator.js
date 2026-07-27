/*
  Phase 4 Integration: Feature Parity Validator
  - Scans Tier 2 showcase folders
  - Builds parity matrix across Python, Ruby, PHP, Dart
  - Emits markdown + JSON reports

  Usage:
    node mirror/phase4/feature_parity_validator.js
*/

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const MIRROR = path.join(ROOT, "mirror");

const TIERS = [
  { key: "python", dir: "tier2-python/showcase", ext: ".py" },
  { key: "ruby", dir: "tier2-ruby/showcase", ext: ".rb" },
  { key: "php", dir: "tier2-php/showcase", ext: ".php" },
  { key: "dart", dir: "tier2-dart/showcase", ext: ".dart" },
];

function readModuleNames(tier) {
  const dir = path.join(MIRROR, tier.dir);
  const files = fs.readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(tier.ext))
    .map((entry) => entry.name);

  const names = files.map((file) => path.basename(file, tier.ext)).sort();
  return { dir, files, names };
}

function buildUnion(allNames) {
  const union = new Set();
  allNames.forEach((names) => names.forEach((n) => union.add(n)));
  return Array.from(union).sort();
}

function categoryOf(moduleName) {
  if (moduleName.startsWith("type_")) return "Type System";
  if (moduleName.startsWith("pattern_")) return "Pattern Matching";
  if (moduleName.startsWith("meta_")) return "Metaprogramming";
  if (moduleName.startsWith("perf_")) return "Optimization";
  if (moduleName.startsWith("sec_")) return "Security";
  if (moduleName.startsWith("async_")) return "Async & Control Flow";
  if (moduleName.startsWith("ir_")) return "IR & Determinism";
  return "Other";
}

function buildMatrix(unionNames, tierData) {
  return unionNames.map((name) => {
    const row = { module: name, category: categoryOf(name) };
    tierData.forEach((tier) => {
      row[tier.key] = tier.names.includes(name);
    });
    return row;
  });
}

function summarize(tierData, unionNames) {
  const total = unionNames.length;
  const summary = {};
  tierData.forEach((tier) => {
    summary[tier.key] = {
      modules: tier.names.length,
      missing: unionNames.filter((n) => !tier.names.includes(n)),
    };
  });
  return { total, summary };
}

function writeJsonReport(outputPath, data) {
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), "utf8");
}

function writeMarkdownReport(outputPath, unionNames, matrix, summary) {
  const lines = [];
  lines.push("# Phase 4 Feature Parity Report");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Total unique modules: ${summary.total}`);
  lines.push(`- Python modules: ${summary.summary.python.modules}`);
  lines.push(`- Ruby modules: ${summary.summary.ruby.modules}`);
  lines.push(`- PHP modules: ${summary.summary.php.modules}`);
  lines.push(`- Dart modules: ${summary.summary.dart.modules}`);
  lines.push("");

  const anyMissing = Object.values(summary.summary)
    .some((s) => s.missing.length > 0);

  lines.push("## Missing Modules");
  lines.push("");
  if (!anyMissing) {
    lines.push("✅ No missing modules detected across tiers.");
  } else {
    for (const [tier, info] of Object.entries(summary.summary)) {
      if (info.missing.length === 0) continue;
      lines.push(`### ${tier.toUpperCase()}`);
      info.missing.forEach((name) => lines.push(`- ${name}`));
      lines.push("");
    }
  }

  lines.push("## Parity Matrix");
  lines.push("");
  lines.push("| Module | Category | Python | Ruby | PHP | Dart |");
  lines.push("|---|---|---|---|---|---|");
  matrix.forEach((row) => {
    lines.push(
      `| ${row.module} | ${row.category} | ${row.python ? "✅" : "❌"} | ${row.ruby ? "✅" : "❌"} | ${row.php ? "✅" : "❌"} | ${row.dart ? "✅" : "❌"} |`
    );
  });

  fs.writeFileSync(outputPath, lines.join("\n"), "utf8");
}

function main() {
  const tierData = TIERS.map((tier) => ({
    ...tier,
    ...readModuleNames(tier),
  }));

  const unionNames = buildUnion(tierData.map((t) => t.names));
  const matrix = buildMatrix(unionNames, tierData);
  const summary = summarize(tierData, unionNames);

  const reportJson = {
    generatedAt: new Date().toISOString(),
    tiers: TIERS.map((t) => t.key),
    totalModules: summary.total,
    summary: summary.summary,
    matrix,
  };

  const outJson = path.join(MIRROR, "phase4", "phase4_feature_parity_report.json");
  const outMd = path.join(MIRROR, "phase4", "PHASE_4_FEATURE_PARITY_REPORT.md");

  writeJsonReport(outJson, reportJson);
  writeMarkdownReport(outMd, unionNames, matrix, summary);

  console.log("Phase 4 feature parity report generated:");
  console.log("-", outMd);
  console.log("-", outJson);
}

main();
