#!/bin/bash
# Sync EdBrio code to Nishi-Taiga/knowledge-base projects/edbrio/
set -e

REPO_URL="https://github.com/Nishi-Taiga/knowledge-base.git"
TMP_DIR="/c/tmp/kb-sync-$$"
TARGET="projects/edbrio"

echo "📦 Syncing EdBrio to knowledge-base..."

# Get commit message from latest EdBrio commit
COMMIT_MSG=$(git log -1 --pretty=format:"%s")

# Clone knowledge-base (shallow)
git clone --depth 1 "$REPO_URL" "$TMP_DIR" 2>/dev/null
echo "✓ Cloned knowledge-base"

# Clear target and export current code
rm -rf "$TMP_DIR/$TARGET"/*
git archive HEAD | tar -x -C "$TMP_DIR/$TARGET/"
echo "✓ Exported code to $TARGET/"

# Commit and push
cd "$TMP_DIR"
git add "$TARGET/"
if git diff --cached --quiet; then
  echo "✓ No changes to push"
else
  git commit -m "$COMMIT_MSG

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
  git push
  echo "✓ Pushed to knowledge-base"
fi

# Cleanup
cd -
rm -rf "$TMP_DIR"
echo "✅ Done"
