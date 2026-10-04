import {crawlSite} from '../src/lib/crawler'
import {closeBrowser} from '../src/lib/render'
const url = process.argv[2] || 'https://cheerio.js.org'
const max = Number(process.argv[3] || 8)
const t0 = Date.now()
const pages = await crawlSite(url, {maxPages: max, onProgress: (d, q, u) => console.log(`  [${d}/${max}] queued=${q} ${u}`)})
console.log(`\n${pages.length} pages in ${((Date.now() - t0) / 1000).toFixed(1)}s, ${pages.filter((p) => p.rendered).length} rendered in Chrome`)
for (const p of pages) console.log(`- ${p.title.slice(0, 50)} | ${p.url} | ${p.markdown.length} chars${p.rendered ? ' | rendered' : ''}`)
console.log('\n--- sample ---\n' + (pages[0]?.markdown.slice(0, 700) ?? '(none)'))
await closeBrowser()
