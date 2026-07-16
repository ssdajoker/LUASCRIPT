"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { repoRoot, parseShard } = require("./runner_utils");

const manifest = require("./language_qualification_manifest.json");
const packageJson = require("../../package.json");

const REQUIRED_LANGUAGES = [
  "JavaScript",
  "LUASCRIPT .ls",
  "Lua input",
  "Python",
  "Ruby",
  "PHP",
  "Dart",
  "C#",
  "Java",
  "Elm",
  "Gleam"
];
const IMPLEMENTED_GROUP = new Set([
  "JavaScript",
  "TypeScript",
  "LUASCRIPT .ls",
  "Lua input",
  "Python",
  "C#",
  "C",
  "C++",
  "Ruby",
  "PHP",
  "Dart",
  "Java",
  "Go",
  "Rust",
  "Kotlin",
  "Elm",
  "Gleam"
]);
const SETUP_BLOCKED_GROUP = new Set([]);
const REQUIRED_EVIDENCE = ["parser", "lowering", "emitter", "runtime", "integration"];
const VERIFIED_SCRIPT_TIMEOUT_MS =
  (manifest.execution && manifest.execution.timeoutMs) || 420000;
const VERIFIED_SCRIPT_RETRIES =
  (manifest.execution && manifest.execution.transientRetries) || 1;
const LANGUAGE_REPORTS = {
  "language:javascript:core": {
    manifest: path.join("tests", "language_completion", "manifests", "javascript.json"),
    report: path.join("artifacts", "language_completion", "javascript-report.json")
  },
  "language:typescript:core": {
    manifest: path.join("tests", "language_completion", "manifests", "typescript.json"),
    report: path.join("artifacts", "language_completion", "typescript-report.json")
  },
  "language:luascript:core": {
    manifest: path.join("tests", "language_completion", "manifests", "luascript.json"),
    report: path.join("artifacts", "language_completion", "luascript-report.json")
  },
  "language:lua:core": {
    manifest: path.join("tests", "language_completion", "manifests", "lua.json"),
    report: path.join("artifacts", "language_completion", "lua-report.json")
  },
  "language:python:core": {
    manifest: path.join("tests", "language_completion", "manifests", "python.json"),
    report: path.join("artifacts", "language_completion", "python-report.json")
  },
  "language:csharp:core": {
    manifest: path.join("tests", "language_completion", "manifests", "csharp.json"),
    report: path.join("artifacts", "language_completion", "csharp-report.json")
  },
  "language:c:core": {
    manifest: path.join("tests", "language_completion", "manifests", "c.json"),
    report: path.join("artifacts", "language_completion", "c-report.json")
  },
  "language:cpp:core": {
    manifest: path.join("tests", "language_completion", "manifests", "cpp.json"),
    report: path.join("artifacts", "language_completion", "cpp-report.json")
  },
  "language:ruby:ir-targets": {
    manifest: path.join("tests", "language_completion", "manifests", "ruby_ir.json"),
    report: path.join("artifacts", "language_completion", "ruby_ir-report.json")
  },
  "language:ruby:bidirectional": {
    manifest: path.join("tests", "language_completion", "manifests", "ruby.json"),
    report: path.join("artifacts", "language_completion", "ruby-report.json")
  },
  "language:php:ir-targets": {
    manifest: path.join("tests", "language_completion", "manifests", "php_ir.json"),
    report: path.join("artifacts", "language_completion", "php_ir-report.json")
  },
  "language:php:bidirectional": {
    manifest: path.join("tests", "language_completion", "manifests", "php.json"),
    report: path.join("artifacts", "language_completion", "php-report.json")
  },
  "language:dart:ir-targets": {
    manifest: path.join("tests", "language_completion", "manifests", "dart_ir.json"),
    report: path.join("artifacts", "language_completion", "dart_ir-report.json")
  },
  "language:dart:bidirectional": {
    manifest: path.join("tests", "language_completion", "manifests", "dart.json"),
    report: path.join("artifacts", "language_completion", "dart-report.json")
  },
  "language:java:ir-targets": {
    manifest: path.join("tests", "language_completion", "manifests", "java.json"),
    report: path.join("artifacts", "language_completion", "java-report.json")
  },
  "language:java:bidirectional": {
    manifest: path.join("tests", "language_completion", "manifests", "java_native.json"),
    report: path.join("artifacts", "language_completion", "java_native-report.json")
  },
  "language:go:ir-targets": {
    manifest: path.join("tests", "language_completion", "manifests", "go.json"),
    report: path.join("artifacts", "language_completion", "go-report.json")
  },
  "language:go:bidirectional": {
    manifest: path.join("tests", "language_completion", "manifests", "go_native.json"),
    report: path.join("artifacts", "language_completion", "go_native-report.json")
  },
  "language:rust:ir-targets": {
    manifest: path.join("tests", "language_completion", "manifests", "rust.json"),
    report: path.join("artifacts", "language_completion", "rust-report.json")
  },
  "language:rust:bidirectional": {
    manifest: path.join("tests", "language_completion", "manifests", "rust_native.json"),
    report: path.join("artifacts", "language_completion", "rust_native-report.json")
  },
  "language:kotlin:ir-targets": {
    manifest: path.join("tests", "language_completion", "manifests", "kotlin.json"),
    report: path.join("artifacts", "language_completion", "kotlin-report.json")
  },
  "language:kotlin:bidirectional": {
    manifest: path.join("tests", "language_completion", "manifests", "kotlin_native.json"),
    report: path.join("artifacts", "language_completion", "kotlin_native-report.json")
  },
  "language:elm:ir-targets": {
    manifest: path.join("tests", "language_completion", "manifests", "elm_ir.json"),
    report: path.join("artifacts", "language_completion", "elm_ir-report.json")
  },
  "language:elm:bidirectional": {
    manifest: path.join("tests", "language_completion", "manifests", "elm_native.json"),
    report: path.join("artifacts", "language_completion", "elm_native-report.json")
  },
  "language:gleam:ir-targets": {
    manifest: path.join("tests", "language_completion", "manifests", "gleam_ir.json"),
    report: path.join("artifacts", "language_completion", "gleam_ir-report.json")
  },
  "language:gleam:bidirectional": {
    manifest: path.join("tests", "language_completion", "manifests", "gleam_native.json"),
    report: path.join("artifacts", "language_completion", "gleam_native-report.json")
  }
};
const TRANSIENT_PROCESS_FAILURES = [
  /VirtualAlloc failed/i,
  /RAW: Check new_pages != nullptr failed/i,
  /spawnSync .*ETIMEDOUT/i,
  /spawnSync .*UNKNOWN/i,
  /\bETIMEDOUT\b/i,
  /\bUNKNOWN\b/i,
  /status=null/i,
  /signal=SIGTERM/i
];

function fail(errors, message) {
  errors.push(message);
  console.error(`FAIL ${message}`);
}

function parseArgs(argv) {
  const options = {
    group: process.env.CLARITY_LANGUAGE_GROUP || null,
    filter: process.env.CLARITY_LANGUAGE_FILTER || null,
    shard: process.env.CLARITY_LANGUAGE_SHARD || null,
    reportsOnly: process.env.CLARITY_LANGUAGE_REPORTS_ONLY === "1"
  };

  for (let index = 0; index < argv.length; index++) {
    const token = argv[index];
    if (token === "--group" && argv[index + 1]) {
      options.group = argv[++index];
    } else if (token === "--filter" && argv[index + 1]) {
      options.filter = argv[++index];
    } else if (token === "--shard" && argv[index + 1]) {
      options.shard = argv[++index];
    } else if (token === "--reports-only") {
      options.reportsOnly = true;
    }
  }

  return options;
}

function selectLanguages(options) {
  const allLanguages = manifest.languages || [];
  const filter = options.filter ? new RegExp(options.filter, "i") : null;
  const selected = allLanguages.filter((entry) => {
    if (options.group === "implemented" && !IMPLEMENTED_GROUP.has(entry.language)) {
      return false;
    }
    if (options.group === "setup-blocked" && !SETUP_BLOCKED_GROUP.has(entry.language)) {
      return false;
    }
    if (options.group === "required" && !REQUIRED_LANGUAGES.includes(entry.language)) {
      return false;
    }
    if (options.group && !["implemented", "setup-blocked", "required", "all"].includes(options.group)) {
      throw new Error(`Unknown language qualification group: ${options.group}`);
    }
    return !filter || filter.test(entry.language) || filter.test(entry.claim || "");
  });

  return selected;
}

function npmScriptExists(scriptName) {
  return Boolean(packageJson.scripts && packageJson.scripts[scriptName]);
}

function fileExists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), "utf8"));
}

function fileMtime(relativePath) {
  return fs.statSync(path.join(repoRoot, relativePath)).mtimeMs;
}

function commandOutput(result) {
  return [
    result.stdout || "",
    result.stderr || "",
    result.error ? String(result.error.message || result.error) : "",
    result.signal ? `signal=${result.signal}` : "",
    result.status === null ? "status=null" : ""
  ].filter(Boolean).join("\n").trim();
}

function isTransientProcessFailure(output) {
  return TRANSIENT_PROCESS_FAILURES.some(pattern => pattern.test(output));
}

function validateManifest(languages, options = {}) {
  const errors = [];
  const warnings = [];
  const verifiedScripts = new Set();
  const allowedTiers = new Set(manifest.policy.allowedTiers);
  const allowedStatuses = new Set(manifest.policy.allowedStatuses);
  const byLanguage = new Map(languages.map(entry => [entry.language, entry]));

  if (options.enforceRequiredCompleteness) {
    for (const language of REQUIRED_LANGUAGES) {
      if (!byLanguage.has(language)) {
        fail(errors, `Missing language qualification entry: ${language}`);
      }
    }
  }

  for (const entry of languages) {
    if (!allowedTiers.has(entry.tier)) {
      fail(errors, `${entry.language} has invalid tier ${JSON.stringify(entry.tier)}`);
    }

    if (/production/i.test(entry.tier) || entry.productionReady === true) {
      fail(errors, `${entry.language} attempts a production-ready claim without complete evidence`);
    }

    for (const key of REQUIRED_EVIDENCE) {
      const evidence = entry.evidence && entry.evidence[key];
      if (!evidence) {
        fail(errors, `${entry.language} missing ${key} evidence`);
        continue;
      }

      if (!allowedStatuses.has(evidence.status)) {
        fail(errors, `${entry.language}.${key} has invalid status ${JSON.stringify(evidence.status)}`);
      }

      if (evidence.status === "verified" && !evidence.npmScript) {
        fail(errors, `${entry.language}.${key} is verified but has no npmScript`);
      }

      if (evidence.status === "verified" && evidence.npmScript) {
        verifiedScripts.add(evidence.npmScript);
      }

      if (evidence.npmScript && !npmScriptExists(evidence.npmScript)) {
        fail(errors, `${entry.language}.${key} references missing npm script ${evidence.npmScript}`);
      }

      if (evidence.status === "missing" && evidence.npmScript) {
        fail(errors, `${entry.language}.${key} is missing but still references npm script ${evidence.npmScript}`);
      }
    }

    const complete = REQUIRED_EVIDENCE.every(key => {
      const evidence = entry.evidence && entry.evidence[key];
      return evidence && evidence.status === "verified" && evidence.npmScript;
    });
    if (!complete) {
      warnings.push(`${entry.language}: remains ${entry.tier}; complete verified evidence not present`);
    }
  }

  return { errors, warnings, total: languages.length, verifiedScripts: Array.from(verifiedScripts).sort() };
}

function runVerifiedEvidenceScripts(scriptNames) {
  const errors = [];
  const useCmdShim = process.platform === "win32";
  const npmCmd = useCmdShim ? "cmd.exe" : "npm";

  for (const scriptName of scriptNames) {
    console.log(`RUN verified evidence: ${scriptName}`);
    let finalResult = null;
    let finalOutput = "";

    for (let attempt = 1; attempt <= VERIFIED_SCRIPT_RETRIES + 1; attempt++) {
      finalResult = spawnSync(npmCmd, useCmdShim ? ["/c", `npm run --silent ${scriptName}`] : ["run", "--silent", scriptName], {
        cwd: repoRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        timeout: VERIFIED_SCRIPT_TIMEOUT_MS,
        maxBuffer: 40 * 1024 * 1024,
        env: {
          ...process.env,
          PYTHONIOENCODING: "utf-8"
        }
      });
      finalOutput = commandOutput(finalResult);

      if (finalResult.status === 0) {
        break;
      }

      if (
        attempt <= VERIFIED_SCRIPT_RETRIES &&
        isTransientProcessFailure(finalOutput)
      ) {
        console.log(`WARN transient process failure in ${scriptName}; retrying (${attempt}/${VERIFIED_SCRIPT_RETRIES})`);
        continue;
      }

      break;
    }

    if (!finalResult || finalResult.status !== 0) {
      fail(errors, `${scriptName} failed while verifying language evidence: ${finalOutput}`);
    }
  }

  return errors;
}

function validateVerifiedEvidenceReports(scriptNames) {
  const errors = [];

  for (const scriptName of scriptNames) {
    const mapping = LANGUAGE_REPORTS[scriptName];
    if (!mapping) {
      fail(errors, `${scriptName} has no language report mapping for reports-only verification`);
      continue;
    }

    if (!fileExists(mapping.manifest)) {
      fail(errors, `${scriptName} manifest is missing: ${mapping.manifest}`);
      continue;
    }

    if (!fileExists(mapping.report)) {
      fail(errors, `${scriptName} report is missing: ${mapping.report}; rerun ${scriptName}`);
      continue;
    }

    let report;
    try {
      report = readJson(mapping.report);
    } catch (error) {
      fail(errors, `${scriptName} report could not be parsed: ${mapping.report} (${error.message})`);
      continue;
    }

    const summary = report.summary || {};
    if (report.kind !== "language:bidirectional") {
      fail(errors, `${scriptName} report has invalid kind ${JSON.stringify(report.kind)} in ${mapping.report}`);
    }
    if (!Number.isFinite(summary.total) || summary.total <= 0) {
      fail(errors, `${scriptName} report has invalid total in ${mapping.report}`);
    }
    if (!Number.isFinite(summary.passed) || summary.passed !== summary.total) {
      fail(errors, `${scriptName} report is not fully passing in ${mapping.report}: ${summary.passed}/${summary.total}`);
    }
    if (!Number.isFinite(summary.failed) || summary.failed !== 0) {
      fail(errors, `${scriptName} report records failures in ${mapping.report}: failed=${summary.failed}`);
    }
    if (!Array.isArray(report.results) || report.results.length !== summary.total) {
      fail(errors, `${scriptName} report results do not match summary total in ${mapping.report}`);
    }
    if (fileMtime(mapping.report) < fileMtime(mapping.manifest)) {
      fail(errors, `${scriptName} report is older than its manifest: ${mapping.report}`);
    }
  }

  return errors;
}

function selectVerifiedScripts(scriptNames, options) {
  const shard = parseShard(options.shard);
  const selectedScripts = shard
    ? scriptNames.filter((_, index) => index % shard.total === shard.index - 1)
    : scriptNames;
  return { selectedScripts, shard };
}

function main() {
  const manifestPath = path.join(repoRoot, "tests", "clarity_canon", "language_qualification_manifest.json");
  if (!fs.existsSync(manifestPath)) {
    console.error("FAIL language qualification manifest is missing");
    process.exit(1);
  }

  const options = parseArgs(process.argv.slice(2));
  const selectedLanguages = selectLanguages(options);

  console.log("Running language qualification manifest gate...");
  console.log(`Selected languages: ${selectedLanguages.length}/${(manifest.languages || []).length}`);
  if (options.group) {
    console.log(`Group: ${options.group}`);
  }
  if (options.filter) {
    console.log(`Filter: ${options.filter}`);
  }
  if (options.shard) {
    console.log(`Shard: ${options.shard}`);
  }
  if (options.reportsOnly) {
    console.log("Mode: reports-only");
  }

  if (selectedLanguages.length === 0) {
    if (options.group === "setup-blocked") {
      console.log("No setup-blocked language lanes are currently selected.");
      return;
    }
    console.error("FAIL no languages selected");
    process.exit(1);
  }

  const result = validateManifest(selectedLanguages, {
    enforceRequiredCompleteness: !options.group && !options.filter
  });

  for (const warning of result.warnings) {
    console.log(`WARN ${warning}`);
  }

  const { selectedScripts, shard } = selectVerifiedScripts(result.verifiedScripts, options);
  if (shard) {
    console.log(`Selected verified scripts: ${selectedScripts.length}/${result.verifiedScripts.length}`);
  }

  if (result.errors.length === 0 && selectedScripts.length > 0) {
    result.errors.push(...(
      options.reportsOnly
        ? validateVerifiedEvidenceReports(selectedScripts)
        : runVerifiedEvidenceScripts(selectedScripts)
    ));
  }

  console.log(`Language qualification results: ${result.total} languages, ${result.errors.length} errors`);
  if (result.errors.length > 0) {
    process.exit(1);
  }
}

main();
