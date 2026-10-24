/**
 * 后台前端请求助手 —— 客户端组件统一调用 admin API
 *
 * 鉴权：凭证走 httpOnly Cookie（same-origin），无需手动传 token。
 * 权限在服务端 API 路由校验（requireStaff）；前端只负责展示与交互。
 */

export async function apiFetch<T = unknown>(
  path: string,
  opts: { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: unknown } = {}
): Promise<T> {
  const res = await fetch(path, {
    method: opts.method ?? 'GET',
    headers: opts.body ? { 'Content-Type': 'application/json' } : undefined,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    credentials: 'same-origin',
    cache: 'no-store',
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error((data && (data.error as string)) || `请求失败 (${res.status})`);
  }
  return data as T;
}
