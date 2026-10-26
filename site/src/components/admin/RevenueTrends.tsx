'use client';

/**
 * 营收趋势卡（客户端）：周期切换（近14天/按月/按季度/按年）+ 指标切换（按金额/按订单）
 * 数据由服务端传入，本地聚合，零依赖。
 */
import { useMemo, useState } from 'react';
import { LineChart } from './Charts';

export type TrendOrder = { ts: number; total: number };

type Period = 'd14' | 'month' | 'quarter' | 'year';
type Metric = 'amount' | 'orders';

const PERIODS: { key: Period; label: string; sub: string }[] = [
  { key: 'd14', label: '近14天', sub: '每日' },
  { key: 'month', label: '按月', sub: '近 12 个月，每月' },
  { key: 'quarter', label: '按季度', sub: '近 8 个季度，每季' },
  { key: 'year', label: '按年', sub: '各年度' },
];

const METRICS: { key: Metric; label: string }[] = [
  { key: 'amount', label: '按金额' },
  { key: 'orders', label: '按订单' },
];

const day0 = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };

/** 生成时间升序的桶（key + 展示 label），并保证无数据的桶也为 0 */
function buildBuckets(period: Period, now: Date): { key: string; label: string }[] {
  if (period === 'd14') {
    const out: { key: string; label: string }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      out.push({ key: String(d.getTime()), label: `${d.getMonth() + 1}/${d.getDate()}` });
    }
    return out;
  }
  if (period === 'month') {
    const out: { key: string; label: string }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      out.push({ key: `${d.getFullYear()}-${d.getMonth() + 1}`, label: `${d.getFullYear() % 100}/${d.getMonth() + 1}` });
    }
    return out;
  }
  if (period === 'quarter') {
    const out: { key: string; label: string }[] = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i * 3, 1);
      const q = Math.floor(d.getMonth() / 3) + 1;
      out.push({ key: `${d.getFullYear()}-Q${q}`, label: `${d.getFullYear() % 100}Q${q}` });
    }
    return out;
  }
  // year：从数据最早年份到当前年（空数据时至少当前年）
  return [];
}

export function RevenueTrends({ orders }: { orders: TrendOrder[] }) {
  const [period, setPeriod] = useState<Period>('d14');
  const [metric, setMetric] = useState<Metric>('amount');
  const now = useMemo(() => day0(new Date()), []);

  const { data, sumCents, count } = useMemo(() => {
    const buckets = buildBuckets(period, now);
    if (period === 'year') {
      const years = new Set<number>([now.getFullYear()]);
      for (const o of orders) years.add(new Date(o.ts).getFullYear());
      const min = Math.min(...years);
      for (let y = min; y <= now.getFullYear(); y++) buckets.push({ key: String(y), label: String(y) });
    }
    const agg: Record<string, { sum: number; n: number }> = {};
    for (const b of buckets) agg[b.key] = { sum: 0, n: 0 };
    for (const o of orders) {
      const d = new Date(o.ts);
      let key: string;
      if (period === 'd14') {
        const dd = day0(d);
        // 只统计近 14 天内的
        if (dd.getTime() < now.getTime() - 13 * 86400000) continue;
        key = String(dd.getTime());
      } else if (period === 'month') key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      else if (period === 'quarter') key = `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`;
      else key = String(d.getFullYear());
      if (!agg[key]) continue;
      agg[key].sum += o.total;
      agg[key].n += 1;
    }
    const series = buckets.map((b) => ({
      label: b.label,
      value: metric === 'amount' ? Math.round((agg[b.key]?.sum ?? 0) / 100) : (agg[b.key]?.n ?? 0),
    }));
    const totalSum = Object.values(agg).reduce((s, v) => s + v.sum, 0);
    const totalCount = Object.values(agg).reduce((s, v) => s + v.n, 0);
    return { data: series, sumCents: totalSum, count: totalCount };
  }, [orders, period, metric, now]);

  const sub = PERIODS.find((p) => p.key === period)!.sub + (metric === 'amount' ? '成交总额（美元）' : '订单数');

  return (
    <div className="adm-chart-card">
      <div className="adm-chart-head">
        <div>
          <h3>营收趋势</h3>
          <div className="sub">
            {sub} · 合计 ${ (sumCents / 100).toFixed(2) } / {count} 单
          </div>
        </div>
        <div className="adm-seg-groups">
          <div className="adm-seg" role="group" aria-label="统计周期">
            {PERIODS.map((p) => (
              <button key={p.key} type="button" className={period === p.key ? 'on' : ''} onClick={() => setPeriod(p.key)}>
                {p.label}
              </button>
            ))}
          </div>
          <div className="adm-seg" role="group" aria-label="统计口径">
            {METRICS.map((m) => (
              <button key={m.key} type="button" className={metric === m.key ? 'on' : ''} onClick={() => setMetric(m.key)}>
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <LineChart data={data} height={220} />
    </div>
  );
}
