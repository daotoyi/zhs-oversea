import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE } from '@/lib/admin/auth';
import { publicRedirect } from '@/lib/admin/http';

export async function POST(req: NextRequest) {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  return publicRedirect(req, '/admin/login');
}
