'use client';

import { useState, useTransition, useEffect, useRef, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/admin/client';
import { categoryLabel, categoryOptions } from '@/lib/categories';
import { toTraditional } from '@/lib/i18n/convert';
import type { Locale } from '@/lib/i18n/config';

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
  // 图片单独用数组管理（要直接显示缩略图、可删可换封面、可从本地上传）
  const [imgList, setImgList] = useState<string[]>([]);
  const [imgUrlInput, setImgUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; m: string } | null>(null);
  // 表头下拉筛选：'' 表示全部
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // 品类名跟随全站语言（NEXT_LOCIE）：要么全英文、要么全中文，不混排
  const locale: Locale = lang === 'zh-Hans' || lang === 'zh-Hant' ? lang : 'en';
  const catOpts = categoryOptions(locale);

  function openEdit(p: Prod) {
    setEditing(p);
    setCreating(false);
    let imgs: string[] = [];
    try { imgs = JSON.parse(p.images || '[]'); } catch { imgs = []; }
    setImgList(imgs);
    setImgUrlInput('');
    setForm({
      title: p.title, title_zh: p.title_zh ?? '', category: p.category,
      collection: p.collection ?? '',
      tagline: p.tagline ?? '', description: p.description ?? '',
      price: String(p.price_usd / 100), compare_at: p.compare_at_usd ? String(p.compare_at_usd / 100) : '',
      stock: String(p.stock), status: p.status,
    });
    setMsg(null);
  }
  function openCreate() {
    setCreating(true);
    setEditing(null);
    setImgList([]);
    setImgUrlInput('');
    setForm({
      title: '', title_zh: '', category: 'fortune-charms', collection: '',
      tagline: '', description: '',
      price: '', compare_at: '', stock: '0', status: 'draft',
    });
    setMsg(null);
  }

  // ── 图片：本地上传 ────────────────────────────────────────
  async function uploadFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    setMsg(null);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append('file', f));
      const res = await fetch('/api/admin/uploads', {
        method: 'POST',
        body: fd,
        credentials: 'same-origin',
      });
      const data = (await res.json().catch(() => null)) as { urls?: string[]; error?: string } | null;
      if (!res.ok || !data?.urls?.length) throw new Error(data?.error ?? '上传失败');
      setImgList((prev) => [...prev, ...data.urls!]);
    } catch (err) {
      setMsg({ t: 'err', m: (err as Error).message });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = ''; // 允许再次选同一个文件
    }
  }

  function addByUrl() {
    const url = imgUrlInput.trim();
    if (!url) return;
    setImgList((prev) => [...prev, url]);
    setImgUrlInput('');
  }

  function removeImage(idx: number) {
    setImgList((prev) => prev.filter((_, i) => i !== idx));
  }

  /** 设为封面 = 挪到数组第一位（前台一律取 images[0] 当主图） */
  function makeCover(idx: number) {
    setImgList((prev) => {
      if (idx === 0) return prev;
      const next = [...prev];
      const [pick] = next.splice(idx, 1);
      return [pick, ...next];
    });
  }

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function save() {
    setMsg(null);
    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      title_zh: form.title_zh.trim() || null,
      category: form.category,
      collection: form.collection?.trim() || null,
      tagline: form.tagline?.trim() || null,
      description: form.description?.trim() || null,
      images: imgList,
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
      // zh-Hant 下中文标题需转繁体（DB 存的是简体），否则与繁体品类名混排
      const zh = p.title_zh ? (locale === 'zh-Hant' ? toTraditional(p.title_zh) : p.title_zh) : null;
      if (zh) return { main: zh, sub: p.title };
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

  // 表头筛选后的列表
  const filtered = initial.filter(
    (p) => (catFilter === '' || p.category === catFilter) && (statusFilter === '' || p.status === statusFilter)
  );

  return (
    <>
      <div className="adm-filters">
        <span style={{ fontSize: 12.5, color: 'var(--ash)' }}>
          {catFilter || statusFilter ? `${filtered.length} / ${initial.length} 个 SKU` : `${initial.length} 个 SKU`}
        </span>
        <button className="adm-btn" onClick={openCreate} disabled={pending}>＋ 新增商品</button>
        {msg && <span style={{ fontSize: 12.5, color: msg.t === 'ok' ? '#4a5a44' : 'var(--cinnabar)' }}>{msg.m}</span>}
      </div>

      <div className="adm-card">
        <table className="adm-table">
          <thead>
            <tr>
              <th>
                <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} style={{ fontSize: 11.5, padding: '3px 6px', maxWidth: 130 }}>
                  <option value="">品类：全部</option>
                  {catOpts.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </th>
              <th>标题</th>
              <th className="num">价格</th>
              <th className="num">库存</th>
              <th>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ fontSize: 11.5, padding: '3px 6px' }}>
                  <option value="">状态：全部</option>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </th>
              <th className="actions">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={6}><div className="adm-empty">暂无商品</div></td></tr>}
            {filtered.map((p) => (
              <tr key={p.slug}>
                <td style={{ whiteSpace: 'nowrap' }}>{categoryLabel(p.category, locale)}</td>
                <td>{(() => { const t = displayTitle(p); return <><div>{t.main}</div><div style={{ fontSize: 11, color: 'var(--ash)' }}>{t.sub}</div></>; })()}</td>
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
                      {catOpts.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
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

                {/* ── 商品图片：直接看图，本地一键上传 ── */}
                <div className="adm-img-field">
                  <div className="adm-img-label">
                    商品图片<span>第一张是封面 · 点任意一张可设为封面</span>
                  </div>

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                    multiple
                    onChange={uploadFiles}
                    style={{ display: 'none' }}
                  />

                  <div className="adm-img-grid">
                    {imgList.map((src, i) => (
                      <div key={`${src}-${i}`} className={`adm-img-item${i === 0 ? ' cover' : ''}`}>
                        <img src={src} alt="" onClick={() => makeCover(i)} title="点击设为封面" />
                        {i === 0 && <span className="adm-img-badge">封面</span>}
                        <button
                          type="button"
                          className="adm-img-del"
                          onClick={() => removeImage(i)}
                          title="删除这张"
                          aria-label="删除这张"
                        >
                          ×
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      className="adm-img-add"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      title="从电脑选择图片（可多选）"
                    >
                      {uploading ? '上传中…' : (
                        <>
                          <span className="adm-img-add-plus">＋</span>
                          <span>本地上传</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="adm-img-url">
                    <input
                      value={imgUrlInput}
                      onChange={(e) => setImgUrlInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addByUrl(); } }}
                      placeholder="也可粘贴图片链接，如 https://… 或 /products/xxx.jpg"
                    />
                    <button className="adm-btn outline sm" type="button" onClick={addByUrl} disabled={!imgUrlInput.trim()}>
                      添加链接
                    </button>
                  </div>
                  <p className="adm-img-note">
                    支持 JPG / PNG / WebP / AVIF / GIF，单张不超过 8MB。上传的图存在服务器 .data 目录，发版不会丢。
                  </p>
                </div>

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
