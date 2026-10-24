import { initDb } from '@/lib/db/loader';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE, verifyToken } from '@/lib/admin/auth';
import { MODULES } from '@/lib/db/schema';
import { listStaff } from '@/lib/admin/dao';
import StaffManager from '@/components/admin/StaffManager';

export const dynamic = 'force-dynamic';

export default async function StaffPage() {
  await initDb();
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  const session = token ? verifyToken(token) : null;
  const isSuper = session?.role === 'super';
  const staff = listStaff();
  return (
    <>
      <div className="adm-page-head">
        <div>
          <h1>员工管理</h1>
          <p>超级管理员可增删员工、分配角色与模块权限{isSuper ? '' : '（当前账号无管理权限，仅可查看）'}</p>
        </div>
      </div>
      <StaffManager initial={staff as never} isSuper={isSuper} modules={MODULES as never} />
    </>
  );
}
