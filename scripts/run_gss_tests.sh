
#!/bin/bash
# Run GSS & AGSS Test Suite

set -e

echo "================================="
echo "   GSS & AGSS Test Suite"
echo "================================="

cd /home/ubuntu/github_repos/LUASCRIPT

echo ""
echo "=== Running Kernel Tests ==="
lua gss/tests/test_kernels.lua

echo ""
echo "=== Running AGSS Tests ==="
lua gss/tests/test_agss.lua

echo ""
echo "=== Running Integration Tests ==="
lua gss/tests/test_integration.lua

echo ""
echo "=== Running GSS Benchmarks ==="
lua gss/benchmarks/bench_gss.lua

echo ""
echo "=== Running AGSS Benchmarks ==="
lua gss/benchmarks/bench_agss.lua

echo ""
echo "================================="
echo "   All Tests Complete!"
echo "================================="
echo ""
echo "Results exported to:"
echo "  - /tmp/gss_benchmark_results.csv"
echo "  - /tmp/agss_benchmark_results.csv"
echo "  - /tmp/gss_test_export.csv"
echo "  - /tmp/gss_test_export.md"
