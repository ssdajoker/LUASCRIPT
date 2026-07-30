"use strict";

const { CoreTranspiler } = require("../..");

const transpiler = new CoreTranspiler({
  optimize: false,
  sourceMap: false
});
const result = transpiler.transpile(
  "const answer = 6 * 7;",
  "package-example.js"
);
const lua = typeof result === "string" ? result : result && result.code;

if (
  typeof lua !== "string" ||
  !/local\s+answer\s*=\s*\(?6\s*\*\s*7\)?/.test(lua)
) {
  throw new Error(`Unexpected LUASCRIPT output: ${String(lua)}`);
}

process.stdout.write(`LUASCRIPT_PACKAGE_EXAMPLE=transpile-js-to-lua\n${lua}\n`);
