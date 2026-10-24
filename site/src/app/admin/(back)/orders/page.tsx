import { initDb } from '@/lib/db/loader';
import { listOrders } from '@/lib/admin/dao';
import OrdersManager from '@/components/admin/OrdersManager';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  await initDb();
  const orders = listOrders({ limit: 1000 });
  return (
    <>
      <div className="adm-page-head">
        <div>
          <h1>订单统计</h1>
          <p>订单管理 · 状态流转 · 物流追踪</p>
        </div>
      </div>
      <OrdersManager initial={orders as never} />
    </>
  );
}
