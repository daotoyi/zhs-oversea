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
PUSH=1         # 默认推送（约定：每次更新完都推；失败则本地记账，下次补推）
for arg in "$@"; do
  case "$arg" in
    --push) PUSH=1 ;;
    --no-push) PUSH=0 ;;
    major|minor|patch) PART="$arg" ;;
    *) echo "未知参数: $arg（可用：patch|minor|major|--push|--no-push）" >&2; exit 1 ;;
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

echo "版本号: ${OLD} → ${NEW}（${PART}）"

cd "$REPO"
git add "$PKG"
git commit -q -m "chore: bump version ${OLD} → ${NEW}"
git tag -a "v${NEW}" -m "v${NEW}"
echo "✓ 本地已提交并打 tag v${NEW}"

if [ "$PUSH" = "1" ]; then
  # 统一走 push.sh：会先补推历史欠账，失败则登记到 .workbuddy/pending-push.md
  if bash "$SITE/scripts/push.sh"; then
    echo "✓ 已推送 GitHub（main + v${NEW}）"
  else
    echo "⚠ 推送失败 —— 已在本地记账，下次迭代（bump/deploy）会自动补推"
  fi
else
  echo "  本次跳过推送。手动推送：npm run push"
fi
