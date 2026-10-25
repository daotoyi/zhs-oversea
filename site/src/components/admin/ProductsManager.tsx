'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/admin/client';

type Prod = {
  slug: string;
  title: string;
  title_zh: string | null;
  tagline: string | null;
  description: string | null;
  category: string;
  collection: string | null;
  price_usd: number;
  compare_at_usd: number | null;
  images: string;
  status: string;
  stock: number;
};

// 与 shop 网址（CloudBase 真实分类）保持一致；同时必须与 lib/types.ts 的 ProductCategory
// 完全一致，否则存进去的品类前台筛选（/objects?category=...）匹配不到，商品会从对应分类消失。
const CATS = ['fortune-charms', 'heavenly-stems', 'three-harmonies', 'raw-wood', 'writing-desk', 'books'];
const CAT_LABELS: Record<string, string> = {
  'fortune-charms': '开运饰品',
  'heavenly-stems': '天干十义',
  'three-harmonies': '三合文创',
  'raw-wood': '原木文创',
  'writing-desk': '文房雅器',
  books: '典籍',
};
const STATUSES = ['active', 'draft', 'archived'];

function usd(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function ProductsManager({ initial, lang = 'en' }: { initial: Prod[]; lang?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Prod | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; m: string } | null>(null);

  function openEdit(p: Prod) {
    setEditing(p);
    setCreating(false);
    let imgs: string[] = [];
    try { imgs = JSON.parse(p.images || '[]'); } catch { imgs = []; }
    setForm({
      title: p.title, title_zh: p.title_zh ?? '', category: p.category,
      collection: p.collection ?? '',
      tagline: p.tagline ?? '', description: p.description ?? '',
      images: imgs.join('\n'),
      price: String(p.price_usd / 100), compare_at: p.compare_at_usd ? String(p.compare_at_usd / 100) : '',
      stock: String(p.stock), status: p.status,
    });
    setMsg(null);
  }
  function openCreate() {
    setCreating(true);
    setEditing(null);
    setForm({
      title: '', title_zh: '', category: 'fortune-charms', collection: '',
      tagline: '', description: '', images: '',
      price: '', compare_at: '', stock: '0', status: 'draft',
    });
    setMsg(null);
  }

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function save() {
    setMsg(null);
    const imageList = (form.images ?? '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      title_zh: form.title_zh.trim() || null,
      category: form.category,
      collection: form.collection?.trim() || null,
      tagline: form.tagline?.trim() || null,
      description: form.description?.trim() || null,
      images: imageList,
      price_usd: Math.round((Number(form.price) || 0) * 100),
      compare_at_usd: form.compare_at ? Math.round(Number(form.compare_at) * 100) : null,
      stock: Number(form.stock) || 0,
      status: form.status,
    };
    if (editing) payload.slug = editing.slug;
    try {
      await apiFetch('/api/admin/products', { method: 'POST', body: payload });
    } catch (e) {
      setMsg({ t: 'err', m: (e as Error).message });
      return;
    }
    setEditing(null); setCreating(false);
    setMsg({ t: 'ok', m: '已保存' });
    startTransition(() => router.refresh());
  }

  async function setStatus(p: Prod, status: string) {
    await apiFetch('/api/admin/products', { method: 'PATCH', body: { slug: p.slug, status } });
    startTransition(() => router.refresh());
  }

  async function remove(p: Prod) {
    if (!confirm(`确认删除商品「${p.title}」？`)) return;
    await apiFetch('/api/admin/products', { method: 'PATCH', body: { slug: p.slug, action: 'delete' } });
    startTransition(() => router.refresh());
  }

  // 与全站语言（NEXT_LOCALE）同步：中文 locales 优先显示中文标题，缺中文回退英文
  const showZh = lang === 'zh-Hans' || lang === 'zh-Hant';

  function displayTitle(p: Prod): { main: string; sub: string } {
    if (showZh) {
      if (p.title_zh) return { main: p.title_zh, sub: p.title };
      return { main: p.title, sub: p.slug };
    }
    return { main: p.title, sub: p.slug };
  }

  const showForm = editing || creating;

  // 已有的合集名 —— 供弹窗输入框做下拉建议，避免同义写法各写各的
  const collectionOptions = Array.from(
    new Set(initial.map((p) => p.collection).filter((c): c is string => !!c && c.trim() !== ''))
  ).sort();

  // Esc 关闭弹窗
  useEffect(() => {
    if (!showForm) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setEditing(null); setCreating(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showForm]);

  const closeForm = () => { setEditing(null); setCreating(false); };

  return (
    <>
      <div className="adm-filters">
        <span style={{ fontSize: 12.5, color: 'var(--ash)' }}>{initial.length} 个 SKU</span>
        <button className="adm-btn" onClick={openCreate} disabled={pending}>＋ 新增商品</button>
        {msg && <span style={{ fontSize: 12.5, color: msg.t === 'ok' ? '#4a5a44' : 'var(--cinnabar)' }}>{msg.m}</span>}
      </div>

      <div className="adm-card">
        <table className="adm-table">
          <thead><tr><th>合集</th><th>标题</th><th>品类</th><th className="num">价格</th><th className="num">库存</th><th>状态</th><th className="actions">操作</th></tr></thead>
          <tbody>
            {initial.length === 0 && <tr><td colSpan={7}><div className="adm-empty">暂无商品</div></td></tr>}
            {initial.map((p) => (
              <tr key={p.slug}>
                <td style={{ whiteSpace: 'nowrap' }}>{p.collection || '—'}</td>
                <td>{(() => { const t = displayTitle(p); return <><div>{t.main}</div><div style={{ fontSize: 11, color: 'var(--ash)' }}>{t.sub}</div></>; })()}</td>
                <td>{CAT_LABELS[p.category] ?? p.category}</td>
                <td className="num">{usd(p.price_usd)}</td>
                <td className="num">{p.stock}</td>
                <td>
                  <select value={p.status} onChange={(e) => setStatus(p, e.target.value)} style={{ fontSize: 12, padding: '4px 8px' }}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="actions">
                  <button className="adm-btn outline sm" onClick={() => openEdit(p)}>编辑</button>
                  <button className="adm-btn danger sm" onClick={() => remove(p)}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="adm-modal-overlay" onClick={closeForm} role="dialog" aria-modal="true">
          <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-head">
              <h2>{creating ? '新增商品' : '编辑商品'}</h2>
              <button type="button" className="adm-modal-close" onClick={closeForm} aria-label="关闭">×</button>
            </div>
            <div className="adm-modal-body">
              <div className="adm-form">
                <div className="adm-form-row">
                  <label>标题（英文）<input value={form.title} onChange={(e) => set('title', e.target.value)} /></label>
                  <label>标题（中文）<input value={form.title_zh} onChange={(e) => set('title_zh', e.target.value)} /></label>
                </div>
                <div className="adm-form-row">
                  <label>合集
                    <input
                      list="adm-collections"
                      value={form.collection ?? ''}
                      onChange={(e) => set('collection', e.target.value)}
                      placeholder="如：道系文创"
                    />
                    <datalist id="adm-collections">
                      {collectionOptions.map((c) => <option key={c} value={c} />)}
                    </datalist>
                  </label>
                  <label>品类
                    <select value={form.category} onChange={(e) => set('category', e.target.value)}>
                      {CATS.map((c) => <option key={c} value={c}>{CAT_LABELS[c] ?? c}</option>)}
                    </select>
                  </label>
                </div>
                <div className="adm-form-row">
                  <label>状态
                    <select value={form.status} onChange={(e) => set('status', e.target.value)}>
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>
                  <label>库存数量<input value={form.stock} onChange={(e) => set('stock', e.target.value)} inputMode="numeric" /></label>
                </div>
                <div className="adm-form-row">
                  <label>价格（美元）<input value={form.price} onChange={(e) => set('price', e.target.value)} inputMode="decimal" /></label>
                  <label>划线价（美元，可选）<input value={form.compare_at} onChange={(e) => set('compare_at', e.target.value)} inputMode="decimal" /></label>
                </div>
                <label>卖点一句话（前台卡片副标题）<input value={form.tagline} onChange={(e) => set('tagline', e.target.value)} /></label>
                <label>详情描述（前台商品页正文）<textarea rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} /></label>
                <label>图片路径（每行一个，如 /products/xxx.jpg）<textarea rows={3} value={form.images} onChange={(e) => set('images', e.target.value)} /></label>
                <div className="adm-form-actions">
                  <button className="adm-btn" onClick={save} disabled={pending}>保存</button>
                  <button className="adm-btn outline" onClick={closeForm}>取消</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
