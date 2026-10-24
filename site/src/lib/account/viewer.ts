/**
 * 服务端读取当前访客的收藏集合（供商品列表/卡片点亮心形）
 *
 * 未登录返回空集合，调用方无需判断登录态。
 */

import { currentUser } from './auth';
import { listFavorites } from './dao';

export async function viewerFavoriteSlugs(): Promise<Set<string>> {
  try {
    const user = await currentUser();
    if (!user) return new Set();
    return new Set(listFavorites(user.id).map((f) => f.slug));
  } catch {
    return new Set();
  }
}
