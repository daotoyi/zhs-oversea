'use client';

import { useState } from 'react';

/**
 * 器物详情页图库：主图 + 缩略图。
 * 点击下方缩略图切换上方大图；当前缩略图高亮；单图商品不显示缩略图列。
 */
export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  const list = images.length > 0 ? images : [];
  const current = list[Math.min(active, list.length - 1)] ?? '';

  return (
    <div className="pdp-media">
      <div className="pdp-main">
        {current && <img key={current} src={current} alt={title} />}
      </div>
      {list.length > 1 && (
        <div className="pdp-thumbs">
          {list.map((img, i) => (
            <button
              key={`${img}-${i}`}
              type="button"
              className={`pdp-thumb${i === active ? ' on' : ''}`}
              onClick={() => setActive(i)}
              aria-label={`${title} — ${i + 1} / ${list.length}`}
              aria-current={i === active}
            >
              <img src={img} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
