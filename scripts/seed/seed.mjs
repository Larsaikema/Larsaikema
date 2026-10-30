#!/usr/bin/env node
// Klapklaar seed script: everything products.csv cannot carry, set through the Shopify Admin GraphQL API.
// Node 22+, no dependencies (global fetch, FormData, Blob).
//
//   node scripts/seed/seed.mjs --dry-run                 offline: runs every step against an in-memory store that holds
//                                                         exactly what products.csv creates, and checks every reference
//   SHOPIFY_STORE=klapklaar.myshopify.com SHOPIFY_ADMIN_TOKEN=shpat_xxx node scripts/seed/seed.mjs definitions
//                                                         step 1, BEFORE the CSV import (Shopify imports a metafield column
//                                                         only when its definition exists)
//   (import catalog/export/products.csv in the admin: Producten > Importeren)
//   SHOPIFY_STORE=... SHOPIFY_ADMIN_TOKEN=... node scripts/seed/seed.mjs
//                                                         all steps, in order; every step is idempotent (run it again after a
//                                                         catalog change: existing items are updated, never duplicated)
//
// Steps (in this order; name one or more to run only those):
//   definitions  metafield definitions (product, variant, collection, article) from export/metafield-definitions.json
//   check        the CSV import is complete: every handle and SKU of products.csv exists in the store
//   csvfields    the plain product metafields of products.csv (needed when the CSV was imported before the definitions)
//   files        the PDF downloads (productbladen, handleidingen) uploaded to Content > Bestanden
//   pages        pages + SEO (export/pages.json)
//   blog         blog "advies" + articles + custom.producten (export/blog.json)
//   collections  smart and manual collections + intro / seo_tekst / kenmerken + image, published to the Online Store
//   references   the reference metafields: product addons, addon_eenmalig, past_op, onderdelen, andere_maten, alternatieven,
//                maatgids, downloads; variant addon_varianten + addon_aantallen, componenten + component_aantallen, stuklijst
//                (handles and SKUs from export/product-references.json resolved to GIDs; stuklijst rows get their variant_id)
//   menus        main-menu and the footer menus (export/menus.json), every link resolved to its resource
//   redirects    URL redirects for renamed handles (export/redirects.csv)
//
// Options: --dry-run · --store <x.myshopify.com> · --token <shpat_…> · --api-version 2026-07 · --files-from-url (fileCreate from
// the public raw GitHub URL instead of uploading the local PDF) · --verbose
// Extra steps, only when named: giftcard (create gift card products the CSV import skips) · images (photos newer than
// the CSV import, from their public URL; with --prune also removes photos the CSV no longer lists and puts them in CSV
// order) · shipping (shipping profiles from export/shipping-profiles.json; needs write_shipping
// and read_locations). --handles a,b limits giftcard, images and csvfields to those products.
// Admin API access scopes of the custom app: write_products, write_files, write_content, write_online_store_pages,
// write_online_store_navigation, write_publications (docs/import-en-seed.md).
import { readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..');
const EXPORT = join(REPO, 'catalog', 'export');
const IMAGES = join(REPO, 'catalog', 'images');
const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/Larsaikema/Larsaikema/claude/shopify-webshop/catalog/images/';
export const STEPS = ['definitions', 'check', 'csvfields', 'files', 'pages', 'blog', 'collections', 'references', 'menus', 'redirects'];
// Run only when named: top-ups for a store whose CSV import is older than the current catalog.
export const EXTRA_STEPS = ['giftcard', 'images', 'shipping'];
const SORT_ORDER = {
  'best-selling': 'BEST_SELLING', manual: 'MANUAL', 'alpha-ascending': 'ALPHA_ASC', 'alpha-descending': 'ALPHA_DESC',
  'price-ascending': 'PRICE_ASC', 'price-descending': 'PRICE_DESC', 'created-descending': 'CREATED_DESC', created: 'CREATED',
};
const RULE_COLUMN = { type: 'TYPE', tag: 'TAG', title: 'TITLE', vendor: 'VENDOR' };
const RULE_RELATION = { equals: 'EQUALS', contains: 'CONTAINS', starts_with: 'STARTS_WITH', ends_with: 'ENDS_WITH', not_equals: 'NOT_EQUALS' };
// theme images the default settings point at (docs/theme-setup.md §2): Shopify file name -> local sources, first one that exists
const THEME_FILES = {
  'scene-hero.webp': ['catalog/images/scene-hero.webp', 'theme/assets/fallback-scene-hero.webp'],
  'scene-zakelijk.webp': ['catalog/images/scene-zakelijk.webp', 'theme/assets/fallback-scene-zakelijk.webp'],
  'tent-3x3-rood-logo-hero.webp': ['catalog/images/tent-3x3-rood-logo-hero.webp', 'theme/assets/fallback-tent-logo.webp'],
  'tent-3x3-rood-logo-front.webp': ['catalog/images/tent-3x3-rood-logo-front.webp', 'theme/assets/fallback-tent-front.webp'],
  'statafelrok-stretch-zwart-print-hero.webp': ['catalog/images/statafelrok-stretch-zwart-print-hero.webp', 'theme/assets/fallback-rok-logo.webp'],
};

// ------------------------------------------------------------------------------------------------ inputs
export function readJson(name) {
  return JSON.parse(readFileSync(join(EXPORT, name), 'utf8'));
}

export function parseCsv(text) {
  const rows = [];
  let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; } else if (c === '"') q = false; else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const head = rows.shift();
  return rows.filter((r) => r.length > 1).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
}

export function loadInputs() {
  const csvRows = parseCsv(readFileSync(join(EXPORT, 'products.csv'), 'utf8'));
  const csvProducts = new Map();   // handle -> Set(sku)
  const csvFields = new Map();     // handle -> [{key, value}] from the 'Name (product.metafields.custom.key)' columns
  const csvImages = new Map();     // handle -> { images: [{src, alt, position}], variants: Map(sku -> src) }
  const giftCards = new Map();     // handle -> CSV rows of products with 'Gift Card' TRUE (Shopify's CSV import skips those)
  for (const r of csvRows) {
    if (!csvProducts.has(r.Handle)) csvProducts.set(r.Handle, new Set());
    if (r['Variant SKU']) csvProducts.get(r.Handle).add(r['Variant SKU']);
    if (!csvImages.has(r.Handle)) csvImages.set(r.Handle, { images: [], variants: new Map() });
    const img = csvImages.get(r.Handle);
    if (r['Image Src']) img.images.push({ src: r['Image Src'], alt: r['Image Alt Text'] || '', position: Number(r['Image Position']) || img.images.length + 1 });
    if (r['Variant SKU'] && r['Variant Image']) img.variants.set(r['Variant SKU'], r['Variant Image']);
    if (r['Gift Card'] === 'TRUE' || giftCards.has(r.Handle)) giftCards.set(r.Handle, [...(giftCards.get(r.Handle) || []), r]);
    if (!csvFields.has(r.Handle) && r.Title) {
      const f = [];
      for (const [col, value] of Object.entries(r)) {
        const m = col.match(/\(product\.metafields\.custom\.([a-z0-9_]+)\)$/);
        if (m && value !== '') f.push({ key: m[1], value });
      }
      csvFields.set(r.Handle, f);
    }
  }
  const redirects = parseCsv(readFileSync(join(EXPORT, 'redirects.csv'), 'utf8'))
    .map((r) => ({ path: r['Redirect from'], target: r['Redirect to'] })).filter((r) => r.path);
  return {
    definitions: readJson('metafield-definitions.json').definitions,
    references: readJson('product-references.json').products,
    pages: readJson('pages.json').pages,
    blog: readJson('blog.json').blog,
    collections: readJson('collections.json').collections,
    menus: readJson('menus.json').menus,
    shipping: existsSync(join(EXPORT, 'shipping-profiles.json')) ? readJson('shipping-profiles.json') : null,
    redirects,
    csvProducts,
    csvFields,
    csvImages,
    giftCards,
  };
}

// ------------------------------------------------------------------------------------------------ API client
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class Admin {
  constructor({ store, token, version }) {
    this.url = `https://${store.replace(/^https?:\/\//, '').replace(/\/$/, '')}/admin/api/${version}/graphql.json`;
    this.token = token;
    this.calls = 0;
  }

  async gql(query, variables = {}) {
    for (let attempt = 0; ; attempt++) {
      this.calls++;
      let res;
      try {
        res = await fetch(this.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': this.token },
          body: JSON.stringify({ query, variables }),
        });
      } catch (err) {
        if (attempt < 5) { await sleep(1000 * 2 ** attempt); continue; }
        throw err;
      }
      if (res.status === 429 || res.status >= 500) {
        if (attempt < 8) { await sleep(Number(res.headers.get('retry-after') || 0) * 1000 || 1000 * 2 ** Math.min(attempt, 5)); continue; }
        throw new Error(`HTTP ${res.status} after ${attempt + 1} attempts`);
      }
      const body = await res.json();
      if (body.errors) {
        const throttled = (Array.isArray(body.errors) ? body.errors : []).some((e) => e.extensions?.code === 'THROTTLED');
        if (throttled && attempt < 10) { await sleep(2000); continue; }
        throw new Error(`GraphQL: ${JSON.stringify(body.errors).slice(0, 800)}`);
      }
      const t = body.extensions?.cost?.throttleStatus;
      if (t && t.currentlyAvailable < 200) await sleep(Math.ceil((200 - t.currentlyAvailable) / (t.restoreRate || 50)) * 1000);
      return body.data;
    }
  }

  async upload(target, buffer, filename, mimeType) {
    const form = new FormData();
    for (const p of target.parameters) form.append(p.name, p.value);
    form.append('file', new Blob([buffer], { type: mimeType }), filename);
    const res = await fetch(target.url, { method: 'POST', body: form });
    if (!res.ok) throw new Error(`staged upload ${filename}: HTTP ${res.status}`);
  }
}

// ------------------------------------------------------------------------------------------------ GraphQL documents
export const Q = {
  productMedia: `query ProductMedia($id: ID!) { product(id: $id) { media(first: 250) { nodes { id alt status ... on MediaImage { image { url } } } } variants(first: 250) { nodes { id sku media(first: 5) { nodes { id } } } } } }`,
  productAddMedia: `mutation ProductAddMedia($product: ProductUpdateInput!, $media: [CreateMediaInput!]) { productUpdate(product: $product, media: $media) { product { id } userErrors { field message } } }`,
  variantDetachMedia: `mutation VariantDetachMedia($productId: ID!, $variantMedia: [ProductVariantDetachMediaInput!]!) { productVariantDetachMedia(productId: $productId, variantMedia: $variantMedia) { product { id } userErrors { field message } } }`,
  fileDelete: `mutation FileDelete($ids: [ID!]!) { fileDelete(fileIds: $ids) { deletedFileIds userErrors { field message code } } }`,
  productReorderMedia: `mutation ReorderMedia($id: ID!, $moves: [MoveInput!]!) { productReorderMedia(id: $id, moves: $moves) { job { id } mediaUserErrors { field message } } }`,
  variantAppendMedia: `mutation VariantAppendMedia($productId: ID!, $variantMedia: [ProductVariantAppendMediaInput!]!) { productVariantAppendMedia(productId: $productId, variantMedia: $variantMedia) { product { id } userErrors { field message } } }`,
  products: `query Products($after: String) { products(first: 250, after: $after) { pageInfo { hasNextPage endCursor } nodes { id handle } } }`,
  variants: `query Variants($after: String) { productVariants(first: 250, after: $after) { pageInfo { hasNextPage endCursor } nodes { id sku product { id handle } } } }`,
  pages: `query Pages($after: String) { pages(first: 250, after: $after) { pageInfo { hasNextPage endCursor } nodes { id handle } } }`,
  blogs: `query Blogs($after: String) { blogs(first: 50, after: $after) { pageInfo { hasNextPage endCursor } nodes { id handle } } }`,
  blogArticles: `query BlogArticles($id: ID!, $after: String) { blog(id: $id) { articles(first: 250, after: $after) { pageInfo { hasNextPage endCursor } nodes { id handle } } } }`,
  collections: `query Collections($after: String) { collections(first: 250, after: $after) { pageInfo { hasNextPage endCursor } nodes { id handle } } }`,
  collectionProducts: `query CollectionProducts($id: ID!, $after: String) { collection(id: $id) { products(first: 250, after: $after) { pageInfo { hasNextPage endCursor } nodes { id } } } }`,
  menus: `query Menus($after: String) { menus(first: 50, after: $after) { pageInfo { hasNextPage endCursor } nodes { id handle } } }`,
  files: `query Files($query: String!) { files(first: 10, query: $query) { nodes { id ... on GenericFile { url fileStatus } ... on MediaImage { image { url } } } } }`,
  fileStatus: `query FileStatus($ids: [ID!]!) { nodes(ids: $ids) { id ... on GenericFile { fileStatus } ... on MediaImage { fileStatus } } }`,
  publications: `query Publications { publications(first: 25) { nodes { id name } } }`,
  shopPolicies: `query ShopPolicies { shop { shopPolicies { id type } } }`,
  redirects: `query Redirects($query: String!) { urlRedirects(first: 5, query: $query) { nodes { id path target } } }`,
  definitionCreate: `mutation DefinitionCreate($definition: MetafieldDefinitionInput!) { metafieldDefinitionCreate(definition: $definition) { createdDefinition { id } userErrors { field message code } } }`,
  stagedUpload: `mutation StagedUpload($input: [StagedUploadInput!]!) { stagedUploadsCreate(input: $input) { stagedTargets { url resourceUrl parameters { name value } } userErrors { field message } } }`,
  fileCreate: `mutation FileCreate($files: [FileCreateInput!]!) { fileCreate(files: $files) { files { id fileStatus } userErrors { field message code } } }`,
  pageCreate: `mutation PageCreate($page: PageCreateInput!) { pageCreate(page: $page) { page { id handle } userErrors { field message code } } }`,
  pageUpdate: `mutation PageUpdate($id: ID!, $page: PageUpdateInput!) { pageUpdate(id: $id, page: $page) { page { id handle } userErrors { field message code } } }`,
  blogCreate: `mutation BlogCreate($blog: BlogCreateInput!) { blogCreate(blog: $blog) { blog { id handle } userErrors { field message code } } }`,
  articleCreate: `mutation ArticleCreate($article: ArticleCreateInput!) { articleCreate(article: $article) { article { id handle } userErrors { field message code } } }`,
  articleUpdate: `mutation ArticleUpdate($id: ID!, $article: ArticleUpdateInput!) { articleUpdate(id: $id, article: $article) { article { id handle } userErrors { field message code } } }`,
  collectionCreate: `mutation CollectionCreate($input: CollectionInput!) { collectionCreate(input: $input) { collection { id handle } userErrors { field message } } }`,
  collectionUpdate: `mutation CollectionUpdate($input: CollectionInput!) { collectionUpdate(input: $input) { collection { id handle } userErrors { field message } } }`,
  collectionAddProducts: `mutation CollectionAddProducts($id: ID!, $productIds: [ID!]!) { collectionAddProducts(id: $id, productIds: $productIds) { collection { id } userErrors { field message } } }`,
  deliveryProfiles: `query DeliveryProfiles { deliveryProfiles(first: 50) { nodes { id name default } } }`,
  deliveryProfile: `query DeliveryProfile($id: ID!) { deliveryProfile(id: $id) { id name default profileLocationGroups { locationGroup { id }
    locationGroupZones(first: 10) { nodes { zone { id name countries { code { countryCode } } } methodDefinitions(first: 40) { nodes { id name
      rateProvider { ... on DeliveryRateDefinition { price { amount } } } methodConditions { field operator conditionCriteria { ... on Weight { value unit } } } } } } } } } }`,
  locations: `query Locations { locations(first: 50) { nodes { id name isActive fulfillsOnlineOrders } } }`,
  deliveryProfileCreate: `mutation DeliveryProfileCreate($profile: DeliveryProfileInput!) { deliveryProfileCreate(profile: $profile) { profile { id } userErrors { field message } } }`,
  deliveryProfileUpdate: `mutation DeliveryProfileUpdate($id: ID!, $profile: DeliveryProfileInput!) { deliveryProfileUpdate(id: $id, profile: $profile) { profile { id } userErrors { field message } } }`,
  giftCardCreate: `mutation GiftCardProduct($product: ProductCreateInput!) { productCreate(product: $product) { product { id variants(first: 1) { nodes { id } } } userErrors { field message } } }`,
  variantsReplace: `mutation VariantsReplace($productId: ID!, $variants: [ProductVariantsBulkInput!]!) { productVariantsBulkCreate(productId: $productId, variants: $variants, strategy: REMOVE_STANDALONE_VARIANT) { productVariants { id sku } userErrors { field message } } }`,
  publish: `mutation Publish($id: ID!, $input: [PublicationInput!]!) { publishablePublish(id: $id, input: $input) { userErrors { field message } } }`,
  metafieldsSet: `mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $metafields) { metafields { id } userErrors { field message code } } }`,
  menuCreate: `mutation MenuCreate($title: String!, $handle: String!, $items: [MenuItemCreateInput!]!) { menuCreate(title: $title, handle: $handle, items: $items) { menu { id handle } userErrors { field message code } } }`,
  menuUpdate: `mutation MenuUpdate($id: ID!, $title: String!, $handle: String, $items: [MenuItemUpdateInput!]!) { menuUpdate(id: $id, title: $title, handle: $handle, items: $items) { menu { id handle } userErrors { field message code } } }`,
  redirectCreate: `mutation RedirectCreate($urlRedirect: UrlRedirectInput!) { urlRedirectCreate(urlRedirect: $urlRedirect) { urlRedirect { id } userErrors { field message code } } }`,
};

async function paginate(api, query, pick, variables = {}) {
  const out = [];
  let after = null;
  for (;;) {
    const conn = pick(await api.gql(query, { ...variables, after }));
    if (!conn) break;
    out.push(...conn.nodes);
    if (!conn.pageInfo?.hasNextPage) break;
    after = conn.pageInfo.endCursor;
  }
  return out;
}

const firstError = (r) => (r?.userErrors || []).map((e) => `${(e.field || []).join('.')}: ${e.message}${e.code ? ` [${e.code}]` : ''}`).join('; ');

// ------------------------------------------------------------------------------------------------ the run
export class Seeder {
  constructor(api, inputs, { log = console.log, verbose = false, filesFromUrl = false, handles = null, prune = false } = {}) {
    this.api = api;
    this.opts = { handles, prune };
    this.in = inputs;
    this.log = log;
    this.verbose = verbose;
    this.filesFromUrl = filesFromUrl;
    this.errors = [];
    this.warnings = [];
    this.stats = {};
    this.idx = {};
  }

  err(step, msg) { this.errors.push(`[${step}] ${msg}`); }
  warn(step, msg) { this.warnings.push(`[${step}] ${msg}`); if (this.verbose) this.log(`  warn ${msg}`); }
  count(step, key, n = 1) { this.stats[step] ??= {}; this.stats[step][key] = (this.stats[step][key] || 0) + n; }

  // ---- indexes (handle / SKU / name -> GID), loaded once and kept up to date by the steps
  async products() {
    if (!this.idx.products) this.idx.products = new Map((await paginate(this.api, Q.products, (d) => d.products)).map((n) => [n.handle, n.id]));
    return this.idx.products;
  }
  async variants() {
    if (!this.idx.variants) {
      this.idx.variants = new Map();
      for (const n of await paginate(this.api, Q.variants, (d) => d.productVariants)) if (n.sku) this.idx.variants.set(n.sku, n.id);
    }
    return this.idx.variants;
  }
  async pagesIdx() {
    if (!this.idx.pages) this.idx.pages = new Map((await paginate(this.api, Q.pages, (d) => d.pages)).map((n) => [n.handle, n.id]));
    return this.idx.pages;
  }
  async collectionsIdx() {
    if (!this.idx.collections) this.idx.collections = new Map((await paginate(this.api, Q.collections, (d) => d.collections)).map((n) => [n.handle, n.id]));
    return this.idx.collections;
  }
  async blogsIdx() {
    if (!this.idx.blogs) this.idx.blogs = new Map((await paginate(this.api, Q.blogs, (d) => d.blogs)).map((n) => [n.handle, n.id]));
    return this.idx.blogs;
  }
  async articlesIdx(blogHandle) {
    this.idx.articles ??= new Map();
    if (!this.idx.articles.has(blogHandle)) {
      const id = (await this.blogsIdx()).get(blogHandle);
      const nodes = id ? await paginate(this.api, Q.blogArticles, (d) => d.blog?.articles, { id }) : [];
      this.idx.articles.set(blogHandle, new Map(nodes.map((n) => [n.handle, n.id])));
    }
    return this.idx.articles.get(blogHandle);
  }
  async onlineStore() {
    if (this.idx.publication === undefined) {
      const d = await this.api.gql(Q.publications);
      this.idx.publication = (d.publications.nodes.find((p) => /online store|onlinewinkel/i.test(p.name || '')) || {}).id || null;
    }
    return this.idx.publication;
  }
  async fileIdx(name) {
    this.idx.files ??= new Map();
    if (!this.idx.files.has(name)) {
      const d = await this.api.gql(Q.files, { query: `filename:'${name}'` });
      const hit = d.files.nodes.find((f) => (f.url || f.image?.url || '').split('?')[0].endsWith('/' + name));
      this.idx.files.set(name, hit ? hit.id : null);
    }
    return this.idx.files.get(name);
  }

  // ---- steps
  async definitions() {
    const S = 'definitions';
    for (const d of this.in.definitions) {
      const def = {
        name: d.name, namespace: d.namespace, key: d.key, type: d.type, ownerType: d.owner_type, description: d.description,
        access: { storefront: (d.access && d.access.storefront) || 'PUBLIC_READ' },
      };
      if (d.validations) def.validations = d.validations;
      let r = (await this.api.gql(Q.definitionCreate, { definition: { ...def, pin: true } })).metafieldDefinitionCreate;
      // Shopify pins at most 20 definitions per owner type: the rest are created unpinned
      if (r.userErrors.some((e) => /pin/i.test(`${e.code} ${e.message}`))) {
        r = (await this.api.gql(Q.definitionCreate, { definition: def })).metafieldDefinitionCreate;
        this.count(S, 'unpinned');
      }
      if (r.createdDefinition) this.count(S, 'created');
      else if (r.userErrors.some((e) => e.code === 'TAKEN' || /already|in use|taken/i.test(e.message))) this.count(S, 'existing');
      else this.err(S, `${d.owner_type} ${d.namespace}.${d.key}: ${firstError(r)}`);
    }
    const filters = this.in.definitions.filter((d) => d.use_as_filter).map((d) => `${d.namespace}.${d.key}`);
    if (filters.length) this.warn(S, `turn on as storefront filter in Search & Discovery (no API): ${filters.join(', ')}`);
  }

  async check() {
    const S = 'check';
    const P = await this.products(), V = await this.variants();
    let missingP = 0, missingV = 0;
    for (const [h, skus] of this.in.csvProducts) {
      if (!P.has(h)) { missingP++; if (missingP <= 10) this.err(S, `product ${h} not in the store (import products.csv first)`); }
      for (const s of skus) if (!V.has(s)) { missingV++; if (missingV <= 10 && P.has(h)) this.err(S, `variant ${s} of ${h} not in the store`); }
    }
    this.count(S, 'products_in_csv', this.in.csvProducts.size);
    this.count(S, 'products_missing', missingP);
    this.count(S, 'variants_missing', missingV);
    if (missingP > 10) this.err(S, `${missingP} products missing in total`);
    return missingP === 0;
  }

  async files() {
    const S = 'files';
    const want = new Map();   // Shopify file name -> {path | url, mime, contentType}
    for (const p of this.in.references) {
      for (const m of p.metafields) {
        if (m.type !== 'list.file_reference') continue;
        for (const n of m.value) want.set(n, { path: join(IMAGES, n), url: IMAGE_BASE_URL + n, mime: 'application/pdf', contentType: 'FILE' });
      }
    }
    for (const [n, srcs] of Object.entries(THEME_FILES)) {
      const path = srcs.map((x) => join(REPO, x)).find((x) => existsSync(x));
      if (path) want.set(n, { path, url: null, mime: 'image/webp', contentType: 'IMAGE' });
      else this.warn(S, `theme image ${n}: no source file, upload it by hand (docs/theme-setup.md)`);
    }
    const pending = [];
    for (const [name, f] of want) {
      if (await this.fileIdx(name)) { this.count(S, 'existing'); continue; }
      let source;
      if (this.filesFromUrl && f.url) source = f.url;
      else {
        if (!existsSync(f.path)) { this.err(S, `${name}: not in catalog/images (run node catalog/tools/productblad.mjs)`); continue; }
        const st = (await this.api.gql(Q.stagedUpload, { input: [{ resource: f.contentType === 'IMAGE' ? 'IMAGE' : 'FILE', filename: name, mimeType: f.mime,
          httpMethod: 'POST', fileSize: String(statSync(f.path).size) }] })).stagedUploadsCreate;
        if (!st.stagedTargets?.length) { this.err(S, `${name}: ${firstError(st)}`); continue; }
        await this.api.upload(st.stagedTargets[0], readFileSync(f.path), name, f.mime);
        source = st.stagedTargets[0].resourceUrl;
      }
      const alt = name.replace(/\.(pdf|webp)$/, '').replace(/-/g, ' ');
      const r = (await this.api.gql(Q.fileCreate, { files: [{ originalSource: source, contentType: f.contentType, filename: name, alt }] })).fileCreate;
      if (!r.files?.length) { this.err(S, `${name}: ${firstError(r)}`); continue; }
      this.idx.files.set(name, r.files[0].id);
      pending.push(r.files[0].id);
      this.count(S, f.contentType === 'IMAGE' ? 'theme_images_uploaded' : 'uploaded');
    }
    // wait until Shopify has processed the uploads (a reference to a failed file is useless)
    for (let round = 0; pending.length && round < 30; round++) {
      const d = await this.api.gql(Q.fileStatus, { ids: pending });
      for (const n of d.nodes) {
        const st = n?.fileStatus;
        if (st === 'READY' || st === 'FAILED') {
          pending.splice(pending.indexOf(n.id), 1);
          if (st === 'FAILED') this.err(S, `${n.id}: processing failed`);
        }
      }
      if (pending.length) await sleep(2000);
    }
    if (pending.length) this.warn(S, `${pending.length} file(s) still processing; run the step again later`);
  }

  seoMetafields(seo) {
    const mf = [];
    if (seo?.title) mf.push({ namespace: 'global', key: 'title_tag', type: 'single_line_text_field', value: seo.title });
    if (seo?.description) mf.push({ namespace: 'global', key: 'description_tag', type: 'multi_line_text_field', value: seo.description });
    return mf;
  }

  async pages() {
    const S = 'pages';
    const idx = await this.pagesIdx();
    for (const pg of this.in.pages) {
      const page = {
        title: pg.title, body: (pg.body_html || '') + (pg.long_html || ''), isPublished: !!pg.published,
        templateSuffix: pg.template_suffix || null, metafields: this.seoMetafields(pg.seo),
      };
      const id = idx.get(pg.handle);
      const r = id ? (await this.api.gql(Q.pageUpdate, { id, page })).pageUpdate
        : (await this.api.gql(Q.pageCreate, { page: { ...page, handle: pg.handle } })).pageCreate;
      if (!r.page) { this.err(S, `${pg.handle}: ${firstError(r)}`); continue; }
      idx.set(pg.handle, r.page.id);
      this.count(S, id ? 'updated' : 'created');
      if (pg.template && this.verbose) this.log(`  ${pg.handle}: template blocks come from the theme (templates/page.${pg.template_suffix}.json)`);
    }
  }

  async refList(handles, type, step, ctx) {
    const resolver = type === 'product_reference' ? await this.products() : type === 'variant_reference' ? await this.variants()
      : type === 'page_reference' ? await this.pagesIdx() : null;
    const ids = [];
    for (const h of handles) {
      const id = type === 'file_reference' ? await this.fileIdx(h) : resolver.get(h);
      if (id) ids.push(id); else this.err(step, `${ctx}: ${type.replace('_reference', '')} ${h} not found`);
    }
    return ids;
  }

  async blog() {
    const S = 'blog';
    const b = this.in.blog;
    const blogs = await this.blogsIdx();
    let blogId = blogs.get(b.handle);
    if (!blogId) {
      const r = (await this.api.gql(Q.blogCreate, { blog: { title: b.title, handle: b.handle, commentPolicy: b.comments === 'disabled' ? 'CLOSED' : 'MODERATED',
        metafields: this.seoMetafields(b.seo) } })).blogCreate;
      if (!r.blog) { this.err(S, `blog ${b.handle}: ${firstError(r)}`); return; }
      blogId = r.blog.id;
      blogs.set(b.handle, blogId);
      this.count(S, 'blog_created');
    }
    const arts = await this.articlesIdx(b.handle);
    for (const a of b.articles) {
      const mf = this.seoMetafields(a.seo);
      for (const m of a.metafields || []) {
        const handles = typeof m.value === 'string' ? JSON.parse(m.value) : m.value;
        const ids = await this.refList(handles, 'product_reference', S, `article ${a.handle}`);
        if (ids.length) mf.push({ namespace: m.namespace, key: m.key, type: m.type, value: JSON.stringify(ids) });
      }
      const article = {
        title: a.title, body: a.body_html, summary: a.summary_html, author: { name: a.author || 'Team Klapklaar' }, tags: a.tags || [],
        isPublished: true, publishDate: a.published_at || undefined, metafields: mf,
      };
      if (a.image?.url) article.image = { url: a.image.url, altText: a.image.alt || a.title };
      const id = arts.get(a.handle);
      let r = id ? (await this.api.gql(Q.articleUpdate, { id, article })).articleUpdate
        : (await this.api.gql(Q.articleCreate, { article: { ...article, blogId, handle: a.handle } })).articleCreate;
      if (!r.article && article.image) {   // the banner URL is not reachable yet (branch not pushed): create without it
        this.warn(S, `${a.handle}: image ${a.image.url} not accepted (${firstError(r)}); article saved without image`);
        delete article.image;
        r = id ? (await this.api.gql(Q.articleUpdate, { id, article })).articleUpdate
          : (await this.api.gql(Q.articleCreate, { article: { ...article, blogId, handle: a.handle } })).articleCreate;
      }
      if (!r.article) { this.err(S, `${a.handle}: ${firstError(r)}`); continue; }
      arts.set(a.handle, r.article.id);
      this.count(S, id ? 'articles_updated' : 'articles_created');
    }
  }

  async collections() {
    const S = 'collections';
    const idx = await this.collectionsIdx();
    const P = await this.products();
    const pub = await this.onlineStore();
    if (!pub) this.warn(S, 'no Online Store publication found: publish the collections by hand (Sales channels)');
    for (const c of this.in.collections) {
      const input = {
        title: c.title, descriptionHtml: c.body_html || '', sortOrder: SORT_ORDER[c.sort_order] || 'BEST_SELLING',
        templateSuffix: c.template_suffix || null, seo: { title: c.seo?.title || null, description: c.seo?.description || null },
        metafields: (c.metafields || []).map((m) => ({ namespace: m.namespace, key: m.key, type: m.type, value: m.value })),
      };
      if (c.image?.url) input.image = { src: c.image.url, altText: c.image.alt || c.title };
      if (c.type === 'smart') {
        input.ruleSet = {
          appliedDisjunctively: !!c.disjunctive,
          rules: c.rules.map((r) => ({ column: RULE_COLUMN[r.column], relation: RULE_RELATION[r.relation], condition: r.condition })),
        };
      }
      const productIds = c.type === 'manual' ? await this.refList(c.products || [], 'product_reference', S, `collection ${c.handle}`) : [];
      const id = idx.get(c.handle);
      const save = async (inp) => (id ? (await this.api.gql(Q.collectionUpdate, { input: { ...inp, id } })).collectionUpdate
        : (await this.api.gql(Q.collectionCreate, { input: { ...inp, handle: c.handle, ...(productIds.length ? { products: productIds } : {}) } })).collectionCreate);
      let r = await save(input);
      if (!r.collection && input.image) {
        this.warn(S, `${c.handle}: image not accepted (${firstError(r)}); saved without image`);
        delete input.image;
        r = await save(input);
      }
      if (!r.collection) { this.err(S, `${c.handle}: ${firstError(r)}`); continue; }
      const cid = r.collection.id;
      idx.set(c.handle, cid);
      this.count(S, id ? 'updated' : 'created');
      if (id && productIds.length) {
        const have = new Set((await paginate(this.api, Q.collectionProducts, (d) => d.collection?.products, { id: cid })).map((n) => n.id));
        const add = productIds.filter((x) => !have.has(x));
        for (let i = 0; i < add.length; i += 250) {
          const a = (await this.api.gql(Q.collectionAddProducts, { id: cid, productIds: add.slice(i, i + 250) })).collectionAddProducts;
          if (a.userErrors.length) this.err(S, `${c.handle}: ${firstError(a)}`);
        }
        this.count(S, 'products_added', add.length);
      }
      if (pub && c.published !== false) {
        const p = (await this.api.gql(Q.publish, { id: cid, input: [{ publicationId: pub }] })).publishablePublish;
        if (p.userErrors.length) this.warn(S, `${c.handle}: publish: ${firstError(p)}`);
      }
    }
    if (P.size === 0) this.warn(S, 'no products in the store yet: smart collections fill once products.csv is imported');
  }

  // Gift card products ('Gift Card' TRUE in products.csv): Shopify's CSV import skips them, so they are created here with
  // their options, prices and SKUs, and published to the Online Store. Photos and metafields follow with the steps
  // 'images' and 'csvfields'. An existing product with the same handle is left alone.
  async giftcard() {
    const S = 'giftcard';
    const P = await this.products();
    for (const [handle, rows] of this.in.giftCards) {
      if (this.opts.handles && !this.opts.handles.has(handle)) continue;
      if (P.has(handle)) { this.count(S, 'already_there'); continue; }
      const head = rows[0];
      const values = rows.map((r) => r['Option1 Value']).filter(Boolean);
      const product = {
        title: head.Title, handle, descriptionHtml: head['Body (HTML)'], vendor: head.Vendor, productType: head.Type,
        status: (head.Status || 'active').toUpperCase(), giftCard: true,
        seo: { title: head['SEO Title'] || null, description: head['SEO Description'] || null },
        productOptions: [{ name: head['Option1 Name'] || 'Bedrag', values: values.map((name) => ({ name })) }],
      };
      const c = (await this.api.gql(Q.giftCardCreate, { product })).productCreate;
      if (c.userErrors.length) { this.err(S, `${handle}: ${firstError(c)}`); continue; }
      const pid = c.product.id;
      P.set(handle, pid);
      const variants = rows.filter((r) => r['Option1 Value']).map((r) => ({
        optionValues: [{ optionName: product.productOptions[0].name, name: r['Option1 Value'] }],
        price: r['Variant Price'], taxable: r['Variant Taxable'] === 'TRUE',
        inventoryItem: { sku: r['Variant SKU'], tracked: false, requiresShipping: r['Variant Requires Shipping'] === 'TRUE' },
      }));
      const v = (await this.api.gql(Q.variantsReplace, { productId: pid, variants })).productVariantsBulkCreate;
      if (v.userErrors.length) { this.err(S, `${handle}: variants: ${firstError(v)}`); continue; }
      this.count(S, 'created');
      this.count(S, 'variants', v.productVariants.length);
      const pub = await this.onlineStore();
      if (!pub) { this.warn(S, `${handle}: no Online Store publication found: publish it by hand (Sales channels)`); continue; }
      const p = (await this.api.gql(Q.publish, { id: pid, input: [{ publicationId: pub }] })).publishablePublish;
      if (p.userErrors.length) this.warn(S, `${handle}: publish: ${firstError(p)}`);
    }
  }

  // Shipping profiles from export/shipping-profiles.json (catalog/tools/shipping_profiles.py): weight-based rates per class, the same
  // amounts the product pages show. The default profile gets the parcel rates; the others are created (needs read_locations) and get
  // their variants. Per country one zone; a zone whose rates differ from the plan gets the plan's rates instead (old rates removed).
  async shipping() {
    const S = 'shipping';
    const plan = this.in.shipping;
    if (!plan) { this.err(S, 'catalog/export/shipping-profiles.json missing (python3 catalog/tools/shipping_profiles.py)'); return; }
    const NAMES = { NL: 'Nederland', BE: 'België' };
    const money = (x) => ({ amount: Number(x).toFixed(2), currencyCode: plan.currency });
    const methods = (rates) => rates.map((r) => ({
      name: r.name, active: true, rateDefinition: { price: money(r.amount) },
      weightConditionsToCreate: [
        { criteria: { value: r.min_kg, unit: 'KILOGRAMS' }, operator: 'GREATER_THAN_OR_EQUAL_TO' },
        { criteria: { value: r.max_kg, unit: 'KILOGRAMS' }, operator: 'LESS_THAN_OR_EQUAL_TO' },
      ],
    }));
    const sig = (name, amount, lo, hi) => `${name}|${Number(amount).toFixed(2)}|${Number(lo).toFixed(3)}|${Number(hi).toFixed(3)}`;
    const want = (rates) => rates.map((r) => sig(r.name, r.amount, r.min_kg, r.max_kg)).sort().join('\n');
    const have = (defs) => defs.map((m) => {
      const w = (op) => m.methodConditions.find((c) => c.field === 'TOTAL_WEIGHT' && c.operator === op)?.conditionCriteria?.value ?? (op === 'GREATER_THAN_OR_EQUAL_TO' ? 0 : -1);
      if (m.methodConditions.some((c) => c.field !== 'TOTAL_WEIGHT')) return `${m.id}|other`;
      return sig(m.name, m.rateProvider?.price?.amount ?? -1, w('GREATER_THAN_OR_EQUAL_TO'), w('LESS_THAN_OR_EQUAL_TO'));
    }).sort().join('\n');
    const baseId = (id) => id.split('?')[0];
    const profiles = (await this.api.gql(Q.deliveryProfiles)).deliveryProfiles.nodes;
    let locations = null;
    const V = await this.variants();
    for (const pp of plan.profiles) {
      const label = pp.name || 'General profile';
      const ex = pp.default ? profiles.find((x) => x.default) : profiles.find((x) => x.name === pp.name);
      const ids = (pp.skus || []).map((s) => V.get(s)).filter(Boolean);
      if ((pp.skus || []).length !== ids.length) this.warn(S, `${label}: ${pp.skus.length - ids.length} SKUs not in the store`);
      const zonesFor = (existing = []) => plan.countries.map((cc) => {
        const z = existing.find((n) => n.zone.countries.some((c) => c.code.countryCode === cc));
        return { cc, z };
      });
      if (!ex) {
        if (!locations) {
          try { locations = (await this.api.gql(Q.locations)).locations.nodes.filter((l) => l.isActive && l.fulfillsOnlineOrders).map((l) => l.id); }
          catch (e) { this.err(S, `${label}: cannot read the locations (give the app the scope read_locations): ${String(e.message).slice(0, 120)}`); return; }
        }
        const profile = {
          name: pp.name,
          locationGroupsToCreate: [{ locations, zonesToCreate: plan.countries.map((cc) => ({ name: NAMES[cc] || cc, countries: [{ code: cc, includeAllProvinces: true }], methodDefinitionsToCreate: methods(pp.rates) })) }],
          variantsToAssociate: ids.slice(0, 250),
        };
        const r = (await this.api.gql(Q.deliveryProfileCreate, { profile })).deliveryProfileCreate;
        if (r.userErrors.length) { this.err(S, `${label}: ${firstError(r)}`); continue; }
        this.count(S, 'profiles_created');
        for (let i = 250; i < ids.length; i += 250) {
          const u = (await this.api.gql(Q.deliveryProfileUpdate, { id: r.profile.id, profile: { variantsToAssociate: ids.slice(i, i + 250) } })).deliveryProfileUpdate;
          if (u.userErrors.length) this.err(S, `${label} variants: ${firstError(u)}`);
        }
        this.count(S, 'variants_assigned', ids.length);
        continue;
      }
      const full = (await this.api.gql(Q.deliveryProfile, { id: ex.id })).deliveryProfile;
      const group = full.profileLocationGroups[0];
      if (!group) { this.err(S, `${label}: has no locations`); continue; }
      const zones = group.locationGroupZones.nodes;
      const zonesToUpdate = [], zonesToCreate = [], methodDefinitionsToDelete = [];
      for (const { cc, z } of zonesFor(zones)) {
        if (!z) { zonesToCreate.push({ name: NAMES[cc] || cc, countries: [{ code: cc, includeAllProvinces: true }], methodDefinitionsToCreate: methods(pp.rates) }); continue; }
        if (z.zone.countries.length > 1) { this.warn(S, `${label}: zone ${z.zone.name} holds more countries than ${cc}; its rates are replaced for all of them`); }
        if (have(z.methodDefinitions.nodes) === want(pp.rates)) continue;
        methodDefinitionsToDelete.push(...new Set(z.methodDefinitions.nodes.map((m) => baseId(m.id))));
        zonesToUpdate.push({ id: z.zone.id, name: z.zone.countries.length > 1 ? z.zone.name : (NAMES[cc] || z.zone.name), methodDefinitionsToCreate: methods(pp.rates) });
      }
      if (zonesToUpdate.length || zonesToCreate.length) {
        const profile = { locationGroupsToUpdate: [{ id: group.locationGroup.id, zonesToUpdate, zonesToCreate }], methodDefinitionsToDelete: [...new Set(methodDefinitionsToDelete)] };
        const r = (await this.api.gql(Q.deliveryProfileUpdate, { id: ex.id, profile })).deliveryProfileUpdate;
        if (r.userErrors.length) { this.err(S, `${label}: ${firstError(r)}`); continue; }
        this.count(S, 'zones_set', zonesToUpdate.length + zonesToCreate.length);
      }
      for (let i = 0; i < ids.length; i += 250) {
        const u = (await this.api.gql(Q.deliveryProfileUpdate, { id: ex.id, profile: { variantsToAssociate: ids.slice(i, i + 250) } })).deliveryProfileUpdate;
        if (u.userErrors.length) { this.err(S, `${label} variants: ${firstError(u)}`); break; }
      }
      if (ids.length) this.count(S, 'variants_assigned', ids.length);
    }
  }

  // Product photos from products.csv that the store does not have yet (renders made after the CSV import), added from their
  // public URL, plus the photo of every variant ('Variant Image'). Matching is on the file name: Shopify keeps it in the CDN
  // URL (with a '_<suffix>' when the name already existed). Existing photos are never removed or reordered.
  async images() {
    const S = 'images';
    const P = await this.products();
    const stem = (u) => decodeURIComponent(String(u).split('?')[0].split('/').pop()).replace(/\.[a-z0-9]+$/i, '').toLowerCase();
    const same = (have, want) => have === want || have.startsWith(`${want}_`);
    for (const [handle, want] of this.in.csvImages) {
      if (this.opts.handles && !this.opts.handles.has(handle)) continue;
      if (!want.images.length && !want.variants.size) continue;
      const pid = P.get(handle);
      if (!pid) {
        if (this.in.giftCards.has(handle)) this.warn(S, `${handle}: gift card not in the store yet (step giftcard)`);
        else this.err(S, `product ${handle} not in the store`);
        continue;
      }
      let prod = (await this.api.gql(Q.productMedia, { id: pid })).product;
      const haveStems = () => prod.media.nodes.filter((m) => m.image?.url).map((m) => [stem(m.image.url), m]);
      const missing = want.images.sort((a, b) => a.position - b.position)
        .filter((w) => !haveStems().some(([h]) => same(h, stem(w.src))));
      if (missing.length) {
        const r = (await this.api.gql(Q.productAddMedia, { product: { id: pid }, media: missing.map((w) => ({ originalSource: w.src, alt: w.alt, mediaContentType: 'IMAGE' })) })).productUpdate;
        if (r.userErrors.length) { this.err(S, `${handle}: ${firstError(r)}`); continue; }
        this.count(S, 'images_added', missing.length);
        // media is processed asynchronously; wait until it is READY before linking variants to it
        for (let t = 0; t < 30; t++) {
          await sleep(2000);
          prod = (await this.api.gql(Q.productMedia, { id: pid })).product;
          if (prod.media.nodes.every((m) => m.status === 'READY' || m.status === 'FAILED')) break;
        }
        for (const m of prod.media.nodes) if (m.status === 'FAILED') this.err(S, `${handle}: media ${m.alt || m.id} failed to process`);
      }
      const detach = [], append = [];
      for (const v of prod.variants.nodes) {
        const src = want.variants.get(v.sku);
        if (!src) continue;
        const target = haveStems().find(([h, m]) => same(h, stem(src)) && m.status === 'READY');
        if (!target) { this.warn(S, `${handle} ${v.sku}: variant photo ${stem(src)} not available`); continue; }
        const cur = v.media.nodes.map((n) => n.id);
        if (cur.length === 1 && cur[0] === target[1].id) continue;
        if (cur.length) detach.push({ variantId: v.id, mediaIds: cur });
        append.push({ variantId: v.id, mediaIds: [target[1].id] });
      }
      // Shopify takes at most 100 variant-media pairs per mutation
      for (let i = 0; i < detach.length; i += 100) {
        const r = (await this.api.gql(Q.variantDetachMedia, { productId: pid, variantMedia: detach.slice(i, i + 100) })).productVariantDetachMedia;
        if (r.userErrors.length) this.err(S, `${handle} detach: ${firstError(r)}`);
      }
      for (let i = 0; i < append.length; i += 100) {
        const part = append.slice(i, i + 100);
        const r = (await this.api.gql(Q.variantAppendMedia, { productId: pid, variantMedia: part })).productVariantAppendMedia;
        if (r.userErrors.length) this.err(S, `${handle} variant photos: ${firstError(r)}`);
        else this.count(S, 'variant_photos_set', part.length);
      }
      // --prune: photos the CSV no longer lists for this product go (renders replaced by a real photo), and the rest follows
      // the CSV order, so the first image (the card in a collection) is the CSV's first
      if (this.opts.prune && want.images.length) {
        prod = (await this.api.gql(Q.productMedia, { id: pid })).product;
        const order = want.images.map((w) => stem(w.src));
        const rank = (m) => order.findIndex((o) => same(stem(m.image?.url || ''), o));
        const stale = prod.media.nodes.filter((m) => m.image?.url && rank(m) < 0);
        if (stale.length) {
          const r = (await this.api.gql(Q.fileDelete, { ids: stale.map((m) => m.id) })).fileDelete;
          if (r.userErrors.length) this.err(S, `${handle} remove old photos: ${firstError(r)}`);
          else this.count(S, 'images_removed', stale.length);
        }
        const kept = prod.media.nodes.filter((m) => m.image?.url && rank(m) >= 0);
        const sorted = [...kept].sort((a, b) => rank(a) - rank(b));
        if (sorted.some((m, i) => m.id !== kept[i].id)) {
          const r = (await this.api.gql(Q.productReorderMedia, { id: pid, moves: sorted.map((m, i) => ({ id: m.id, newPosition: String(i) })) })).productReorderMedia;
          if (r.mediaUserErrors.length) this.err(S, `${handle} reorder: ${firstError({ userErrors: r.mediaUserErrors })}`);
          else this.count(S, 'products_reordered');
        }
      }
    }
  }

  // The plain product metafields of products.csv, set through the API: a CSV import done before the definitions existed
  // skipped those columns, and this way a re-import is not needed for them.
  async csvfields() {
    const S = 'csvfields';
    const P = await this.products();
    const types = new Map(this.in.definitions.filter((d) => d.owner_type === 'PRODUCT' && d.namespace === 'custom').map((d) => [d.key, d.type]));
    const sets = [];
    for (const [handle, fields] of this.in.csvFields) {
      if (this.opts.handles && !this.opts.handles.has(handle)) continue;
      const pid = P.get(handle);
      if (!pid) { this.err(S, `product ${handle} not in the store`); continue; }
      for (const f of fields) {
        const type = types.get(f.key);
        if (!type) { this.warn(S, `${handle}: no definition for custom.${f.key}`); continue; }
        sets.push({ ownerId: pid, namespace: 'custom', key: f.key, type, value: f.value });
      }
    }
    for (let i = 0; i < sets.length; i += 25) {
      const batch = sets.slice(i, i + 25);
      const r = (await this.api.gql(Q.metafieldsSet, { metafields: batch })).metafieldsSet;
      if (r.userErrors.length) this.err(S, `metafieldsSet batch ${i / 25 + 1}: ${firstError(r)}`);
      else this.count(S, 'metafields_set', batch.length);
    }
  }

  async references() {
    const S = 'references';
    const P = await this.products(), V = await this.variants();
    const sets = [];
    for (const p of this.in.references) {
      const pid = P.get(p.handle);
      if (!pid) { this.err(S, `product ${p.handle} not in the store`); continue; }
      for (const m of p.metafields) {
        const base = m.type.replace(/^list\./, '');
        const vals = Array.isArray(m.value) ? m.value : [m.value];
        const ids = await this.refList(vals, base, S, `${p.handle} ${m.key}`);
        if (!ids.length) continue;
        sets.push({ ownerId: pid, namespace: m.namespace, key: m.key, type: m.type, value: m.type.startsWith('list.') ? JSON.stringify(ids) : ids[0] });
        this.count(S, `product.${m.key}`);
      }
      for (const v of p.variants) {
        const vid = V.get(v.sku);
        if (!vid) { this.err(S, `variant ${v.sku} (${p.handle}) not in the store`); continue; }
        const own = v.metafields;
        for (const m of own) {
          let value = m.value;
          if (m.type === 'list.variant_reference') {
            const ids = await this.refList(m.value_skus, 'variant_reference', S, `${v.sku} ${m.key}`);
            if (ids.length !== m.value_skus.length) {
              // keep the quantity list aligned: an add-on list with a hole would give the wrong amounts; skip the pair
              this.err(S, `${v.sku} ${m.key}: ${m.value_skus.length - ids.length} unresolved, pair skipped`);
              continue;
            }
            value = JSON.stringify(ids);
          } else if (m.key === 'stuklijst') {
            const rows = JSON.parse(m.value);
            for (const row of rows) {
              const id = V.get(row.sku);
              if (id) row.variant_id = Number(id.split('/').pop()); else this.warn(S, `${v.sku} stuklijst: ${row.sku} not found`);
            }
            value = JSON.stringify(rows);
          } else if (m.type === 'list.number_integer') {
            // the quantities go only with a fully resolved reference list (the pair stays aligned)
            const ref = own.find((x) => x.type === 'list.variant_reference' && x.key === { addon_aantallen: 'addon_varianten', component_aantallen: 'componenten' }[m.key]);
            if (ref && ref.value_skus.some((s) => !V.has(s))) continue;
          }
          sets.push({ ownerId: vid, namespace: m.namespace, key: m.key, type: m.type, value });
          this.count(S, `variant.${m.key}`);
        }
      }
    }
    for (let i = 0; i < sets.length; i += 25) {
      const batch = sets.slice(i, i + 25);
      const r = (await this.api.gql(Q.metafieldsSet, { metafields: batch })).metafieldsSet;
      if (r.userErrors.length) this.err(S, `metafieldsSet batch ${i / 25 + 1}: ${firstError(r)}`);
      else this.count(S, 'metafields_set', batch.length);
    }
  }

  async menus() {
    const S = 'menus';
    const C = await this.collectionsIdx(), P = await this.products(), PG = await this.pagesIdx(), B = await this.blogsIdx();
    let policies = new Map();
    try {
      policies = new Map((await this.api.gql(Q.shopPolicies)).shop.shopPolicies.map((x) => [x.type, x.id]));
    } catch (e) { this.warn(S, `shop policies not readable (${e.message.slice(0, 80)}): policy links become plain links`); }
    const existing = new Map((await paginate(this.api, Q.menus, (d) => d.menus)).map((n) => [n.handle, n.id]));
    const conv = async (items) => {
      const out = [];
      for (const it of items) {
        const e = { title: it.title, type: it.admin_type, url: it.url };
        let rid = null;
        if (it.admin_type === 'COLLECTION') rid = C.get(it.handle);
        else if (it.admin_type === 'PRODUCT') rid = P.get(it.handle);
        else if (it.admin_type === 'PAGE') rid = PG.get(it.handle);
        else if (it.admin_type === 'BLOG') rid = B.get(it.handle);
        else if (it.admin_type === 'ARTICLE') {
          const [bh, ah] = it.handle.split('/');
          rid = (await this.articlesIdx(bh)).get(ah);
        } else if (it.admin_type === 'SHOP_POLICY') rid = policies.get(it.handle.toUpperCase().replace(/-/g, '_'));
        if (['COLLECTION', 'PRODUCT', 'PAGE', 'BLOG', 'ARTICLE', 'SHOP_POLICY'].includes(it.admin_type)) {
          if (rid) { e.resourceId = rid; delete e.url; } else {
            (it.admin_type === 'SHOP_POLICY' ? this.warn : this.err).call(this, S, `${it.title}: ${it.admin_type.toLowerCase()} ${it.handle} not found, kept as a plain link`);
            e.type = 'HTTP';
          }
        }
        if (it.items?.length) e.items = await conv(it.items);
        out.push(e);
        this.count(S, 'items');
      }
      return out;
    };
    for (const m of this.in.menus) {
      const items = await conv(m.items);
      const id = existing.get(m.handle);
      const r = id ? (await this.api.gql(Q.menuUpdate, { id, title: m.title, handle: m.handle, items })).menuUpdate
        : (await this.api.gql(Q.menuCreate, { title: m.title, handle: m.handle, items })).menuCreate;
      if (!r.menu) this.err(S, `${m.handle}: ${firstError(r)}`);
      else this.count(S, id ? 'updated' : 'created');
    }
  }

  async redirects() {
    const S = 'redirects';
    for (const r of this.in.redirects) {
      const have = (await this.api.gql(Q.redirects, { query: `path:'${r.path}'` })).urlRedirects.nodes.find((x) => x.path === r.path);
      if (have) { this.count(S, 'existing'); continue; }
      const c = (await this.api.gql(Q.redirectCreate, { urlRedirect: { path: r.path, target: r.target } })).urlRedirectCreate;
      if (c.urlRedirect) this.count(S, 'created'); else this.err(S, `${r.path}: ${firstError(c)}`);
    }
  }

  async run(steps) {
    for (const s of steps) {
      const t0 = Date.now();
      this.log(`- ${s}`);
      if (s === 'check') {
        const ok = await this.check();
        if (!ok && steps.some((x) => ['references', 'collections', 'menus', 'blog'].includes(x))) {
          this.log('  products.csv is not (fully) imported: the steps that point at products are skipped. Import it and run again.');
          break;
        }
      } else await this[s]();
      this.log(`  ${JSON.stringify(this.stats[s] || {})} (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
    }
    return { stats: this.stats, errors: this.errors, warnings: this.warnings, calls: this.api.calls };
  }
}

// ------------------------------------------------------------------------------------------------ CLI
// Since 2026 an app for your own store is made in the Dev Dashboard; its Client ID + secret are exchanged for a 24-hour
// Admin API token (client credentials grant). Works only when app and store are in the same Shopify organization.
async function clientCredentialsToken(store, clientId, clientSecret) {
  const res = await fetch(`https://${store}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret }),
  });
  if (!res.ok) {
    throw new Error(`token request failed (${res.status}): is the app installed on ${store} and in the same organization? ${(await res.text()).slice(0, 200)}`);
  }
  const { access_token: token, scope } = await res.json();
  console.log(`access token via client credentials (scopes: ${scope})`);
  return token;
}

async function main(argv) {
  const args = { steps: [], dryRun: false, verbose: false, filesFromUrl: false, version: '2026-07', store: process.env.SHOPIFY_STORE, token: process.env.SHOPIFY_ADMIN_TOKEN };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--verbose') args.verbose = true;
    else if (a === '--files-from-url') args.filesFromUrl = true;
    else if (a === '--store') args.store = argv[++i];
    else if (a === '--token') args.token = argv[++i];
    else if (a === '--api-version') args.version = argv[++i];
    else if (a === '--help' || a === '-h') { console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\nimport ')[0]); return 0; }
    else if (STEPS.includes(a) || EXTRA_STEPS.includes(a)) args.steps.push(a);
    else if (a === '--handles') args.handles = new Set(argv[++i].split(','));
    else if (a === '--prune') args.prune = true;
    else { console.error(`unknown argument ${a} (steps: ${STEPS.join(', ')})`); return 2; }
  }
  const steps = args.steps.length ? [...STEPS, ...EXTRA_STEPS].filter((s) => args.steps.includes(s)) : STEPS;
  const inputs = loadInputs();
  let api;
  if (args.dryRun) {
    const { MockAdmin } = await import('./mock-admin.mjs');
    api = MockAdmin.afterCsvImport(inputs.csvProducts);
    console.log(`dry run: in-memory store with the ${inputs.csvProducts.size} products of products.csv, no network`);
  } else {
    if (args.store && !args.store.includes('.')) args.store = `${args.store}.myshopify.com`;
    if (args.store && !args.token && process.env.SHOPIFY_CLIENT_ID && process.env.SHOPIFY_CLIENT_SECRET) {
      args.token = await clientCredentialsToken(args.store, process.env.SHOPIFY_CLIENT_ID, process.env.SHOPIFY_CLIENT_SECRET);
    }
    if (!args.store || !args.token) {
      console.error('set SHOPIFY_STORE plus SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET (Dev Dashboard app) or SHOPIFY_ADMIN_TOKEN (or --store / --token), or use --dry-run');
      return 2;
    }
    api = new Admin(args);
  }
  const res = await new Seeder(api, inputs, { verbose: args.verbose, filesFromUrl: args.filesFromUrl, handles: args.handles, prune: args.prune }).run(args.dryRun ? STEPS : steps);
  if (args.dryRun && api.report) {
    const rep = api.report();
    console.log(`store after the run: ${JSON.stringify(rep.counts)}`);
    res.errors.push(...rep.problems.map((p) => `[store] ${p}`));
  }
  for (const w of res.warnings.slice(0, args.verbose ? 1e9 : 15)) console.log(`WARN  ${w}`);
  if (!args.verbose && res.warnings.length > 15) console.log(`WARN  … ${res.warnings.length - 15} more (--verbose)`);
  for (const e of res.errors.slice(0, 50)) console.log(`ERROR ${e}`);
  console.log(`${res.calls} API calls · ${res.errors.length} errors · ${res.warnings.length} warnings`);
  return res.errors.length ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then((code) => process.exit(code), (err) => { console.error(err); process.exit(1); });
}
