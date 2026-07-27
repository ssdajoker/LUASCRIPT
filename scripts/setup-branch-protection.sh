#!/bin/bash
# GitHub Branch Protection Setup Script
# Run this to configure branch protection rules via CLI

# Configuration
REPO="${GITHUB_REPO:-ssdajoker/LUASCRIPT}"
BRANCH="main"

echo "🔐 Configuring branch protection for $REPO on branch '$BRANCH'..."

# Step 1: Require status checks
echo "1️⃣  Setting required status checks..."
gh api "repos/$REPO/branches/$BRANCH/protection" \
  --method PUT \
  --input - <<EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["gate (18)", "gate (20)"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "allow_auto_merge": true
}
EOF

if [ $? -eq 0 ]; then
  echo "✅ Branch protection configured successfully!"
  echo ""
  echo "Summary:"
  echo "  ✓ Required checks: gate (18), gate (20)"
  echo "  ✓ Requires 1 approval"
  echo "  ✓ Auto-merge enabled"
  echo "  ✓ Force push disabled"
  echo "  ✓ Deletion disabled"
  echo ""
  echo "Next steps:"
  echo "  1. Enable 'Automatically delete head branches' in repo settings"
  echo "  2. Create a feature branch and push a PR"
  echo "  3. CI will run and auto-merge when approved"
else
  echo "❌ Failed to configure branch protection"
  echo "Make sure you have GitHub CLI installed and authenticated:"
  echo "  gh auth login"
  exit 1
fi
