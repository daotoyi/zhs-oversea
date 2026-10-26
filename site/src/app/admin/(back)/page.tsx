import { initDb } from '@/lib/db/loader';
import {
  listProducts, listOrders, listCustomers, listCoupons, listSaleEvents,
} from '@/lib/admin/dao';
import { seedCatalogIfEmpty } from '@/lib/admin/seed';
import { DonutChart } from '@/components/admin/Charts';
import { RevenueTrends } from '@/components/admin/RevenueTrends';
import { categoryLabel } from '@/lib/categories';
import { LOCALE_COOKIE, isLocale, DEFAULT_LOCALE } from '@/lib/i18n/config';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const CAT_COLORS: Record<string, string> = {
  'fortune-charms': '#9E3B2E',
  'heavenly-stems': '#C8A15A',
  'three-harmonies': '#4F7A6A',
  'raw-wood': '#6B645B',
  'writing-desk': '#3F6F8F',
  books: '#5C6B58',
};

function usd(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function AdminDashboard() {
  await initDb();
  seedCatalogIfEmpty();

  // 品类名跟随全站语言（NEXT_LOCALE）：要么全英文、要么全中文
  const cookieStore = await cookies();
  const localeRaw = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = localeRaw && isLocale(localeRaw) ? localeRaw : DEFAULT_LOCALE;
  // 饼图里的两个非品类分组也要跟随语种，避免中英混排
  const otherLabel = locale === 'en' ? 'Other' : locale === 'zh-Hant' ? '其他' : '其他';
  const mixedLabel = locale === 'en' ? 'Mixed' : locale === 'zh-Hant' ? '混合' : '混合';

  const products = listProducts(true);
  const orders = listOrders({ limit: 1000 });
  const customers = listCustomers();
  const coupons = listCoupons();
  const sales = listSaleEvents();

  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const activeProducts = products.filter((p) => p.status === 'active').length;
  const activeSales = sales.filter((s) => s.status === 'active').length;

  // 营收趋势（近14天/按月/按季度/按年 + 按金额/按订单）由客户端组件聚合
  const trendOrders = orders.map((o) => ({ ts: new Date(o.created_at).getTime(), total: o.total }));

  // 各品类营收占比（用 seeded 商品的 slug→category 映射）
  const slugCat: Record<string, string> = {};
  for (const p of products) slugCat[p.slug] = p.category;
  const byCat: Record<string, number> = {};
  for (const o of orders) {
    let cat = '其他';
    try {
      const items = JSON.parse(o.items || '[]') as { slug?: string }[];
      const cset = new Set(items.map((it) => slugCat[it.slug ?? ''] || '其他'));
      cat = cset.size === 1 ? [...cset][0] : '混合';
    } catch { cat = '其他'; }
    byCat[cat] = (byCat[cat] ?? 0) + o.total;
  }
  const donut = Object.entries(byCat).map(([cat, v]) => ({
    label: cat === '其他' ? otherLabel : cat === '混合' ? mixedLabel : categoryLabel(cat, locale),
    value: Math.round(v / 100),
    color: CAT_COLORS[cat] ?? '#9E3B2E',
  }));

  const statusCount: Record<string, number> = {};
  for (const o of orders) statusCount[o.status] = (statusCount[o.status] ?? 0) + 1;
  const statusDonut = Object.entries(statusCount).map(([s, n], i) => ({
    label: s, value: n, color: [ '#5C6B58', '#9E3B2E', '#C8A15A', '#6B645B', '#8A6F9E' ][i % 5],
  }));

  const recent = orders.slice(0, 8);

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h1>仪表盘</h1>
          <p>全站经营概览 · 实时数据</p>
        </div>
      </div>

      <div className="adm-stats">
        <div className="adm-stat"><div className="k">销售额</div><div className="v">{usd(revenue)}</div><div className="d">累计</div></div>
        <div className="adm-stat"><div className="k">订单</div><div className="v">{orders.length}</div><div className="d">累计 {activeSales} 个活动折扣中</div></div>
        <div className="adm-stat"><div className="k">客户</div><div className="v">{customers.length}</div><div className="d">{coupons.length} 张优惠券</div></div>
        <div className="adm-stat"><div className="k">在售商品</div><div className="v">{activeProducts}</div><div className="d">共 {products.length} 个 SKU</div></div>
      </div>

      <div className="adm-charts">
        <RevenueTrends orders={trendOrders} />
        <div className="adm-chart-card">
          <h3>品类营收占比</h3>
          <div className="sub">按订单商品品类聚合</div>
          <DonutChart data={donut} size={172} />
          <div className="adm-legend">
            {donut.map((d) => (
              <span key={d.label}><i style={{ background: d.color }} />{d.label} {usd(d.value * 100)}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="adm-card" style={{ marginTop: 20 }}>
        <h2>最近订单</h2>
        {recent.length === 0 ? (
          <div className="adm-empty">暂无订单 — 客户通过 Stripe Checkout 付款后将自动同步至此</div>
        ) : (
          <table className="adm-table">
            <thead><tr><th>订单号</th><th>客户</th><th>金额</th><th>状态</th><th>时间</th></tr></thead>
            <tbody>
              {recent.map((o) => (
                <tr key={o.id}>
                  <td>{o.id}</td>
                  <td>{o.customer_name || o.email}</td>
                  <td className="num">{usd(o.total)}</td>
                  <td><span className={`adm-status ${o.status}`}>{o.status}</span></td>
                  <td>{new Date(o.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
