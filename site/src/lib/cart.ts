'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartLine = {
  slug: string;
  variantId: string;
  quantity: number;
};

type CartState = {
  lines: CartLine[];
  drawerOpen: boolean;
  addLine: (line: CartLine) => void;
  removeLine: (slug: string, variantId: string) => void;
  setQuantity: (slug: string, variantId: string, quantity: number) => void;
  clear: () => void;
  /** 清理无效行（商品已下架/目录已更换导致的幽灵行）；keep 返回 false 的行被移除 */
  sanitizeLines: (keep: (line: CartLine) => boolean) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
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
      clear: () => set({ lines: [] }),
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
      partialize: (state) => ({ lines: state.lines }),
    }
  )
);
