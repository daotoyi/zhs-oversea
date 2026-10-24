import type { Product } from './types';

/**
 * 首轮 SKU 清单（18 个）
 *
 * 选题原则：
 * 1. 覆盖 6 大品类，但重心落在「文房雅器 + 香道 + 经典书籍」—— 客单高、破损率低、物流成本占比小
 * 2. 朱砂类按决策 4 保留，但一律 wearable=false（展示级，封闭工艺）
 * 3. 沉香/檀香/紫檀按决策 5 保留，cites.status=regulated，permitNo 需从台账填入
 * 4. 每条都带 assay / maker / consecration 字段 —— 这是溯源页的数据基础
 *
 * 待补：库存量、真实照片（当前 public/products 需补拍）、检测报告编号、证书编号
 */

const products: Product[] = [
  // ─────────── 经典书籍 ───────────

  {
    slug: 'dao-de-jing-81-chapters',
    title: 'The Dao De Jing, in 81 Chapters',
    titleZh: '帛书德道经注释',
    category: 'books',
    tagline: 'The Mawangdui silk manuscript, in plain English — the text Laozi actually wrote down.',
    description:
      'Discovered in 1973 inside a sealed tomb in Changsha, this silk scroll had been untouched for two thousand years. Eighty-one chapters, unpolished, unrhymed. This edition presents the silk text with a facing English translation and plain-language commentary — not the smoother received edition the West has read for two centuries.',
    priceUsd: 3200,
    images: ['/products/dao-de-jing-book.jpg'],
    variants: [{ id: 'hardcover', label: 'Hardcover', priceUsd: 3200, weightGrams: 620, stock: 40, sku: 'ZHS-BK-001' }],
    materials: ['Archival paper', 'Hardcover cloth binding', 'Silk manuscript facsimile plate'],
    weightGrams: 620,
    hsCode: '4901.99',
    cites: { status: 'not-regulated' },
    wearable: false,
    maker: { name: 'Zhen He Sheng editorial studio', region: 'Beijing', craft: 'Typeset in-house; silk plate reproduced from the Hunan Museum scan' },
    freeShippingThresholdUsd: 60,
    seo: {
      title: 'The Dao De Jing in 81 Chapters — Mawangdui Silk Manuscript, English',
      description:
        'The Mawangdui silk text of the Dao De Jing with facing English translation and commentary. Eighty-one chapters, annotated for modern readers.',
      keywords: ['dao de jing', 'tao te ching silk manuscript', 'mawangdui', 'lao tzu english', '81 chapters'],
    },
    status: 'draft',
  },

  {
    slug: 'i-ching-sixty-four-hexagrams',
    title: 'The Sixty-Four Hexagrams, Explained',
    titleZh: '周易六十四卦详解',
    category: 'books',
    tagline: 'Every hexagram, with the judgement, the lines, and what it asks of a modern life.',
    description:
      'The Book of Changes read as a living text rather than a fortune. Each of the sixty-four hexagrams is given with its judgement and line commentary, the classical images, and a short reflection on where the pattern shows up in ordinary work and family life.',
    priceUsd: 3800,
    images: ['/products/yijing.png'],
    variants: [{ id: 'hardcover', label: 'Hardcover', priceUsd: 3800, weightGrams: 780, stock: 40, sku: 'ZHS-BK-002' }],
    materials: ['Archival paper', 'Hardcover cloth binding'],
    weightGrams: 780,
    hsCode: '4901.99',
    cites: { status: 'not-regulated' },
    wearable: false,
    maker: { name: 'Zhen He Sheng editorial studio', region: 'Beijing', craft: 'Typeset in-house; diagrams redrawn from the received text' },
    freeShippingThresholdUsd: 60,
    seo: {
      title: 'The Sixty-Four Hexagrams Explained — I Ching English Edition',
      description:
        'The I Ching Book of Changes, all sixty-four hexagrams with judgement, line commentary and modern reflection. A practical English edition.',
      keywords: ['i ching', 'book of changes', '64 hexagrams english', 'hexagram meaning', 'yijing'],
    },
    status: 'draft',
  },

  // ─────────── 文房雅器 ───────────

  {
    slug: 'calligraphy-shang-shan-ruo-shui',
    title: '“The Highest Good Is Like Water”',
    titleZh: '上善若水 · 手写书法',
    category: 'writing-desk',
    tagline: 'Chapter 8 of the silk text, brushed by hand and mounted for the wall.',
    description:
      'The opening of chapter eight — the passage on water that gives its name to the highest goodness — written in a single hand on archival paper and mounted in a plain wood frame. Every piece is brushed individually, so no two are identical.',
    priceUsd: 16800,
    images: ['/products/calligraphy-shangshan.jpg'],
    variants: [
      { id: 'frame-wood', label: 'Wood frame', priceUsd: 16800, weightGrams: 1450, stock: 12, sku: 'ZHS-WR-011' },
      { id: 'scroll', label: 'Hanging scroll', priceUsd: 22000, weightGrams: 1200, stock: 12, sku: 'ZHS-WR-012' },
    ],
    materials: ['Xuan paper', 'Pine wood frame', 'Iron-gall ink', 'Cinnabar seal paste'],
    dimensionsCm: { w: 40, h: 62, d: 4 },
    weightGrams: 1450,
    hsCode: '9701.10',
    cites: { status: 'not-regulated' },
    wearable: false,
    maker: { name: 'Hand-brushed in the Beijing studio', region: 'Beijing', craft: 'Brush calligraphy on xuan paper, mounted by hand' },
    freeShippingThresholdUsd: 60,
    seo: {
      title: 'Shang Shan Ruo Shui — Chapter 8 Calligraphy, Hand-Brushed',
      description:
        'Chapter 8 of the Dao De Jing as hand-brushed Chinese calligraphy on archival paper, mounted in a plain wood frame. One of a series.',
      keywords: ['shang shan ruo shui', 'dao de jing calligraphy', 'chinese calligraphy art', 'taoist wall art'],
    },
    status: 'draft',
  },

  {
    slug: 'calligraphy-zhi-xu-ji-ye',
    title: '“Reaching the Utmost Emptiness”',
    titleZh: '致虚极也 · 手写书法',
    category: 'writing-desk',
    tagline: 'Chapter 16 — the empty vessel, brushed by hand and mounted.',
    description:
      'Chapter sixteen of the silk text, the passage on keeping the mind empty like a vessel. Brushed by hand on xuan paper with the commentary written alongside, mounted in a light wood frame.',
    priceUsd: 16800,
    images: ['/products/calligraphy-zhixu.jpg'],
    variants: [{ id: 'frame-wood', label: 'Wood frame', priceUsd: 16800, weightGrams: 1450, stock: 12, sku: 'ZHS-WR-013' }],
    materials: ['Xuan paper', 'Pine wood frame', 'Iron-gall ink', 'Cinnabar seal paste'],
    dimensionsCm: { w: 40, h: 62, d: 4 },
    weightGrams: 1450,
    hsCode: '9701.10',
    cites: { status: 'not-regulated' },
    wearable: false,
    maker: { name: 'Hand-brushed in the Beijing studio', region: 'Beijing', craft: 'Brush calligraphy on xuan paper, mounted by hand' },
    freeShippingThresholdUsd: 60,
    seo: {
      title: 'Zhi Xu Ji Ye — Chapter 16 Calligraphy, Hand-Brushed',
      description: 'Chapter 16 of the Dao De Jing as hand-brushed calligraphy on archival paper, mounted in a wood frame.',
      keywords: ['zhi xu ji ye', 'chapter 16 dao de jing', 'chinese calligraphy', 'taoist art'],
    },
    status: 'draft',
  },

  {
    slug: 'duan-yan-four-treasures',
    title: 'Duan Inkstone & the Four Treasures',
    titleZh: '端砚文房四宝',
    category: 'writing-desk',
    tagline: 'A carved Duan inkstone with the ink, brush and paper to meet it.',
    description:
      'A Duan inkstone from the Guangdong stone quarries, hand-carved with the studio name and the date. Supplied with a stick of pine soot ink, a mixed-hair brush, and a sheet of xuan paper — the four treasures of the writing desk, in the form they take when they are bought to be used rather than displayed.',
    priceUsd: 24900,
    images: ['/products/dao-de-jing.png'],
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
    status: 'draft',
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
    images: ['/products/lightning-wood.jpg'],
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
    status: 'draft',
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
    images: ['/products/sanhe-wood.jpg'],
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
    status: 'draft',
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
    images: ['/products/tianguan.jpg'],
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
    status: 'draft',
  },

  // ─────────── 香道器物 ───────────

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
    images: ['/products/lightning-wood.jpg'],
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
    status: 'draft',
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
    images: ['/products/lightning-wood.jpg'],
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
    status: 'draft',
  },

  {
    slug: 'ai-cao-health-incense',
    title: 'Mugwort & Sandalwood Incense',
    titleZh: '养生香盒',
    category: 'incense-ritual',
    tagline: 'A blend of mugwort and sandalwood, in a box that travels well.',
    description:
      'A compact blend of mugwort and sandalwood in a sliding box, made for travel and for smaller rooms. The mugwort is from the Qichun growing area; the sandalwood is plantation-grown and CITES-documented.',
    priceUsd: 2800,
    images: ['/products/lightning-wood.jpg'],
    variants: [{ id: 'box', label: 'Box of 40', priceUsd: 2800, weightGrams: 320, stock: 25, sku: 'ZHS-IN-221' }],
    materials: ['Artemisia argyi (Qichun)', 'Sandalwood', 'Bamboo core', 'Sliding box'],
    weightGrams: 320,
    hsCode: '3307.41',
    cites: {
      status: 'regulated',
      species: 'Santalum album',
      permitNo: 'PENDING-FROM-CITES-LEDGER',
      validUntil: '2027-06-30',
    },
    wearable: false,
    containsFragrance: true,
    maker: { name: 'Zhen He Sheng incense workshop', region: 'Beijing', craft: 'Hand-blended and hand-rolled' },
    freeShippingThresholdUsd: 60,
    seo: {
      title: 'Mugwort and Sandalwood Incense — Travel Box of 40',
      description: 'A compact blend of Qichun mugwort and CITES-certified sandalwood in a sliding travel box. Forty hand-rolled sticks.',
      keywords: ['mugwort incense', 'ai cao incense', 'travel incense set', 'wellness incense'],
    },
    status: 'draft',
  },

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
    images: ['/products/cinnabar-bracelet.jpg'],
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
    status: 'draft',
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
    images: ['/products/cinnabar-bracelet.jpg'],
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
    status: 'draft',
  },

  {
    slug: 'lightning-struck-jujube-wood',
    title: 'Lightning-Struck Jujube Wood',
    titleZh: '雷击原木 · 护身符木',
    category: 'talisman-objects',
    tagline: 'Wood that lightning struck, as the old texts say it should be.',
    description:
      'Jujube wood that took a lightning strike. The old texts hold that wood so marked carries a different charge — not as a superstition but as a claim about the material, which is why the practice exists at all. Each piece is cut from a struck trunk and keeps its certificate of origin. Jujube is not CITES-listed; the certificate records the site and the date of the strike.',
    priceUsd: 7600,
    images: ['/products/lightning-wood.jpg'],
    variants: [{ id: 'single', label: 'Single piece', priceUsd: 7600, weightGrams: 220, stock: 16, sku: 'ZHS-TL-321' }],
    materials: ['Lightning-struck jujube wood (Ziziphus jujuba)'],
    dimensionsCm: { w: 14, h: 4, d: 4 },
    weightGrams: 220,
    hsCode: '4421.99',
    cites: { status: 'not-regulated' },
    wearable: false,
    maker: { name: 'Collected and cut by the studio', region: 'Hebei', craft: 'Cut from struck trunks; site and date recorded' },
    freeShippingThresholdUsd: 60,
    seo: {
      title: 'Lightning-Struck Jujube Wood — Hand-Cut with Origin Certificate',
      description:
        'Jujube wood struck by lightning, hand-cut and shipped with a certificate recording the site and date of the strike.',
      keywords: ['lightning struck wood', 'jujube wood amulet', 'thunder struck jujube', 'daoist wood talisman'],
    },
    status: 'draft',
  },

  {
    slug: 'three-harmonies-plaque',
    title: 'Three Harmonies Wooden Plaque',
    titleZh: '三合木局 · 桃木符牌',
    category: 'talisman-objects',
    tagline: 'Wood, ink and vermilion only, in the wood bureau tradition.',
    description:
      'A peach-wood plaque from the wood bureau tradition, marked with the three harmonies of your birth elements and brushed with ink and vermilion. The three-harmonies configuration pairs your day element with the element that supports it and the element it completes — wood and water for a wood day, and so on.',
    priceUsd: 4500,
    images: ['/products/sanhe-wood.jpg'],
    variants: [{ id: 'wood', label: 'Peach wood', priceUsd: 4500, weightGrams: 180, stock: 16, sku: 'ZHS-TL-331' }],
    materials: ['Peach wood', 'Ink', 'Cinnabar pigment'],
    dimensionsCm: { w: 12, h: 20, d: 2 },
    weightGrams: 180,
    hsCode: '4421.99',
    cites: { status: 'not-regulated' },
    wearable: false,
    prop65Warning: true,
    maker: { name: 'Zhen He Sheng wood bureau', region: 'Beijing', craft: 'Cut and brushed by hand in the wood bureau tradition' },
    freeShippingThresholdUsd: 60,
    seo: {
      title: 'Three Harmonies Wooden Plaque — Peach Wood, Birth Element',
      description:
        'A hand-brushed peach wood plaque marked with the three harmonies of your birth elements, in ink and vermilion.',
      keywords: ['three harmonies', 'san he', 'peach wood talisman', 'birth element charm', 'chinese astrological plaque'],
    },
    status: 'draft',
  },

  // ─────────── 风水摆件 ───────────

  {
    slug: 'heavenly-official-blessing',
    title: 'Heavenly Official Blessing',
    titleZh: '天官赐福 · 风水摆件',
    category: 'home-altar',
    tagline: 'The first of the three blessings, placed for the new year and kept.',
    description:
      'Tian Guan, the Heavenly Official, grants the first of the three blessings at the start of the lunar year — the blessing of a good beginning. This brass-and-enamel piece on a hardwood stand is set up in the first month and kept for the year. A clear space on a shelf, near the door of a home or a workroom, is enough.',
    priceUsd: 6900,
    images: ['/products/tianguan.jpg'],
    variants: [{ id: 'stand', label: 'With hardwood stand', priceUsd: 6900, weightGrams: 820, stock: 11, sku: 'ZHS-HM-401' }],
    materials: ['Brass', 'Enamel', 'Hardwood stand'],
    dimensionsCm: { w: 14, h: 20, d: 8 },
    weightGrams: 820,
    hsCode: '8302.42',
    cites: { status: 'not-regulated' },
    wearable: false,
    maker: { name: 'Zhen He Sheng metal workshop', region: 'Beijing', craft: 'Cast brass with hand-applied enamel' },
    freeShippingThresholdUsd: 60,
    seo: {
      title: 'Heavenly Official Blessing — Tian Guan Desktop Ornament',
      description:
        'A brass and enamel Tian Guan piece on a hardwood stand, the blessing of a good beginning at the start of the lunar year.',
      keywords: ['tian guan ci fu', 'heavenly official', 'feng shui ornament', 'chinese desk ornament', 'luck charm'],
    },
    status: 'draft',
  },

  {
    slug: 'fortune-set-miao-jie',
    title: 'The Twelve Double-Hour Hours',
    titleZh: '天干十义 · 十二时辰',
    category: 'home-altar',
    tagline: 'Twelve small pieces, one for each double-hour of the Chinese day.',
    description:
      'The Chinese day is divided into twelve double-hours, each with its own animal, element and character. This set is one small piece for each — twelve of them, made to be kept in a drawer and brought out when you want to read your own hours.',
    priceUsd: 9800,
    images: ['/products/tianguan.jpg'],
    variants: [{ id: 'set-12', label: 'Set of twelve', priceUsd: 9800, weightGrams: 2400, stock: 11, sku: 'ZHS-HM-411' }],
    materials: ['Mixed hardwood', 'Ink', 'Cinnabar pigment'],
    weightGrams: 2400,
    hsCode: '4421.99',
    cites: { status: 'not-regulated' },
    wearable: false,
    maker: { name: 'Zhen He Sheng wood bureau', region: 'Beijing', craft: 'Cut and brushed by hand' },
    freeShippingThresholdUsd: 60,
    seo: {
      title: 'The Twelve Double-Hour Hours — Chinese Zodiac Time Set',
      description:
        'Twelve hand-brushed pieces, one for each double-hour of the Chinese day, with its animal, element and character.',
      keywords: ['twelve double hours', 'chinese zodiac hours', 'shichen', 'chinese time keeping', 'zodiac set'],
    },
    status: 'draft',
  },

  {
    slug: 'red-envelope-luck-set',
    title: 'Red Envelope & Luck Set',
    titleZh: '福袋 · 开运套装',
    category: 'talisman-objects',
    tagline: 'The red envelope that carries a blessing, with the pieces that go in it.',
    description:
      'The red envelope is how a blessing is carried from one place to another — into a new home, a new year, a new business. This set is the envelope, written and sealed, together with the small pieces that go inside it.',
    priceUsd: 3900,
    images: ['/products/sanhe-wood.jpg'],
    variants: [{ id: 'standard', label: 'Envelope + two pieces', priceUsd: 3900, weightGrams: 240, stock: 16, sku: 'ZHS-TL-341' }],
    materials: ['Red paper envelope', 'Peach wood plaque', 'Ink', 'Cinnabar pigment'],
    weightGrams: 240,
    hsCode: '4823.91',
    cites: { status: 'not-regulated' },
    wearable: false,
    prop65Warning: true,
    maker: { name: 'Zhen He Sheng wood bureau', region: 'Beijing', craft: 'Written and sealed by hand' },
    freeShippingThresholdUsd: 60,
    seo: {
      title: 'Red Envelope Luck Set — Blessing Envelope with Wood Pieces',
      description:
        'A hand-written red envelope carrying a blessing, with peach wood plaques and a vermilion seal. For a new home or a new year.',
      keywords: ['red envelope gift', 'hongbao blessing', 'chinese gift set', 'new year envelope', 'luck set'],
    },
    status: 'draft',
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
