#!/usr/bin/env bash

set -o errexit
set -o nounset
set -o pipefail

REPORT_DIR="${1:-artifacts/lint-reports}"

mkdir -p "${REPORT_DIR}"

npm exec eslint "src/ir/core/**/*.js" --max-warnings 0 --format html --output-file "${REPORT_DIR}/core.html"
npm exec eslint "src/ir/transforms/**/*.js" "src/ir/validators/**/*.js" --max-warnings 50 --format html --output-file "${REPORT_DIR}/extended.html"
npm exec eslint "src/backends/**/*.js" --max-warnings 100 --format html --output-file "${REPORT_DIR}/backends.html"
npm exec eslint "src/**/*.js" "lib/**/*.js" --max-warnings 200 --format html --output-file "${REPORT_DIR}/general.html"
