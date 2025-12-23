# Lint Dashboard
Tracks ESLint warning/error counts across weekly Tier 4 runs.

## Trend (Tier 4 / General Code)
| Date (UTC) | Scope | Command | Warnings | Errors | Budget | HTML Report | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2025-12-23 | `src/**/*.js` | `npm exec -- eslint "src/**/*.js" --max-warnings 200` | 17 | 17 | ≤200 warnings | [reports/eslint/eslint-weekly-2025-12-23.html](eslint/eslint-weekly-2025-12-23.html) | Initial weekly sweep; errors present and should be triaged in follow-up cleanup |

## How to Update
- Run the weekly report command (see `DEVELOPMENT_WORKFLOW.md`) to generate a new HTML artifact under `reports/eslint/`.
- Append a new row above with the date (UTC), command, warning/error counts, budget, and link to the saved HTML file.
- Keep budgets aligned with `ESLINT_CLEANUP_GUIDE.md` (Tier 4 cap: 200 warnings; errors should trend toward zero).
