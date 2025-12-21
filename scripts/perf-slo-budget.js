#!/usr/bin/env node
/**
 * Performance SLO & Budget System
 * 
 * Converts performance smoke tests into strict SLOs with ±5% budgets.
 * Detects regressions, warns on drift, uploads artifacts for trend visualization.
 * 
 * Integration:
 * - Runs after test suite
 * - Uploads results to artifacts/perf-{COMMIT}.json
 * - Generates trend report for visualization
 * - Fails CI on budget violations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ============================================================================
// CONFIGURATION: SLO BUDGETS (±5% tolerance bands)
// ============================================================================

const SLO_BUDGETS = {
  'transpile-simple': {
    name: 'Simple Transpilation (var declaration)',
    metric: 'transpile_time_ms',
    budget: 0.85,        // 0.85ms baseline
    tolerance: 0.05,      // ±5% = ±0.0425ms
    sloMs: { min: 0.8075, max: 0.8925 },
    description: 'Basic variable assignment transpilation'
  },
  'transpile-function': {
    name: 'Function Transpilation',
    metric: 'transpile_time_ms',
    budget: 1.2,
    tolerance: 0.05,
    sloMs: { min: 1.14, max: 1.26 },
    description: 'Function declaration with simple body'
  },
  'transpile-objects': {
    name: 'Object/Array Transpilation',
    metric: 'transpile_time_ms',
    budget: 1.15,
    tolerance: 0.05,
    sloMs: { min: 1.0925, max: 1.2075 },
    description: 'Complex literals (objects, arrays)'
  },
  'ir-parse-simple': {
    name: 'IR Parsing (Simple)',
    metric: 'parse_time_ms',
    budget: 0.25,
    tolerance: 0.05,
    sloMs: { min: 0.2375, max: 0.2625 },
    description: 'Canonical IR parsing for basic code'
  },
  'ir-parse-complex': {
    name: 'IR Parsing (Complex)',
    metric: 'parse_time_ms',
    budget: 0.95,
    tolerance: 0.05,
    sloMs: { min: 0.9025, max: 0.9975 },
    description: 'Canonical IR parsing for complex patterns'
  },
  'lua-emit-simple': {
    name: 'Lua Emission (Simple)',
    metric: 'emit_time_ms',
    budget: 0.35,
    tolerance: 0.05,
    sloMs: { min: 0.3325, max: 0.3675 },
    description: 'Emit Lua from simple IR nodes'
  },
  'lua-emit-complex': {
    name: 'Lua Emission (Complex)',
    metric: 'emit_time_ms',
    budget: 1.05,
    tolerance: 0.05,
    sloMs: { min: 0.9975, max: 1.1025 },
    description: 'Emit Lua from complex IR patterns'
  }
};

// ============================================================================
// DATA COLLECTION & MEASUREMENT
// ============================================================================

class PerfMeasurement {
  constructor() {
    this.results = {};
    this.violations = [];
    this.warnings = [];
  }

  measure(key, timeMs, metadata = {}) {
    if (!this.results[key]) {
      this.results[key] = [];
    }
    this.results[key].push({ time: timeMs, ...metadata });
  }

  getStats(key) {
    const times = this.results[key] || [];
    if (times.length === 0) return null;

    const vals = times.map(x => x.time).sort((a, b) => a - b);
    return {
      count: vals.length,
      min: vals[0],
      max: vals[vals.length - 1],
      avg: vals.reduce((a, b) => a + b, 0) / vals.length,
      median: vals[Math.floor(vals.length / 2)],
      p95: vals[Math.floor(vals.length * 0.95)],
      p99: vals[Math.floor(vals.length * 0.99)]
    };
  }

  checkBudget(sloKey, actualMs) {
    const slo = SLO_BUDGETS[sloKey];
    if (!slo) return null;

    const { min, max } = slo.sloMs;
    const within = actualMs >= min && actualMs <= max;
    const percentOfBudget = (actualMs / slo.budget) * 100;

    return {
      within,
      actualMs: actualMs.toFixed(3),
      budgetMs: slo.budget.toFixed(3),
      percentOfBudget: percentOfBudget.toFixed(1),
      range: `[${min.toFixed(4)}, ${max.toFixed(4)}]`,
      status: within ? '✅' : percentOfBudget > 110 ? '❌' : '⚠️'
    };
  }

  assessRegression(sloKey, previousAvg, currentAvg) {
    const percentChange = ((currentAvg - previousAvg) / previousAvg) * 100;
    const isRegression = percentChange > 5;    // Regression: > +5%
    const isDrift = percentChange > 2;          // Drift: > +2% (warning)

    return {
      percentChange: percentChange.toFixed(2),
      severity: isRegression ? 'REGRESSION' : isDrift ? 'DRIFT' : 'OK',
      previous: previousAvg.toFixed(3),
      current: currentAvg.toFixed(3),
      advice: isRegression
        ? `FAIL: Regression detected (+${percentChange.toFixed(2)}% > +5% budget)`
        : isDrift
        ? `WARN: Performance drifting (+${percentChange.toFixed(2)}%)`
        : 'PASS: Within budget'
    };
  }
}

// ============================================================================
// ARTIFACT GENERATION & TREND TRACKING
// ============================================================================

class PerfArtifactManager {
  constructor(artifactDir = 'artifacts') {
    this.artifactDir = artifactDir;
    if (!fs.existsSync(artifactDir)) {
      fs.mkdirSync(artifactDir, { recursive: true });
    }
  }

  getCurrentMetadata() {
    return {
      timestamp: new Date().toISOString(),
      commit: this._getCommitHash(),
      branch: this._getBranch(),
      runner: process.env.RUNNER_OS || process.platform,
      nodeVersion: process.version,
      timestamp_unix: Date.now()
    };
  }

  _getCommitHash() {
    try {
      return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  _getBranch() {
    try {
      return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  savePerfResults(measurements, violations, warnings) {
    const filename = `perf-${this._getCommitHash()}-${Date.now()}.json`;
    const filepath = path.join(this.artifactDir, filename);

    const report = {
      metadata: this.getCurrentMetadata(),
      summary: {
        totalViolations: violations.length,
        totalWarnings: warnings.length,
        passingBudgets: Object.keys(SLO_BUDGETS).length - violations.length,
        failingBudgets: violations.length
      },
      measurements: measurements.results,
      stats: this._computeStats(measurements),
      violations,
      warnings
    };

    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    console.log(`📊 Perf artifact saved: ${filepath}`);
    return filepath;
  }

  _computeStats(measurements) {
    const stats = {};
    for (const [key, slo] of Object.entries(SLO_BUDGETS)) {
      stats[key] = measurements.getStats(key) || { error: 'no data' };
    }
    return stats;
  }

  saveTrendData(historicalData) {
    const trendFile = path.join(this.artifactDir, 'perf-trend.json');
    fs.writeFileSync(trendFile, JSON.stringify(historicalData, null, 2));
    console.log(`📈 Trend data saved: ${trendFile}`);
  }

  generateVisualizationHTML(measurements, violations) {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>LUASCRIPT Performance SLO Dashboard</title>
  <style>
    body { font-family: system-ui; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { color: #333; border-bottom: 3px solid #0066cc; padding-bottom: 10px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
    .card { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .metric { font-size: 24px; font-weight: bold; color: #0066cc; }
    .label { color: #666; font-size: 12px; text-transform: uppercase; }
    .violations { background: #fee; padding: 15px; border-left: 4px solid #c00; border-radius: 4px; margin: 20px 0; }
    .violation-item { margin: 10px 0; font-family: monospace; font-size: 12px; }
    .warning { color: #ff6600; }
    .pass { color: #00aa00; }
    .fail { color: #cc0000; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f0f0f0; font-weight: bold; }
    tr:hover { background: #f9f9f9; }
    .budget-bar { width: 100%; height: 20px; background: #ddd; border-radius: 3px; overflow: hidden; position: relative; }
    .budget-fill { height: 100%; background: linear-gradient(90deg, #0066cc 0%, #00aa00 50%, #ff6600 75%, #cc0000 100%); }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
  <div class="container">
    <h1>⚡ LUASCRIPT Performance SLO Dashboard</h1>
    
    <div class="summary">
      <div class="card">
        <div class="label">Total SLOs</div>
        <div class="metric">${Object.keys(SLO_BUDGETS).length}</div>
      </div>
      <div class="card">
        <div class="label">Passing</div>
        <div class="metric pass">${Object.keys(SLO_BUDGETS).length - violations.length}</div>
      </div>
      <div class="card">
        <div class="label">Violations</div>
        <div class="metric fail">${violations.length}</div>
      </div>
      <div class="card">
        <div class="label">Health</div>
        <div class="metric">${(((Object.keys(SLO_BUDGETS).length - violations.length) / Object.keys(SLO_BUDGETS).length) * 100).toFixed(0)}%</div>
      </div>
    </div>

    <h2>SLO Status</h2>
    <table>
      <tr>
        <th>SLO</th>
        <th>Budget (ms)</th>
        <th>Actual (ms)</th>
        <th>% of Budget</th>
        <th>Status</th>
      </tr>
      ${Object.entries(SLO_BUDGETS).map(([key, slo]) => {
        const stat = measurements.getStats(key);
        if (!stat) return `<tr><td>${slo.name}</td><td colspan="4">No data</td></tr>`;
        const budget = measurements.checkBudget(key, stat.avg);
        return `
      <tr>
        <td><strong>${slo.name}</strong></td>
        <td>${budget.budgetMs}</td>
        <td>${budget.actualMs}</td>
        <td>${budget.percentOfBudget}%</td>
        <td>${budget.status}</td>
      </tr>
        `;
      }).join('')}
    </table>

    ${violations.length > 0 ? `
    <div class="violations">
      <h3>❌ Budget Violations</h3>
      ${violations.map(v => `
      <div class="violation-item">
        <strong>${v.slo}</strong>: ${v.message}
      </div>
      `).join('')}
    </div>
    ` : '<p class="pass">✅ All SLOs within budget!</p>'}

    <p style="color: #999; font-size: 12px; margin-top: 40px;">
      Generated: ${new Date().toISOString()} | 
      <a href="https://github.com/ssdajoker/LUASCRIPT/actions">View CI Logs</a>
    </p>
  </div>
</body>
</html>
    `;
    
    const filepath = path.join(this.artifactDir, 'perf-dashboard.html');
    fs.writeFileSync(filepath, html);
    console.log(`📊 Dashboard generated: ${filepath}`);
    return filepath;
  }
}

// ============================================================================
// MAIN: SLO EVALUATION
// ============================================================================

async function main() {
  console.log('🎯 Performance SLO & Budget System');
  console.log('===================================\n');

  const perf = new PerfMeasurement();
  const artifacts = new PerfArtifactManager();

  // ===== SIMULATE MEASUREMENTS (in real use, hook into test harness) =====
  // These would come from actual test runs
  const mockMeasurements = {
    'transpile-simple': 0.84,      // within budget
    'transpile-function': 1.25,    // warning (99% of budget)
    'transpile-objects': 1.27,     // VIOLATION (110% of budget)
    'ir-parse-simple': 0.24,       // within budget
    'ir-parse-complex': 0.96,      // warning (101% of budget)
    'lua-emit-simple': 0.34,       // within budget
    'lua-emit-complex': 1.06,      // warning (101% of budget)
  };

  console.log('📏 Measuring against SLO budgets (±5% tolerance)...\n');

  const violations = [];
  const warnings = [];

  for (const [sloKey, actualMs] of Object.entries(mockMeasurements)) {
    const slo = SLO_BUDGETS[sloKey];
    const check = perf.checkBudget(sloKey, actualMs);

    if (!check.within) {
      const percentOver = parseFloat(check.percentOfBudget) - 100;
      if (percentOver > 10) {
        violations.push({
          slo: slo.name,
          message: `${actualMs.toFixed(3)}ms exceeds budget ${slo.budget}ms by ${percentOver.toFixed(1)}%`
        });
        console.log(`❌ ${slo.name}`);
        console.log(`   Budget: ${slo.budget}ms | Actual: ${actualMs.toFixed(3)}ms | ${check.percentOfBudget}% of budget`);
      } else {
        warnings.push({
          slo: slo.name,
          message: `${actualMs.toFixed(3)}ms approaching budget ${slo.budget}ms (${check.percentOfBudget}% of budget)`
        });
        console.log(`⚠️  ${slo.name}`);
        console.log(`   Budget: ${slo.budget}ms | Actual: ${actualMs.toFixed(3)}ms | ${check.percentOfBudget}% of budget (approaching limit)`);
      }
    } else {
      console.log(`✅ ${slo.name}`);
      console.log(`   Budget: ${slo.budget}ms | Actual: ${actualMs.toFixed(3)}ms | ${check.percentOfBudget}% of budget`);
    }
    console.log();
  }

  // ===== GENERATE ARTIFACTS =====
  console.log('\n📊 Generating artifacts...\n');

  const resultsFile = artifacts.savePerfResults(perf, violations, warnings);
  const dashboardFile = artifacts.generateVisualizationHTML(perf, violations);

  // ===== CI DECISION =====
  console.log('\n🎯 SLO Assessment:');
  console.log(`   Passing budgets: ${Object.keys(SLO_BUDGETS).length - violations.length}/${Object.keys(SLO_BUDGETS).length}`);
  console.log(`   Violations: ${violations.length}`);
  console.log(`   Warnings: ${warnings.length}`);

  if (violations.length > 0) {
    console.log('\n❌ FAILED: Performance SLO violations detected');
    console.log('   Violations must be resolved before merge');
    process.exit(1);
  } else if (warnings.length > 0) {
    console.log('\n⚠️  WARNING: Performance drift detected');
    console.log('   Monitor for regressions; no blocker for merge');
    process.exit(0);
  } else {
    console.log('\n✅ PASSED: All SLOs within budget');
    process.exit(0);
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
}

module.exports = { PerfMeasurement, PerfArtifactManager, SLO_BUDGETS };
