/**
 * Stripe 客户端 —— 香港主体（决策 1）
 *
 * 两条通道：
 * 1. 实物文创 → 标准 Stripe Checkout + Stripe Tax（美国各州销售税）
 * 2. 数字产品 → Stripe Managed Payments（MoR，决策 3）
 *
 * 关键设计：客户端采用「懒初始化」。
 * 构建期（next build 收集页面数据）不需要密钥存在，只在真正发起支付请求时校验。
 * 这样构建机无需持有生产密钥，也让站点在支付未接入时仍可正常上线。
 */

import Stripe from 'stripe';

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (cached) return cached;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured — checkout is not yet enabled');
  }

  cached = new Stripe(key, {
    apiVersion: '2024-12-18.acacia',
    typescript: true,
    appInfo: {
      name: 'Zhen He Sheng — Dao Culture & Living',
      version: '0.1.0',
    },
  });

  return cached;
}

/** 保留旧调用名，内部走懒初始化 */
export const requireStripe = getStripe;

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zhenhesheng.com';

export function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }
  return secret;
}
