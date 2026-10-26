'use client';

import type { ReactNode } from 'react';

/**
 * 后台「操作指引」折叠块
 *
 * 凭据获取步骤、DNS 清单这类长文案平时不需要看，
 * 默认收起，只留一行标题 —— 页面从「一屏文字」变成「一屏表单」。
 *
 * 用原生 <details>：无需 JS、支持键盘、浏览器自带展开动画语义。
 */
export default function AdminFold({
  title,
  hint,
  defaultOpen = false,
  children,
}: {
  title: string;
  hint?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details className="adm-fold" open={defaultOpen}>
      <summary className="adm-fold-head">
        <span className="adm-fold-arrow" aria-hidden="true">
          ▸
        </span>
        <span className="adm-fold-title">{title}</span>
        {hint && <span className="adm-fold-hint">{hint}</span>}
      </summary>
      <div className="adm-fold-body">{children}</div>
    </details>
  );
}
