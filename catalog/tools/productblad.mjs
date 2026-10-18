#!/usr/bin/env node
// Productbladen (pdf, A4) uit de catalogus: catalog/images/productblad-<handle>.pdf.
// catalog/build.py hangt elk bestaand productblad aan custom.downloads van het product (fix 6b), de pagina
// Handleidingen en het blok Downloads op de productpagina tonen ze dan vanzelf.
//
// Alleen gegevens die al in de catalogus staan (kenmerk, specificaties, inhoud, uitvoeringen met SKU, verpakking,
// garantie, add-ons). Geen prijzen of voorraad: die veranderen, het blad verwijst daarvoor naar de productpagina.
// Een render wordt alleen opgenomen als hij al in catalog/images staat.
//
//   python3 catalog/build.py && node catalog/tools/productblad.mjs [--types "Easy-up partytent,Partytent"] [handle ...]
//   python3 catalog/build.py            # opnieuw, zodat de nieuwe pdf's aan custom.downloads hangen
//
// Standaard: alle tenten (product_type in TENT_TYPES). Benodigd: Node 22 met (globale) playwright + Chromium.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CATALOG = path.join(ROOT, 'catalog', 'catalog.json');
const IMAGES = path.join(ROOT, 'catalog', 'images');
const FONT = path.join(ROOT, 'brand', 'fonts', 'Figtree-VF.ttf');
const LOGO = path.join(ROOT, 'brand', 'logo.svg');
const TENT_TYPES = ['Easy-up partytent', 'Partytent', 'Opslagtent', 'Stretchtent', 'Stertent', 'Opblaasbare tent'];
const MAX_VARIANT_ROWS = 36;

const require = createRequire(import.meta.url);
function loadPlaywright() {
  try {
    return require('playwright');
  } catch {
    return require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
  }
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const kg = (grams) => (grams ? `${(grams / 1000).toLocaleString('nl-NL', { maximumFractionDigits: 1 })} kg` : '');
const firstParagraphs = (html, n = 2) =>
  [...String(html || '').matchAll(/<p>([\s\S]*?)<\/p>/g)]
    .slice(0, n)
    .map((m) => m[1].replace(/<(?!\/?(strong|em)\b)[^>]+>/g, ''))
    .filter(Boolean);

function variantTable(p) {
  const names = (p.options || []).map((o) => o.name).filter((n) => n && n !== 'Title');
  const vs = p.variants || [];
  if (!names.length || vs.length < 2) return '';
  if (vs.length > MAX_VARIANT_ROWS) {
    const rows = p.options.map((o) => `<tr><th>${esc(o.name)}</th><td>${o.values.map(esc).join(' · ')}</td></tr>`).join('');
    return `<h2>Uitvoeringen</h2><table class="kv">${rows}</table><p class="note">${vs.length} combinaties; de artikelnummers staan per uitvoering op de productpagina.</p>`;
  }
  const head = names.map((n) => `<th>${esc(n)}</th>`).join('');
  const rows = vs
    .map((v) => {
      const vals = [v.option1, v.option2, v.option3].slice(0, names.length).map((x) => `<td>${esc(x)}</td>`).join('');
      return `<tr>${vals}<td class="mono">${esc(v.sku)}</td><td class="num">${kg(v.grams)}</td></tr>`;
    })
    .join('');
  return `<h2>Uitvoeringen</h2><table class="grid"><thead><tr>${head}<th>Artikelnummer</th><th class="num">Gewicht</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function specTable(specs) {
  if (!specs?.length) return '';
  const groups = [];
  for (const s of specs) {
    let g = groups.find((x) => x.name === s.groep);
    if (!g) groups.push((g = { name: s.groep, rows: [] }));
    g.rows.push(s);
  }
  const body = groups
    .map(
      (g) =>
        `<tbody><tr class="group"><th colspan="2">${esc(g.name)}</th></tr>${g.rows
          .map((r) => `<tr><th>${esc(r.label)}</th><td>${esc(r.waarde)}</td></tr>`)
          .join('')}</tbody>`
    )
    .join('');
  return `<h2>Specificaties</h2><table class="kv specs">${body}</table>`;
}

const list = (title, items) => (items?.length ? `<div class="col"><h2>${esc(title)}</h2><ul>${items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>` : '');

function sheet(p, byHandle, shop, today) {
  const m = p.metafields || {};
  const hero = (p.images || []).map((i) => i.file).find((f) => f && fs.existsSync(path.join(IMAGES, f)));
  const heroImg = hero
    ? `<figure class="hero"><img src="${pathToFileURL(path.join(IMAGES, hero)).href}" alt=""></figure>`
    : '';
  const intro = firstParagraphs(p.body_html).map((t) => `<p>${t}</p>`).join('');
  const usps = m.usps?.length ? `<ul class="usps">${m.usps.map((u) => `<li>${esc(u)}</li>`).join('')}</ul>` : '';
  const addons = (m.addons || []).map((h) => byHandle[h]?.title).filter(Boolean);
  const pack = [
    m.verpakt && ['Verpakt', m.verpakt],
    m.gewicht_kg && (p.variants || []).length < 2 && ['Gewicht', `ca. ${String(m.gewicht_kg).replace('.', ',')} kg`],
    m.garantie && ['Garantie', m.garantie],
  ].filter(Boolean);
  const packTable = pack.length
    ? `<div class="col"><h2>Verpakking en garantie</h2><table class="kv">${pack.map(([a, b]) => `<tr><th>${esc(a)}</th><td>${esc(b)}</td></tr>`).join('')}</table></div>`
    : '';
  const url = `${shop.domain}/products/${p.handle}`;
  const logo = fs.readFileSync(LOGO, 'utf8').replace(/<title>[\s\S]*?<\/title>/, '');
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><title>Productblad ${esc(p.title)}</title><style>
  @font-face { font-family: Figtree; src: url('${pathToFileURL(FONT).href}') format('truetype'); font-weight: 300 900; }
  @page { size: A4; margin: 16mm 15mm 18mm; }
  :root { --inkt:#1D2420; --linnen:#ECE4D6; --lijn:#DDD2BF; --kiezel:#5D625C; --lampion:#E66414; }
  * { box-sizing: border-box; }
  html { background:#fff; }
  body { margin:0; font: 400 9.6pt/1.45 Figtree, system-ui, sans-serif; color: var(--inkt); }
  header.top { display:flex; justify-content:space-between; align-items:flex-end; padding-bottom:3mm; border-bottom:1.2mm solid var(--lampion); margin-bottom:6mm; }
  header.top svg { height:7mm; width:auto; }
  header.top .meta { font-size:8.5pt; color:var(--kiezel); text-align:right; }
  .eyebrow { font-size:8.5pt; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:var(--kiezel); margin:0 0 1.5mm; }
  h1 { font-size:21pt; line-height:1.12; font-weight:800; margin:0 0 1.5mm; }
  .kenmerk { font-size:11pt; font-weight:600; margin:0 0 4mm; }
  .lead { display:grid; grid-template-columns: ${hero ? '1fr 70mm' : '1fr'}; gap:6mm; align-items:start; }
  .lead p { margin:0 0 2.5mm; }
  .hero { margin:0; background:var(--linnen); border-radius:2mm; overflow:hidden; }
  .hero img { display:block; width:100%; height:auto; }
  ul.usps { list-style:none; padding:0; margin:3mm 0 0; }
  ul.usps li { padding:1.2mm 0 1.2mm 5mm; position:relative; border-top:.25mm solid var(--lijn); }
  ul.usps li::before { content:''; position:absolute; left:0; top:2.6mm; width:2.2mm; height:1.1mm; border-left:.5mm solid var(--inkt); border-bottom:.5mm solid var(--inkt); transform:rotate(-45deg); }
  h2 { font-size:11.5pt; font-weight:800; margin:6mm 0 2mm; break-after:avoid; }
  table { width:100%; border-collapse:collapse; font-size:9pt; }
  th, td { text-align:left; vertical-align:top; padding:1.3mm 2mm; border-bottom:.25mm solid var(--lijn); }
  table.kv th { width:38%; font-weight:600; }
  table.specs tr.group th { background:var(--linnen); font-weight:800; width:auto; }
  table.grid thead th { background:var(--linnen); font-weight:800; }
  tr { break-inside:avoid; }
  .num { text-align:right; white-space:nowrap; }
  .mono { font-variant-numeric: tabular-nums; letter-spacing:.01em; white-space:nowrap; }
  .cols { display:grid; grid-template-columns:1fr 1fr; gap:0 8mm; }
  .col ul { margin:0; padding-left:4.5mm; }
  .col li { margin:0 0 1mm; }
  .note { font-size:8.5pt; color:var(--kiezel); margin:1.5mm 0 0; }
  footer.end { margin-top:8mm; padding-top:3mm; border-top:.25mm solid var(--lijn); font-size:8.5pt; color:var(--kiezel); break-inside:avoid; }
  footer.end strong { color:var(--inkt); }
  </style></head><body>
  <header class="top">${logo}<div class="meta">Productblad · ${esc(today)}<br>${esc(shop.domain)} · ${esc(shop.email)}</div></header>
  <p class="eyebrow">${esc(p.product_type)}</p>
  <h1>${esc(p.title)}</h1>
  ${m.kenmerk_kort ? `<p class="kenmerk">${esc(m.kenmerk_kort)}</p>` : ''}
  <div class="lead"><div>${intro}${usps}</div>${heroImg}</div>
  <div class="cols">${list('Wat zit erin', m.included)}${list('Los te bestellen', m.excluded)}</div>
  ${specTable(m.specificaties)}
  ${variantTable(p)}
  <div class="cols">${packTable}${list('Handig erbij', addons)}</div>
  <footer class="end"><strong>Prijs, voorraad en levertijd</strong> zie je op ${esc(url)}. Dit blad toont de gegevens van ${esc(today)};
  maten en gewichten zijn circa-waarden. Vragen over opzetten of onderdelen? Mail ${esc(shop.email)} met de naam van het product.</footer>
  </body></html>`;
}

async function main() {
  const args = process.argv.slice(2);
  let types = TENT_TYPES;
  const ti = args.indexOf('--types');
  if (ti >= 0) {
    types = args[ti + 1].split(',').map((s) => s.trim());
    args.splice(ti, 2);
  }
  const cat = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
  const byHandle = Object.fromEntries(cat.products.map((p) => [p.handle, p]));
  const products = args.length ? args.map((h) => byHandle[h]).filter(Boolean) : cat.products.filter((p) => types.includes(p.product_type) && p.status !== 'draft');
  const today = new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'productblad-'));
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  let n = 0;
  for (const p of products) {
    const html = path.join(tmp, `${p.handle}.html`);
    fs.writeFileSync(html, sheet(p, byHandle, cat.shop, today));
    await page.goto(pathToFileURL(html).href, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const out = path.join(IMAGES, `productblad-${p.handle}.pdf`);
    await page.pdf({
      path: out,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: `<div style="font:7pt Figtree,sans-serif;color:#5D625C;width:100%;padding:0 15mm;display:flex;justify-content:space-between"><span>${esc(p.title)}</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
      margin: { top: '16mm', bottom: '18mm', left: '15mm', right: '15mm' },
    });
    n++;
    console.log(`${path.relative(ROOT, out)}  ${(fs.statSync(out).size / 1024).toFixed(0)} kB`);
  }
  await browser.close();
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`${n} productbladen`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
