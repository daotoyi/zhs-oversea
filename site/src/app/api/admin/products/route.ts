import { requireStaff, json, bad } from '@/lib/admin/guard';
import { initDb, persistSoon, uid } from '@/lib/db/loader';
import { listProducts, saveProduct, setProductStatus, deleteProduct } from '@/lib/admin/dao';
import { audit } from '@/lib/admin/dao';

export async function GET() {
  const auth = await requireStaff('products');
  if (!auth.ok) return auth.res;
  await initDb();
  return json({ products: listProducts(true) });
}

export async function POST(req: Request) {
  const auth = await requireStaff('products');
  if (!auth.ok) return auth.res;
  await initDb();
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad('请求格式错误');
  }
  const title = String(body.title ?? '').trim();
  const category = String(body.category ?? '').trim();
  const price = Number(body.price_usd ?? 0);
  if (!title || !category || !price) return bad('标题、分类、价格为必填');

  const product = saveProduct({
    slug: body.slug ? String(body.slug) : undefined,
    title,
    title_zh: body.title_zh ? String(body.title_zh) : undefined,
    tagline: body.tagline ? String(body.tagline) : undefined,
    description: body.description ? String(body.description) : undefined,
    category,
    price_usd: price,
    compare_at_usd: body.compare_at_usd ? Number(body.compare_at_usd) : null,
    images: Array.isArray(body.images) ? body.images.map(String) : [],
    status: String(body.status ?? 'draft'),
    stock: Number(body.stock ?? 0),
    sort_order: Number(body.sort_order ?? 0),
    meta: (body.meta as Record<string, unknown>) ?? {},
  });
  persistSoon();
  audit(auth.staff, body.slug ? 'product.update' : 'product.create', product.slug, `title=${title}`);
  return json({ product });
}

export async function PATCH(req: Request) {
  const auth = await requireStaff('products');
  if (!auth.ok) return auth.res;
  await initDb();
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad('请求格式错误');
  }
  const slug = String(body.slug ?? '');
  if (!slug) return bad('缺少 slug');
  if (body.action === 'delete') {
    deleteProduct(slug);
    persistSoon();
    audit(auth.staff, 'product.delete', slug);
    return json({ ok: true });
  }
  const status = String(body.status ?? '');
  if (!['active', 'draft', 'archived'].includes(status)) return bad('非法状态');
  setProductStatus(slug, status as 'active' | 'draft' | 'archived');
  persistSoon();
  audit(auth.staff, 'product.status', slug, `status=${status}`);
  return json({ ok: true });
}
