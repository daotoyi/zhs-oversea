/**
 * 界面文案 —— 简体中文（繁體由 OpenCC 转换派生）
 *
 * 只收录「界面框架」文案：导航、按钮、表单、页脚、购物车、信任条等。
 * 商品与经典内容的翻译见 ./zh-hans-content.ts
 */

export const UI_ZH = {
  // ── 顶部公告条 ──
  topbar: '美国满 $60 免运费 · 结账时已含关税 · 30 天无理由退换 · 每件礼器均附传承证书',

  // ── 导航 ──
  nav: {
    classics: '经典',
    objects: '器物',
    practice: '修习',
    traceability: '溯源',
    journal: '札记',
    about: '关于',
    search: '搜索',
    contact: '联系',
    bag: '购物袋',
    brandSub: '道家文化 · 生活',
  },

  // ── 信任条 ──
  trust: [
    { title: '传承可溯', desc: '每件礼器附证书编号与所属传承名号。' },
    { title: '材质有据', desc: '重金属经 ISO 17025 实验室检测；木作文种与 CITES 状态逐件标明。' },
    { title: '美国满 $60 免运费', desc: '北京发货，7–15 日达。关税与税费结账时一次结清。' },
    { title: '30 天退换', desc: '未使用、保持原包装即可退，退货运费由我们承担。' },
  ],

  // ── 通用 ──
  common: {
    home: '首页',
    objects: '器物',
    allObjects: '全部器物',
    viewAll: '查看全部',
    readMore: '阅读全文',
    backTo: '返回',
    loading: '载入中…',
    free: '免费',
    from: '起',
    soon: '即将刊出',
    addToCart: '加入购物袋',
    soldOut: '暂时无货',
    checkout: '结账',
    summary: '订单摘要',
    subtotal: '小计',
    shipping: '运费',
    estimatedDelivery: '预计送达',
    remove: '移除',
    emptyBag: '购物袋是空的。器物页是个不错的起点。',
    browseObjects: '去看器物',
    awayFromFreeShipping: '再买 {amount} 即可享美国免运费。',
    dutiesAtCheckout: '关税与美国各州销售税将在结账时计算。',
    businessDays: '个工作日',
    yourBag: '购物袋',
    search: '搜索',
    contact: '联系',
    account: '账户',
    freeShipping: '免运费',
    disclaimer: '本站所售为文化器物与出版物，不构成医疗、法律或财务建议。',
  },

  // ── 首页 ──
  home: {
    heroEyebrow: '北京 · 龙虎山一脉',
    heroSub:
      '帛书《德道经》八十一章英译，手作茶器、礼器香事、文房清供——每一件都溯得到制作者、材质与传承。',
    ctaExplore: '去看器物',
    ctaRead: '读《德道经》',
    heroNoteLabel: '第八章',
    originsEyebrow: '道之源',
    originsTitle: '一部从墓中取出的丝帛古本。',
    originsP1:
      '一九七三年，长沙马王堆的发掘者打开了一座封存两千年的墓。里面有两卷丝帛抄本，写着我们自以为早已读懂的文字。',
    originsP2:
      '它并非西方两百年来通行的那个《道德经》。它更粗、更直，章节次序不同，后世修润成格言的句子，在这里读起来更像指令。',
    originsItems: [
      { k: '本源', v: '以马王堆帛书为底本，逐句比对通行本' },
      { k: '传承', v: '龙虎山——历代公认的道教祖庭' },
      { k: '师承', v: '每周线上讲论，不限根底，皆可旁听' },
      { k: '修习', v: '茶、香、书、卜，皆为日课而非玄谈' },
    ],
    originsLink: '我们的传承 →',
    objectsEyebrow: '道之器',
    objectsTitle: '日课之器。',
    objectsLead: '由具名的手，在具名的作坊，用注明的材料做成。这里没有来路不明之物。',
    practiceEyebrow: '道之术',
    practiceTitle: '读一章，过一周。',
    practiceLead:
      '《德道经》的每一章都是一个提示，不是一堂课。我们把文本、每周的功课与几件趁手的器物配在一起，让它更容易被守住。',
    chapterFootObjects: '本章相关器物 · 3 件',
    chapterFootRead: '读第十二章 →',
    subTitle: '每周日一卦。',
    subDesc: '当周的卦象与简注，配一件意趣相投的器物。免费订阅，无需留卡。',
    subPlaceholder: 'your@email.com',
    subButton: '订阅',
    alsoInClassics: '经典另览',
    traceEyebrow: '溯源',
    traceTitle: '怎么知道手里这件是什么。',
    traceP1:
      '多数道家器物卖家不会告诉你材料从哪来、含什么金属、由谁开光。我们把这一页写在每件商品上——因为这是区分手艺与工业制造最直接的办法。',
    traceList: [
      '作坊、制作者与产地，全部具名',
      '材料完整注明——木种、合金、漆料',
      'ISO 17025 实验室报告编号，可查',
      '木作与香材的 CITES 附录状态，直说',
      '开光证书编号，可按传承核验',
    ],
    traceLink: '看我们的标准 →',
    traceCells: [
      { k: '检测机构', v: 'SGS', s: 'ISO/IEC 17025 · 重金属与溶出量' },
      { k: '报告编号', v: 'SGS-24-1187', s: '下单前可在商品页查阅' },
      { k: '开光传承', v: '证书 LHM-0436', s: '由龙虎山一脉出具' },
      { k: 'CITES 状态', v: '已声明', s: '附录 II 物种均附出口证明' },
    ],
    journalEyebrow: '道之美',
    journalTitle: '在寻常日子里读道。',
    practiceCta: '加入修习',
    membershipTitle: '会员',
    membershipPer: '/ 月',
    membershipNote: '一年 $169，可随时退订。',
    membershipFoot: '会员为数字产品，经我们的备案商户（MoR）渠道计费，全球各地税务由其代处理。',
    sessionsTitle: '讲论',
    sessionsPer: '/ 场',
    sessionsFoot:
      '讲论为直播并留存档。我们不提供一对一付费占卜：美国多个州对有偿占卜有法律限制，我们在当地亦无相关执照。',
  },

  // ── 器物列表 ──
  objectsPage: {
    eyebrow: '道之器 · 器物',
    title: '日课之器。',
    lead: '由具名的手，在具名的作坊，用注明的材料做成。每件商品页都带溯源记录——产地、检测、CITES 状态、开光证书。',
    filterAll: '全部',
    catTea: '茶器',
    catIncense: '香事',
    catWriting: '文房',
    catTalisman: '礼器',
    catHome: '居家',
    catBooks: '典籍',
    empty: '此类下暂无器物。',
  },

  // ── 商品详情 ──
  pdp: {
    traceTitle: '溯源',
    maker: '制作者',
    craft: '工艺',
    material: '材质',
    dimensions: '尺寸',
    laboratory: '检测报告',
    cites: 'CITES',
    consecration: '开光传承',
    displayNotice:
      '展示级器物。本品含欧盟 REACH 限制清单内的材质，已做隔绝皮肤接触的封装，仅供陈设与观赏。下单前请先阅上方检测报告。',
    prop65Notice:
      '加州 65 号提案警示。本品含有 65 号提案所列物质，所完成的检测以上方报告编号为准。',
    assurances: [
      '美国满 $60 免运费 · 结账时已含关税',
      '30 天退换，退货运费由我们承担',
      '北京发货并附单号 · 7–15 个工作日',
      '随附英文说明卡，讲述器物来历与用途',
    ],
    shipHintLight: '北京发货 —— 至美国 7–12 个工作日，全程保价。',
    shipHintHeavy: '较重或易碎 —— 至美国 8–14 个工作日，全程保价。',
    alsoInCat: '同类器物',
    variantLabel: '规格',
    priceCompare: '原价',
  },

  // ── 购物车 ──
  cartPage: {
    eyebrow: '购物袋',
    title: '结账',
    dutyNote: '关税与美国各州销售税在结账时计算。',
    openingCheckout: '正在打开安全结账…',
  },

  // ── 结账成功 ──
  checkoutSuccess: {
    title: '谢谢——已经在路上了。',
    p1: '确认邮件与单号已发到你的邮箱。包裹在北京两个工作日内发出，7–15 个工作日抵达美国。',
    p2:
      '每份订单都附一张英文说明卡，写明器物的来历、制作者，以及适用时的开光证书编号。收到后若有不明，写信给我们，有人会回。',
    backToObjects: '回到器物',
    readDao: '读《德道经》',
  },

  // ── 经典 ──
  classicsPage: {
    eyebrow: '道之法',
    title: '一章一章地读。',
    lead: '八十一章，皆自马王堆帛书出，逐章英译并附注。每章配一件意趣相投的器物。',
    daoDeJingMeta: '帛书德道经 · 八十一章',
    yijingMeta: '周易六十四卦',
    baziMeta: '四柱八字',
    baziLead:
      '四十篇入门：十天干、十二地支、如何从一个生辰排出一张盘，以及十神出现时意味着什么。写给从未见过命盘的人。',
    baziNote: '我们把它作为学问刊出，不出售占卜，也不声称一张盘能决定一个人的行止。',
    baziStart: '开始阅读 →',
    allChapters: '全部八十一章 →',
    allHexagrams: '全部六十四卦 →',
    forthcoming: '即将刊出',
    chapterCount: '章',
    monthlyNote: '按月陆续刊出。会员随写随得。',
    backToClassics: '← 经典',
    backToDaoDeJing: '← 德道经',
    backToYijing: '← 六十四卦',
    readingHeading: '读法',
    practiceHeading: '本周功课',
  },

  // ── 修习 ──
  practicePage: {
    eyebrow: '道之术',
    title: '一周一章，并且守得住。',
    lead: '《道德经》读完就放下，是最常见的结局。下面这部分是为了让它留下来：每周一卦、一场可以参加的讲论，以及几件让功课更容易握在手里的器物。',
    membershipTitle: '会员',
    membershipPer: '/ 月',
    membershipList: [
      '每周日一卦，附简注',
      '八十一章完整英译',
      '章节注文，抢先于公开发表',
      '限量器物优先购',
      '会员专享价，适用于每件礼器',
    ],
    membershipNote: '一年 $169，可随时退订。',
    membershipFoot: '会员为数字产品，经我们的备案商户（MoR）渠道计费，全球各地税务由其代处理。',
    freeTitle: '每周日一卦',
    freeList: ['每周一卦，附简注', '一件意趣相投的器物', '无需留卡'],
    sessionsTitle: '讲论',
    sessionsPer: '/ 场',
    sessionsFoot: '讲论为直播并留存档。我们不提供一对一付费占卜：美国多个州对有偿占卜有法律限制，我们在当地亦无相关执照。',
    objectsEyebrow: '修习之器',
    sessionsList: [
      '周二晚，线上——帛书《德道经》，梁坤老师主讲',
      '周日，线上——古汉字与书法，张灃老师主讲',
      '周三、周六，线下——通州本部，以道会友',
      '不限根底——完全不懂中文亦可参加',
    ],
  },

  // ── 札记 ──
  journalPage: {
    eyebrow: '道之美',
    title: '在寻常日子里读道。',
    lead: '关于古本、材料，以及一间做了十五年的作坊的日课。',
  },

  // ── 溯源 ──
  traceabilityPage: {
    eyebrow: '溯源',
    title: '怎么知道手里这件是什么。',
    lead: '多数道家器物卖家不会告诉你材料从哪来、含什么金属、由谁开光。这一页说明我们在每件商品上公布什么，以及你怎么核验——而不是听我们说。',
    standards: [
      {
        t: '产地',
        d: '每件商品写明作坊、制作者与产地。我们不经过未曾到访的中间商出货。',
      },
      {
        t: '材料',
        d: '完整注明——木作与香材标木种，金属标合金，漆与墨标成分。不用「传统材料」一笔带过。',
      },
      {
        t: '实验室检测',
        d: '检测在 ISO/IEC 17025 认可实验室完成。报告编号印在商品页，下单前可向我们索取全文。',
      },
      {
        t: 'CITES 状态',
        d: '檀香、小叶紫檀与沉香均列 CITES 附录 II，随货附出口证明，人工种植亦不例外。无法取证的物种，我们不上架。',
      },
      {
        t: '开光',
        d: '器物若经仪轨处理，我们写明传承、行者与日期，并印出证书编号。我们只陈述曾行此仪，不声称其效验。',
      },
      {
        t: '重金属',
        d: '含朱砂等受限材质的器物，一律隔绝皮肤接触，不作为佩戴品出售，并附重金属溶出检测报告。',
      },
    ],
    checkTitle: '核验一项说法',
    checkP:
      '每件商品页都载有制作者、产地、材料构成、实验室报告编号、CITES 状态，以及适用时的开光证书编号。若本页某处说法未在商品页得到体现，请视为我们的疏漏并写信告知——我们会更正，或撤回该商品。',
    checkLink: '报告一处不符 →',
  },

  // ── 关于 ──
  aboutPage: {
    eyebrow: '关于 · 真和盛',
    title: '我们读的，是真正被写下来的那个本子。',
    p1:
      '真和盛是北京的一间作坊，十五年来只做一件事：老子这篇文字到底说了什么？不是西方十九世纪以来通行的版本，而是一九七三年马王堆墓中丝帛上的那一个——粗、直、未加修饰。',
    p2:
      '这个差别比听起来重要。通行本被后世修润得极好读，好引用，也好叫人安心。帛书不是。',
    teachersH: '我们的老师',
    teachersP:
      '梁坤老师周二晚线上讲帛书《德道经》；张灃老师周日线上讲古汉字与书法源流。另有每周一次的线下聚讲，在通州本部，论古典修习。',
    craftH: '我们做什么',
    craftP:
      '我们只与少数几处作坊合作，不自设产线。茶器来自江苏宜兴与江西景德镇，文房来自广东端石与安徽竹刻，香由北京本坊手作。每件东西都做在叫得出名字的人手里。',
    standardH: '我们的标准',
    standardP:
      '我们把多数卖家不肯说的都写出来：制作者、产地、材料构成、实验室报告编号、CITES 状态、开光证书编号。这是唯一诚实的区分手艺与工业制造的办法，也让你可以核验我们，而不必听我们说。',
    contactH: '联系',
    contactP: '真和盛，中国北京通州。注册于中国香港特别行政区。书面来函一个工作日内必复——收信的是人。',
    contactLink: '联系我们 →',
  },

  // ── 联系 ──
  contactPage: {
    eyebrow: '联系',
    title: '写信到作坊。',
    p: '若某件器物的尺寸、材质或用途说不清——问就是。我们宁愿在您下单前答完，不愿在收货后应付。',
    emailH: '邮件',
    emailResponse: '周一至周六，一个工作日内回复。',
    addressH: '作坊地址',
    addressNote: '真和盛 · 中国北京通州',
    addressLegal: '注册于中国香港特别行政区——公司信息见法律声明页',
    beforeH: '写信之前',
    beforeNote: '运费、关税与退换，都写在运费页与退换页。多数疑问那里已有答案。',
  },

  // ── 政策页 ──
  policies: {
    eyebrow: '政策',
    shippingTitle: '运费与关税',
    returnsTitle: '退换与退款',
    privacyTitle: '隐私政策',
    termsTitle: '服务条款',
    imprintTitle: '法律声明',
  },

  // ── 页脚 ──
  footer: {
    about:
      '北京的一间作坊，以马王堆帛书一脉为业。器物、文本与修习——带给任何想从这里开始的人。',
    cnLink: '中文站 zhenhesheng.cn →',
    shopH: '器物',
    learnH: '学问',
    supportH: '服务',
    shipping: '运费与关税',
    returns: '退换',
    trace: '溯源标准',
    privacyTerms: '隐私与条款',
    imprint: '法律声明',
    copyright: '© 2026 真和盛 · 中国北京 · 注册于中国香港特别行政区',
    daoDeJing: '德道经',
    hexagrams: '六十四卦',
    fourPillars: '四柱八字',
    sessions: '每周讲论',
    journal: '札记',
    tea: '茶器',
    incense: '香事',
    writing: '文房',
    books: '典籍',
  },
} as const;
