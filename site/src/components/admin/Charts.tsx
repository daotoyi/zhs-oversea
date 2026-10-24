/**
 * 后台图表 —— 纯 SVG，零依赖，与站点设计系统一致
 */

export type Point = { label: string; value: number };

/** 折线图（带渐变面积） */
export function LineChart({ data, height = 200 }: { data: Point[]; height?: number }) {
  const W = 640;
  const H = height;
  const pad = { l: 44, r: 12, t: 14, b: 26 };
  if (data.length === 0) {
    return <div className="adm-empty">暂无数据</div>;
  }
  const max = Math.max(...data.map((d) => d.value), 1);
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const x = (i: number) => pad.l + (data.length === 1 ? iw / 2 : (i / (data.length - 1)) * iw);
  const y = (v: number) => pad.t + ih - (v / max) * ih;
  const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(' ');
  const area = `${line} L${x(data.length - 1).toFixed(1)},${pad.t + ih} L${x(0).toFixed(1)},${pad.t + ih} Z`;
  const ticks = [0, 0.5, 1].map((f) => Math.round(max * f));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }} role="img">
      <defs>
        <linearGradient id="admArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9E3B2E" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#9E3B2E" stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#E3DDD0" strokeWidth="1" />
          <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="10" fill="#6B645B">{t}</text>
        </g>
      ))}
      <path d={area} fill="url(#admArea)" />
      <path d={line} fill="none" stroke="#9E3B2E" strokeWidth="1.8" strokeLinejoin="round" />
      {data.map((d, i) => (
        <circle key={i} cx={x(i)} cy={y(d.value)} r="2.6" fill="#9E3B2E" />
      ))}
      {data.map((d, i) =>
        i % Math.ceil(data.length / 8) === 0 || data.length <= 8 ? (
          <text key={`x${i}`} x={x(i)} y={H - 8} textAnchor="middle" fontSize="9.5" fill="#6B645B">
            {d.label}
          </text>
        ) : null
      )}
    </svg>
  );
}

/** 环形图 */
export function DonutChart({ data, size = 180 }: { data: { label: string; value: number; color: string }[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div className="adm-empty">暂无数据</div>;
  const r = 62;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg viewBox="0 0 160 160" style={{ width: size, height: size, margin: '0 auto', display: 'block' }}>
      <g transform="rotate(-90 80 80)">
        {data.map((d, i) => {
          const frac = d.value / total;
          const dash = frac * c;
          const el = (
            <circle
              key={i}
              cx="80"
              cy="80"
              r={r}
              fill="none"
              stroke={d.color}
              strokeWidth="16"
              strokeDasharray={`${dash - 1.5} ${c - dash + 1.5}`}
              strokeDashoffset={-offset}
            />
          );
          offset += dash;
          return el;
        })}
      </g>
      <text x="80" y="76" textAnchor="middle" fontSize="22" fontFamily="var(--serif)" fill="#1A1714">
        {total}
      </text>
      <text x="80" y="94" textAnchor="middle" fontSize="9" fill="#6B645B" letterSpacing="1">
        TOTAL
      </text>
    </svg>
  );
}

/** 柱状图 */
export function BarChart({ data, height = 180 }: { data: Point[]; height?: number }) {
  const W = 320;
  const H = height;
  const pad = { l: 34, r: 8, t: 12, b: 24 };
  if (data.length === 0) return <div className="adm-empty">暂无数据</div>;
  const max = Math.max(...data.map((d) => d.value), 1);
  const ih = H - pad.t - pad.b;
  const bw = (W - pad.l - pad.r) / data.length;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }} role="img">
      {[0, 0.5, 1].map((f) => (
        <g key={f}>
          <line x1={pad.l} x2={W - pad.r} y1={pad.t + ih - f * ih} y2={pad.t + ih - f * ih} stroke="#E3DDD0" />
          <text x={pad.l - 6} y={pad.t + ih - f * ih + 4} textAnchor="end" fontSize="9" fill="#6B645B">
            {Math.round(max * f)}
          </text>
        </g>
      ))}
      {data.map((d, i) => {
        const h = (d.value / max) * ih;
        return (
          <g key={i}>
            <rect
              x={pad.l + i * bw + bw * 0.18}
              y={pad.t + ih - h}
              width={bw * 0.64}
              height={h}
              fill="#5C6B58"
              rx="1.5"
            />
            <text x={pad.l + i * bw + bw / 2} y={H - 7} textAnchor="middle" fontSize="9" fill="#6B645B">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
