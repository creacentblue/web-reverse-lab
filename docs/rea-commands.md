# REA 使用记录（真实运行，rea v6.5.0）

REA 没有 "clone website" 命令（`rea --help` 中的网站相关命令为 inspect-web-page / analyze-web-bundle / export-web-scripts / capture-web-screenshot 等，均基于 Chrome DevTools Protocol）。因此本仓库的 02-clone 是**手工克隆**的。

```bash
unset NPM_CONFIG_PREFIX; source ~/.nvm/nvm.sh && nvm use 24
google-chrome --headless=new --remote-debugging-port=9333 --user-data-dir=/tmp/reachrome about:blank &
curl -s -X PUT "http://127.0.0.1:9333/json/new?https://quotes.toscrape.com/js/"
curl -s -X PUT "http://127.0.0.1:9333/json/new?https://quotes.toscrape.com/scroll"
rea list-browser-targets http://127.0.0.1:9333 --format json           > list-browser-targets.json
rea inspect-web-page   http://127.0.0.1:9333 <targetId> --format json   > inspect-web-page*.json
rea analyze-web-bundle http://127.0.0.1:9333 <targetId> --observation-ms 2000 --format json > analyze-web-bundle*.json
```

## 关键结果（摘自 rea/analyze-web-bundle-scroll.json 原文）

```json
"endpoints":[{"value":"/api/quotes","mechanism":"call:$.get","location":{"script_key":"scr_0c32ac6e...","line":18,"column":12}}]
```

- `/scroll` 页：REA 静态分析脚本后直接定位到 `$.get('/api/quotes', ...)`，即数据 API —— **有帮助**。
- `/js/` 页：只发现 2 个脚本（jquery.js + 一个 4458 字节的内联脚本），没有 endpoint —— 说明 /js/ 页的数据是**内联在 HTML 的 JS 变量里**，不走 API。
- `inspect-web-page` 在被动模式下 network_requests 为 0（页面已加载完成后才接入），对找 API 帮助不大。

原始输出见 `docs/rea/*.json`。
