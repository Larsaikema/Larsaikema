// Local stand-in for https://cdn.shopify.com/storefront/standard-events.js (blocked offline).
// Implements the public API declared in Horizon's assets/standard-events.d.ts so themes behave as on Shopify.

export const StandardEvents = Object.freeze({
  pageView: 'shopify:page:view',
  productView: 'shopify:product:view',
  productSelect: 'shopify:product:select',
  cartView: 'shopify:cart:view',
  cartError: 'shopify:cart:error',
  cartLinesUpdate: 'shopify:cart:lines-update',
  cartNoteUpdate: 'shopify:cart:note-update',
  cartDiscountUpdate: 'shopify:cart:discount-update',
  searchUpdate: 'shopify:search:update',
  collectionView: 'shopify:collection:view',
  collectionUpdate: 'shopify:collection:update',
});

function createGid(type, id) {
  if (id === null || id === undefined || id === '') return id;
  const s = String(id);
  if (s.startsWith('gid://')) return s;
  return `gid://shopify/${type}/${s}`;
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  // Avoid unhandled-rejection noise for promises nobody listens to.
  promise.catch(() => {});
  return { promise, resolve, reject };
}

function money(amount, currencyCode) {
  const n = typeof amount === 'string' ? Number(amount) : Number(amount || 0);
  // AJAX amounts are in cents
  return { amount: (n / 100).toFixed(2), currencyCode: currencyCode || (window.Shopify?.currency?.active ?? 'EUR') };
}

function fromAjaxCart(cart) {
  if (!cart) return null;
  const currency = cart.currency;
  return {
    id: createGid('Cart', cart.token || ''),
    totalQuantity: Number(cart.item_count || 0),
    cost: { totalAmount: money(cart.total_price, currency) },
    lines: (cart.items || []).map((line) => ({
      id: createGid('CartLine', line.key ?? String(line.id)),
      quantity: Number(line.quantity || 0),
      cost: { totalAmount: money(line.final_line_price, currency) },
    })),
    discountCodes: (cart.discount_codes || []).map((d) => ({ code: d.code, applicable: !!d.applicable })),
  };
}

function convertIds(value, key) {
  if (Array.isArray(value)) return value.map((v) => convertIds(v, key));
  if (value instanceof Promise) return value;
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (k === 'detail' || k === 'promise') {
        out[k] = v;
      } else if (k === 'merchandiseId' && (typeof v === 'string' || typeof v === 'number')) {
        out[k] = createGid('ProductVariant', v);
      } else {
        out[k] = convertIds(v, k);
      }
    }
    return out;
  }
  return value;
}

export class ShopifyStandardEvent extends Event {
  static eventName = '';
  static createGid = createGid;

  constructor(type, payload = {}, options = {}) {
    super(type, { bubbles: true, composed: true, cancelable: true, ...options });
    Object.assign(this, payload);
  }
}

function withPromise(cls) {
  cls.createPromise = deferred;
  return cls;
}

export class PageViewEvent extends ShopifyStandardEvent {
  static eventName = StandardEvents.pageView;
  constructor(payload) {
    super(StandardEvents.pageView, payload);
  }
}

export class ProductViewEvent extends ShopifyStandardEvent {
  static eventName = StandardEvents.productView;
  constructor(payload) {
    const p = { ...payload };
    if (p.product) {
      p.product = { ...p.product, id: createGid('Product', p.product.id) };
      if (p.product.selectedVariant) {
        p.product.selectedVariant = { ...p.product.selectedVariant, id: createGid('ProductVariant', p.product.selectedVariant.id) };
      }
    }
    super(StandardEvents.productView, p);
  }
}

export class ProductSelectEvent extends ShopifyStandardEvent {
  static eventName = StandardEvents.productSelect;
  constructor(payload) {
    const p = { ...payload };
    if (p.product) p.product = { ...p.product, id: createGid('Product', p.product.id) };
    super(StandardEvents.productSelect, p);
  }
}
withPromise(ProductSelectEvent);

export class CartViewEvent extends ShopifyStandardEvent {
  static eventName = StandardEvents.cartView;
  static createCartFromAjaxResponse = fromAjaxCart;
  constructor({ cart, ...payload }) {
    super(StandardEvents.cartView, { ...payload, cart: cart ? { ...cart, id: cart.id ?? '' } : null });
  }
}

export class CartErrorEvent extends ShopifyStandardEvent {
  static eventName = StandardEvents.cartError;
  constructor(payload) {
    super(StandardEvents.cartError, payload);
  }
}

class CartLinesUpdateEventImpl extends ShopifyStandardEvent {
  static eventName = StandardEvents.cartLinesUpdate;
  static createCartFromAjaxResponse = fromAjaxCart;
  constructor(payload) {
    super(StandardEvents.cartLinesUpdate, convertIds(payload));
  }
}
withPromise(CartLinesUpdateEventImpl);
export const CartLinesUpdateEvent = CartLinesUpdateEventImpl;

export class CartNoteUpdateEvent extends ShopifyStandardEvent {
  static eventName = StandardEvents.cartNoteUpdate;
  static createCartFromAjaxResponse = fromAjaxCart;
  constructor(payload) {
    super(StandardEvents.cartNoteUpdate, payload);
  }
}
withPromise(CartNoteUpdateEvent);

export class CartDiscountUpdateEvent extends ShopifyStandardEvent {
  static eventName = StandardEvents.cartDiscountUpdate;
  static createCartFromAjaxResponse = fromAjaxCart;
  constructor(payload) {
    super(StandardEvents.cartDiscountUpdate, payload);
  }
}
withPromise(CartDiscountUpdateEvent);

function parseProductFilters(searchParams = new URLSearchParams(window.location.search)) {
  const filters = [];
  let price = null;
  for (const [key, value] of searchParams.entries()) {
    if (!key.startsWith('filter.')) continue;
    if (key === 'filter.v.availability') filters.push({ available: value === '1' });
    else if (key === 'filter.v.price.gte') (price ??= {}).min = Number(value);
    else if (key === 'filter.v.price.lte') (price ??= {}).max = Number(value);
    else if (key === 'filter.p.product_type') filters.push({ productType: value });
    else if (key === 'filter.p.vendor') filters.push({ productVendor: value });
    else if (key === 'filter.p.tag') filters.push({ tag: value });
    else if (key.startsWith('filter.v.option.')) filters.push({ variantOption: { name: key.slice(16), value } });
    else if (key.startsWith('filter.p.m.')) {
      const [namespace, k] = key.slice(11).split('.');
      filters.push({ productMetafield: { namespace, key: k, value } });
    } else if (key.startsWith('filter.v.m.')) {
      const [namespace, k] = key.slice(11).split('.');
      filters.push({ variantMetafield: { namespace, key: k, value } });
    }
  }
  if (price) filters.push({ price });
  return filters.length ? filters : undefined;
}

const COLLECTION_SORT = {
  manual: 'MANUAL', 'best-selling': 'BEST_SELLING', 'title-ascending': 'TITLE', 'title-descending': 'TITLE',
  'price-ascending': 'PRICE', 'price-descending': 'PRICE', 'created-ascending': 'CREATED', 'created-descending': 'CREATED',
};

function getCollectionSortKey(searchParams = new URLSearchParams(window.location.search)) {
  const v = searchParams.get('sort_by');
  return v ? COLLECTION_SORT[v] ?? 'COLLECTION_DEFAULT' : undefined;
}

function getSearchSortKey(searchParams = new URLSearchParams(window.location.search)) {
  const v = searchParams.get('sort_by');
  if (!v) return undefined;
  return v.startsWith('price') ? 'PRICE' : 'RELEVANCE';
}

export class SearchUpdateEvent extends ShopifyStandardEvent {
  static eventName = StandardEvents.searchUpdate;
  static parseProductFilters = parseProductFilters;
  static getSortKey = getSearchSortKey;
  constructor(payload) {
    super(StandardEvents.searchUpdate, payload);
  }
}
withPromise(SearchUpdateEvent);

export class CollectionViewEvent extends ShopifyStandardEvent {
  static eventName = StandardEvents.collectionView;
  constructor(payload) {
    const p = { ...payload };
    if (p.collection) p.collection = { ...p.collection, id: createGid('Collection', p.collection.id) };
    super(StandardEvents.collectionView, p);
  }
}

export class CollectionUpdateEvent extends ShopifyStandardEvent {
  static eventName = StandardEvents.collectionUpdate;
  static parseProductFilters = parseProductFilters;
  static getSortKey = getCollectionSortKey;
  constructor(payload) {
    const p = { ...payload };
    if (p.collection) p.collection = { ...p.collection, id: createGid('Collection', p.collection.id) };
    super(StandardEvents.collectionUpdate, p);
  }
}
withPromise(CollectionUpdateEvent);

const VIEW_EVENT_CLASSES = {
  product: ProductViewEvent,
  collection: CollectionViewEvent,
  cart: CartViewEvent,
};

function readPayload(el) {
  const attr = el.getAttribute('view-event-payload');
  let raw = attr;
  if (!raw) raw = el.querySelector(':scope > script[type="application/json"][data-view-event-payload]')?.textContent;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function eventForPayload(payload) {
  if (!payload) return null;
  if (payload.product) return new ProductViewEvent(payload);
  if (payload.collection) return new CollectionViewEvent(payload);
  if ('cart' in payload) return new CartViewEvent(payload);
  return null;
}

export function createViewEventElement(Base = HTMLElement, options = {}) {
  const defaultTrigger = options.defaultTrigger || 'connect';
  return class ViewEventElement extends Base {
    #observer = null;
    #dispatched = false;

    connectedCallback() {
      super.connectedCallback?.();
      const trigger = this.getAttribute('view-event-trigger') || defaultTrigger;
      if (trigger === 'connect') {
        queueMicrotask(() => this.dispatchViewEvent());
      } else if (trigger === 'intersect' && 'IntersectionObserver' in window) {
        this.#observer = new IntersectionObserver((entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            this.#observer?.disconnect();
            this.dispatchViewEvent();
          }
        });
        this.#observer.observe(this);
      } else if (trigger === 'dialog') {
        const dialog = this.closest('dialog');
        dialog?.addEventListener('toggle', () => dialog.open && this.dispatchViewEvent());
      }
    }

    disconnectedCallback() {
      super.disconnectedCallback?.();
      this.#observer?.disconnect();
      this.#dispatched = false;
    }

    dispatchViewEvent() {
      if (this.#dispatched) return;
      const evt = eventForPayload(readPayload(this));
      if (!evt) return;
      this.#dispatched = true;
      this.dispatchEvent(evt);
    }
  };
}

export default {
  StandardEvents,
  ShopifyStandardEvent,
  PageViewEvent,
  ProductViewEvent,
  ProductSelectEvent,
  CartViewEvent,
  CartErrorEvent,
  CartLinesUpdateEvent,
  CartNoteUpdateEvent,
  CartDiscountUpdateEvent,
  SearchUpdateEvent,
  CollectionViewEvent,
  CollectionUpdateEvent,
  createViewEventElement,
};

void VIEW_EVENT_CLASSES;
