# Artifact Management & CI Pipeline Guidelines

## Performance Regression Testing

### Generated Artifacts
- **Location**: `artifacts/perf-regression-results.json`
- **Source**: Performance gate CI pipeline
- **Purpose**: Track performance regressions across commits
- **Lifecycle**: Generated during CI → archived in artifact management system → purged from working directory

### Handling Strategy (World-Class CI/CD)

1. **Local Development**
   - These files are in `.gitignore` and should never be committed
   - Local perf testing generates temporary results; review locally then discard

2. **CI Pipeline**
   - Perf gate runs automatically on PR/merge
   - Results are uploaded to artifact storage (GitHub Actions, AWS S3, or equivalent)
   - JSON results are queryable for regression analysis dashboards

3. **Artifact Retention**
   - Performance results retained for 30 days minimum
   - Historical data enables trend analysis and regression detection
   - Integrated with performance monitoring dashboards

4. **Best Practices**
   ```bash
   # DO: Run locally to validate
   npm run perf:test
   
   # DON'T: Commit perf-regression-results.json
   # (already in .gitignore)
   
   # For historical analysis, use artifact API:
   # curl https://artifacts.ci.example.com/perf-results/<commit-hash>
   ```

## Other Ignored Artifacts

- `*.benchmark.json` - Benchmark timing results
- `perf-results/` - Performance test output directory
- `benchmarks/output/` - Compiled benchmark artifacts

## Related Documentation
- [CI/CD Pipeline](./DEPLOYMENT_CHECKLIST.md)
- [Performance Testing](./README.md#performance)
- [Quality Gates](./QUALITY_GATES_ENFORCEMENT.md)
