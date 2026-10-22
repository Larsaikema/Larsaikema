// In-memory stand-in for the Shopify Admin GraphQL API, used by `node scripts/seed/seed.mjs --dry-run`.
// It answers the operations seed.mjs sends (matched on the operation name), starts with exactly the products and variants that
// products.csv creates, and checks every input the way the real API would refuse it: required fields, enum values, metafield
// definitions and types, list values, and that every reference points at an existing object of the right type.
const DEF_TYPES = new Set(['single_line_text_field', 'multi_line_text_field', 'rich_text_field', 'json', 'boolean', 'number_integer',
  'number_decimal', 'date', 'list.single_line_text_field', 'list.number_integer', 'list.product_reference', 'list.variant_reference',
  'list.file_reference', 'page_reference', 'product_reference', 'variant_reference', 'file_reference', 'collection_reference',
  'list.collection_reference', 'list.page_reference']);
const OWNER_GID = { PRODUCT: 'Product', PRODUCTVARIANT: 'ProductVariant', COLLECTION: 'Collection', ARTICLE: 'Article', PAGE: 'Page', BLOG: 'Blog' };
const REF_TYPE = { product_reference: 'Product', variant_reference: 'ProductVariant', page_reference: 'Page', file_reference: 'GenericFile',
  collection_reference: 'Collection' };
const MENU_TYPES = new Set(['ARTICLE', 'BLOG', 'CATALOG', 'COLLECTION', 'COLLECTIONS', 'CUSTOMER_ACCOUNT_PAGE', 'FRONTPAGE', 'HTTP', 'PAGE', 'PRODUCT',
  'SEARCH', 'SHOP_POLICY', 'METAOBJECT']);
const MENU_RESOURCE = { ARTICLE: 'Article', BLOG: 'Blog', COLLECTION: 'Collection', PAGE: 'Page', PRODUCT: 'Product', SHOP_POLICY: 'ShopPolicy' };
const SORT = new Set(['ALPHA_ASC', 'ALPHA_DESC', 'BEST_SELLING', 'CREATED', 'CREATED_DESC', 'MANUAL', 'PRICE_ASC', 'PRICE_DESC']);
const RULE_COL = new Set(['TYPE', 'TAG', 'TITLE', 'VENDOR', 'VARIANT_PRICE', 'VARIANT_TITLE', 'VARIANT_WEIGHT', 'VARIANT_INVENTORY', 'VARIANT_COMPARE_AT_PRICE',
  'IS_PRICE_REDUCED', 'PRODUCT_CATEGORY_ID', 'PRODUCT_METAFIELD_DEFINITION', 'VARIANT_METAFIELD_DEFINITION', 'PRODUCT_TAXONOMY_NODE_ID']);
const RULE_REL = new Set(['EQUALS', 'NOT_EQUALS', 'CONTAINS', 'NOT_CONTAINS', 'STARTS_WITH', 'ENDS_WITH', 'GREATER_THAN', 'LESS_THAN', 'IS_SET', 'IS_NOT_SET']);
const MAX_LIST = 128;

export class MockAdmin {
  static afterCsvImport(csvProducts) {
    const m = new MockAdmin();
    for (const [handle, skus] of csvProducts) {
      const pid = m.make('Product', { handle });
      for (const sku of skus) m.make('ProductVariant', { sku, productId: pid });
    }
    m.make('Publication', { name: 'Online Store' });
    m.make('Blog', { handle: 'news' });           // a new store has a blog 'news' and the menus main-menu and footer
    m.make('Menu', { handle: 'main-menu', title: 'Main menu' });
    m.make('Menu', { handle: 'footer', title: 'Footer menu' });
    m.make('ShopPolicy', { policyType: 'TERMS_OF_SERVICE' });   // filled in by the owner; the privacy policy is not yet (plain link)
    return m;
  }

  constructor() {
    this.seq = 1000;
    this.objs = new Map();          // gid -> object
    this.defs = new Map();          // OWNER|ns.key -> def
    this.problems = [];
    this.calls = 0;
    this.ops = {};
    this.uploads = 0;
  }

  make(type, data) {
    const id = `gid://shopify/${type}/${++this.seq}`;
    this.objs.set(id, { id, type, metafields: new Map(), ...data });
    return id;
  }

  all(type) { return [...this.objs.values()].filter((o) => o.type === type); }
  typeOf(gid) { return this.objs.get(gid)?.type; }
  problem(msg) { if (this.problems.length < 200) this.problems.push(msg); }

  page(list, first, after) {
    const start = after ? Number(after) : 0;
    const nodes = list.slice(start, start + first);
    return { nodes, pageInfo: { hasNextPage: start + first < list.length, endCursor: String(start + first) } };
  }

  // ---------------------------------------------------------------- validation
  checkValue(type, value, ctx) {
    if (typeof value !== 'string') return this.problem(`${ctx}: value must be a string, got ${typeof value}`);
    const base = type.replace(/^list\./, '');
    let vals = [value];
    if (type.startsWith('list.') || type === 'json' || type === 'rich_text_field') {
      try { vals = JSON.parse(value); } catch { return this.problem(`${ctx}: value is not JSON`); }
      if (type === 'json' || type === 'rich_text_field') return undefined;
      if (!Array.isArray(vals)) return this.problem(`${ctx}: list value must be a JSON array`);
      if (vals.length > MAX_LIST) this.problem(`${ctx}: ${vals.length} items > ${MAX_LIST}`);
    }
    for (const x of vals) {
      if (REF_TYPE[base]) {
        if (this.typeOf(x) !== REF_TYPE[base]) this.problem(`${ctx}: ${x} is not an existing ${REF_TYPE[base]}`);
      } else if (base === 'number_integer') {
        if (!Number.isInteger(x) && !/^-?\d+$/.test(String(x))) this.problem(`${ctx}: ${x} is not an integer`);
      } else if (base === 'boolean') {
        if (!['true', 'false'].includes(String(x))) this.problem(`${ctx}: ${x} is not a boolean`);
      }
    }
    return undefined;
  }

  checkMetafield(ownerType, m, ctx) {
    if (!m.namespace || !m.key || !m.type) return this.problem(`${ctx}: metafield without namespace/key/type`);
    if (m.namespace !== 'global') {
      const d = this.defs.get(`${ownerType}|${m.namespace}.${m.key}`);
      if (!d) this.problem(`${ctx}: no ${ownerType} definition for ${m.namespace}.${m.key}`);
      else if (d.type !== m.type) this.problem(`${ctx}: ${m.namespace}.${m.key} is ${d.type}, sent as ${m.type}`);
    }
    this.checkValue(m.type, m.value, `${ctx} ${m.namespace}.${m.key}`);
    return undefined;
  }

  storeMetafields(obj, mfs, ownerType, ctx) {
    for (const m of mfs || []) {
      this.checkMetafield(ownerType, m, ctx);
      obj.metafields.set(`${m.namespace}.${m.key}`, m);
    }
  }

  checkMenuItems(items, depth, ctx) {
    for (const it of items) {
      if (depth > 3) this.problem(`${ctx}: menu deeper than 3 levels at ${it.title}`);
      if (!it.title) this.problem(`${ctx}: item without title`);
      if (!MENU_TYPES.has(it.type)) this.problem(`${ctx}: item type ${it.type}`);
      if (MENU_RESOURCE[it.type]) {
        if (this.typeOf(it.resourceId) !== MENU_RESOURCE[it.type]) this.problem(`${ctx}: ${it.title} resourceId ${it.resourceId} is not a ${MENU_RESOURCE[it.type]}`);
      } else if (it.type === 'HTTP' && !it.url) this.problem(`${ctx}: HTTP item ${it.title} without url`);
      this.checkMenuItems(it.items || [], depth + 1, ctx);
    }
  }

  // ---------------------------------------------------------------- API
  async upload(target, buffer, filename) {
    if (!target.url || !buffer?.length) this.problem(`upload ${filename}: no target or empty file`);
    this.uploads++;
  }

  async gql(query, v = {}) {
    this.calls++;
    const op = (query.match(/^\s*(?:query|mutation)\s+(\w+)/) || [])[1];
    this.ops[op] = (this.ops[op] || 0) + 1;
    const fn = this[`op${op}`];
    if (!fn) throw new Error(`mock: no operation ${op}`);
    return fn.call(this, v);
  }

  opProducts(v) { return { products: this.page(this.all('Product').map((p) => ({ id: p.id, handle: p.handle })), 250, v.after) }; }
  opVariants(v) {
    return { productVariants: this.page(this.all('ProductVariant').map((x) => ({ id: x.id, sku: x.sku, product: { id: x.productId, handle: this.objs.get(x.productId).handle } })), 250, v.after) };
  }
  opPages(v) { return { pages: this.page(this.all('Page').map((p) => ({ id: p.id, handle: p.handle })), 250, v.after) }; }
  opBlogs(v) { return { blogs: this.page(this.all('Blog').map((p) => ({ id: p.id, handle: p.handle })), 50, v.after) }; }
  opBlogArticles(v) {
    if (this.typeOf(v.id) !== 'Blog') return { blog: null };
    return { blog: { articles: this.page(this.all('Article').filter((a) => a.blogId === v.id).map((a) => ({ id: a.id, handle: a.handle })), 250, v.after) } };
  }
  opCollections(v) { return { collections: this.page(this.all('Collection').map((p) => ({ id: p.id, handle: p.handle })), 250, v.after) }; }
  opCollectionProducts(v) {
    const c = this.objs.get(v.id);
    return { collection: c ? { products: this.page((c.products || []).map((id) => ({ id })), 250, v.after) } : null };
  }
  opMenus(v) { return { menus: this.page(this.all('Menu').map((p) => ({ id: p.id, handle: p.handle })), 50, v.after) }; }
  opFiles(v) {
    const name = (v.query.match(/filename:'([^']+)'/) || [])[1];
    const url = (f) => `https://cdn.shopify.com/s/files/1/0/files/${f.filename}?v=1`;
    return { files: { nodes: [...this.all('GenericFile'), ...this.all('MediaImage')].filter((f) => f.filename === name)
      .map((f) => (f.type === 'MediaImage' ? { id: f.id, image: { url: url(f) } } : { id: f.id, url: url(f), fileStatus: 'READY' })) } };
  }
  opFileStatus(v) { return { nodes: v.ids.map((id) => (this.objs.get(id) ? { id, fileStatus: 'READY', url: 'https://cdn.shopify.com/x' } : null)) }; }
  opPublications() { return { publications: { nodes: this.all('Publication').map((p) => ({ id: p.id, name: p.name })) } }; }
  opShopPolicies() { return { shop: { shopPolicies: this.all('ShopPolicy').map((p) => ({ id: p.id, type: p.policyType })) } }; }
  opRedirects(v) {
    const path = (v.query.match(/path:'([^']+)'/) || [])[1];
    return { urlRedirects: { nodes: this.all('UrlRedirect').filter((r) => r.path === path).map((r) => ({ id: r.id, path: r.path, target: r.target })) } };
  }

  opDefinitionCreate({ definition: d }) {
    const errs = [];
    for (const k of ['name', 'namespace', 'key', 'type', 'ownerType']) if (!d[k]) errs.push({ field: ['definition', k], message: `${k} is required` });
    if (!DEF_TYPES.has(d.type)) errs.push({ field: ['definition', 'type'], message: `unknown type ${d.type}` });
    if (!OWNER_GID[d.ownerType]) errs.push({ field: ['definition', 'ownerType'], message: `unknown ownerType ${d.ownerType}` });
    if (d.access && !['PUBLIC_READ', 'NONE'].includes(d.access.storefront)) errs.push({ field: ['definition', 'access'], message: 'storefront access' });
    for (const val of d.validations || []) if (!val.name || typeof val.value !== 'string') errs.push({ field: ['definition', 'validations'], message: 'validation needs name + string value' });
    const key = `${d.ownerType}|${d.namespace}.${d.key}`;
    if (this.defs.has(key)) errs.push({ field: ['definition', 'key'], message: 'Key is in use for this owner type', code: 'TAKEN' });
    if (!errs.length && d.pin && [...this.defs.values()].filter((x) => x.ownerType === d.ownerType && x.pin).length >= 20) {
      errs.push({ field: ['definition', 'pin'], message: 'Limit of 20 pinned definitions reached', code: 'PINNED_LIMIT_REACHED' });
    }
    if (errs.length) {
      if (!errs.every((e) => e.code)) this.problem(`definition ${key}: ${errs.map((e) => e.message).join('; ')}`);
      return { metafieldDefinitionCreate: { createdDefinition: null, userErrors: errs } };
    }
    this.defs.set(key, { ...d });
    return { metafieldDefinitionCreate: { createdDefinition: { id: this.make('MetafieldDefinition', { key }) }, userErrors: [] } };
  }

  opStagedUpload({ input }) {
    return { stagedUploadsCreate: { stagedTargets: input.map((x) => {
      if (!['FILE', 'IMAGE'].includes(x.resource) || !x.filename || !x.mimeType || x.httpMethod !== 'POST') this.problem(`stagedUpload ${x.filename}: bad input`);
      return { url: 'https://shopify-staged-uploads.storage.googleapis.com/', resourceUrl: `https://shopify-staged-uploads.storage.googleapis.com/tmp/${x.filename}`,
        parameters: [{ name: 'key', value: `tmp/${x.filename}` }] };
    }), userErrors: [] } };
  }

  opFileCreate({ files }) {
    return { fileCreate: { files: files.map((f) => {
      if (!f.originalSource || !['FILE', 'IMAGE'].includes(f.contentType)) this.problem(`fileCreate: bad input ${JSON.stringify(f).slice(0, 120)}`);
      return { id: this.make(f.contentType === 'IMAGE' ? 'MediaImage' : 'GenericFile', { filename: f.filename || f.originalSource.split('/').pop() }), fileStatus: 'UPLOADED' };
    }), userErrors: [] } };
  }

  opPageCreate({ page }) {
    if (!page.title) this.problem('pageCreate without title');
    if (this.all('Page').some((p) => p.handle === page.handle)) return { pageCreate: { page: null, userErrors: [{ field: ['handle'], message: 'taken' }] } };
    const id = this.make('Page', { handle: page.handle, title: page.title, body: page.body, templateSuffix: page.templateSuffix });
    this.storeMetafields(this.objs.get(id), page.metafields, 'PAGE', `page ${page.handle}`);
    return { pageCreate: { page: { id, handle: page.handle }, userErrors: [] } };
  }

  opPageUpdate({ id, page }) {
    const p = this.objs.get(id);
    if (!p) return { pageUpdate: { page: null, userErrors: [{ field: ['id'], message: 'not found' }] } };
    Object.assign(p, { title: page.title, body: page.body });
    this.storeMetafields(p, page.metafields, 'PAGE', `page ${p.handle}`);
    return { pageUpdate: { page: { id, handle: p.handle }, userErrors: [] } };
  }

  opBlogCreate({ blog }) {
    if (!blog.title || !['AUTO_PUBLISHED', 'CLOSED', 'MODERATED'].includes(blog.commentPolicy)) this.problem('blogCreate: title / commentPolicy');
    const id = this.make('Blog', { handle: blog.handle, title: blog.title });
    this.storeMetafields(this.objs.get(id), blog.metafields, 'BLOG', `blog ${blog.handle}`);
    return { blogCreate: { blog: { id, handle: blog.handle }, userErrors: [] } };
  }

  checkArticle(a, ctx) {
    if (!a.title || !a.author?.name) this.problem(`${ctx}: title and author.name are required`);
    if (a.image && !/^https:\/\//.test(a.image.url || '')) this.problem(`${ctx}: image url`);
  }

  opArticleCreate({ article }) {
    this.checkArticle(article, `article ${article.handle}`);
    if (this.typeOf(article.blogId) !== 'Blog') this.problem(`article ${article.handle}: blogId ${article.blogId}`);
    const id = this.make('Article', { handle: article.handle, blogId: article.blogId });
    this.storeMetafields(this.objs.get(id), article.metafields, 'ARTICLE', `article ${article.handle}`);
    return { articleCreate: { article: { id, handle: article.handle }, userErrors: [] } };
  }

  opArticleUpdate({ id, article }) {
    const a = this.objs.get(id);
    this.checkArticle(article, `article ${a?.handle}`);
    this.storeMetafields(a, article.metafields, 'ARTICLE', `article ${a.handle}`);
    return { articleUpdate: { article: { id, handle: a.handle }, userErrors: [] } };
  }

  checkCollection(input, ctx) {
    if (!input.id && !input.title) this.problem(`${ctx}: title required`);
    if (input.sortOrder && !SORT.has(input.sortOrder)) this.problem(`${ctx}: sortOrder ${input.sortOrder}`);
    if (input.ruleSet) {
      if (typeof input.ruleSet.appliedDisjunctively !== 'boolean') this.problem(`${ctx}: appliedDisjunctively`);
      for (const r of input.ruleSet.rules) {
        if (!RULE_COL.has(r.column) || !RULE_REL.has(r.relation) || !r.condition) this.problem(`${ctx}: rule ${JSON.stringify(r)}`);
      }
    }
    for (const id of input.products || []) if (this.typeOf(id) !== 'Product') this.problem(`${ctx}: product ${id}`);
    if (input.image && !/^https:\/\//.test(input.image.src || '')) this.problem(`${ctx}: image src`);
  }

  opCollectionCreate({ input }) {
    this.checkCollection(input, `collection ${input.handle}`);
    if (input.ruleSet && input.products) this.problem(`collection ${input.handle}: smart collection with products`);
    const id = this.make('Collection', { handle: input.handle, smart: !!input.ruleSet, products: [...(input.products || [])] });
    this.storeMetafields(this.objs.get(id), input.metafields, 'COLLECTION', `collection ${input.handle}`);
    return { collectionCreate: { collection: { id, handle: input.handle }, userErrors: [] } };
  }

  opCollectionUpdate({ input }) {
    const c = this.objs.get(input.id);
    this.checkCollection(input, `collection ${c?.handle}`);
    if (input.products) this.problem(`collection ${c.handle}: products is not allowed on update`);
    if (!!input.ruleSet !== c.smart) this.problem(`collection ${c.handle}: cannot switch between smart and manual`);
    this.storeMetafields(c, input.metafields, 'COLLECTION', `collection ${c.handle}`);
    return { collectionUpdate: { collection: { id: c.id, handle: c.handle }, userErrors: [] } };
  }

  opCollectionAddProducts({ id, productIds }) {
    const c = this.objs.get(id);
    if (c.smart) return { collectionAddProducts: { collection: null, userErrors: [{ field: ['id'], message: 'Can\'t manually add products to a smart collection' }] } };
    for (const p of productIds) if (c.products.includes(p)) this.problem(`collection ${c.handle}: product ${p} added twice`); else c.products.push(p);
    return { collectionAddProducts: { collection: { id }, userErrors: [] } };
  }

  opPublish({ id, input }) {
    const o = this.objs.get(id);
    if (!o || input.some((x) => this.typeOf(x.publicationId) !== 'Publication')) this.problem(`publish ${id}: bad id or publication`);
    else o.published = true;
    return { publishablePublish: { userErrors: [] } };
  }

  opMetafieldsSet({ metafields }) {
    if (metafields.length > 25) this.problem(`metafieldsSet with ${metafields.length} > 25 metafields`);
    for (const m of metafields) {
      const o = this.objs.get(m.ownerId);
      if (!o) { this.problem(`metafieldsSet: owner ${m.ownerId} not found`); continue; }
      const owner = Object.keys(OWNER_GID).find((k) => OWNER_GID[k] === o.type);
      this.checkMetafield(owner, m, `${o.handle || o.sku}`);
      o.metafields.set(`${m.namespace}.${m.key}`, m);
    }
    return { metafieldsSet: { metafields: metafields.map(() => ({ id: `gid://shopify/Metafield/${++this.seq}` })), userErrors: [] } };
  }

  opMenuCreate({ title, handle, items }) {
    this.checkMenuItems(items, 1, `menu ${handle}`);
    if (this.all('Menu').some((m) => m.handle === handle)) return { menuCreate: { menu: null, userErrors: [{ field: ['handle'], message: 'taken', code: 'TAKEN' }] } };
    const id = this.make('Menu', { handle, title, items });
    return { menuCreate: { menu: { id, handle }, userErrors: [] } };
  }

  opMenuUpdate({ id, title, handle, items }) {
    this.checkMenuItems(items, 1, `menu ${handle}`);
    Object.assign(this.objs.get(id), { title, items });
    return { menuUpdate: { menu: { id, handle }, userErrors: [] } };
  }

  opRedirectCreate({ urlRedirect: r }) {
    if (!/^\//.test(r.path || '') || !r.target) this.problem(`redirect ${JSON.stringify(r)}`);
    if (this.all('UrlRedirect').some((x) => x.path === r.path)) return { urlRedirectCreate: { urlRedirect: null, userErrors: [{ field: ['path'], message: 'taken' }] } };
    return { urlRedirectCreate: { urlRedirect: { id: this.make('UrlRedirect', { path: r.path, target: r.target }) }, userErrors: [] } };
  }

  report() {
    const count = (t) => this.all(t).length;
    const mf = (t) => this.all(t).reduce((n, o) => n + o.metafields.size, 0);
    return {
      counts: {
        definitions: this.defs.size, files: count('GenericFile'), pages: count('Page'), articles: count('Article'), collections: count('Collection'),
        menus: count('Menu'), redirects: count('UrlRedirect'), product_metafields: mf('Product'), variant_metafields: mf('ProductVariant'),
        collection_metafields: mf('Collection'), uploads: this.uploads,
      },
      problems: this.problems,
    };
  }
}
