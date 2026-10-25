import { cookies } from 'next/headers';
import { initDb } from '@/lib/db/loader';
import { listProducts } from '@/lib/admin/dao';
import { seedCatalogIfEmpty } from '@/lib/admin/seed';
import ProductsManager from '@/components/admin/ProductsManager';
import { LOCALE_COOKIE, isLocale, DEFAULT_LOCALE } from '@/lib/i18n/config';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  await initDb();
  seedCatalogIfEmpty();
  const products = listProducts(true);

  // 与全站语言切换（NEXT_LOCALE Cookie）同步：中文 locales 时标题列显示中文标题
  const cookieStore = await cookies();
  const localeRaw = cookieStore.get(LOCALE_COOKIE)?.value;
  const lang = localeRaw && isLocale(localeRaw) ? localeRaw : DEFAULT_LOCALE;

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h1>商品管理</h1>
          <p>编辑价格 / 标题 / 描述 / 图片 · 保存后前台实时生效</p>
        </div>
      </div>
      <ProductsManager initial={products as never} lang={lang} />
    </>
  );
}
