/* Klapklaar cart extras (cart page; the drawer only when it shows them): note and attributes (reference, delivery
   date), discount codes, the phone checkout bar. Needs cart.js + cart-ui.js (cart.post, cart.show). */
(() => {
const KK = window.KK, d = document, $ = (s, r = d) => r.querySelector(s), on = (t, f) => d.addEventListener(t, f), cart = () => KK.cart;
if (KK.cartExtras) return;
KK.cartExtras = 1;
/* note + attributes: saved on change, also sent with the cart form at checkout; the twin field (drawer/page) follows.
   A delivery date before the earliest possible day is not saved (an empty one is), and says why */
on('change', (e) => {
	const el = e.target, note = el.matches('[data-cart-note]'), key = el.dataset.cartAttribute;
	if (!note && !key) return;
	const v = el.matches(D) && (minDate(el), flag(el)) ? '' : el.value;
	cart().post(`${KK.routes.cartUpdate}.js`, note ? { note: v } : { attributes: { [key]: v } }, 1).catch(() => {});
	d.querySelectorAll(note ? '[data-cart-note]' : `[data-cart-attribute="${CSS.escape(key)}"]`).forEach((x) => x != el && (x.value = el.value));
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

/* 'Gewenste leverdatum': the earliest day is the last day of the expected window the summary shows ('verwacht in huis
   3 – 10 nov' -> 10 nov; in stock: the expected date, delivery-countdown.js), not the server's estimate, which can be
   stale in Shopify's page cache. Set at load and before the picker opens; the help says it ('Kan vanaf di 10 nov.').
   An earlier date gets an inline error (aria-invalid) and stops Afrekenen until it is fixed or emptied. */
const D = '[data-cart-attribute="Gewenste leverdatum"]', day = (s) => new Date(s).toLocaleDateString(d.documentElement.lang || 'nl', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).replace('.', '').replace(/ /g, '\u00a0');
function minDate(i) {
	const el = i.closest('.cart-page,#CartDrawer')?.querySelector('[data-delivery],[data-wait-days]'), c = el && KK.delivery?.compute?.(el), s = el && $('[data-wait-lead]', el), w = +el?.dataset.waitDays;
	const t = c && s ? c.etaAt(+s.dataset.to + c.transit) : w ? new Date(Date.now() + (w + 1) * 864e5) : c?.eta, f = $('[data-date-from]', i.parentNode);
	if (t) i.min = t.toISOString().slice(0, 10);
	if (f && i.min) f.textContent = f.dataset.dateFrom.replace('__DATE__', day(i.min));
}
function flag(i) {
	const e = $('[data-date-error]', i.parentNode), bad = !!(i.value && i.min && i.value < i.min);
	if (e) (e.textContent = bad ? e.dataset.dateError.replace('__DATE__', day(i.min)) : ''), (e.hidden = !bad);
	bad ? i.setAttribute('aria-invalid', 'true') : i.removeAttribute('aria-invalid');
	return bad;
}
const dates = () => d.querySelectorAll(D).forEach((i) => (minDate(i), flag(i)));
dates();
['cart:changed', 'cart:added'].forEach((x) => KK.on(x, dates)); // a re-render brings the server's min back, and the cart's lead time may have changed
on('focusin', (e) => e.target.matches?.(D) && minDate(e.target));
on('click', (e) => {
	if (!e.target.closest?.('[name="checkout"]')) return;
	const i = [...d.querySelectorAll(D)].find((x) => (minDate(x), flag(x)));
	if (!i) return;
	e.preventDefault();
	i.closest('details').open = true;
	i.focus({ preventScroll: true });
	i.scrollIntoView({ block: 'center' });
});

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
