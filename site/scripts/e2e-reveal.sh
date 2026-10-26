#!/bin/bash
# 后台「小眼睛」取明文 + 折叠块 自检（起服务 → 断言 → 收工，一次跑完）
set -u
cd "$(dirname "$0")/.." || exit 1

PORT=3081
D=/tmp/zhs-e2e-reveal
LOG=/tmp/zhs-e2e-reveal.log
JAR=/tmp/zhs-e2e-reveal-cookie.txt
PASS=0; FAIL=0

ok()  { PASS=$((PASS+1)); echo "  ✓ $1"; }
bad() { FAIL=$((FAIL+1)); echo "  ✗ $1"; }
chk() { if [ "$2" = "$3" ]; then ok "$1 ($2)"; else bad "$1: 期望 [$3] 实际 [$2]"; fi; }

rm -rf "$D" "$JAR"; mkdir -p "$D"

echo "── 启动副本服务 (DATA_DIR=$D PORT=$PORT)"
unset NODE_OPTIONS
DATA_DIR="$D" PORT=$PORT ADMIN_INIT_PASSWORD='e2e-pass-1505' node .next/standalone/server.js > "$LOG" 2>&1 &
SRV=$!
trap 'kill $SRV 2>/dev/null' EXIT

BASE="http://127.0.0.1:$PORT"
code=000
for i in $(seq 1 60); do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/admin/login")
  [ "$code" = "200" ] && break
  sleep 0.5
done
echo "  服务就绪 HTTP $code"

echo "── 1. 未登录不能取明文"
c=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/api/admin/settings/reveal" \
  -H 'Content-Type: application/json' -d '{"field":"google_client_secret"}')
chk "未登录被拦" "$c" "401"

curl -s -o /dev/null -c "$JAR" -X POST "$BASE/api/admin/login" \
  -H 'Content-Type: application/json' \
  -d '{"username":"ZHSM001","password":"e2e-pass-1505"}'

echo "── 2. 白名单外字段必须拒绝"
c=$(curl -s -o /dev/null -w '%{http_code}' -b "$JAR" -X POST "$BASE/api/admin/settings/reveal" \
  -H 'Content-Type: application/json' -d '{"field":"user_jwt_secret"}')
chk "任意 settings key 被拒" "$c" "400"

echo "── 3. 未保存过的密钥返回空"
v=$(curl -s -b "$JAR" -X POST "$BASE/api/admin/settings/reveal" -H 'Content-Type: application/json' \
  -d '{"field":"resend_api_key"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('configured'), repr(d.get('value')))")
chk "未配置时 configured=False" "$v" "False ''"

echo "── 4. 存进去的密钥能被取回（Google）"
curl -s -b "$JAR" -X POST "$BASE/api/admin/settings" -H 'Content-Type: application/json' \
  -d '{"provider":"google","clientId":"probe.apps.googleusercontent.com","clientSecret":"GOCSPX-e2e-secret-9876"}' > /dev/null
got=$(curl -s -b "$JAR" -X POST "$BASE/api/admin/settings/reveal" -H 'Content-Type: application/json' \
  -d '{"field":"google_client_secret"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('value'), d.get('source'))")
chk "取回完整明文" "$got" "GOCSPX-e2e-secret-9876 db"

echo "── 5. PayPal / Resend / Webhook 三处同样可取"
curl -s -b "$JAR" -X POST "$BASE/api/admin/settings" -H 'Content-Type: application/json' \
  -d '{"provider":"paypal","clientId":"paypal-id","clientSecret":"EPAYPAL-secret-1111","paypalEnv":"sandbox"}' > /dev/null
curl -s -b "$JAR" -X POST "$BASE/api/admin/mail" -H 'Content-Type: application/json' \
  -d '{"resendKey":"re_e2e_key_2222","webhookSecret":"whsec_e2e_3333"}' > /dev/null
for f in paypal_client_secret resend_api_key resend_webhook_secret; do
  val=$(curl -s -b "$JAR" -X POST "$BASE/api/admin/settings/reveal" -H 'Content-Type: application/json' \
    -d "{\"field\":\"$f\"}" | python3 -c "import sys,json; print(json.load(sys.stdin).get('value',''))")
  [ -n "$val" ] && ok "$f → ${val:0:14}…" || bad "$f 取不到明文"
done

echo "── 6. 页面本身不含明文密钥（只在点眼睛时才取）"
curl -s -b "$JAR" "$BASE/admin/settings" > /tmp/zhs-settings.html
for s in "GOCSPX-e2e-secret-9876" "EPAYPAL-secret-1111" "re_e2e_key_2222" "whsec_e2e_3333"; do
  grep -q "$s" /tmp/zhs-settings.html && bad "页面 HTML 泄露了 $s" || ok "页面不含 ${s:0:10}…"
done

echo "── 7. 折叠块与眼睛都在"
n_fold=$(grep -o 'adm-fold-head' /tmp/zhs-settings.html | wc -l | tr -d ' ')
[ "$n_fold" -ge 5 ] && ok "设置页有 $n_fold 个折叠块" || bad "折叠块只有 $n_fold 个"
n_eye=$(grep -o '显示明文' /tmp/zhs-settings.html | wc -l | tr -d ' ')
[ "$n_eye" -ge 4 ] && ok "设置页有 $n_eye 个小眼睛" || bad "小眼睛只有 $n_eye 个"
grep -q '怎么拿到这些凭据' /tmp/zhs-settings.html && ok "凭据获取说明存在（已折叠）" || bad "凭据说明丢了"
grep -q 'DNSPod 需要加的记录' /tmp/zhs-settings.html && ok "DNS 清单存在（已折叠）" || bad "DNS 清单丢了"

echo "── 8. 每次取明文都写审计日志（谁在什么时候看过）"
n=$(strings "$D/zhs.db" 2>/dev/null | grep -c 'settings.reveal' || true)
[ "${n:-0}" -ge 4 ] && ok "审计表里有 $n 条 reveal 记录" || bad "审计记录只有 ${n:-0} 条"

echo
echo "════ 通过 $PASS / 失败 $FAIL ════"
[ "$FAIL" -eq 0 ]
