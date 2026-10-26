#!/bin/bash
# 优惠券链路端到端自检（一次性跑完：起服务 → 断言 → 收工）
# 铁律：后台进程会在工具调用之间被回收，所以必须在同一个脚本里跑完。
set -u
cd "$(dirname "$0")/.." || exit 1

PORT=3077
D=/tmp/zhs-e2e-coupon
LOG=/tmp/zhs-e2e-coupon.log
JAR=/tmp/zhs-e2e-cookie.txt
PASS=0; FAIL=0

ok()   { PASS=$((PASS+1)); echo "  ✓ $1"; }
bad()  { FAIL=$((FAIL+1)); echo "  ✗ $1"; }
chk()  { if [ "$2" = "$3" ]; then ok "$1 ($2)"; else bad "$1: 期望 [$3] 实际 [$2]"; fi; }

rm -rf "$D" "$JAR"; mkdir -p "$D"

echo "── 启动副本服务 (DATA_DIR=$D PORT=$PORT)"
unset NODE_OPTIONS
DATA_DIR="$D" PORT=$PORT ENABLE_DIAG=1 ADMIN_INIT_PASSWORD='e2e-pass-1505' node .next/standalone/server.js > "$LOG" 2>&1 &
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

echo "── 1. 后台登录（JSON 与表单两种格式都要能过）"
c1=$(curl -s -o /dev/null -w '%{http_code}' -c "$JAR" -X POST "$BASE/api/admin/login" \
  -H 'Content-Type: application/json' \
  -d '{"username":"ZHSM001","password":"e2e-pass-1505"}')
[ "$c1" = "307" ] || [ "$c1" = "303" ] && ok "JSON 登录 ($c1)" || bad "JSON 登录: $c1"

c2=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/api/admin/login" \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'username=ZHSM001&password=e2e-pass-1505')
[ "$c2" = "307" ] || [ "$c2" = "303" ] && ok "表单登录 ($c2)" || bad "表单登录: $c2"

echo "── 2. 新增优惠券（领取模式 auto）"
curl -s -b "$JAR" -X POST "$BASE/api/admin/coupons" -H 'Content-Type: application/json' \
  -d '{"code":"E2EPCT15","type":"percent","value":15,"min_subtotal":0,"max_uses":100,"per_customer_limit":1,"status":"active","acquisition_mode":"auto"}' > /dev/null
mode=$(curl -s -b "$JAR" "$BASE/api/admin/coupons" | python3 -c "
import sys,json
d=json.load(sys.stdin)
c=[x for x in d['coupons'] if x['code']=='E2EPCT15']
print(f\"{c[0]['acquisition_mode']} {c[0]['value']} {c[0].get('claim_count')}\") if c else print('missing')")
chk "领取模式落库" "$mode" "auto 15 0"

echo "── 3. 编辑保存要真生效（原「保存不生效」缺陷）"
curl -s -b "$JAR" -X POST "$BASE/api/admin/coupons" -H 'Content-Type: application/json' \
  -d '{"code":"E2EPCT15","type":"percent","value":25,"min_subtotal":5000,"max_uses":50,"per_customer_limit":2,"status":"active","acquisition_mode":"auto"}' > /dev/null
after=$(curl -s -b "$JAR" "$BASE/api/admin/coupons" | python3 -c "
import sys,json
d=json.load(sys.stdin)
c=[x for x in d['coupons'] if x['code']=='E2EPCT15']
print(f\"{c[0]['value']}/{c[0]['min_subtotal']}/{c[0]['max_uses']}/{c[0]['per_customer_limit']}\") if c else print('missing')")
chk "编辑后数值" "$after" "25/5000/50/2"

echo "── 4. 免运费券（type=freeship）"
curl -s -b "$JAR" -X POST "$BASE/api/admin/coupons" -H 'Content-Type: application/json' \
  -d '{"code":"E2EFREESHIP","type":"freeship","value":0,"min_subtotal":0,"max_uses":0,"per_customer_limit":1,"status":"active","acquisition_mode":"auto"}' > /dev/null
fs=$(curl -s -b "$JAR" "$BASE/api/admin/coupons" | python3 -c "
import sys,json
d=json.load(sys.stdin)
c=[x for x in d['coupons'] if x['code']=='E2EFREESHIP']
print(c[0]['type']) if c else print('missing')")
chk "免运费券类型" "$fs" "freeship"

echo "── 5. 试算：免运费券不动商品金额，只标记 freeship"
v=$(curl -s -X POST "$BASE/api/coupon/validate" -H 'Content-Type: application/json' \
  -d '{"items":[{"slug":"zhi-xu-ji-ye","variantId":"standard","quantity":1}],"couponCode":"E2EFREESHIP"}')
echo "    $v"
echo "$v" | python3 -c "
import sys,json
d=json.load(sys.stdin)
assert d['valid'] is True, d
assert d['freeship'] is True, d
assert d['couponDiscountUsd'] == 0, d
" > /dev/null 2>&1 && ok "freeship 标记正确、商品零减免" || bad "freeship 试算异常"

echo "── 6. 结账核心：运费 1200 → 0，总额只差运费"
diag() { # $1 = coupon（可空）；带重试，standalone 首次加载路由偶尔会回 HTML 404
  local body out
  if [ -n "${1:-}" ]; then
    body="{\"items\":[{\"slug\":\"zhi-xu-ji-ye\",\"variantId\":\"standard\",\"quantity\":1}],\"couponCode\":\"$1\"}"
  else
    body='{"items":[{"slug":"zhi-xu-ji-ye","variantId":"standard","quantity":1}]}'
  fi
  for try in 1 2 3; do
    out=$(curl -s -X POST "$BASE/api/diag/cart" -H 'Content-Type: application/json' -d "$body")
    case "$out" in \{*) printf '%s' "$out"; return 0;; esac
    sleep 1
  done
  printf '%s' "$out"
}
base=$(diag "")
waived=$(diag "E2EFREESHIP")
echo "    无券: $base"
echo "    带券: $waived"
both=$(python3 - "$base" "$waived" <<'PY'
import sys, json
try:
    b, w = json.loads(sys.argv[1]), json.loads(sys.argv[2])
except Exception:
    print("parse-fail"); raise SystemExit
print(f"{b['shippingUsd']}->{w['shippingUsd']} ship:{w['shippingFree']} sub:{b['subtotalUsd']}->{w['subtotalUsd']} total:{b['totalUsd']}->{w['totalUsd']}")
PY
)
chk "运费归零、商品不动" "$both" "1200->0 ship:True sub:400->400 total:1600->400"

pct=$(diag "E2EPCT15")
echo "    百分比券(门槛\$50,小计\$4): $pct"
echo "$pct" | grep -q '"error"' && ok "未达门槛被拒" || bad "未达门槛竟然通过"

echo "── 7. 领券页（公开领取链接）"
c=$(curl -s -o /tmp/zhs-claim.html -w '%{http_code}' "$BASE/coupon/claim?code=E2EPCT15")
chk "领券页 200" "$c" "200"
# 注意：券码会出现在 RSC payload 里，不能用「页面上有没有券码」判断分支，
# 只能找只在该分支渲染的文案。
grep -q "Apply the code at checkout" /tmp/zhs-claim.html && ok "可领取分支（成功态）" || bad "可领取券未进成功分支"

curl -s -o /tmp/zhs-claim-bad.html "$BASE/coupon/claim?code=NOSUCHCODE"
grep -q "This link is not valid" /tmp/zhs-claim-bad.html && ok "无效券走错误分支" || bad "无效券未走错误分支"

# 短链 /coupon/CODE → /coupon/claim?code=CODE
c=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/coupon/E2EPCT15")
[ "$c" = "307" ] || [ "$c" = "308" ] && ok "短链跳转 ($c)" || bad "短链跳转: $c"

echo "── 8. 手动发放的券不能公开领取"
curl -s -b "$JAR" -X POST "$BASE/api/admin/coupons" -H 'Content-Type: application/json' \
  -d '{"code":"E2EMANUAL","type":"percent","value":10,"min_subtotal":0,"max_uses":0,"per_customer_limit":0,"status":"active","acquisition_mode":"manual"}' > /dev/null
curl -s -o /tmp/zhs-claim-manual.html "$BASE/coupon/claim?code=E2EMANUAL"
grep -q "not open for public claim" /tmp/zhs-claim-manual.html && ok "手动券拒绝公开领取" || bad "手动券可被公开领取"

echo "── 9. 删除"
curl -s -b "$JAR" -X POST "$BASE/api/admin/coupons" -H 'Content-Type: application/json' \
  -d '{"code":"E2EMANUAL","action":"delete"}' > /dev/null
still=$(curl -s -b "$JAR" "$BASE/api/admin/coupons" | grep -c 'E2EMANUAL')
chk "删除后不再出现" "$still" "0"

echo "── 10. 落盘：杀掉进程后重启重读"
kill $SRV 2>/dev/null; wait $SRV 2>/dev/null
DATA_DIR="$D" PORT=$PORT ADMIN_INIT_PASSWORD='e2e-pass-1505' node .next/standalone/server.js > "$LOG.2" 2>&1 &
SRV=$!
for i in $(seq 1 60); do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/admin/login")
  [ "$code" = "200" ] && break
  sleep 0.5
done
curl -s -b "$JAR" -X POST "$BASE/api/admin/login" -H 'Content-Type: application/json' \
  -d '{"username":"ZHSM001","password":"e2e-pass-1505"}' -o /dev/null -c "$JAR"
persist=$(curl -s -b "$JAR" "$BASE/api/admin/coupons" | grep -c 'E2EFREESHIP')
chk "重启后券仍在（已落盘）" "$persist" "1"

kill $SRV 2>/dev/null; wait $SRV 2>/dev/null
echo
echo "════ 通过 $PASS / 失败 $FAIL ════"
[ "$FAIL" = "0" ] || { echo "服务日志尾部："; tail -20 "$LOG"; exit 1; }
