// Sanity test: run the userscript against real HTML with jsdom.
// usage: npm i jsdom && node test_userscript.mjs
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
const html = await (await fetch('https://quotes.toscrape.com/')).text();
const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'https://quotes.toscrape.com/' });
dom.window.eval(fs.readFileSync(new URL('./quotes-enhancer.user.js', import.meta.url), 'utf8'));
const d = dom.window.document;
const all = d.querySelectorAll('.quote').length;
const hidden = [...d.querySelectorAll('.quote')].filter(q => q.style.display === 'none').length;
console.log({ quotes: all, hidden, highlighted: d.querySelectorAll('.qe-highlight').length,
  copyButtons: d.querySelectorAll('.qe-tools button').length,
  banner: d.querySelector('.qe-banner')?.textContent,
  firstWordCount: d.querySelector('.qe-tools')?.textContent });
