const fs = require('fs');
const path = require('path');

function main() {
  const meta = {
    timestamp: new Date().toISOString(),
    workflow: process.env.WORKFLOW || 'unknown',
    runId: process.env.RUN_ID || process.env.GITHUB_RUN_ID || 'unknown',
    gitSha: process.env.GIT_SHA || process.env.GITHUB_SHA || 'unknown',
  };

  const checks = {
    test: process.env.TEST_STATUS || 'unknown',
    harness: process.env.HARNESS_STATUS || 'unknown',
    irValidate: process.env.IR_VALIDATE_STATUS || 'unknown',
    emitGoldens: process.env.EMIT_GOLDENS_STATUS || 'unknown',
    perf: process.env.PERF_STATUS || 'unknown',
  };

  const payload = { meta, checks };

  const artifactsDir = path.join(process.cwd(), 'artifacts');
  fs.mkdirSync(artifactsDir, { recursive: true });

  const outPath = path.join(artifactsDir, 'status.json');
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
  console.log(`Wrote status bundle to ${outPath}`);
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error('Failed to write status bundle:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
}
