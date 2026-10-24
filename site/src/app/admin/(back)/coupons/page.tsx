import { initDb } from '@/lib/db/loader';
import { listCoupons } from '@/lib/admin/dao';
import CouponsManager from '@/components/admin/CouponsManager';

export const dynamic = 'force-dynamic';

export default async function CouponsPage() {
  await initDb();
  const coupons = listCoupons();
  return (
    <>
      <div className="adm-page-head">
        <div>
          <h1>优惠券</h1>
          <p>创建、编辑、停用 · 支持百分比折扣与固定立减</p>
        </div>
      </div>
      <CouponsManager initial={coupons as never} />
    </>
  );
}
