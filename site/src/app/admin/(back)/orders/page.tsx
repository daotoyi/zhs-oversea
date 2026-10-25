import { initDb } from '@/lib/db/loader';
import { listOrders, listRefundRequests } from '@/lib/admin/dao';
import OrdersManager from '@/components/admin/OrdersManager';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  await initDb();
  const orders = listOrders({ limit: 1000 });
  const refunds = listRefundRequests();
  return (
    <>
      <div className="adm-page-head">
        <div>
          <h1>订单统计</h1>
          <p>订单管理 · 状态流转 · 物流追踪 · 退款处理</p>
        </div>
      </div>
      <OrdersManager initial={orders as never} refunds={refunds as never} />
    </>
  );
}
