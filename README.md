# zhs-oversea

Dao culture oversea — 道家文化出海站

真和盛（Zhen He Sheng）海外独立站，对应中文站 [zhenhesheng.cn](https://zhenhesheng.cn)。
首个市场：**美国**，单一语种英语，单一币种美元。

**线上地址：https://zhenhesheng.com**

---

## 定位

以「帛书《德道经》81 章英译」为内容护城河，以「溯源可查的器物」为成交主体，
走「内容 → 信任 → 器物」的转化路径。不做低价玄学货，不做平台价格战。

## 目录结构

```
.
├── docs/                     规划与决策文档
│   ├── 海外站规划方案-v1.md       市场选择、竞品拆解、信息架构、支付方案
│   └── 执行方案-v2-决策锁定版.md   按已定决策展开的执行细则
├── mockup/                   首页视觉稿（home-v1.html）+ 素材
└── site/                     生产站源码（Next.js 15.5.28 App Router）
    ├── src/app/              页面路由与 API
    ├── src/components/       组件
    ├── src/lib/              商品数据、Stripe、运费、购物车、订单
    ├── src/data/             经典内容（章节 / 卦象 / 文章）
    └── scripts/
        ├── deploy.sh         一键部署（含推送）
        ├── push.sh           推送 GitHub（失败记账 / 自动补推）
        └── bump-version.sh   版本号递增
```

## 本地开发

```bash
cd site
npm install
cp .env.example .env.production   # 填入 Stripe 密钥
npm run dev
```

## 版本号与推送（每次修改必做）

**约定：默认迭代第三位版本号（patch）。每次代码修改完成后，执行一次递增，并推送 GitHub。**

```bash
cd site
npm run version:bump     # 0.0.2 → 0.0.3，commit + 打 tag + 推送（推送现在已是默认行为）
```

- 需要跳位时：`bash scripts/bump-version.sh minor`（第二位）或 `major`（第一位）
- 临时不想推送：`bash scripts/bump-version.sh --no-push`

版本号唯一来源是 `site/package.json` 的 `version` 字段，tag 形如 `v0.0.3`。
流程：改代码 → 提交 → `npm run version:bump` → 构建 → 部署（部署成功会自动再推一次）。

### 推送失败怎么办（网络不稳时）

推送失败**不阻塞**本地开发和部署，会自动记账，下次迭代补推：

```bash
npm run push           # 补推欠账 + 推送 main 与最新 tag；成功则自动清账
npm run push:status    # 只看欠账
npm run push -- --clear # 确认远端已一致时手工清账
```

- 欠账写在本机 `.workbuddy/pending-push.md`（含时间 / HEAD / tag / 失败原因），另有 `.workbuddy/push-history.log` 记录每次成败
- `version:bump` 和 `deploy.sh` 都会调用 `site/scripts/push.sh`，所以「下次迭代」会自动重试，不需要记着手动补
- 推送前会清掉 `HTTP(S)_PROXY`：沙箱代理会干扰 git 的 HTTPS 请求

## 部署

```bash
cd site
npm run build          # 产出 .next/standalone
bash scripts/deploy.sh # 构建→打包→备份→上传→重启→清缓存→健康检查
```

> ⚠️ 生产服务器 nginx 有全局 `proxy_cache`（inactive=1d），部署后必须清
> `/www/server/nginx/proxy_cache_dir` 并 reload，否则域名会返回旧 HTML。
> deploy.sh 已内置该步骤。

## 关键约定

| 项 | 约定 |
|---|---|
| 版本 | 语义化版本，当前 **v0.0.8**；每次修改递增第三位，见上文「版本号与推送」 |
| 推送 | 每次更新完都推 GitHub；网络失败本地记账（`.workbuddy/pending-push.md`），下次迭代自动补推 |
| 交易 | 实物走标准 Stripe + Stripe Tax；数字产品走 Stripe Managed Payments（MoR） |
| 结汇 | Airwallex 收单 → 万里汇结汇回大陆 |
| 合规 | 朱砂只做封闭封装展示级；CITES 物种逐 SKU 存证；全站无功效宣称 |
| 禁语 | 治愈 / 转运 / 招财 / 改命等功效词一律不用 |

## 已上线

- 18 个 SKU，6 品类，$28–$249
- 德道经 81 章骨架（10 章已译全文）+ 8 卦 + 八字 40 篇骨架
- 6 篇英文 Journal
- 政策五页（Shipping / Returns / Privacy / Terms / Imprint）
- sitemap 58 URL、结构化数据、OG

## 待办

- [ ] 香港公司注册 + Stripe 香港开户（当前 checkout 因缺密钥而降级）
- [ ] 商品图补拍（现为复用素材，多 SKU 共用同一张图）
- [ ] 接入真实库存
- [ ] 81 章英文全文按月补齐（流量主引擎）

---

MIT License — 详见 [LICENSE](./LICENSE)
