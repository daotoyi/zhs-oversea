'use client';

import { useEffect, useRef } from 'react';
import { useCart } from '@/lib/cart';

/**
 * 支付成功后的购物车收尾
 *
 * 挂在 Stripe / PayPal 的成功页上：把「已付款的那几行」从购物车移除，
 * 未勾选结算的商品原封不动保留。
 *
 * 放在客户端 useEffect 里而不是服务端渲染时清：
 * 购物车是 localStorage（zustand persist），只有浏览器端才能改。
 */
export default function CartSettle({ orderId }: { orderId?: string }) {
  const settlePending = useCart((s) => s.settlePending);
  const done = useRef(false);

  useEffect(() => {
    // React 18 开发模式会二次挂载 effect，用 ref 保证只结算一次
    if (done.current) return;
    done.current = true;
    settlePending();
    // 清掉「进行中的 PayPal 订单」等临时态，避免下次进购物车误判
    try {
      sessionStorage.removeItem('zhs-pending-paypal');
    } catch {
      /* 隐私模式下 sessionStorage 可能不可用，忽略 */
    }
  }, [settlePending, orderId]);

  return null;
}
