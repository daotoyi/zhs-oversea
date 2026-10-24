#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════
# 推送 GitHub —— 带「失败本地记账、下次迭代自动补推」
#
# 约定（昊辰 2026-10-24）：每次更新完都要推送。如果当时网络不通，
# 不阻塞本地工作，把待推记录写进 .workbuddy/pending-push.md，
# 下一次执行任何推送/发版时先补推，成功后清账。
#
# 用法：
#   bash scripts/push.sh              # 补推历史欠账 + 推送当前 main 与 tag
#   bash scripts/push.sh --status     # 只看欠账，不推送
#   bash scripts/push.sh --clear      # 手工清账（确认远端已一致后用）
#
# 退出码：0 = 已同步（含补推成功）；1 = 网络/认证失败，已记录待推
# ══════════════════════════════════════════════════════════════════
set -uo pipefail

SITE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO="$(cd "$SITE/.." && pwd)"
PENDING="$REPO/.workbuddy/pending-push.md"
LOG="$REPO/.workbuddy/push-history.log"

cd "$REPO" || exit 1

# 沙箱代理会干扰 git 的 HTTPS POST，必须清掉
unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy ALL_PROXY all_proxy 2>/dev/null || true
export GIT_TERMINAL_PROMPT=0

MODE="${1:-push}"

pending_count() {
  [ -f "$PENDING" ] || { echo 0; return; }
  grep -c '^- ' "$PENDING" 2>/dev/null || echo 0
}

show_pending() {
  local n
  n="$(pending_count)"
  if [ "$n" -gt 0 ]; then
    # 变量必须用 ${} 包起来：紧邻全角括号时 bash 会把括号当成变量名的一部分
    echo "⚠ 有 ${n} 条待推送记录（${PENDING}）："
    grep '^- ' "$PENDING" | tail -5 | sed 's/^/    /'
  fi
}

record_pending() {
  local reason="$1"
  local head tags
  head="$(git rev-parse --short HEAD 2>/dev/null || echo '?')"
  tags="$(git tag --points-at HEAD 2>/dev/null | tr '\n' ' ')"
  mkdir -p "$(dirname "$PENDING")"
  if [ ! -f "$PENDING" ]; then
    {
      echo "# 待推送记录"
      echo
      echo "> 推送失败时自动登记。下次执行 \`bash scripts/push.sh\` 会先补推，成功后自动清空本文件。"
      echo
    } > "$PENDING"
  fi
  printf -- '- %s | HEAD=%s | tags=%s | 原因: %s\n' \
    "$(date '+%Y-%m-%d %H:%M')" "$head" "${tags:-无}" "$reason" >> "$PENDING"
  printf '%s\tFAIL\t%s\t%s\t%s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$head" "${tags:-none}" "$reason" >> "$LOG"
  echo "   已登记待推送：HEAD=$head"
}

clear_pending() {
  if [ -f "$PENDING" ]; then
    rm -f "$PENDING"
    echo "   ✓ 待推记录已清空"
  fi
}

case "$MODE" in
  --status)
    if [ "$(pending_count)" -eq 0 ]; then
      echo "✓ 无待推送记录"
    else
      show_pending
    fi
    exit 0
    ;;
  --clear)
    clear_pending
    exit 0
    ;;
esac

echo "── 推送 zhenhesheng.com → GitHub ────────────────"

if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  echo "   提示：工作区有未提交改动（不影响推送已提交内容）"
fi

TAG_LIST="$(git tag --list --sort=-v:refname)"
LATEST_TAG="$(echo "$TAG_LIST" | head -1)"

echo "→ 推送 main"
if ! PUSH_OUT="$(git push origin main 2>&1)"; then
  echo "$PUSH_OUT" | tail -6 | sed 's/^/    /'
  record_pending "main 推送失败：$(echo "$PUSH_OUT" | tail -1)"
  echo
  echo "✗ 推送未完成 —— 已在本地记账，下次迭代会自动补推"
  exit 1
fi
# 注意：用 [[:space:]] 而非 \s —— macOS 自带 BSD grep 不认 \s
if echo "$PUSH_OUT" | grep -qE '[[:space:]][0-9a-f]+\.\.[0-9a-f]+'; then
  echo "$PUSH_OUT" | grep -E '[0-9a-f]+\.\.[0-9a-f]+' | sed 's/^/    /'
else
  echo "    (已是最新，无需推送)"
fi

if [ -n "$LATEST_TAG" ]; then
  echo "→ 推送最新 tag $LATEST_TAG"
  # tag 可能被 git tag -f 移动过（bump 脚本的既定用法），需要 --force 覆盖远端
  if ! TAG_OUT="$(git push origin "$LATEST_TAG" --force 2>&1)"; then
    echo "$TAG_OUT" | tail -6 | sed 's/^/    /'
    record_pending "tag $LATEST_TAG 推送失败：$(echo "$TAG_OUT" | tail -1)"
    echo
    echo "✗ tag 推送未完成 —— 已在本地记账，下次迭代会自动补推"
    exit 1
  fi
  echo "$TAG_OUT" | grep -E 'new tag|forced update|up-to-date' | sed 's/^/    /' || true
fi
# 其余本地 tag 也顺手补齐（历史欠账 / 新打的非最新 tag）
OTHERS="$(echo "$TAG_LIST" | tail -n +2)"
if [ -n "$OTHERS" ]; then
  while IFS= read -r t; do
    [ -z "$t" ] && continue
    git push origin "$t" >/dev/null 2>&1 || true
  done <<< "$OTHERS"
fi

clear_pending
printf '%s\tOK\t%s\t%s\t\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$(git rev-parse --short HEAD)" "${LATEST_TAG:-none}" >> "$LOG"
echo
echo "✓ 已同步 GitHub（main${LATEST_TAG:+ + $LATEST_TAG}）"
exit 0
