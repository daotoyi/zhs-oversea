'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartLine = {
  slug: string;
  variantId: string;
  quantity: number;
};

/** 行唯一键：同一商品的不用规格是不同行 */
export const lineKey = (slug: string, variantId: string) => `${slug}::${variantId}`;

type CartState = {
  lines: CartLine[];
  /**
   * 已提交给支付渠道、等待回跳确认的行键。
   * 付款成功页据此只清掉「这一单买掉的行」，
   * 没勾选结算的商品原封不动留在车里。
   */
  pendingKeys: string[];
  drawerOpen: boolean;
  addLine: (line: CartLine) => void;
  removeLine: (slug: string, variantId: string) => void;
  setQuantity: (slug: string, variantId: string, quantity: number) => void;
  clear: () => void;
  /** 发起结账时记录本单包含的行 */
  markPending: (keys: string[]) => void;
  /** 支付成功后：移除本单行，其余保留 */
  settlePending: () => void;
  /** 放弃支付：作废待结算标记，不动购物车 */
  cancelPending: () => void;
  /** 清理无效行（商品已下架/目录已更换导致的幽灵行）；keep 返回 false 的行被移除 */
  sanitizeLines: (keep: (line: CartLine) => boolean) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      pendingKeys: [],
      drawerOpen: false,
      addLine: (line) =>
        set((state) => {
          const existing = state.lines.find((l) => l.slug === line.slug && l.variantId === line.variantId);
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.slug === line.slug && l.variantId === line.variantId
                  ? { ...l, quantity: Math.min(l.quantity + line.quantity, 20) }
                  : l
              ),
              drawerOpen: true,
            };
          }
          return { lines: [...state.lines, line], drawerOpen: true };
        }),
      removeLine: (slug, variantId) =>
        set((state) => ({
          lines: state.lines.filter((l) => !(l.slug === slug && l.variantId === variantId)),
        })),
      setQuantity: (slug, variantId, quantity) =>
        set((state) => ({
          lines:
            quantity <= 0
              ? state.lines.filter((l) => !(l.slug === slug && l.variantId === variantId))
              : state.lines.map((l) =>
                  l.slug === slug && l.variantId === variantId ? { ...l, quantity: Math.min(quantity, 20) } : l
                ),
        })),
      clear: () => set({ lines: [], pendingKeys: [] }),
      markPending: (keys) => set({ pendingKeys: keys }),
      settlePending: () =>
        set((state) => {
          // 没有待结算标记（如旧版本遗留会话）就什么都不动 —— 宁可不清，
          // 也不能把用户还没结账的商品误清空。
          if (state.pendingKeys.length === 0) return state;
          const bought = new Set(state.pendingKeys);
          return {
            lines: state.lines.filter((l) => !bought.has(lineKey(l.slug, l.variantId))),
            pendingKeys: [],
          };
        }),
      cancelPending: () => set({ pendingKeys: [] }),
      sanitizeLines: (keep) =>
        set((state) => {
          const next = state.lines.filter(keep);
          // 无无效行时返回原 state 对象，避免无谓重渲染与持久化写入
          return next.length === state.lines.length ? state : { lines: next };
        }),
      openDrawer: () => set({ drawerOpen: true }),
      closeDrawer: () => set({ drawerOpen: false }),
    }),
    {
      name: 'zhs-cart',
      partialize: (state) => ({ lines: state.lines, pendingKeys: state.pendingKeys }),
    }
  )
);
