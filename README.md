# web-reverse-lab：三个网站逆向小实验

目标站点：<https://quotes.toscrape.com> —— Zyte 官方提供的**专门用于练习爬虫的合法沙盒站**。请勿将这些技术用于未授权的商业网站。

| 目录 | 内容 |
|---|---|
| `01-scrape-automation/` | 逆向出隐藏的 JSON API，用 `requests` 直接拉全部名言（不解析 HTML） |
| `02-clone/` | 前端静态克隆 + 本地 mock 后端（实现同样的 `/api/quotes` 协议），可离线运行 |
| `03-modify-view/` | Tampermonkey 油猴脚本 + Chrome MV3 扩展，修改你看到的页面 |
| `docs/` | REA 真实输出、各实验在 box 上的真实测试输出 |

环境：Python 3.8+，（实验 3 测试可选）Node 18+。

---

## 01 · 抓取自动化：逆向数据 API

### 怎么发现接口的
1. 打开 `https://quotes.toscrape.com/scroll`（无限滚动页），HTML 里没有名言，内容是 JS 加载的。
2. 看页面源码中的内联脚本（或浏览器 DevTools → Network → XHR，滚动时可看到请求）：
   ```js
   $.get('/api/quotes', {page: page}).done(function(data) {
       appendQuotes(data.quotes);
       hasNextPage = data.has_next;
   ```
3. 用 REA 的 `analyze-web-bundle` 对页面做静态分析，同样自动定位到 `endpoint: /api/quotes, mechanism: call:$.get, line 18`（见 `docs/rea-commands.md`）。
4. 直接请求 `GET /api/quotes?page=1`，返回 `{quotes:[...], has_next, page, top_ten_tags, tag}`（样例：`docs/api-sample-page1.txt`）。翻页直到 `has_next=false`。

> 对比：`/js/` 页的数据是直接写在 HTML 内联 `<script>` 的变量里，没有 API。

### 运行
```bash
cd 01-scrape-automation
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python scrape_api.py        # 每页间隔 1 秒（礼貌延迟）
```
输出 `quotes.json`、`quotes.csv`。box 上实测：**10 页、100 条名言、50 位作者**（`docs/scrape-run-output.txt`）。

---

## 02 · 克隆：静态前端 + 本地 mock 后端

REA 没有 "clone website" 命令，所以这里是**手工克隆**：
- `site/index.html`：原站 `/scroll` 页的 HTML（`/login` 链接改为 `/`）
- `site/static/`：原站的 `bootstrap.min.css`、`main.css`、`jquery.js`
- `server.py`：纯 Python 标准库服务器，无需安装依赖；静态文件 + `GET /api/quotes?page=N`，返回格式与真站一致，数据来自 `quotes.json`（仓库已附带一份抓取结果）。

```bash
cd 02-clone
python server.py            # 默认 http://127.0.0.1:8000/
# 另开终端
curl "http://127.0.0.1:8000/api/quotes?page=1"
```
浏览器打开 <http://127.0.0.1:8000/>，向下滚动会无限加载，完全离线。
box 上实测（`docs/clone-test-output.txt`）：page 1 → 10 条 has_next=True；page 10 → 10 条 has_next=False；page 11 → 0 条；headless Chrome 渲染出 10 个 `.quote`。

---

## 03 · 修改视图：油猴脚本 / Chrome 扩展

功能（在 `quotes-enhancer.user.js` 顶部可改配置）：
- 隐藏带 `love` 标签的名言，顶部横幅显示隐藏了几条
- 高亮作者 `Albert Einstein`
- 每条名言加 “Copy quote” 按钮 + 单词数
- 用 MutationObserver 兼容 `/js/`、`/scroll` 等动态加载页；也匹配本地克隆 `http://127.0.0.1:8000/*`

### 安装（Tampermonkey）
1. Chrome/Edge/Firefox 安装 Tampermonkey 扩展。
2. Tampermonkey 图标 → “添加新脚本” → 粘贴 `quotes-enhancer.user.js` 全部内容 → 保存。
3. 打开 <https://quotes.toscrape.com/>。

### 安装（Chrome 扩展 MV3）
1. 打开 `chrome://extensions`，开启右上角“开发者模式”。
2. “加载已解压的扩展程序” → 选择 `03-modify-view/chrome-extension/`。

### 测试（可选）
```bash
cd 03-modify-view && npm install && npm test
```
用 jsdom 在真实首页 HTML 上执行脚本。box 上实测：10 条名言、隐藏 1 条、高亮 3 条、9 个复制按钮；ESLint 推荐规则 0 问题（`docs/userscript-test-output.txt`）。
