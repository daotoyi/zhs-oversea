#!/usr/bin/env bash
# 部署 zhenhesheng.com 到生产服务器
#
# 实测要点（踩过的坑，勿改）：
# 1. 必须在「有真实 node_modules」的项目目录构建。用符号链接的 node_modules 构建，
#    standalone/node_modules 会变成指向本机的符号链接，上传后报 Cannot find module 'next'。
# 2. 端口必须由 pm2 ecosystem 固化（PORT=5001）。行内 `PORT=5001 pm2 start` 不可靠。
# 3. nginx 已配置 proxy_pass http://127.0.0.1:5001，改端口需同步改 nginx。
#
# 用法：bash scripts/deploy.sh

set -euo pipefail

HOST="49.232.35.145"
USER="root"
APP_DIR="/www/wwwroot/zhenhesheng.com"
BACKUP_DIR="/www/backup"
PM2_NAME="zhenhesheng"
PORT="5001"

SITE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STAMP="$(date +%Y%m%d-%H%M%S)"
STAGE="/tmp/zhs-stage"
TARBALL="/tmp/zhs-site-${STAMP}.tar.gz"

echo "── 部署 zhenhesheng.com ─────────────────────"
echo "项目: $SITE"
echo "目标: $USER@$HOST:$APP_DIR (端口 $PORT)"
echo

[ -d "$SITE/node_modules" ] || { echo "✗ 缺少 node_modules，先 npm install"; exit 1; }
[ -L "$SITE/node_modules" ] && { echo "✗ node_modules 是符号链接，standalone 会坏，请用真实目录"; exit 1; }

echo "→ 构建"
cd "$SITE"
rm -rf .next
npm run build

echo "→ 组装产物"
rm -rf "$STAGE"; mkdir -p "$STAGE"
rsync -a "$SITE/.next/standalone/" "$STAGE/"
rm -rf "$STAGE/.next/static" && cp -R "$SITE/.next/static" "$STAGE/.next/static"
rm -rf "$STAGE/public" && cp -R "$SITE/public" "$STAGE/public"

if [ -f "$SITE/.env.production" ]; then
  cp "$SITE/.env.production" "$STAGE/.env.production"
else
  printf 'NEXT_PUBLIC_SITE_URL=https://zhenhesheng.com\nNODE_ENV=production\n' > "$STAGE/.env.production"
fi

# pm2 配置必须随包上传，否则重启会回落到默认 3000 端口
cp "$SITE/ecosystem.config.js" "$STAGE/ecosystem.config.js"

echo "→ 打包"
tar -czf "$TARBALL" -C "$STAGE" .
echo "   $(du -h "$TARBALL" | cut -f1)"

echo "→ 上传"
scp -o StrictHostKeyChecking=no "$TARBALL" "$USER@$HOST:/tmp/site.tar.gz"

echo "→ 备份线上版本"
ssh -o StrictHostKeyChecking=no "$USER@$HOST" \
  "mkdir -p $BACKUP_DIR; if [ -n \"\$(ls -A $APP_DIR 2>/dev/null)\" ]; then \
     tar -czf $BACKUP_DIR/zhenhesheng.com-$STAMP.tar.gz -C $APP_DIR . && \
     echo '   备份: '$BACKUP_DIR'/zhenhesheng.com-$STAMP.tar.gz'; \
   else echo '   线上为空，跳过备份'; fi"

echo "→ 解压并重启"
ssh -o StrictHostKeyChecking=no "$USER@$HOST" \
  "rm -rf $APP_DIR/* $APP_DIR/.[!.]* 2>/dev/null || true; \
   tar -xzf /tmp/site.tar.gz -C $APP_DIR; \
   chown -R www:www $APP_DIR; \
   cd $APP_DIR && pm2 delete $PM2_NAME >/dev/null 2>&1 || true; \
   pm2 start ecosystem.config.js && pm2 save"

# 关键：proxy.conf 里有全局 proxy_cache cache_one（inactive=1d）。
# 不清缓存的话，域名会继续返回上一版 HTML，导致「明明部署成功但页面没变」。
echo "→ 清除 nginx 代理缓存"
ssh -o StrictHostKeyChecking=no "$USER@$HOST" \
  "rm -rf /www/server/nginx/proxy_cache_dir/* 2>/dev/null; nginx -t >/dev/null 2>&1 && nginx -s reload && echo '   cache cleared + nginx reloaded'"

echo "→ 健康检查"
sleep 5
ssh -o StrictHostKeyChecking=no "$USER@$HOST" \
  "curl -s --noproxy '*' -o /dev/null -w '   本机 5001: HTTP %{http_code}\n' -m 10 http://127.0.0.1:$PORT/"
curl -s --noproxy '*' -o /dev/null -w "   域名 https: HTTP %{http_code}\n" -m 15 https://zhenhesheng.com/

echo
echo "✓ 部署完成 —— 保留最近备份于 $BACKUP_DIR"
