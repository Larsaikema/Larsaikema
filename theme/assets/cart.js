/* Klapklaar cart core (every page): add, drawer, quick add. Notes: sections/cart-drawer.liquid */
(() => {
const KK = window.KK, d = document, $ = (s, r = d) => r.querySelector(s), on = (t, f, o) => d.addEventListener(t, f, o);
const J = { 'Content-Type': 'application/json', Accept: 'application/json' };
const drawer = () => d.getElementById('CartDrawer'), page = () => $('.cart-page'), zone = (t) => t?.closest?.('#CartDrawer,.cart-page');
const got = {}, load = (u) =>
	(got[u] ||= new Promise((ok) => {
		if (!u || $(`[src="${u}"],[href="${u}"]`)) return ok();
		const c = /\.css\b/.test(u), n = d.createElement(c ? 'link' : 'script');
		c ? ((n.rel = 'stylesheet'), (n.href = u)) : (n.src = u);
		n.onload = n.onerror = ok;
		d.head.append(n);
	}));
const ds = () => $('cart-drawer')?.dataset || {}, css = () => Promise.all([load(ds().css), load(ds().extrasCss)]), ui = () => Promise.all([css(), load(ds().ui), load(ds().extras)]);
on('pointerover', (e) => e.target.closest?.('[data-cart-toggle]') && css(), { passive: true });
on('pointerdown', (e) => zone(e.target) && ui(), { passive: true });
on('focusin', (e) => zone(e.target) && !e.target.matches('[data-drawer-close],[tabindex="-1"]') && ui());
let replay, q = Promise.resolve(), live;
['click', 'change'].forEach((type) =>
	on(type, (e) => {
		const t = !KK.cartUi && !replay && e.target.closest?.(type == 'click' ? '[data-cart-remove],[data-discount-apply],[data-discount-remove]' : '[name="updates[]"],[data-cart-note],[data-cart-attribute]');
		if (!zone(t)) return;
		e.preventDefault();
		e.stopImmediatePropagation();
		ui().then(() => ((replay = 1), type == 'click' ? t.click() : t.dispatchEvent(new Event('change', { bubbles: true })), (replay = 0)));
	}, true)
);
on('keydown', (e) => e.key == ' ' && e.target.matches?.('[data-cart-remove]') && (e.preventDefault(), e.target.click()));
const mark = (root, item, block = 'nearest') => {
	const row = item?.key && root?.querySelector(`.cart-line[data-key="${CSS.escape(item.key)}"]`);
	row?.classList.add('is-new');
	row?.scrollIntoView({ block });
};

const cart = (KK.cart = {
	load,
	ui,
	run(fn) {
		cart.flush?.();
		const p = q.then(fn);
		q = p.catch(() => {});
		return p;
	},
	say(t) {
		const l = $('#CartDrawer[open] [data-cart-live]') || (live ||= d.body.appendChild(Object.assign(d.createElement('p'), { className: 'visually-hidden' })));
		l.setAttribute('role', 'status');
		l.textContent = '';
		setTimeout(() => (l.textContent = t), 150);
	},
	ids: () => [...d.querySelectorAll('[data-cart-dependent][data-section-id]')].map((e) => e.dataset.sectionId).concat(drawer() && !page() ? 'cart-drawer' : []).slice(0, 5),
	render(s) {
		for (const [id, html] of Object.entries(s || {})) {
			const D = id == 'cart-drawer', S = D ? '#CartDrawerInner' : '[data-cart-dependent]', old = $(D ? S : `#shopify-section-${id} ${S}`), fresh = html && old && KK.parse(html).querySelector(S);
			if (!fresh) continue;
			const open = [...old.querySelectorAll('details[open][id]')].map((x) => x.id), top = $('.drawer__body', old)?.scrollTop, f = cart.keep?.(old), root = D ? old : d.importNode(fresh, 1);
			D ? ((old.innerHTML = fresh.innerHTML), (drawer().dataset.itemCount = fresh.dataset.itemCount)) : old.replaceWith(root);
			open.forEach((x) => d.getElementById(x)?.setAttribute('open', ''));
			if (top) $('.drawer__body', root).scrollTop = top;
			f?.(root);
		}
	},
	req: (u, body, quiet, err = KK.strings.cartError) =>
		cart.run(async () => {
			const ids = quiet ? [] : cart.ids(), x = ids.length ? { sections: ids.join(), sections_url: location.pathname } : {}, fd = body instanceof FormData;
			if (fd) for (const k in x) body.append(k, x[k]);
			const r = await fetch(u, { method: 'POST', headers: fd ? { Accept: J.Accept, 'X-Requested-With': 'XMLHttpRequest' } : J, body: fd ? body : JSON.stringify({ ...body, ...x }) });
			const data = await r.json().catch(() => ({}));
			if (!r.ok || data.status) throw Object.assign(Error((r.status == 422 && data.description) || err), { data });
			return data;
		}),
	async add(body, { quiet } = {}) {
		css();
		const rev = body.items?.length > 1;
		if (rev) body = { ...body, items: [...body.items].reverse() };
		const data = await cart.req(`${KK.routes.cartAdd}.js`, body, quiet, KK.strings.addError);
		if (rev) data.items?.reverse();
		if (quiet) return data;
		cart.render(data.sections);
		const n = !page() && drawer()?.dataset.itemCount;
		KK.updateCartCount(n ? +n : await (await fetch(`${KK.routes.cart}.js`, { headers: J })).json());
		KK.emit('cart:added', { data });
		return data;
	},
	change: (...a) => ui().then(() => (KK.cartUi ? cart.change(...a) : Promise.reject(Error(KK.strings.cartError)))),
	async open(by = d.activeElement) {
		const dlg = drawer(), t = $('[data-cart-toggle]');
		if (!dlg) return void (location.href = KK.routes.cart);
		await css();
		$('[data-cart-added]', dlg)?.setAttribute('hidden', '');
		KK.openDialog(dlg, t);
		if (by && by != t && by != d.body && !dlg.contains(by)) {
			dlg._opener = by;
			dlg.addEventListener('close', () => (by.removeAttribute('aria-expanded'), t?.setAttribute('aria-expanded', 'false')), { once: true });
		}
	},
	label(i) {
		const v = i?.product_has_only_default_variant ? [] : (i?.variant_options || []).filter((o) => !i.product_title.includes(o));
		return i?.product_title ? i.product_title + (v.length ? `, ${v.join(' · ')}` : '') : '';
	},
	async afterAdd(title, item) {
		const line = cart.label(item) || title || '', p = page();
		if (p) return KK.toast(`<strong>${KK.escape(KK.strings.addedTitle)}</strong>${line && `<br>${KK.escape(line)}`}`), mark(p, item, 'center');
		if (KK.cartType == 'page' || !drawer()) return void (location.href = KK.routes.cart);
		await cart.open();
		$('#CartDrawer [data-cart-added]')?.removeAttribute('hidden');
		cart.say(`${KK.strings.addedTitle} ${line}`);
		mark(drawer(), item);
	},
});

on('click', (e) => {
	if (!e.target.closest?.('[data-cart-toggle]') || (!page() && (!drawer() || KK.cartType == 'page'))) return;
	e.preventDefault();
	if (!page()) return cart.open();
	scrollTo({ top: 0 });
	$('h1', page())?.focus({ preventScroll: true });
});

on('submit', async (e) => {
	const form = e.target.closest?.('form[data-product-form]');
	if (!form || form.dataset.productForm == 'main') return;
	e.preventDefault();
	const b = $('[type=submit]', form), fd = new FormData(form);
	b?.classList.add('is-loading');
	try {
		const res = await cart.add({ items: [{ id: +fd.get('id'), quantity: +fd.get('quantity') || 1 }] });
		cart.afterAdd(form.closest('.card,.upsell__item')?.querySelector('a[href*="/products/"]:not([tabindex])')?.textContent.trim(), res.items ? res.items[0] : res);
	} catch (err) {
		KK.toast(KK.escape(err.message || KK.strings.addError), 'error');
	}
	b?.classList.remove('is-loading');
});
})();
