#!/usr/bin/env node
// Compare the theme in a store with theme/ and upload what is missing or different, through the Admin API. Shopify
// validates every file on upload and rejects the ones it does not accept; this prints its reason per file, which a
// zip upload in the admin only shows once.
//
//   node scripts/theme/sync.mjs                  list differences with the published theme (read only)
//   node scripts/theme/sync.mjs --push           upload the missing and changed files to it
//   node scripts/theme/sync.mjs --theme <id> …   another theme than the published one
//   --only sections/header-group.json,templates/product.json   limit to these files
//
// Credentials as in scripts/seed/seed.mjs (SHOPIFY_STORE + SHOPIFY_CLIENT_ID/SECRET, or SHOPIFY_ADMIN_TOKEN). Needs the
// access scopes read_themes (and write_themes for --push).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'theme');
const VERSION = '2026-07';
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const opt = (n) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : null);
const only = opt('--only') ? new Set(opt('--only').split(',')) : null;
let store = process.env.SHOPIFY_STORE || '';
if (store && !store.includes('.')) store += '.myshopify.com';

async function token() {
  if (process.env.SHOPIFY_ADMIN_TOKEN) return process.env.SHOPIFY_ADMIN_TOKEN;
  const r = await fetch(`https://${store}/admin/oauth/access_token`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: process.env.SHOPIFY_CLIENT_ID, client_secret: process.env.SHOPIFY_CLIENT_SECRET }) });
  if (!r.ok) throw new Error(`access token: HTTP ${r.status} ${(await r.text()).slice(0, 200)}`);
  const j = await r.json();
  console.log(`access token via client credentials (scopes: ${j.scope})`);
  return j.access_token;
}
const TOKEN = await token();
async function gql(query, variables) {
  for (let attempt = 0; ; attempt++) {
    const r = await fetch(`https://${store}/admin/api/${VERSION}/graphql.json`, { method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': TOKEN }, body: JSON.stringify({ query, variables }) });
    const j = await r.json();
    if (j.errors?.some((e) => e.extensions?.code === 'THROTTLED') && attempt < 5) { await new Promise((res) => setTimeout(res, 2000)); continue; }
    if (j.errors) throw new Error(JSON.stringify(j.errors).slice(0, 600));
    return j.data;
  }
}

const walk = (dir) => readdirSync(dir).flatMap((n) => { const p = join(dir, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
const local = new Map(walk(ROOT).map((p) => [relative(ROOT, p).split('\\').join('/'), readFileSync(p)]));
const md5 = (buf) => createHash('md5').update(buf).digest('hex');
const isText = (f) => /\.(liquid|json|css|js|svg|txt|md)$/i.test(f);

const themes = (await gql(`{ themes(first: 50) { nodes { id name role } } }`)).themes.nodes;
const theme = opt('--theme') ? themes.find((t) => t.id.endsWith(`/${opt('--theme')}`) || t.id === opt('--theme')) : themes.find((t) => t.role === 'MAIN');
if (!theme) throw new Error(`theme not found; themes: ${themes.map((t) => `${t.name} (${t.role}, ${t.id})`).join(', ')}`);
console.log(`theme: ${theme.name} (${theme.role}, ${theme.id})`);

const remote = new Map();
for (let after = null; ;) {
  const d = await gql(`query($id: ID!, $after: String) { theme(id: $id) { files(first: 250, after: $after) { nodes { filename checksumMd5 size } pageInfo { hasNextPage endCursor } } } }`, { id: theme.id, after });
  for (const n of d.theme.files.nodes) remote.set(n.filename, n);
  if (!d.theme.files.pageInfo.hasNextPage) break;
  after = d.theme.files.pageInfo.endCursor;
}

const missing = [], changed = [];
for (const [f, buf] of local) {
  if (only && !only.has(f)) continue;
  if (f === 'config/settings_data.json' && remote.has(f) && !only) continue; // holds the editor's changes: never overwrite unasked
  const r = remote.get(f);
  if (!r) missing.push(f);
  else if (r.checksumMd5 && r.checksumMd5 !== md5(buf)) changed.push(f);
}
const extra = [...remote.keys()].filter((f) => !local.has(f));
console.log(`local ${local.size} files, store ${remote.size} files`);
console.log(`missing in the store (${missing.length}): ${missing.join(', ') || '-'}`);
console.log(`different (${changed.length}): ${changed.join(', ') || '-'}`);
if (extra.length) console.log(`only in the store (${extra.length}): ${extra.join(', ')}`);

if (flag('--push')) {
  // dependencies first: snippets, blocks and sections before the JSON templates and groups that use them
  const rank = (f) => (/^(assets|locales|snippets|layout|config\/settings_schema)/.test(f) ? 0 : /^blocks\//.test(f) ? 1 : /^sections\/.*\.liquid$/.test(f) ? 2 : 3);
  const todo = [...missing, ...changed].sort((a, b) => rank(a) - rank(b));
  let ok = 0, failed = 0;
  for (let i = 0; i < todo.length; i += 10) {
    const part = todo.slice(i, i + 10);
    const files = part.map((f) => ({ filename: f, body: isText(f) ? { type: 'TEXT', value: local.get(f).toString('utf8') } : { type: 'BASE64', value: local.get(f).toString('base64') } }));
    const d = await gql(`mutation($id: ID!, $files: [OnlineStoreThemeFilesUpsertFileInput!]!) { themeFilesUpsert(themeId: $id, files: $files) { upsertedThemeFiles { filename } userErrors { filename code message } } }`, { id: theme.id, files });
    const r = d.themeFilesUpsert;
    for (const u of r.upsertedThemeFiles || []) { ok++; console.log(`  ok    ${u.filename}`); }
    for (const e of r.userErrors || []) { failed++; console.log(`  ERROR ${e.filename || ''}: ${e.message} [${e.code}]`); }
  }
  console.log(`uploaded ${ok}, rejected ${failed}`);
  process.exitCode = failed ? 1 : 0;
}
