import { initDb } from '@/lib/db/loader';
import { listProducts } from '@/lib/admin/dao';
import { seedCatalogIfEmpty } from '@/lib/admin/seed';
import ProductsManager from '@/components/admin/ProductsManager';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  await initDb();
  seedCatalogIfEmpty();
  const products = listProducts(true);
  return (
    <>
      <div className="adm-page-head">
        <div>
          <h1>商品管理</h1>
          <p>编辑、上架 / 下架 · 镜像自静态商品目录</p>
        </div>
      </div>
      <ProductsManager initial={products as never} />
    </>
  );
}
