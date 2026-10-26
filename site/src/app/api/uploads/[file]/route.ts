import fs from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * 读取后台上传的图片（公开可访问，商品图本来就要给买家看）
 *
 * 路径白名单：只允许 .data/uploads 下、形如 xxxx.jpg 的文件名，
 * 杜绝 ../../ 穿越到数据库或其他目录。
 */

const MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
};

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;

  if (!/^[a-z0-9-]+\.(jpg|jpeg|png|webp|avif|gif)$/i.test(file)) {
    return new NextResponse('Not found', { status: 404 });
  }

  const dir = path.join(process.env.DATA_DIR ?? path.join(process.cwd(), '.data'), 'uploads');
  const full = path.join(dir, file);
  // 双保险：文件名已用白名单正则校验过（不含 / 和 .），这里再确认落点仍在 uploads 内
  if (!full.startsWith(dir + path.sep)) return new NextResponse('Not found', { status: 404 });
  if (!fs.existsSync(full)) return new NextResponse('Not found', { status: 404 });

  const ext = file.split('.').pop()!.toLowerCase();
  const body = fs.readFileSync(full);
  return new NextResponse(new Uint8Array(body), {
    status: 200,
    headers: {
      'Content-Type': MIME[ext] ?? 'application/octet-stream',
      // 文件名带随机串，内容不会变 —— 可以长缓存
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
