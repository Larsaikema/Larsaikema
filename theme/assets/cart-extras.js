/* Klapklaar cart extras (cart page; the drawer only when it shows them): note and attributes (reference, delivery
   date), discount codes, the phone checkout bar. Needs cart.js + cart-ui.js (cart.post, cart.show). */
(() => {
const KK = window.KK, d = document, $ = (s, r = d) => r.querySelector(s), on = (t, f) => d.addEventListener(t, f), cart = () => KK.cart;
if (KK.cartExtras) return;
KK.cartExtras = 1;
/* note + attributes: saved on change, also sent with the cart form at checkout; the twin field (drawer/page) follows */
on('change', (e) => {
	const el = e.target, note = el.matches('[data-cart-note]'), key = el.dataset.cartAttribute;
	if (!note && !key) return;
	cart().post(`${KK.routes.cartUpdate}.js`, note ? { note: el.value } : { attributes: { [key]: el.value } }, 1).catch(() => {});
	d.querySelectorAll(note ? '[data-cart-note]' : `[data-cart-attribute="${CSS.escape(key)}"]`).forEach((x) => (x.value = el.value));
});

/* discount codes: Shopify replaces the cart's codes with the list sent; discount_codes[].applicable says if one works */
const codes = (box) => (box.dataset.codes || '').split(',').filter(Boolean);
const send = (list, quiet) => cart().post(`${KK.routes.cartUpdate}.js`, { discount: list.join() }, quiet);
const panel = (box) => d.getElementById(box.closest('details').id) || box;
const apply = async (box) => {
	const code = $('[data-discount-input]', box).value.trim(), lc = code.toLowerCase(), cur = codes(box), btn = $('[data-discount-apply]', box);
	const fail = (m) => {
		const p = panel(box), err = $('[data-discount-error]', p), field = $('[data-discount-input]', p);
		err.textContent = err.dataset[m];
		err.hidden = false;
		field.value = code;
		field.setAttribute('aria-invalid', 'true');
		field.focus({ preventScroll: true });
		err.scrollIntoView({ block: 'nearest' });
	};
	if (!code) return fail('msgEmpty');
	if (cur.some((c) => c.toLowerCase() == lc)) return void ($('[data-discount-input]', box).value = '');
	btn.classList.add('is-loading');
	try {
		/* sent with the sections, so a code that works shows at once (chip, discount row, new total) */
		const data = await send([...cur, code]);
		if ((data.discount_codes || []).some((c) => c.applicable && c.code.toLowerCase() == lc)) $('[data-discount-input]', panel(box)).value = '';
		else await send(cur, 1), fail('msgInvalid'); // Shopify keeps a code that does not apply: take it out, say why
	} catch (err) {
		KK.toast(KK.escape(err.message), 'error');
	}
	btn.classList.remove('is-loading');
};
on('click', (e) => {
	const go = e.target.closest('[data-discount-apply]'), rm = e.target.closest('[data-discount-remove]'), s = e.target.closest('.cart-extras__item>summary');
	if (s) return setTimeout(() => s.parentNode.open && s.parentNode.scrollIntoView({ block: 'nearest' })); // above the drawer's footer
	if (go) return apply(go.closest('[data-discount]'));
	if (!rm) return;
	const box = rm.closest('[data-discount]');
	rm.classList.add('is-loading');
	send(codes(box).filter((c) => c != rm.dataset.discountRemove)).then(() => $('[data-discount-input]', panel(box))?.focus(), (err) => KK.toast(KK.escape(err.message), 'error'));
});
on('keydown', (e) => e.key == 'Enter' && e.target.matches('[data-discount-input]') && (e.preventDefault(), apply(e.target.closest('[data-discount]'))));

/* cart page, phone: checkout bar until the summary's total is in view, so it never covers the total or its btw line.
   Measured on every scroll (an IntersectionObserver misses a jump from below it to above it, e.g. Home) */
customElements.get('cart-sticky') || customElements.define('cart-sticky', class extends HTMLElement {
	connectedCallback() {
		const t = this.closest('.cart-page')?.querySelector('.cart-summary__row--total');
		if (!t) return;
		this.hidden = false;
		(this.f = () => this.classList.toggle('is-off', t.getBoundingClientRect().top < innerHeight - this.offsetHeight))();
		addEventListener('scroll', this.f, { passive: true });
		addEventListener('resize', this.f);
	}
	disconnectedCallback() {
		removeEventListener('scroll', this.f);
		removeEventListener('resize', this.f);
	}
});

/* 'Gewenste leverdatum': the earliest day is the expected delivery date the summary shows (delivery-countdown.js), not
   the server's estimate, which can be stale in Shopify's page cache. Set at load and again before the picker opens. */
const D = '[data-cart-attribute="Gewenste leverdatum"]', minDate = (i) => {
	const el = i.closest('.cart-page,#CartDrawer')?.querySelector('[data-delivery],[data-wait-days]'), w = +el?.dataset.waitDays, r = !w && el && KK.delivery?.compute?.(el);
	const t = w ? new Date(Date.now() + (w + 1) * 864e5) : r?.eta;
	if (t) i.min = t.toISOString().slice(0, 10);
};
d.querySelectorAll(D).forEach(minDate);
on('focusin', (e) => e.target.matches?.(D) && minDate(e.target));

/* 'Geef je leverdatum door' (under a lead time; the drawer links here with #CartDate-page): open the row, go to the field */
const toDate = (e) => {
	const i = d.getElementById('CartDate-page');
	if (!i) return;
	e?.preventDefault();
	i.closest('details').open = true;
	i.focus({ preventScroll: true });
	i.scrollIntoView({ block: 'center' });
};
on('click', (e) => e.target.closest?.('.cart-page [data-date-link]') && toDate(e));
if (location.hash == '#CartDate-page') toDate();
})();
