/* Variant picker + product-info; documented in snippets/product-variant-picker.liquid. */
(() => {
const KK = window.KK;
const money = (c) => ['incl', 'excl'].map((m) => `<span data-vat-show="${m}">${KK.formatMoney(KK.vatShown(c, m === 'excl'))}</span>`).join('');
class VariantPicker extends HTMLElement {
	connectedCallback() {
		this.variants = JSON.parse(this.querySelector('script[data-variants]').textContent);
		this.addEventListener('change', (e) => e.target.matches('.vp__input') && this.onChange(e.target));
		this.hl = null;
		this.addEventListener('pointerover', (e) => {
			const l = e.target.closest('.vp__swatch');
			if (e.pointerType === 'mouse' && (l || !e.target.closest('.vp__option--swatch .vp__values'))) this.hover(l);
		});
		this.addEventListener('pointerleave', () => this.hover(null));
	}
	hover(l) {
		if (l === this.hl) return;
		const g = this.closest('product-info')?.querySelector('media-gallery');
		if (!this.hl) this.gi = g?.index;
		const fs = (l || this.hl).closest('fieldset');
		this.hl = l;
		const c = l ? document.getElementById(l.htmlFor) : fs.querySelector('input:checked');
		const out = fs.querySelector('[data-selected-value]');
		if (out && c) out.textContent = c.value;
		if (!g || !c) return;
		if (!l) return g.go(this.gi, false);
		const i = +fs.dataset.optionIndex;
		const cur = [...this.querySelectorAll('fieldset[data-option-index]')].map((f) => f.querySelector('input:checked')?.value);
		cur[i] = c.value;
		const v = this.variants.find((x) => x.options.every((o, k) => o === cur[k])) || this.variants.find((x) => x.options[i] === c.value);
		if (v?.media_id) g.goToMedia(v.media_id, false);
	}
	onChange(input) {
		const sets = [...this.querySelectorAll('fieldset[data-option-index]')];
		const idx = +input.closest('fieldset').dataset.optionIndex;
		const opts = sets.map((fs) => fs.querySelector('input:checked')?.value);
		let v = this.variants.find((x) => x.options.every((o, i) => o === opts[i]));
		if (!v) {
			v = this.variants.find((x) => x.available && x.options[idx] === opts[idx]) || this.variants.find((x) => x.options[idx] === opts[idx]);
			if (!v) return;
			v.options.forEach((o, i) => {
				const r = [...this.querySelectorAll(`fieldset[data-option-index="${i}"] input`)].find((el) => el.value === o);
				if (r) r.checked = true;
			});
		}
		this.hl = null;
		sets.forEach((fs) => {
			const out = fs.querySelector('[data-selected-value]');
			const c = fs.querySelector('input:checked');
			if (out && c) out.textContent = c.value.replace(/ x /g, ' × ');
			fs.querySelectorAll('[data-hint]').forEach((h) => (h.hidden = h.dataset.hint !== c?.value));
		});
		this.syncSiblings(v);
		this.closest('product-info')?.setVariant(v);
	}
	syncSiblings(v) {
		const links = this.querySelectorAll('[data-sibling]');
		if (!links.length) return;
		const pairs = JSON.parse(this.dataset.keyNames || '[]').map((n, i) => n !== null && `${n}=${v.options[i]}|`).filter(Boolean);
		links.forEach((a) => {
			const map = JSON.parse(a.dataset.siblingVariants || '{}');
			const keys = Object.keys(map);
			const exact = map[pairs.join('')];
			const score = (k) => pairs.filter((p) => k.includes(p)).length * 2 + (map[k][1] ? 1 : 0);
			const hit = exact || map[keys.sort((x, y) => score(y) - score(x))[0]];
			a.href = hit ? `${a.dataset.url}?variant=${hit[0]}` : a.dataset.url;
			const off = !hit || !hit[1];
			a.classList.toggle('is-unavailable', off);
			a.querySelector('[data-unavailable-text]')?.toggleAttribute('hidden', !off);
			const price = a.querySelector('[data-sibling-price]');
			const miss = !exact && pairs.find((p) => !keys.some((k) => k.includes(p)));
			const note = miss ? this.dataset.missTpl.replace('__VALUE__', miss.slice(miss.indexOf('=') + 1, -1)) : '';
			if (price) note ? (price.textContent = note) : hit && hit[2] != null && (price.innerHTML = money(hit[2]));
			const sr = a.querySelector('[data-sibling-note]');
			if (sr) sr.textContent = note && `, ${note}`;
		});
	}
}
customElements.get('variant-picker') || customElements.define('variant-picker', VariantPicker);

class ProductInfo extends HTMLElement {
	connectedCallback() {
		this.cache = new Map();
		const byId = (id) => document.getElementById(id);
		const h = location.hash && byId(decodeURIComponent(location.hash.slice(1)));
		if (h?.tagName === 'DETAILS') h.open = true;
		const wide = (this.wide = matchMedia('(min-width: 990px)'));
		const syncCards = () => {
			this.querySelectorAll('details[data-open-desktop]').forEach((d) => (d.open = wide.matches || d.dataset.userOpen === 'true'));
			this.querySelectorAll('details[data-fold-desktop]').forEach((d) => (d.open = !wide.matches));
		};
		syncCards();
		wide.addEventListener?.('change', syncCards);
		const cb = this.querySelector('[data-clamp-toggle]');
		const body = cb && byId(cb.getAttribute('aria-controls'));
		// phones: the clamp ends just before a heading near 26em (else before a paragraph), not halfway through a table
		const top = (x) => x.getBoundingClientRect().top;
		const pick = (sel, max) => [...body.querySelectorAll(sel)].map((x) => top(x) - top(body)).filter((t) => t > 190 && t < max).sort((a, b) => Math.abs(a - 416) - Math.abs(b - 416))[0];
		const cut = body && !wide.matches && (pick('h2,h3', 640) || pick('.rte > *', 480));
		if (cut) body.style.setProperty('--clamp', `${cut - 6}px`);
		if (body && body.scrollHeight > body.clientHeight + 40) cb.hidden = false;
		cb?.addEventListener('click', () => {
			const open = cb.getAttribute('aria-expanded') !== 'true';
			cb.setAttribute('aria-expanded', String(open));
			body.classList.toggle('is-open', open);
			cb.querySelector('[data-more-label]').hidden = open;
			cb.querySelector('[data-less-label]').hidden = !open;
			if (!open) body.closest('section')?.scrollIntoView({ block: 'start' });
		});
		body?.addEventListener('focusin', (e) => {
			if (cb.hidden || cb.getAttribute('aria-expanded') === 'true') return;
			cb.click();
			body.scrollTop = 0;
			e.target.scrollIntoView({ block: 'center', behavior: 'instant' });
		});
		this.addEventListener('click', (e) => {
			const sum = e.target.closest('details[data-open-desktop] > summary');
			if (sum) return (sum.parentElement.dataset.userOpen = String(!sum.parentElement.open));
			const a = e.target.closest('a[data-open-details]');
			const d = a && byId(a.hash.slice(1));
			if (d?.tagName !== 'DETAILS') return;
			e.preventDefault();
			d.open = true;
			d.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
			d.querySelector('summary')?.focus({ preventScroll: true });
		});
		KK.delivery ? this.later() : addEventListener('DOMContentLoaded', () => this.later(), { once: true });
	}
	later() {
		const el = this.querySelector('[data-delivery-later]');
		const m = el && !/\bna\b/i.test(el.dataset.lead) && el.dataset.lead.match(/(\d+)(?:\s*[–-]\s*(\d+))?\s*(werkdag|dag|week|weken)/i);
		if (!m || !KK.delivery) return;
		const u = m[3].toLowerCase();
		const f = u[0] === 'd' ? 5 / 7 : u.startsWith('werk') ? 1 : 5;
		const r = KK.delivery.compute(el.closest('[data-delivery]'));
		const [a, b] = [m[1], m[2] || m[1]].map((n) => r.etaAt(Math.round(n * f) + r.transit).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', timeZone: 'UTC' }).replace('.', '').split(' '));
		el.innerHTML = el.dataset.tpl.replace('__FROM__', a[1] === b[1] ? a[0] : a.join(' ')).replace('__TO__', b.join(' '));
		el.closest('[data-delivery-later-row]').hidden = false;
	}
	announce(v) {
		const live = this.querySelector('[data-variant-live]');
		if (!live) return;
		const excl = document.documentElement.dataset.vat === 'excl';
		const stock = this.querySelector('[data-dynamic="delivery"] .stock')?.textContent.trim() || (v.available ? '' : KK.strings.soldOut);
		live.textContent = '';
		clearTimeout(this.liveT);
		this.liveT = setTimeout(() => (live.textContent = [v.options.join(', ').replace(/ x /g, ' × '), KK.formatMoney(KK.vatShown(v.price, excl)) + (excl ? ` ${KK.strings.excl}` : ''), stock].filter(Boolean).join('. ')), 100);
	}
	async setVariant(v) {
		this.variant = v;
		const id = document.getElementById(this.dataset.formId)?.querySelector('[name="id"]');
		if (id) id.value = v.id;
		const u = new URL(location.href);
		u.searchParams.set('variant', v.id);
		['contact_posted', 'customer_posted', 'form_type'].forEach((k) => u.searchParams.delete(k));
		if (u.hash.startsWith('#Notify')) u.hash = '';
		history.replaceState(history.state, '', u);
		if (v.media_id) this.querySelector('media-gallery')?.goToMedia(v.media_id);
		const label = v.options.join(' / ');
		this.querySelectorAll('[data-quote-variant]').forEach((i) => (i.value = label));
		this.querySelectorAll('[data-quote-variant-text]').forEach((t) => (t.textContent = v.options.filter((o, i) => !`,${t.dataset.skip},`.includes(`,${i},`)).join(' / ').replace(/ x /g, ' × ')));
		const print = this.querySelector('[data-print]');
		if (print) print.hidden = print.disabled = !v.print;
		KK.emit('variant:change', { variant: v, root: this });
		const url = `${this.dataset.productUrl}?variant=${v.id}&section_id=${this.dataset.sectionId}`;
		try {
			const html = this.cache.get(url) || (await (await fetch(url)).text());
			this.cache.set(url, html);
			if (this.variant !== v) return;
			const doc = KK.parse(html);
			['price', 'badge-sale', 'staffel', 'delivery', 'bundle', 'sticky-price', 'sticky-variant', 'sticky-stock', 'sticky-media', 'sku', 'notify', 'service', 'compare-price'].forEach((key) => {
				const fresh = doc.querySelector(`[data-dynamic="${key}"]`);
				if (fresh) this.querySelectorAll(`[data-dynamic="${key}"]`).forEach((el) => el.replaceWith(fresh.cloneNode(true)));
			});
			doc.querySelectorAll('.vp__input').forEach((fi) => {
				const input = document.getElementById(fi.id);
				if (!input) return;
				input.toggleAttribute('data-unavailable', fi.hasAttribute('data-unavailable'));
				const sel = `label[for="${CSS.escape(fi.id)}"]`;
				const l = this.querySelector(sel);
				const fl = doc.querySelector(sel);
				if (l && fl) (l.className = fl.className), (l.innerHTML = fl.innerHTML);
			});
			this.later();
			KK.emit('variant:rendered', { variant: v, root: this, button: doc.querySelector('[data-add-button]'), doc });
			this.announce(v);
		} catch (e) {
			if (this.variant === v) KK.emit('variant:rendered', { variant: v, root: this, failed: true });
		}
	}
}
customElements.get('product-info') || customElements.define('product-info', ProductInfo);
})();
