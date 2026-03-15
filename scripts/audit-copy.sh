#!/bin/bash
# Audit for hardcoded user-facing strings in components.
# Run after any session that touches UI components.

echo "Checking features/ for hardcoded copy..."
HITS=$(grep -rn --include="*.tsx" --include="*.ts" \
  -E '(["'"'"'])[A-Z][A-Z .*]{2,}\1' features/ \
  | grep -v 'copy/' | grep -v '__tests__/' | grep -v '.test.' | grep -v 'import ' \
  | grep -v '/data/' | grep -v ' \* ' | grep -v 'Intl\.' | grep -v 'toLocaleString')

if [ -z "$HITS" ]; then
  echo "✅ No hardcoded copy found in features/."
else
  echo "⚠️  Possible hardcoded copy in features/:"
  echo "$HITS"
fi

echo ""
echo "Checking extension/popup/ for hardcoded copy..."
EXT_HITS=$(grep -rn --include="*.ts" --include="*.html" \
  -E '(["'"'"'])[A-Z][A-Z .*]{2,}\1' extension/popup/ \
  | grep -v 'copy.ts' | grep -v '__tests__/')

if [ -z "$EXT_HITS" ]; then
  echo "✅ No hardcoded copy found in extension/."
else
  echo "⚠️  Possible hardcoded copy in extension/:"
  echo "$EXT_HITS"
fi

if [ -n "$HITS" ] || [ -n "$EXT_HITS" ]; then
  echo ""
  echo "Extract any hits to the appropriate copy file before committing."
  exit 1
fi

echo ""
echo "✅ All clear."
