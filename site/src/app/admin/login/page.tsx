import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE, verifyToken } from '@/lib/admin/auth';
import AdminLoginForm from '@/components/admin/AdminLoginForm';

export const metadata = { title: '员工登录 · 真和盛后台' };

export default async function AdminLoginPage() {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (token && verifyToken(token)) redirect('/admin');

  return (
    <div className="adm-login">
      <AdminLoginForm />
    </div>
  );
}
