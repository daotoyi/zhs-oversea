#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════
# 版本号递增 —— 每次修改执行一次
#
# 约定：默认迭代第三位（patch）：0.0.1 → 0.0.2 → 0.0.3 …
#
# 用法：
#   npm run version:bump            # 第三位 +1（默认），本地 commit + tag
#   npm run version:push            # 同上，并推送 GitHub（commit + tag）
#   bash scripts/bump-version.sh minor   # 第二位 +1（功能较多时用）
#   bash scripts/bump-version.sh major   # 第一位 +1（大版本时用）
#
# 做的事：
#   1. site/package.json version 递增
#   2. git commit（chore: bump version X → Y）
#   3. git tag vY
#   4. （--push 时）推送 main 与 tag 到 GitHub
# ══════════════════════════════════════════════════════════════════
set -euo pipefail

SITE="$(cd "$(dirname "$0")/.." && pwd)"   # .../zhs-oversea/site
REPO="$(cd "$SITE/.." && pwd)"             # .../zhs-oversea
PKG="$SITE/package.json"

PART="patch"   # 默认：第三位
PUSH=0
for arg in "$@"; do
  case "$arg" in
    --push) PUSH=1 ;;
    major|minor|patch) PART="$arg" ;;
    *) echo "未知参数: $arg（可用：patch|minor|major|--push）" >&2; exit 1 ;;
  esac
done

OLD="$(node -p "require('$PKG').version")"

NEW="$(node -e "
const p = require('$PKG');
const [maj, min, pat] = p.version.split('.').map(Number);
const part = '$PART';
if (part === 'major') console.log([maj + 1, 0, 0].join('.'));
else if (part === 'minor') console.log([maj, min + 1, 0].join('.'));
else console.log([maj, min, pat + 1].join('.'));
")"

# 写回 package.json（保持 2 空格缩进 + 末尾换行）
node -e "
const fs = require('fs');
const p = '$PKG';
const d = JSON.parse(fs.readFileSync(p, 'utf8'));
d.version = '$NEW';
fs.writeFileSync(p, JSON.stringify(d, null, 2) + '\n');
"

echo "版本号: $OLD → $NEW（$PART）"

cd "$REPO"
git add "$PKG"
git commit -q -m "chore: bump version $OLD → $NEW"
git tag -a "v$NEW" -m "v$NEW"
echo "✓ 本地已提交并打 tag v$NEW"

if [ "$PUSH" = "1" ]; then
  # 沙箱代理会干扰 git POST，必须清掉
  unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy 2>/dev/null || true
  GIT_TERMINAL_PROMPT=0 git push origin main
  GIT_TERMINAL_PROMPT=0 git push origin "v$NEW"
  echo "✓ 已推送 GitHub（main + v$NEW）"
else
  echo "  推送 GitHub：npm run version:push（或 bash scripts/bump-version.sh --push）"
fi
