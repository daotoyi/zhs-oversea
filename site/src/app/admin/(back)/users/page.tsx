import { initDb } from '@/lib/db/loader';
import { listCustomers, allTags } from '@/lib/admin/dao';
import UsersManager from '@/components/admin/UsersManager';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  await initDb();
  const customers = listCustomers();
  const tags = allTags();
  return (
    <>
      <div className="adm-page-head">
        <div>
          <h1>用户管理</h1>
          <p>客户分组打标签 · 配合邮件推广按组触达</p>
        </div>
      </div>
      <UsersManager initial={customers as never} tags={tags} />
    </>
  );
}
