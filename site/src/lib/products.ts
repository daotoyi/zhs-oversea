import type { Product } from './types';

/**
 * 商品种子 —— 与国内文创站 https://zhenhesheng.cn/shop.html 对齐（2026-10 重新校准）
 *
 * 校准原则：
 * 1. 前台「器物」页商品集合完全对齐 shop.html 的 12 件文创雅器
 * 2. 图片直接复用 shop 资源（https://zhenhesheng.cn/images/products/product-0X.png）
 * 3. 品类沿用站内 6+1 分类；shop 的「服饰配件」映射到新增的 apparel
 * 4. 国内站没有的 9 件海外独有商品（书法×2、养生香、雷击木、三合符牌、福袋、天官赐福、
 *    十二时辰、周易）已移出种子；其在线上 DB 的行由 scripts/sync-products.mjs 置为 archived
 *
 * 待补：真实照片替换、库存量核对（当前沿用既有估算）、检测报告/证书编号
 */

const SHOP_IMG = (n: number) => `https://zhenhesheng.cn/images/products/product-${String(n).padStart(2, '0')}.png`;

const products: Product[] = [
  // ─────────── 开运饰品 ───────────

  {
    slug: 'cinnabar-hetian-jade-bracelet',
    title: 'Cinnabar & Hetian Jade Bracelet',
    titleZh: '天然朱砂手串 · 和田玉',
    category: 'talisman-objects',
    tagline: 'Natural cinnabar sealed in silver, with a Hetian jade bead. A display piece, never worn.',
    description:
      'Cinnabar contains mercury sulfide, so this bracelet is sealed inside a silver cage and made to be looked at rather than worn against the skin. A single Hetian jade bead sits among the cinnabar beads. Ships with an ISO 17025 heavy-metal assay report whose number is printed on the product page — read it before you buy, not after.',
    priceUsd: 8800,
    images: [SHOP_IMG(1)],
    variants: [{ id: 'standard', label: 'Standard · 18 beads', priceUsd: 8800, weightGrams: 65, stock: 16, sku: 'ZHS-TL-301' }],
    materials: ['Natural cinnabar (HgS)', 'Sterling silver cage', 'Hetian jade', 'Silk cord'],
    weightGrams: 65,
    hsCode: '7103.99',
    cites: { status: 'not-regulated' },
    assay: {
      reportNo: 'PENDING-SGS-ASSAY',
      lab: 'SGS',
      issuedAt: '2026-11-15',
      scope: ['mercury', 'lead', 'cadmium', 'nickel release'],
    },
    prop65Warning: true,
    wearable: false,
    maker: { name: 'Zhen He Sheng silver workshop', region: 'Beijing', craft: 'Beads hand-cut and caged in sterling silver' },
    freeShippingThresholdUsd: 60,
    seo: {
      title: 'Cinnabar and Hetian Jade Bracelet — Sealed, Display Only',
      description:
        'A bracelet of natural cinnabar sealed in sterling silver with a Hetian jade bead. Ships with an ISO 17025 heavy-metal assay report. Display only.',
      keywords: ['cinnabar bracelet', 'cinnabar crystal', 'hetian jade bracelet', 'taiji bead', 'feng shui bracelet'],
    },
    status: 'active',
  },

  {
    slug: 'red-sandalwood-prayer-beads',
    title: 'Red Sandalwood Prayer Beads',
    titleZh: '小叶紫檀念珠',
    category: 'talisman-objects',
    tagline: 'Indian red sandalwood, 108 beads, oiled by hand.',
    description:
      'One hundred and eight beads of Indian red sandalwood, turned and strung by hand, the traditional count for a round of practice. The wood is CITES-listed and comes with its export certificate. Sandalwood is listed under Appendix II and is permitted with certification.',
    priceUsd: 11900,
    images: [SHOP_IMG(2)],
    variants: [{ id: 'standard', label: '108 beads', priceUsd: 11900, weightGrams: 95, stock: 16, sku: 'ZHS-TL-311' }],
    materials: ['Pterocarpus santalinus (red sandalwood)', 'Silk cord'],
    weightGrams: 95,
    hsCode: '4421.99',
    cites: {
      status: 'regulated',
      species: 'Pterocarpus santalinus',
      permitNo: 'PENDING-FROM-CITES-LEDGER',
      validUntil: '2027-03-31',
    },
    wearable: false,
    maker: { name: 'Zhen He Sheng bead workshop', region: 'Beijing', craft: 'Turned and strung by hand; oiled finish' },
    freeShippingThresholdUsd: 60,
    seo: {
      title: 'Red Sandalwood Prayer Beads, 108 — Pterocarpus santalinus',
      description:
        'One hundred and eight hand-turned beads of CITES-certified Indian red sandalwood, on silk cord. The traditional practice count.',
      keywords: ['red sandalwood beads', '108 beads', 'pueraria prayer beads', 'tibetan mala', 'zhen niu'],
    },
    status: 'active',
  },

  // ─────────── 香薰禅修 ───────────

  {
    slug: 'sandalwood-incense-set',
    title: 'Sandalwood Incense Gift Set',
    titleZh: '檀香线香礼盒',
    category: 'incense-ritual',
    tagline: 'Pure sandalwood sticks in a box made for the end of a working day.',
    description:
      'Sandalwood sticks blended without added fragrance oils, in a lidded box that keeps them dry. A set of thirty, with a small brass ash stand and a pair of brass tongs — enough to run a proper sitting rather than a token one. Sandalwood is listed under CITES Appendix II, so every shipment carries its export certificate.',
    priceUsd: 5800,
    compareAtUsd: 6800,
    images: [SHOP_IMG(3)],
    variants: [{ id: 'box-30', label: 'Box of 30 + stand', priceUsd: 5800, weightGrams: 720, stock: 25, sku: 'ZHS-IN-201' }],
    materials: ['Sandalwood (Santalum album) powder', 'Brass ash stand', 'Folding box'],
    weightGrams: 720,
    hsCode: '3307.41',
    cites: {
      status: 'regulated',
      species: 'Santalum album',
      permitNo: 'PENDING-FROM-CITES-LEDGER',
      validUntil: '2027-06-30',
    },
    wearable: false,
    containsFragrance: true,
    maker: { name: 'Zhen He Sheng incense workshop', region: 'Beijing', craft: 'Hand-rolled sticks; no added fragrance oils' },
    freeShippingThresholdUsd: 60,
    seo: {
      title: 'Sandalwood Incense Sticks Gift Set with Brass Ash Stand',
      description:
        'Thirty pure sandalwood incense sticks with a brass ash stand and tongs, in a lidded box. CITES-certified sandalwood.',
      keywords: ['sandalwood incense', 'taoist incense', 'incense sticks gift set', 'meditation incense', 'agarwood'],
    },
    status: 'active',
  },

  {
    slug: 'gilt-lotus-incense-burner',
    title: 'Gilt Lotus Incense Burner',
    titleZh: '铜鎏金莲花香炉',
    category: 'incense-ritual',
    tagline: 'A small brass burner in the shape of a lotus, for a single stick.',
    description:
      'Cast brass, gilded and finished by hand, with a lotus-form lid that lifts to rest the stick across the rim. Sized for a single stick rather than a full session, so it can sit on a desk without becoming furniture.',
    priceUsd: 6800,
    images: [SHOP_IMG(4)],
    variants: [{ id: 'single', label: 'Single stick', priceUsd: 6800, weightGrams: 480, stock: 25, sku: 'ZHS-IN-211' }],
    materials: ['Cast brass', 'Hand-applied gilding'],
    dimensionsCm: { w: 9, h: 11, d: 9 },
    weightGrams: 480,
    hsCode: '7323.91',
    cites: { status: 'not-regulated' },
    wearable: false,
    maker: { name: 'Zhen He Sheng metal workshop', region: 'Beijing', craft: 'Cast, chased and gilded by hand' },
    freeShippingThresholdUsd: 60,
    seo: {
      title: 'Gilt Lotus Brass Incense Burner — Daoist Ritual Vessel',
      description: 'A small hand-gilded brass incense burner in the shape of a lotus, sized for a single stick of incense.',
      keywords: ['incense burner', 'lotus incense holder', 'brass censer', 'daoist ritual object'],
    },
    status: 'active',
  },

  // ─────────── 文房雅器 ───────────

  {
    slug: 'duan-yan-four-treasures',
    title: 'Duan Inkstone & the Four Treasures',
    titleZh: '端砚文房四宝',
    category: 'writing-desk',
    tagline: 'A carved Duan inkstone with the ink, brush and paper to meet it.',
    description:
      'A Duan inkstone from the Guangdong stone quarries, hand-carved with the studio name and the date. Supplied with a stick of pine soot ink, a mixed-hair brush, and a sheet of xuan paper — the four treasures of the writing desk, in the form they take when they are bought to be used rather than displayed.',
    priceUsd: 24900,
    images: [SHOP_IMG(5)],
    variants: [{ id: 'standard', label: 'Standard set', priceUsd: 24900, weightGrams: 2600, stock: 12, sku: 'ZHS-WR-021' }],
    materials: ['Duan stone', 'Pine soot ink', 'Mixed hair brush', 'Xuan paper'],
    dimensionsCm: { w: 22, h: 14, d: 4 },
    weightGrams: 2600,
    hsCode: '6802.99',
    cites: { status: 'not-regulated' },
    wearable: false,
    maker: { name: 'Duan stone workshop, Zhaoqing', region: 'Guangdong', craft: 'Hand-carved inkstone; ink and brush made in-house' },
    freeShippingThresholdUsd: 60,
    seo: {
      title: 'Duan Inkstone and the Four Treasures of the Study',
      description:
        'A hand-carved Duan inkstone from Guangdong with ink, brush and xuan paper. The Chinese scholar’s four treasures, sold as a working set.',
      keywords: ['duan inkstone', 'four treasures of the study', 'chinese calligraphy set', 's chinese scholar supplies'],
    },
    status: 'active',
  },

  {
    slug: 'bamboo-carved-paper-weights',
    title: 'Bamboo Paper Weights, Pair',
    titleZh: '竹雕镇纸一对',
    category: 'writing-desk',
    tagline: 'Two carved bamboo weights, holding a page down and the desk still.',
    description:
      'A matched pair of bamboo paper weights, carved with the Heart Sutra. Bamboo is the material the old texts prefer for exactly this purpose — heavy enough to hold a page against a draught, quiet on the surface, and warm in the hand.',
    priceUsd: 8800,
    images: [SHOP_IMG(6)],
    variants: [{ id: 'pair', label: 'Pair', priceUsd: 8800, weightGrams: 520, stock: 12, sku: 'ZHS-WR-031' }],
    materials: ['Bamboo', 'Natural wax finish'],
    dimensionsCm: { w: 18, h: 3, d: 3 },
    weightGrams: 520,
    hsCode: '4421.99',
    cites: { status: 'not-regulated' },
    wearable: false,
    maker: { name: 'Bamboo carving workshop', region: 'Anhui', craft: 'Hand-carved, natural wax finish' },
    freeShippingThresholdUsd: 60,
    seo: {
      title: 'Bamboo Paper Weights, Hand-Carved Pair',
      description: 'A pair of carved bamboo paper weights with the Heart Sutra, for holding pages and calming a desk.',
      keywords: ['bamboo paper weight', 'chinese desk accessories', 'paperweight pair', 'feng shui desk'],
    },
    status: 'active',
  },

  // ─────────── 茶道器具 ───────────

  {
    slug: 'yixing-clay-teapot',
    title: 'Yixing Clay Teapot',
    titleZh: '宜兴紫砂壶',
    category: 'tea-ware',
    tagline: 'Thrown from original Yixing ore, unglazed, and meant to be used daily.',
    description:
      'Made from the original ore of the Yixing hills rather than a blend, unglazed so the surface takes on the tea over time. Shaped by hand — the weight in the palm and the arc of the spout vary slightly from pot to pot, which is how you tell a thrown pot from a moulded one.',
    priceUsd: 12900,
    images: [SHOP_IMG(7)],
    variants: [
      { id: 'small', label: 'Small · 180ml', priceUsd: 12900, weightGrams: 340, stock: 9, sku: 'ZHS-TW-101' },
      { id: 'large', label: 'Large · 320ml', priceUsd: 15900, weightGrams: 480, stock: 9, sku: 'ZHS-TW-102' },
    ],
    materials: ['Yixing zisha clay (original ore)', 'Unglazed exterior'],
    dimensionsCm: { w: 14, h: 9, d: 11 },
    weightGrams: 340,
    hsCode: '6912.00',
    cites: { status: 'not-regulated' },
    wearable: false,
    maker: { name: 'Yixing pottery workshop', region: 'Jiangsu', craft: 'Thrown and finished by hand; natural unglazed finish' },
    freeShippingThresholdUsd: 60,
    seo: {
      title: 'Yixing Zisha Clay Teapot — Original Ore, Hand-Thrown',
      description:
        'A hand-thrown Yixing clay teapot made from original ore and left unglazed so it seasons with use. Comes in 180ml and 320ml.',
      keywords: ['yixing teapot', 'zisha clay', 'chinese teapot', 'purple clay teapot', 'gongfu tea'],
    },
    status: 'active',
  },

  {
    slug: 'blue-white-gaiwan-set',
    title: 'Blue-and-White Gaiwan Set',
    titleZh: '青花盖碗茶具',
    category: 'tea-ware',
    tagline: 'A Jingdezhen gaiwan with saucer and three cups, painted in cobalt.',
    description:
      'A covered bowl from Jingdezhen with its saucer and three cups, hand-painted in cobalt blue. The gaiwan is the everyday vessel of the tea table — it brews evenly, pours cleanly, and covers well enough to hold heat through a long session.',
    priceUsd: 8900,
    images: [SHOP_IMG(8)],
    variants: [{ id: 'set', label: 'Gaiwan, saucer, 3 cups', priceUsd: 8900, weightGrams: 1450, stock: 9, sku: 'ZHS-TW-111' }],
    materials: ['Porcelain', 'Cobalt underglaze'],
    dimensionsCm: { w: 20, h: 12, d: 20 },
    weightGrams: 1450,
    hsCode: '6912.00',
    cites: { status: 'not-regulated' },
    wearable: false,
    maker: { name: 'Jingdezhen porcelain studio', region: 'Jiangxi', craft: 'Hand-painted cobalt underglaze, high-fired' },
    freeShippingThresholdUsd: 60,
    seo: {
      title: 'Blue-and-White Porcelain Gaiwan Tea Set — Jingdezhen',
      description:
        'A hand-painted blue-and-white gaiwan from Jingdezhen with saucer and three cups. The everyday vessel of the Chinese tea table.',
      keywords: ['gaiwan', 'blue and white porcelain', 'jingdezhen tea set', 'chinese tea ceremony set'],
    },
    status: 'active',
  },

  // ─────────── 风水摆件 ───────────

  {
    slug: 'brass-feng-shui-luopan',
    title: 'Brass Feng Shui Compass (Luopan)',
    titleZh: '黄铜风水罗盘',
    category: 'home-altar',
    tagline: 'A brass luopan with the twenty-four mountains, for reading a space.',
    description:
      'Cast brass with the full twenty-four mountain divisions, the eight trigrams and the ten stems engraved around the dial. Used in the traditional survey of a dwelling — to read orientation, light and the flow of a room. Rests on a small wooden stand, and the disc turns in the hand.',
    priceUsd: 4800,
    images: [SHOP_IMG(9)],
    variants: [{ id: 'standard', label: 'Standard', priceUsd: 4800, weightGrams: 820, stock: 11, sku: 'ZHS-HM-421' }],
    materials: ['Cast brass', 'Wooden stand'],
    dimensionsCm: { w: 12, h: 12, d: 3 },
    weightGrams: 820,
    hsCode: '7323.91',
    cites: { status: 'not-regulated' },
    wearable: false,
    maker: { name: 'Zhen He Sheng metal workshop', region: 'Beijing', craft: 'Cast and engraved by hand' },
    freeShippingThresholdUsd: 60,
    seo: {
      title: 'Brass Feng Shui Compass — Luopan with 24 Mountains',
      description:
        'A hand-cast brass luopan with the twenty-four mountain divisions and trigrams, on a wooden stand. For reading the orientation of a space.',
      keywords: ['feng shui compass', 'luopan', 'brass compass', 'chinese compass', 'feng shui tool'],
    },
    status: 'active',
  },

  {
    slug: 'natural-gourd-pendant',
    title: 'Natural Gourd Pendant',
    titleZh: '天然葫芦挂件',
    category: 'home-altar',
    tagline: 'A dried gourd, hung for the home.',
    description:
      'A naturally grown gourd, dried and fitted with a silk cord for hanging. In the old household practice a gourd by the door is kept for luck and to steady a space. Each one differs in shape, as gourds do — no two are alike.',
    priceUsd: 1800,
    images: [SHOP_IMG(10)],
    variants: [{ id: 'standard', label: 'Single pendant', priceUsd: 1800, weightGrams: 120, stock: 16, sku: 'ZHS-HM-431' }],
    materials: ['Dried natural gourd', 'Silk cord'],
    dimensionsCm: { w: 6, h: 10, d: 6 },
    weightGrams: 120,
    hsCode: '1404.90',
    cites: { status: 'not-regulated' },
    wearable: false,
    maker: { name: 'Collected and fitted by the studio', region: 'Hebei', craft: 'Dried and corded by hand' },
    freeShippingThresholdUsd: 60,
    seo: {
      title: 'Natural Gourd Pendant — Dried Gourd with Silk Cord',
      description:
        'A dried natural gourd fitted with a silk cord for hanging by a door. Each gourd differs in shape. A household charm in the old practice.',
      keywords: ['gourd pendant', 'hulu', 'chinese good luck charm', 'natural gourd', 'door hanging'],
    },
    status: 'active',
  },

  // ─────────── 服饰配件 ───────────

  {
    slug: 'cotton-linen-meditation-robe',
    title: 'Cotton & Linen Meditation Robe',
    titleZh: '棉麻禅修服',
    category: 'apparel',
    tagline: 'Loose cotton-linen wear for sitting and moving.',
    description:
      'A loose robe in natural cotton and linen, breathable for sitting practice and gentle movement. Cut roomy so it does not bind at the shoulders or knees. Offered in undyed natural or charcoal, one size that fits most.',
    priceUsd: 6800,
    images: [SHOP_IMG(11)],
    variants: [
      { id: 'natural', label: 'Natural', priceUsd: 6800, weightGrams: 600, stock: 14, sku: 'ZHS-AP-101' },
      { id: 'charcoal', label: 'Charcoal', priceUsd: 6800, weightGrams: 600, stock: 14, sku: 'ZHS-AP-102' },
    ],
    materials: ['Cotton', 'Linen'],
    weightGrams: 600,
    hsCode: '6211.43',
    cites: { status: 'not-regulated' },
    wearable: false,
    maker: { name: 'Zhen He Sheng textile workshop', region: 'Shandong', craft: 'Cut and sewn in-house' },
    freeShippingThresholdUsd: 60,
    seo: {
      title: 'Cotton & Linen Meditation Robe — Loose Practice Wear',
      description:
        'A loose cotton-linen robe for sitting and gentle movement, in natural or charcoal. Roomy cut, one size.',
      keywords: ['meditation robe', 'zen clothing', 'cotton linen robe', 'taoist robe', 'practice wear'],
    },
    status: 'active',
  },

  // ─────────── 书籍经典 ───────────

  {
    slug: 'dao-de-jing-81-chapters',
    title: 'The Dao De Jing, Silk Manuscript — Annotated',
    titleZh: '帛书道德经注译',
    category: 'books',
    tagline: 'The Mawangdui silk manuscript, annotated chapter by chapter.',
    description:
      'The Mawangdui silk manuscript of the Dao De Jing, presented chapter by chapter with plain-language annotation and a simplified-character comparison alongside. Discovered in 1973 inside a sealed tomb in Changsha, this is the text as it was actually written down — unpolished, unrhymed, older than the received edition the West has read for two centuries.',
    priceUsd: 3200,
    images: [SHOP_IMG(12)],
    variants: [{ id: 'hardcover', label: 'Hardcover', priceUsd: 3200, weightGrams: 620, stock: 40, sku: 'ZHS-BK-001' }],
    materials: ['Archival paper', 'Hardcover cloth binding', 'Silk manuscript facsimile plate'],
    weightGrams: 620,
    hsCode: '4901.99',
    cites: { status: 'not-regulated' },
    wearable: false,
    maker: { name: 'Zhen He Sheng editorial studio', region: 'Beijing', craft: 'Typeset in-house; silk plate reproduced from the Hunan Museum scan' },
    freeShippingThresholdUsd: 60,
    seo: {
      title: 'The Dao De Jing, Silk Manuscript — Annotated Edition',
      description:
        'The Mawangdui silk text of the Dao De Jing, annotated chapter by chapter with a simplified-character comparison. Eighty-one chapters.',
      keywords: ['dao de jing', 'tao te ching silk manuscript', 'mawangdui', 'lao tzu english', '81 chapters'],
    },
    status: 'active',
  },
];

export function getProducts(): Product[] {
  return products;
}

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductsByCategory(category: Product['category']): Product[] {
  return products.filter((p) => p.category === category);
}

export function getRelatedProducts(product: Product, limit = 3): Product[] {
  return products.filter((p) => p.slug !== product.slug && p.category === product.category).slice(0, limit);
}
