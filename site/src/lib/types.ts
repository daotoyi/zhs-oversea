/**
 * 商品数据类型定义 —— 英文站唯一数据契约
 *
 * 设计要点：
 * 1. 合规字段与商品字段同表（cites / assay / prop65），避免漏填后无法上架
 * 2. 价格一律 USD 整数分存储，展示层格式化
 * 3. weightGrams + hsCode 必填 —— 直接决定运费结构与关税申报
 * 4. shipping 从北京发出，freightThresholdUsd 控制免运门槛
 */

export type ProductCategory =
  | 'tea-ware'
  | 'incense-ritual'
  | 'writing-desk'
  | 'talisman-objects'
  | 'home-altar'
  | 'apparel'
  | 'books';

export type CitesStatus = 'not-regulated' | 'regulated';

export type ProductVariant = {
  id: string;
  label: string;
  priceUsd: number;
  /** 该变体的重量（克），用于运费估算 */
  weightGrams: number;
  stock: number;
  sku: string;
};

export type Product = {
  slug: string;
  title: string;
  titleZh: string;
  category: ProductCategory;
  /** 一句话价值主张，英文 */
  tagline: string;
  description: string;
  priceUsd: number;
  compareAtUsd?: number;
  images: string[];
  variants: ProductVariant[];
  materials: string[];
  /** 尺寸，单位厘米 */
  dimensionsCm?: { w: number; h: number; d: number };
  weightGrams: number;
  /** 海关 HS 编码，申报与 DDP 算税用 */
  hsCode: string;
  /** CITES 管制状态 */
  cites: {
    status: CitesStatus;
    /** 物种学名，regulated 时必填 */
    species?: string;
    /** 出口/进口许可证编号，商品页公示 */
    permitNo?: string;
    /** 证书有效期 */
    validUntil?: string;
  };
  /** ISO 17025 检测报告 */
  assay?: {
    reportNo: string;
    lab: string;
    issuedAt: string;
    /** 检测项，如 heavy-metals / lead-cadmium-migration */
    scope: string[];
  };
  /** 加州 Prop 65 警示 */
  prop65Warning?: boolean;
  /** 是否为可佩戴物品（朱砂类必须为 false） */
  wearable: boolean;
  /** 是否含香精/精油（进欧盟需 IFRA + MSDS + CLP） */
  containsFragrance?: boolean;
  consecration?: {
    lineage: string;
    certificateNo: string;
    date: string;
  };
  maker: {
    name: string;
    region: string;
    /** 工艺描述 */
    craft: string;
  };
  freeShippingThresholdUsd: number;
  seo: {
    title: string;
    description: string;
    /** JSON-LD keywords */
    keywords: string[];
  };
  status: 'draft' | 'active' | 'sold-out';
};

/** 运费规则：按重量分档 */
export type ShippingRate = {
  id: string;
  label: string;
  maxWeightGrams: number;
  priceUsd: number;
  /** 预计送达天数 */
  minDays: number;
  maxDays: number;
};

export const FREE_SHIPPING_THRESHOLD_USD = 60;
export const FLAT_SHIPPING_USD = 12;

export const US_SHIPPING_RATES: ShippingRate[] = [
  { id: 'light', label: 'Light · 7–12 business days', maxWeightGrams: 500, priceUsd: 12, minDays: 7, maxDays: 12 },
  { id: 'standard', label: 'Standard · 8–14 business days', maxWeightGrams: 2000, priceUsd: 18, minDays: 8, maxDays: 14 },
  { id: 'heavy', label: 'Fragile · 10–18 business days', maxWeightGrams: 8000, priceUsd: 28, minDays: 10, maxDays: 18 },
];
