import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { requireStaff } from '@/lib/admin/guard';

export const runtime = 'nodejs';

/**
 * 后台上传商品图片
 *
 * 存到 <DATA_DIR>/uploads（即 .data/uploads），由 /api/uploads/<file> 回读。
 * 不写 public/：部署脚本每次整包覆盖 public，图片会全丢；
 * .data 会被deploy保留，才是能长期存东西的地方。
 */

const MAX_BYTES = 8 * 1024 * 1024; // 8MB：商品图足够，再大浪费带宽

const ALLOWED: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
};

export async function POST(req: Request) {
  const auth = await requireStaff('products');
  if (!auth.ok) return auth.res;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: '请求格式错误（需 multipart/form-data）' }, { status: 400 });
  }

  const files = form.getAll('file').filter((f): f is File => f instanceof File);
  if (files.length === 0) return NextResponse.json({ error: '没有收到文件' }, { status: 400 });

  const dir = path.join(process.env.DATA_DIR ?? path.join(process.cwd(), '.data'), 'uploads');
  fs.mkdirSync(dir, { recursive: true });

  const urls: string[] = [];
  for (const file of files) {
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `${file.name} 超过 8MB，请先压缩再上传` },
        { status: 413 }
      );
    }
    const ext = ALLOWED[file.type];
    if (!ext) {
      return NextResponse.json(
        { error: `${file.name} 格式不支持（仅 JPG / PNG / WebP / AVIF / GIF）` },
        { status: 415 }
      );
    }
    const name = `${Date.now().toString(36)}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(path.join(dir, name), buf);
    urls.push(`/api/uploads/${name}`);
  }

  return NextResponse.json({ urls });
}
