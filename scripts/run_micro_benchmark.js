#!/usr/bin/env node
const { UnifiedLuaScript } = require('../src/unified_luascript.js');

(async () => {
  const system = UnifiedLuaScript.createProduction();
  try {
    await system.initializeComponents();
    const result = await system.benchmark('let x = 5;', 100);
    const payload = {
      timestamp: new Date().toISOString(),
      iterations: result.iterations,
      mean: result.mean,
      median: result.median,
      min: result.min,
      max: result.max,
      stdDev: result.stdDev,
      p95: result.p95,
      p99: result.p99
    };
    console.log(JSON.stringify(payload, null, 2));
  } catch (error) {
    console.error('Benchmark run failed:', error);
    process.exitCode = 1;
  } finally {
    try {
      system.shutdown();
    } catch (shutdownError) {
      console.error('Shutdown error:', shutdownError);
    }
    process.exit();
  }
})();
