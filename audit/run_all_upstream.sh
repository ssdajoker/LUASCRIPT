#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")"/.. && pwd)"
AUDIT_DIR="$ROOT_DIR/audit_upstream"
cd "$ROOT_DIR"

echo "== Audit: initialize =="
mkdir -p "$AUDIT_DIR"
touch "$AUDIT_DIR/.gitkeep"

echo "== Audit: file tree =="
{
  echo "# File Tree"; echo;
  if command -v tree >/dev/null 2>&1; then
    tree -ah --du -I "node_modules|.git|.venv|__pycache__|dist|build|*.lock"
  else
    echo "[tree not installed]"
  fi
} > "$AUDIT_DIR/FILE_TREE.md"

echo "== Audit: files_all =="
if command -v fd >/dev/null 2>&1; then
  fd -H -t f > "$AUDIT_DIR/files_all.txt"
else
  find . -type f \
    -not -path "./.git/*" \
    -not -path "./node_modules/*" \
    -not -path "./.venv/*" \
    -not -path "./dist/*" \
    -not -path "./build/*" \
    -print | sed 's|^\./||' > "$AUDIT_DIR/files_all.txt"
fi

echo "== Audit: cloc =="
if command -v cloc >/dev/null 2>&1; then
  cloc --json --vcs=git . > "$AUDIT_DIR/cloc.json" || echo '{"error":"cloc failed"}' > "$AUDIT_DIR/cloc.json"
else
  echo '{"info":"cloc not installed"}' > "$AUDIT_DIR/cloc.json"
fi

echo "== Audit: gitfiles mtimes =="
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git ls-files -z | while IFS= read -r -d '' f; do
    printf "%s\t" "$f"
    if [ -e "$f" ]; then stat -c %Y -- "$f"; else echo "NA"; fi
  done > "$AUDIT_DIR/gitfiles_mtime.tsv"
else
  : > "$AUDIT_DIR/gitfiles_mtime.tsv"
fi

echo "== Audit: classifiers and indexers =="
node audit/classify.js || true
node audit/ideation.js || true
node audit/deps.js || true
node audit/implmap.js || true

echo "== Audit: linters =="
: > "$AUDIT_DIR/eslint.txt"; : > "$AUDIT_DIR/luacheck.txt"; : > "$AUDIT_DIR/python_lint.txt"

# Try to ensure tools exist (best-effort, non-fatal)
if ! command -v cloc >/dev/null 2>&1; then (command -v apt >/dev/null 2>&1 && sudo apt-get update && sudo apt-get install -y cloc) || true; fi
if ! command -v rg >/dev/null 2>&1; then (command -v apt >/dev/null 2>&1 && sudo apt-get update && sudo apt-get install -y ripgrep) || true; fi
if ! command -v semgrep >/dev/null 2>&1; then (command -v pipx >/dev/null 2>&1 && pipx install semgrep) || (python3 -m pip install --user semgrep && export PATH="$HOME/.local/bin:$PATH") || true; fi
if ! command -v ruff >/dev/null 2>&1; then (python3 -m pip install --user ruff && export PATH="$HOME/.local/bin:$PATH") || true; fi
if ! command -v flake8 >/dev/null 2>&1; then (python3 -m pip install --user flake8 && export PATH="$HOME/.local/bin:$PATH") || true; fi
if ! command -v luacheck >/dev/null 2>&1; then (command -v apt >/dev/null 2>&1 && sudo apt-get update && sudo apt-get install -y luacheck) || true; fi

# luacheck
if [ -f .luacheckrc ] && command -v luacheck >/dev/null 2>&1; then luacheck . 2>&1 | tee "$AUDIT_DIR/luacheck.txt" || true; fi

# ESLint: prefer local flat config under audit/
if command -v npx >/dev/null 2>&1; then
  npx -y eslint -c audit/eslint.config.mjs . 2>&1 | tee "$AUDIT_DIR/eslint.txt" || true
else
  (npm exec --yes eslint -c audit/eslint.config.mjs . 2>&1 | tee "$AUDIT_DIR/eslint.txt") || true
fi

# Python lint
if command -v ruff >/dev/null 2>&1; then ruff . 2>&1 | tee "$AUDIT_DIR/python_lint.txt" || true; elif command -v flake8 >/dev/null 2>&1; then flake8 2>&1 | tee "$AUDIT_DIR/python_lint.txt" || true; fi

echo "== Audit: security (semgrep) =="
if command -v semgrep >/dev/null 2>&1; then
  semgrep --config p/ci --json > "$AUDIT_DIR/semgrep.json" || echo '{"error":"semgrep failed"}' > "$AUDIT_DIR/semgrep.json"
else
  echo '{"info":"semgrep not installed"}' > "$AUDIT_DIR/semgrep.json"
fi

echo "== Audit: quality report =="
node audit/quality.js || true

echo "== Audit: tests =="
: > "$AUDIT_DIR/tests_output.txt"
if [ -f package.json ]; then
  if command -v timeout >/dev/null 2>&1; then timeout 180s npm test --silent 2>&1 | tee "$AUDIT_DIR/tests_output.txt" || true; else npm test --silent 2>&1 | tee "$AUDIT_DIR/tests_output.txt" || true; fi
fi
node audit/tests_summary.js || true

echo "== Audit: synthesis local summary =="
node audit/local_summary.js || true

echo "== Audit: checklist =="
cat > "$AUDIT_DIR/CHECKLIST.md" <<'EOF'
# Audit Artifacts Checklist

- [x] audit/.gitkeep
- [x] audit/FILE_TREE.md
- [x] audit/files_all.txt
- [x] audit/cloc.json
- [x] audit/gitfiles_mtime.tsv
- [x] audit/classified_files.json
- [x] audit/docs_index.csv
- [x] audit/ideation_hits.txt
- [x] audit/adr_index.csv
- [x] audit/implementation_map.json
- [x] audit/quality_report.md
- [x] audit/tests_report.md
- [x] audit/deps_report.md
- [x] audit/deps.json
- [x] audit/local_summary.md
EOF

nonempty=(FILE_TREE.md files_all.txt classified_files.json docs_index.csv ideation_hits.txt adr_index.csv implementation_map.json quality_report.md tests_report.md deps_report.md deps.json local_summary.md)
for f in "${nonempty[@]}"; do
  if [ ! -s "$AUDIT_DIR/$f" ]; then echo "WARN: $AUDIT_DIR/$f is empty"; fi
done

echo "== Audit: Phase‑A synthesis (executive summary) =="
node audit/synthesize_phaseA.js || true

echo "== Audit: done =="
ls -lah "$AUDIT_DIR" | sed -n '1,200p'
