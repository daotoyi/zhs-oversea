import { initDb } from '@/lib/db/loader';
import {
  listProducts, listOrders, listCustomers, listCoupons, listSaleEvents,
} from '@/lib/admin/dao';
import { seedCatalogIfEmpty } from '@/lib/admin/seed';
import { LineChart, DonutChart } from '@/components/admin/Charts';

export const dynamic = 'force-dynamic';

const CAT_COLORS: Record<string, string> = {
  books: '#5C6B58',
  'writing-desk': '#9E3B2E',
  'incense-ritual': '#C8A15A',
  'talisman-objects': '#8A6F9E',
  'tea-ware': '#4F7A6A',
  'home-altar': '#6B645B',
};
const CAT_LABELS: Record<string, string> = {
  books: '书籍', 'writing-desk': '文房', 'incense-ritual': '香道',
  'talisman-objects': '开运饰品', 'tea-ware': '茶器', 'home-altar': '风水摆件',
};

function usd(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function AdminDashboard() {
  await initDb();
  seedCatalogIfEmpty();

  const products = listProducts(true);
  const orders = listOrders({ limit: 1000 });
  const customers = listCustomers();
  const coupons = listCoupons();
  const sales = listSaleEvents();

  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const activeProducts = products.filter((p) => p.status === 'active').length;
  const activeSales = sales.filter((s) => s.status === 'active').length;

  // 近 14 天营收趋势
  const days = 14;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const trend: { label: string; value: number }[] = [];
  const byDay: Record<string, number> = {};
  for (const o of orders) {
    const d = new Date(o.created_at); d.setHours(0, 0, 0, 0);
    const key = d.getTime();
    byDay[key] = (byDay[key] ?? 0) + o.total;
  }
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const key = d.getTime();
    trend.push({ label: `${d.getMonth() + 1}/${d.getDate()}`, value: Math.round((byDay[key] ?? 0) / 100) });
  }

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
    label: CAT_LABELS[cat] ?? cat, value: Math.round(v / 100), color: CAT_COLORS[cat] ?? '#9E3B2E',
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
        <div className="adm-chart-card">
          <h3>近 14 天营收（美元）</h3>
          <div className="sub">每日成交总额</div>
          <LineChart data={trend} height={220} />
        </div>
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
