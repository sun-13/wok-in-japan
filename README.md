# wok-in-japan

在日本做中餐。私人菜单数据库 + 每日选菜小工具。
Personal Chinese cooking picker, using only ingredients you can actually buy in Japan.

## 这是什么

每天「今天吃什么」苦思冥想？这是一个私人小网站：

- **随机推荐**：一键选出一道今晚要做的菜
- **按筛选浏览**：按菜系（川 / 鲁 / 粤…）、餐型（主菜 / 凉菜 / 汤…）、难度、用时筛选
- **食材索引**：每样食材都标了在日本哪里买（普通超市 / 業務スーパー / 中華食材店…），以及替代品

## 数据

数据来源于个人手工整理（通过 Claude Cowork 生成），文件位于 `data/`：

- `dishes.json` — 菜品（含食材、步骤、tips）
- `ingredients.json` — 食材（含日文名、购买场所、季节）
- `cuisines.json` — 菜系字典
- `course_types.json` — 餐型字典
- `categories.json` — 食材分类
- `locations.json` — 在日本的购买场所
- `tags.json` — 食材标签

## 技术栈

- pnpm + Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4 + shadcn/ui
- 部署：Vercel（自动检测 Next.js）

UI 现为中文，食材同时显示日文。架构为多语言切换预留（消息文件在 `src/messages/`）。

## 开发

```sh
pnpm install
pnpm dev          # 本地开发
pnpm build        # 生产构建（全部页面 SSG）
pnpm start        # 启动生产服务器
pnpm lint         # ESLint
pnpm format       # Prettier 自动格式化
```

构建会把所有菜品 / 食材页面预渲染为静态 HTML，可直接部署到任何静态托管。

## 部署到 Vercel

1. 把这个 repo 推到 GitHub
2. 在 [vercel.com](https://vercel.com) 导入 repo
3. 直接 Deploy（Next.js + pnpm 全自动识别）
