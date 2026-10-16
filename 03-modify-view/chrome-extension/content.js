// ==UserScript==
// @name         Quotes Enhancer (web-reverse-lab)
// @namespace    https://github.com/creacentblue/web-reverse-lab
// @version      1.0.0
// @description  Hide a tag, highlight an author, add copy button + word count on quotes.toscrape.com
// @match        https://quotes.toscrape.com/*
// @match        http://127.0.0.1:8000/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  // ---- config ----
  const HIDE_TAG = 'love';                 // quotes with this tag are hidden
  const HIGHLIGHT_AUTHOR = 'Albert Einstein';

  const style = document.createElement('style');
  style.textContent = `
    .qe-highlight { background: #fff6c2 !important; border-left: 5px solid #f0b400 !important; }
    .qe-tools { margin-top: 6px; font-size: 12px; color: #666; }
    .qe-tools button { margin-right: 8px; font-size: 12px; cursor: pointer; }
    .qe-banner { background:#222; color:#fff; padding:6px 10px; font-size:13px; margin-bottom:10px; }
  `;
  document.head.appendChild(style);

  let hidden = 0;

  function enhance(q) {
    if (q.dataset.qeDone) return;
    q.dataset.qeDone = '1';
    const textEl = q.querySelector('.text');
    const author = (q.querySelector('.author') || {}).textContent || '';
    const tags = [...q.querySelectorAll('.tag')].map(t => t.textContent.trim());
    if (!textEl) return;

    if (tags.includes(HIDE_TAG)) { q.style.display = 'none'; hidden++; updateBanner(); return; }
    if (author.trim() === HIGHLIGHT_AUTHOR) q.classList.add('qe-highlight');

    const text = textEl.textContent.replace(/^[“"]|[”"]$/g, '').trim();
    const words = text.split(/\s+/).filter(Boolean).length;

    const bar = document.createElement('div');
    bar.className = 'qe-tools';
    const btn = document.createElement('button');
    btn.textContent = 'Copy quote';
    btn.addEventListener('click', () => {
      const payload = `"${text}" — ${author.trim()}`;
      const done = () => { btn.textContent = 'Copied!'; setTimeout(() => (btn.textContent = 'Copy quote'), 1200); };
      if (navigator.clipboard) navigator.clipboard.writeText(payload).then(done, () => fallback(payload, done));
      else fallback(payload, done);
    });
    bar.appendChild(btn);
    bar.appendChild(document.createTextNode(` ${words} words`));
    q.appendChild(bar);
  }

  function fallback(s, done) {
    const ta = document.createElement('textarea');
    ta.value = s; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); ta.remove(); done();
  }

  let banner;
  function updateBanner() {
    if (!banner) {
      banner = document.createElement('div');
      banner.className = 'qe-banner';
      const c = document.querySelector('.container') || document.body;
      c.insertBefore(banner, c.firstChild);
    }
    banner.textContent = `Quotes Enhancer: hidden ${hidden} quote(s) tagged "${HIDE_TAG}", highlighting ${HIGHLIGHT_AUTHOR}`;
  }

  function run() { document.querySelectorAll('.quote').forEach(enhance); updateBanner(); }
  run();
  // /js and /scroll pages insert quotes dynamically -> observe DOM changes
  new MutationObserver(run).observe(document.body, { childList: true, subtree: true });
})();
