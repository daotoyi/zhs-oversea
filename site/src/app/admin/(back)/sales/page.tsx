import { initDb } from '@/lib/db/loader';
import { listSaleEvents } from '@/lib/admin/dao';
import SalesManager from '@/components/admin/SalesManager';

export const dynamic = 'force-dynamic';

export default async function SalesPage() {
  await initDb();
  const events = listSaleEvents();
  return (
    <>
      <div className="adm-page-head">
        <div>
          <h1>节日折扣</h1>
          <p>特殊时段打折 · 可按全站 / 品类 / 单品生效</p>
        </div>
      </div>
      <SalesManager initial={events as never} />
    </>
  );
}
