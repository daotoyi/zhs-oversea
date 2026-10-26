#!/bin/bash
# 后台上传图片 + 商品图回读 端到端自检（起服务 → 断言 → 收工，一次跑完）
set -u
cd "$(dirname "$0")/.." || exit 1

PORT=3078
D=/tmp/zhs-e2e-upload
LOG=/tmp/zhs-e2e-upload.log
JAR=/tmp/zhs-e2e-upload-cookie.txt
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

echo "── 1. 未登录不能上传"
c=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/api/admin/uploads" -F "file=@/tmp/zhs-tiny.png")
[ "$c" = "401" ] || [ "$c" = "403" ] || [ "$c" = "307" ] && ok "未登录被拦 ($c)" || bad "未登录竟然能传: $c"

echo "── 2. 登录后上传 PNG"
curl -s -o /dev/null -c "$JAR" -X POST "$BASE/api/admin/login" \
  -H 'Content-Type: application/json' \
  -d '{"username":"ZHSM001","password":"e2e-pass-1505"}'
resp=$(curl -s -b "$JAR" -X POST "$BASE/api/admin/uploads" -F "file=@/tmp/zhs-tiny.png")
url=$(echo "$resp" | python3 -c "import sys,json; print(json.load(sys.stdin).get('urls',[''])[0])" 2>/dev/null)
[ -n "$url" ] && ok "上传成功 → $url" || bad "上传失败: $resp"

echo "── 3. 回读图片（前台要能看到）"
ct=$(curl -s -o /tmp/zhs-got.png -w '%{content_type}' "$BASE$url")
chk "Content-Type" "$ct" "image/png"
size=$(wc -c < /tmp/zhs-got.png | tr -d ' ')
[ "$size" -gt 50 ] && ok "图片大小 $size 字节" || bad "图片内容异常 ($size 字节)"

echo "── 4. 路径穿越必须 404"
for p in "/api/uploads/..%2f..%2fzhs.db" "/api/uploads/zhs.db" "/api/uploads/x.png"; do
  c=$(curl -s -o /dev/null -w '%{http_code}' "$BASE$p")
  chk "拒绝 $p" "$c" "404"
done

echo "── 5. 非图片拒绝"
printf 'hello' > /tmp/zhs-not-image.txt
c=$(curl -s -o /tmp/zhs-reject.json -w '%{http_code}' -b "$JAR" -X POST "$BASE/api/admin/uploads" -F "file=@/tmp/zhs-not-image.txt;type=text/plain")
chk "text/plain 被拒" "$c" "415"

echo "── 6. 商品保存落库带新图"
curl -s -b "$JAR" -X POST "$BASE/api/admin/products" -H 'Content-Type: application/json' \
  -d "{\"slug\":\"e2e-upload-probe\",\"title\":\"E2E Upload Probe\",\"category\":\"tea-ware\",\"price_usd\":1200,\"images\":[\"$url\"],\"status\":\"draft\",\"stock\":1}" > /dev/null
got=$(curl -s -b "$JAR" "$BASE/api/admin/products" | python3 -c "
import sys,json
d=json.load(sys.stdin)
p=[x for x in d['products'] if x['slug']=='e2e-upload-probe']
print(p[0]['images'] if p else 'missing')")
echo "$got" | grep -q "$url" && ok "商品 images 字段已存上传路径" || bad "商品图片未落库: $got"

echo "── 7. 上传文件落在 DATA_DIR（发版可保留）"
n=$(ls "$D/uploads" 2>/dev/null | wc -l | tr -d ' ')
[ "$n" -ge 1 ] && ok "DATA_DIR/uploads 有 $n 个文件" || bad "上传物没落在 DATA_DIR"

echo
echo "════ 通过 $PASS / 失败 $FAIL ════"
[ "$FAIL" -eq 0 ]
