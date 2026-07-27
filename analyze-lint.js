const fs = require('fs');
const report = JSON.parse(fs.readFileSync('lint-report-full.json', 'utf8'));

const violations = {};
const fileStats = {};

report.forEach(file => {
  const fileName = file.filePath.split('\\').pop();
  fileStats[file.filePath] = { errors: 0, warnings: 0, rules: {} };
  
  file.messages.forEach(msg => {
    const rule = msg.ruleId || 'unknown';
    if (!violations[rule]) violations[rule] = 0;
    violations[rule]++;
    
    if (msg.severity === 2) fileStats[file.filePath].errors++;
    else fileStats[file.filePath].warnings++;
    
    if (!fileStats[file.filePath].rules[rule]) fileStats[file.filePath].rules[rule] = 0;
    fileStats[file.filePath].rules[rule]++;
  });
});

console.log('\n=== TOP 20 VIOLATION RULES ===\n');
Object.entries(violations)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20)
  .forEach(([rule, count]) => console.log(rule + ': ' + count));

console.log('\n=== FILES WITH MOST VIOLATIONS ===\n');
Object.entries(fileStats)
  .map(([file, stats]) => ({ file, total: stats.errors + stats.warnings, errors: stats.errors, warnings: stats.warnings }))
  .sort((a, b) => b.total - a.total)
  .slice(0, 15)
  .forEach(stat => console.log(stat.file + ' => ' + stat.errors + ' errors, ' + stat.warnings + ' warnings'));

console.log('\n=== SUMMARY ===\n');
const totalViolations = Object.values(violations).reduce((a, b) => a + b, 0);
const totalErrors = Object.values(fileStats).reduce((a, b) => a + b.errors, 0);
const totalWarnings = Object.values(fileStats).reduce((a, b) => a + b.warnings, 0);
console.log('Total violations: ' + totalViolations);
console.log('Total errors: ' + totalErrors);
console.log('Total warnings: ' + totalWarnings);
console.log('Files with issues: ' + Object.keys(fileStats).filter(f => fileStats[f].errors + fileStats[f].warnings > 0).length);
