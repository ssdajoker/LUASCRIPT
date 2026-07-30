"use strict";

const { UnifiedLuaScript } = require("../..");

async function main() {
  const system = new UnifiedLuaScript({ enableAll: false });
  try {
    await system.initializationPromise;
    const status = system.getSystemStatus();

    if (
      status.initialized !== true ||
      status.componentsLoaded !== 0 ||
      status.components.length !== 0 ||
      typeof status.version !== "string"
    ) {
      throw new Error(`Unexpected disabled-system status: ${JSON.stringify(status)}`);
    }

    process.stdout.write(
      `LUASCRIPT_PACKAGE_EXAMPLE=minimal-system version=${status.version} components=0\n`
    );
  } finally {
    system.shutdown();
  }
}

main().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
