"use strict";

const { JSToIRCompiler } = require("./js-to-ir");

function fail(message) {
  throw new Error(message);
}

function createEmptyLuascriptPolicy() {
  return {
    targets: {},
    profiles: [],
    declaredTargets: {},
    implicitProfiles: []
  };
}

function createEmptyLuascriptVerification() {
  return {};
}

function ensureTargetEntry(targetMap, target) {
  if (!targetMap[target]) {
    targetMap[target] = {};
  }
  return targetMap[target];
}

function ensureTargetPolicy(policy, target) {
  return ensureTargetEntry(policy.targets, target);
}

function ensureDeclaredTargetPolicy(policy, target) {
  if (!policy.declaredTargets) {
    policy.declaredTargets = {};
  }
  return ensureTargetEntry(policy.declaredTargets, target);
}

const supportedLuascriptPolicyTargets = new Set(["lua", "javascript", "python", "luascript"]);

const requiredCapabilitiesByTarget = {
  lua: new Set(["lua.goto"]),
  javascript: new Set(["js.console"]),
  python: new Set(["python.print"]),
  luascript: new Set(["js.console"])
};

const forbiddenCapabilitiesByTarget = {
  lua: new Set(["lua.goto", "js.prototype"]),
  javascript: new Set(["js.prototype"]),
  python: new Set(["python.imports"]),
  luascript: new Set(["js.prototype"])
};

const resolverStrategiesByTarget = {
  lua: { continue: "label_goto" },
  javascript: { continue: "native_continue" },
  python: { continue: "native_continue" },
  luascript: { continue: "native_continue" }
};

const knownLuascriptDiagnostics = {
  async_unsupported: "async is not supported in LuaScript V0",
  lua_continue_no_compatible_lowering: "No policy-compatible lowering for continue on lua target",
  js_prototype_forbidden: "Forbidden capability used by meta policy: js.prototype"
};

const luascriptProfileDefinitions = {
  portable_v1: {
    targets: {
      lua: {
        requires: ["lua.goto"],
        adapters: {
          indexing: "zero_based",
          length: "array_length_property",
          slicing: "runtime_slice",
          truthiness: "js_truthy",
          string_coercion: "explicit_tostring",
          multiple_returns: "packed_array"
        },
        diagnostics: {
          async: knownLuascriptDiagnostics.async_unsupported
        }
      },
      javascript: {
        requires: ["js.console"],
        adapters: {
          truthiness: "js_truthy"
        },
        diagnostics: {
          async: knownLuascriptDiagnostics.async_unsupported
        }
      },
      python: {
        requires: ["python.print"],
        forbid: ["python.imports"],
        adapters: {
          indexing: "zero_based",
          length: "array_length_property",
          slicing: "runtime_slice",
          truthiness: "js_truthy",
          string_coercion: "explicit_tostring",
          multiple_returns: "packed_array"
        },
        diagnostics: {
          async: knownLuascriptDiagnostics.async_unsupported
        }
      },
      luascript: {
        requires: ["js.console"],
        forbid: ["js.prototype"],
        adapters: {
          indexing: "zero_based",
          length: "array_length_property",
          slicing: "runtime_slice",
          truthiness: "js_truthy",
          string_coercion: "explicit_tostring",
          multiple_returns: "packed_array"
        },
        diagnostics: {
          async: knownLuascriptDiagnostics.async_unsupported
        }
      }
    }
  },
  portable_semantics_v1: {
    targets: {
      lua: {
        adapters: {
          indexing: "zero_based",
          length: "array_length_property",
          slicing: "runtime_slice",
          truthiness: "js_truthy",
          string_coercion: "explicit_tostring",
          multiple_returns: "packed_array"
        }
      },
      javascript: {
        requires: ["js.console"],
        adapters: {
          indexing: "zero_based",
          length: "array_length_property",
          slicing: "runtime_slice",
          truthiness: "js_truthy",
          string_coercion: "explicit_tostring",
          multiple_returns: "packed_array"
        }
      },
      python: {
        requires: ["python.print"],
        forbid: ["python.imports"],
        adapters: {
          indexing: "zero_based",
          length: "array_length_property",
          slicing: "runtime_slice",
          truthiness: "js_truthy",
          string_coercion: "explicit_tostring",
          multiple_returns: "packed_array"
        }
      },
      luascript: {
        requires: ["js.console"],
        forbid: ["js.prototype"],
        adapters: {
          indexing: "zero_based",
          length: "array_length_property",
          slicing: "runtime_slice",
          truthiness: "js_truthy",
          string_coercion: "explicit_tostring",
          multiple_returns: "packed_array"
        }
      }
    }
  }
};

function clonePolicyFragment(value) {
  return JSON.parse(JSON.stringify(value));
}

function mergeUniqueList(existing = [], incoming = []) {
  return [...new Set([...(existing || []), ...(incoming || [])])];
}

function mergeTargetPolicy(targetPolicy, incomingPolicy) {
  if (!incomingPolicy) {
    return targetPolicy;
  }

  targetPolicy.requires = mergeUniqueList(targetPolicy.requires, incomingPolicy.requires);
  targetPolicy.forbid = mergeUniqueList(targetPolicy.forbid, incomingPolicy.forbid);
  targetPolicy.resolve = {
    ...(targetPolicy.resolve || {}),
    ...(incomingPolicy.resolve || {})
  };
  targetPolicy.adapters = {
    ...(targetPolicy.adapters || {}),
    ...(incomingPolicy.adapters || {})
  };
  targetPolicy.diagnostics = {
    ...(targetPolicy.diagnostics || {}),
    ...(incomingPolicy.diagnostics || {})
  };
  targetPolicy.repairs = {
    ...(targetPolicy.repairs || {}),
    ...(incomingPolicy.repairs || {})
  };

  return targetPolicy;
}

function applyLuascriptProfile(policy, profileName, options = {}) {
  const { recordProfile = true, recordImplicit = false } = options;
  const profileDefinition = luascriptProfileDefinitions[profileName];
  if (!profileDefinition) {
    fail(`Unsupported meta profile: ${profileName}`);
  }

  if (recordProfile && !policy.profiles.includes(profileName)) {
    policy.profiles.push(profileName);
  }
  if (recordImplicit) {
    policy.implicitProfiles = policy.implicitProfiles || [];
    if (!policy.implicitProfiles.includes(profileName)) {
      policy.implicitProfiles.push(profileName);
    }
  }

  for (const [target, targetPolicy] of Object.entries(profileDefinition.targets || {})) {
    validateLuascriptPolicyTarget(target);
    mergeTargetPolicy(
      ensureTargetPolicy(policy, target),
      clonePolicyFragment(targetPolicy)
    );
  }
}

function mutateDeclaredTargetPolicy(policy, target, mutate) {
  mutate(ensureTargetPolicy(policy, target));
  mutate(ensureDeclaredTargetPolicy(policy, target));
}

function resolveLuascriptDiagnosticValue(value) {
  if (/^[A-Za-z_$][\w$]*$/.test(value)) {
    if (!Object.prototype.hasOwnProperty.call(knownLuascriptDiagnostics, value)) {
      fail(`Unknown LUASCRIPT diagnostic: ${value}`);
    }
    return knownLuascriptDiagnostics[value];
  }
  return value;
}

function sourceUsesContinue(source) {
  return /\bcontinue\b/.test(source);
}

function negotiateLuascriptCapabilityPolicy(policy, source) {
  if (!sourceUsesContinue(source)) {
    return;
  }

  const luaPolicy = ensureTargetPolicy(policy, "lua");
  const forbid = new Set(luaPolicy.forbid || []);
  luaPolicy.resolve = luaPolicy.resolve || {};

  if (!luaPolicy.resolve.continue) {
    if (forbid.has("lua.goto")) {
      fail(knownLuascriptDiagnostics.lua_continue_no_compatible_lowering);
    }
    luaPolicy.resolve.continue = "label_goto";
    luaPolicy.requires = mergeUniqueList(luaPolicy.requires, ["lua.goto"]);
  }

  for (const target of ["javascript", "python", "luascript"]) {
    if (!policy.targets[target]) {
      continue;
    }
    policy.targets[target].resolve = policy.targets[target].resolve || {};
    if (!policy.targets[target].resolve.continue) {
      policy.targets[target].resolve.continue = "native_continue";
    }
  }
}

function validateLuascriptPolicyTarget(target) {
  if (!supportedLuascriptPolicyTargets.has(target)) {
    fail(`Unsupported meta target: ${target}`);
  }
}

function skipTrivia(source, index) {
  let current = index;
  while (current < source.length) {
    if (/\s/.test(source[current])) {
      current++;
      continue;
    }
    if (source.startsWith("//", current)) {
      const next = source.indexOf("\n", current + 2);
      current = next === -1 ? source.length : next + 1;
      continue;
    }
    if (source.startsWith("/*", current)) {
      const next = source.indexOf("*/", current + 2);
      if (next === -1) {
        fail("Unterminated block comment before LUASCRIPT meta block");
      }
      current = next + 2;
      continue;
    }
    break;
  }
  return current;
}

function isWordAt(source, index, word) {
  if (!source.startsWith(word, index)) return false;
  const before = index === 0 ? "" : source[index - 1];
  const after = source[index + word.length] || "";
  return !/[A-Za-z0-9_$]/.test(before) && !/[A-Za-z0-9_$]/.test(after);
}

function findMatchingBrace(source, openIndex) {
  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let i = openIndex; i < source.length; i++) {
    const char = source[i];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === "\"" || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "{") depth++;
    if (char === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }

  fail("Unterminated LUASCRIPT meta block");
}

function validateLuascriptMetaPolicy(policy, target, directive) {
  const resolve = directive.match(/^resolve\s+([A-Za-z_$][\w$]*)\s+using\s+([A-Za-z_$][\w$]*)$/);
  if (resolve) {
    const [, capability, strategy] = resolve;
    const allowedStrategy = resolverStrategiesByTarget[target] && resolverStrategiesByTarget[target][capability];
    if (!allowedStrategy) {
      fail(`Unsupported meta resolver: ${capability}`);
    }
    if (strategy !== allowedStrategy) {
      fail(`Unsupported meta strategy for ${capability}: ${strategy}`);
    }
    mutateDeclaredTargetPolicy(policy, target, targetPolicy => {
      targetPolicy.resolve = targetPolicy.resolve || {};
      targetPolicy.resolve[capability] = strategy;
    });
    return;
  }

  const diagnostic = directive.match(/^diagnose\s+([A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)\s+"([^"]*)"$/);
  if (diagnostic) {
    const [, feature, status, message] = diagnostic;
    if (feature !== "async") {
      fail(`Unsupported meta diagnostic feature: ${feature}`);
    }
    if (status !== "unsupported") {
      fail(`Unsupported meta diagnostic status for ${feature}: ${status}`);
    }
    mutateDeclaredTargetPolicy(policy, target, targetPolicy => {
      targetPolicy.diagnostics = targetPolicy.diagnostics || {};
      targetPolicy.diagnostics[feature] = message;
    });
    return;
  }

  const requires = directive.match(/^requires\s+([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)$/);
  if (requires) {
    const [, capability] = requires;
    const allowed = requiredCapabilitiesByTarget[target] || new Set();
    if (!allowed.has(capability)) {
      fail(`Unsupported required capability for ${target}: ${capability}`);
    }
    mutateDeclaredTargetPolicy(policy, target, targetPolicy => {
      targetPolicy.requires = mergeUniqueList(targetPolicy.requires, [capability]);
    });
    return;
  }

  const forbid = directive.match(/^forbid\s+([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)$/);
  if (forbid) {
    const [, capability] = forbid;
    const allowed = forbiddenCapabilitiesByTarget[target] || new Set();
    if (!allowed.has(capability)) {
      fail(`Unsupported forbidden capability for ${target}: ${capability}`);
    }
    mutateDeclaredTargetPolicy(policy, target, targetPolicy => {
      targetPolicy.forbid = mergeUniqueList(targetPolicy.forbid, [capability]);
    });
    return;
  }

  const adapter = directive.match(/^adapt\s+([A-Za-z_$][\w$]*)\s+using\s+([A-Za-z_$][\w$]*)$/);
  if (adapter) {
    const [, feature, strategy] = adapter;
    const allowed = {
      indexing: "zero_based",
      length: "array_length_property",
      slicing: "runtime_slice",
      truthiness: "js_truthy",
      string_coercion: "explicit_tostring",
      multiple_returns: "packed_array"
    };
    if (!Object.prototype.hasOwnProperty.call(allowed, feature)) {
      fail(`Unsupported meta adapter: ${feature}`);
    }
    if (strategy !== allowed[feature]) {
      fail(`Unsupported meta adapter strategy for ${feature}: ${strategy}`);
    }
    mutateDeclaredTargetPolicy(policy, target, targetPolicy => {
      targetPolicy.adapters = targetPolicy.adapters || {};
      targetPolicy.adapters[feature] = strategy;
    });
    return;
  }

  fail(`Malformed LUASCRIPT meta directive: ${directive}`);
}

function validateLuascriptRepairPolicy(policy, target, directive) {
  const repair = directive.match(/^lower\s+([A-Za-z_$][\w$]*)\s+using\s+([A-Za-z_$][\w$]*)$/);
  if (!repair) {
    fail(`Malformed LUASCRIPT repair directive: ${directive}`);
  }

  const [, feature, strategy] = repair;
  const allowed = {
    indexing: "zero_based",
    length: "array_length_property",
    slicing: "runtime_slice",
    truthiness: "js_truthy",
    string_coercion: "explicit_tostring",
    multiple_returns: "packed_array"
  };
  if (!Object.prototype.hasOwnProperty.call(allowed, feature)) {
    fail(`Unsupported repair feature: ${feature}`);
  }
  if (strategy !== allowed[feature]) {
    fail(`Unsupported repair strategy for ${feature}: ${strategy}`);
  }

  mutateDeclaredTargetPolicy(policy, target, targetPolicy => {
    targetPolicy.repairs = targetPolicy.repairs || {};
    targetPolicy.repairs[feature] = strategy;
  });
}

function parseLuascriptMetaBody(body, policy) {
  let foundTarget = false;
  const targetPattern = /target\s+([A-Za-z_$][\w$]*)\s*\{([\s\S]*?)\}/g;
  const leftover = body.replace(targetPattern, (_match, target, targetBody) => {
    foundTarget = true;
    validateLuascriptPolicyTarget(target);

    const directives = targetBody
      .split(";")
      .map(part => part.trim())
      .filter(Boolean);
    for (const directive of directives) {
      validateLuascriptMetaPolicy(policy, target, directive);
    }
    return "";
  });

  if (!foundTarget) {
    fail("Malformed LUASCRIPT meta block: expected target <name> { ... }");
  }
  if (leftover.trim()) {
    fail(`Malformed LUASCRIPT meta block content: ${leftover.trim()}`);
  }
}

function parseLuascriptMetaProfileStatement(statement, policy) {
  const match = statement.match(/^meta\s+profile\s+([A-Za-z_$][\w$]*)\s*;$/);
  if (!match) {
    fail(`Malformed LUASCRIPT meta profile statement: ${statement.trim()}`);
  }
  applyLuascriptProfile(policy, match[1]);
}

function parseLuascriptRepairBody(body, policy) {
  let foundTarget = false;
  const targetPattern = /target\s+([A-Za-z_$][\w$]*)\s*\{([\s\S]*?)\}/g;
  const leftover = body.replace(targetPattern, (_match, target, targetBody) => {
    foundTarget = true;
    if (!supportedLuascriptPolicyTargets.has(target)) {
      fail(`Unsupported repair target: ${target}`);
    }

    const directives = targetBody
      .split(";")
      .map(part => part.trim())
      .filter(Boolean);
    for (const directive of directives) {
      validateLuascriptRepairPolicy(policy, target, directive);
    }
    return "";
  });

  if (!foundTarget) {
    fail("Malformed LUASCRIPT repair block: expected target <name> { ... }");
  }
  if (leftover.trim()) {
    fail(`Malformed LUASCRIPT repair block content: ${leftover.trim()}`);
  }
}

function parseLuascriptVerifyBody(body, verification) {
  const targetAssertionAliases = {
    lua_policy: "lua_policy",
    lua_not_policy: "lua_not_policy",
    lua_repair: "lua_repair",
    js_policy: "javascript_policy",
    js_not_policy: "javascript_not_policy",
    js_repair: "javascript_repair",
    python_policy: "python_policy",
    python_not_policy: "python_not_policy",
    python_repair: "python_repair",
    ls_policy: "luascript_policy",
    ls_not_policy: "luascript_not_policy",
    ls_repair: "luascript_repair",
    js_stdout: "javascript_stdout",
    js_runtime_error: "javascript_runtime_error",
    js_contains: "javascript_contains",
    js_not_contains: "javascript_not_contains",
    ls_stdout: "luascript_stdout",
    ls_runtime_error: "luascript_runtime_error",
    ls_contains: "luascript_contains",
    ls_not_contains: "luascript_not_contains"
  };
  const directives = body
    .split(";")
    .map(part => part.trim())
    .filter(Boolean);

  for (const directive of directives) {
    const match = directive.match(/^(stdout|diagnostic|feature|no_feature|profile|no_profile|implicit_profile|no_implicit_profile|lua_stdout|lua_runtime_error|lua_contains|lua_not_contains|lua_policy|lua_not_policy|lua_repair|js_stdout|js_runtime_error|js_contains|js_not_contains|js_policy|js_not_policy|js_repair|python_stdout|python_runtime_error|python_contains|python_not_contains|python_policy|python_not_policy|python_repair|ls_stdout|ls_runtime_error|ls_contains|ls_not_contains|ls_policy|ls_not_policy|ls_repair)\s+"([^"]*)"$/);
    if (!match) {
      fail(`Malformed LUASCRIPT verify directive: ${directive}`);
    }
    const directiveName = targetAssertionAliases[match[1]] || match[1];
    const directiveValue = directiveName === "diagnostic"
      ? resolveLuascriptDiagnosticValue(match[2])
      : match[2];
    if (
      directiveName === "feature" ||
      directiveName === "no_feature" ||
      directiveName === "profile" ||
      directiveName === "no_profile" ||
      directiveName === "implicit_profile" ||
      directiveName === "no_implicit_profile" ||
      directiveName.endsWith("_contains") ||
      directiveName.endsWith("_not_contains") ||
      directiveName.endsWith("_policy") ||
      directiveName.endsWith("_repair")
    ) {
      verification[directiveName] = verification[directiveName] || [];
      verification[directiveName].push(directiveValue);
    } else {
      verification[directiveName] = directiveValue;
    }
  }
}

function collectLuascriptFeatureSlices(source, blockFeatures) {
  const features = new Set(blockFeatures || []);

  if (/\bfor\s*\(\s*(?:(?:let|const|var)\s+)?[A-Za-z_$][\w$]*\s+of\s+/.test(source)) features.add("for-of");
  if (/\bclass\s+[A-Za-z_$][\w$]*/.test(source)) features.add("classes");
  if (/\btry\s*\{/.test(source)) features.add("try-catch");
  if (/`/.test(source)) features.add("template-literals");
  if (/\|>/.test(source)) features.add("pipelines");
  if (/[∑∏∫]/.test(source)) features.add("math-binders");
  if (/∂_\s*\{/.test(source)) features.add("derivative-binders");
  if (/(?:^|[^\w$])(?:lim|limit)_\s*\{/.test(source)) features.add("limit-binders");
  if (/\[[^\]]*\.\.[^\]]*\]/.test(source)) features.add("ranges");
  if (/\blet\b[\s\S]*?\bin\b/.test(source)) features.add("let-in");

  return features;
}

function validateLuascriptFeatureVerification(verification, featureSlices) {
  for (const expected of verification.feature || []) {
    if (!featureSlices.has(expected)) {
      fail(`Missing verified feature slice: ${expected}`);
    }
  }

  for (const unexpected of verification.no_feature || []) {
    if (featureSlices.has(unexpected)) {
      fail(`Forbidden verified feature slice present: ${unexpected}`);
    }
  }
}

function validateProfileAssertion(policy, profileName, key, collection, shouldExist) {
  const profiles = new Set(policy[collection] || []);
  const matches = profiles.has(profileName);
  if (shouldExist && !matches) {
    fail(`Missing LUASCRIPT ${key} assertion: ${profileName}`);
  }
  if (!shouldExist && matches) {
    fail(`Forbidden LUASCRIPT ${key} assertion present: ${profileName}`);
  }
}

function validateLuascriptProfileVerification(verification, policy) {
  for (const profileName of verification.profile || []) {
    validateProfileAssertion(policy, profileName, "profile", "profiles", true);
  }
  for (const profileName of verification.no_profile || []) {
    validateProfileAssertion(policy, profileName, "profile", "profiles", false);
  }
  for (const profileName of verification.implicit_profile || []) {
    validateProfileAssertion(policy, profileName, "implicit profile", "implicitProfiles", true);
  }
  for (const profileName of verification.no_implicit_profile || []) {
    validateProfileAssertion(policy, profileName, "implicit profile", "implicitProfiles", false);
  }
}

function validateLuascriptCapabilityPolicy(policy) {
  for (const [target, targetPolicy] of Object.entries(policy.targets || {})) {
    const requires = new Set(targetPolicy.requires || []);
    const forbid = new Set(targetPolicy.forbid || []);

    for (const capability of requires) {
      if (forbid.has(capability)) {
        fail(`Conflicting capability policy: ${capability} is both required and forbidden`);
      }
    }

    if (
      target === "lua" &&
      targetPolicy.resolve &&
      targetPolicy.resolve.continue === "label_goto" &&
      !requires.has("lua.goto")
    ) {
      fail("resolve continue using label_goto requires lua.goto");
    }

    if (
      target === "lua" &&
      targetPolicy.resolve &&
      targetPolicy.resolve.continue === "label_goto" &&
      forbid.has("lua.goto")
    ) {
      fail("Forbidden capability used by meta policy: lua.goto");
    }
  }
}

function applyLuascriptMetaDiagnostics(source, policy) {
  for (const targetPolicy of Object.values(policy.targets || {})) {
    const asyncDiagnostic = targetPolicy.diagnostics && targetPolicy.diagnostics.async;
    if (asyncDiagnostic && /\basync\b/.test(source)) {
      fail(asyncDiagnostic);
    }
  }
  for (const targetPolicy of Object.values(policy.targets || {})) {
    if ((targetPolicy.forbid || []).includes("js.prototype") && /\.prototype\b/.test(source)) {
      fail(knownLuascriptDiagnostics.js_prototype_forbidden);
    }
  }
}

function luascriptPolicyHas(policy, feature, strategy) {
  const luaPolicy = policy && policy.targets && policy.targets.lua ? policy.targets.lua : {};
  return Boolean(
    (luaPolicy.adapters && luaPolicy.adapters[feature] === strategy) ||
    (luaPolicy.repairs && luaPolicy.repairs[feature] === strategy)
  );
}

function annotateLuascriptBuiltins(root, policy) {
  const manyEnabled = luascriptPolicyHas(policy, "multiple_returns", "packed_array");

  function visit(value) {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }

    if (
      value.kind === "CallExpression" &&
      value.callee &&
      value.callee.kind === "Identifier" &&
      value.callee.name === "many" &&
      manyEnabled
    ) {
      value.metadata = {
        ...(value.metadata || {}),
        luascriptBuiltin: "many"
      };
    }

    for (const [key, child] of Object.entries(value)) {
      if (key === "metadata" || key === "loc" || key === "range") continue;
      visit(child);
    }
  }

  visit(root);
}

function extractLuascriptCompileTimeBlocks(source) {
  const policy = createEmptyLuascriptPolicy();
  applyLuascriptProfile(policy, "portable_semantics_v1", {
    recordProfile: false,
    recordImplicit: true
  });
  const verification = createEmptyLuascriptVerification();
  const blockFeatures = new Set();
  let offset = 0;
  let foundBlock = false;

  while (true) {
    offset = skipTrivia(source, offset);
    const isMeta = isWordAt(source, offset, "meta");
    const isVerify = isWordAt(source, offset, "verify");
    const isRepair = isWordAt(source, offset, "repair");
    if (!isMeta && !isVerify && !isRepair) break;

    foundBlock = true;
    if (isMeta) {
      const postMeta = skipTrivia(source, offset + "meta".length);
      if (isWordAt(source, postMeta, "profile")) {
        const semicolonIndex = source.indexOf(";", postMeta + "profile".length);
        if (semicolonIndex === -1) {
          fail("Malformed LUASCRIPT meta profile statement: missing ';'");
        }
        blockFeatures.add("meta-profiles");
        parseLuascriptMetaProfileStatement(source.slice(offset, semicolonIndex + 1), policy);
        offset = semicolonIndex + 1;
        continue;
      }
    }

    const keyword = isMeta ? "meta" : (isVerify ? "verify" : "repair");
    const openIndex = source.indexOf("{", offset + keyword.length);
    if (openIndex === -1) {
      fail(`Malformed LUASCRIPT ${keyword} block: expected '{' after ${keyword}`);
    }
    const closeIndex = findMatchingBrace(source, openIndex);
    if (isMeta) {
      blockFeatures.add("meta-blocks");
      parseLuascriptMetaBody(source.slice(openIndex + 1, closeIndex), policy);
    } else if (isRepair) {
      blockFeatures.add("repair-blocks");
      parseLuascriptRepairBody(source.slice(openIndex + 1, closeIndex), policy);
    } else {
      blockFeatures.add("verify-blocks");
      parseLuascriptVerifyBody(source.slice(openIndex + 1, closeIndex), verification);
    }
    offset = closeIndex + 1;
  }

  const executableSource = foundBlock ? source.slice(offset).replace(/^\s+/, "") : source;
  const featureSlices = collectLuascriptFeatureSlices(executableSource, blockFeatures);
  validateLuascriptFeatureVerification(verification, featureSlices);
  validateLuascriptProfileVerification(verification, policy);
  validateLuascriptCapabilityPolicy(policy);
  negotiateLuascriptCapabilityPolicy(policy, executableSource);
  validateLuascriptCapabilityPolicy(policy);

  return {
    source: executableSource,
    policy,
    verification
  };
}

class LuaScriptToIRCompiler {
  compile(source) {
    return this.compileArtifact(source).program;
  }

  compileArtifact(source) {
    const metaArtifact = extractLuascriptCompileTimeBlocks(source);
    applyLuascriptMetaDiagnostics(metaArtifact.source, metaArtifact.policy);
    const program = new JSToIRCompiler().compile(metaArtifact.source);
    program.metadata = {
      ...(program.metadata || {}),
      sourceLanguage: "luascript",
      luascriptMeta: metaArtifact.policy,
      luascriptVerify: metaArtifact.verification
    };
    annotateLuascriptBuiltins(program, metaArtifact.policy);

    return {
      program,
      root: program,
      metaPolicy: metaArtifact.policy,
      verifyPolicy: metaArtifact.verification,
      source: metaArtifact.source
    };
  }
}

module.exports = {
  LuaScriptToIRCompiler,
  extractLuascriptCompileTimeBlocks,
  applyLuascriptMetaDiagnostics,
  annotateLuascriptBuiltins,
  knownLuascriptDiagnostics
};
