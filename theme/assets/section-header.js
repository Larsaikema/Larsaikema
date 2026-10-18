/* Header core: sticky, USP bar, search field; menu and search files load while idle or on first reach (sections/header.liquid) */
(() => {
const KK = (window.KK ||= {});
const def = (n, c) => customElements.get(n) || customElements.define(n, c);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const wide = matchMedia('(min-width:990px)');
const got = {};
const done = new Set();
const load = (src, css) =>
	src
		? (got[src] ||= new Promise((ok, fail) =>
				document.head.append(
					Object.assign(document.createElement(css ? 'link' : 'script'), css ? { rel: 'stylesheet', href: src } : { src }, {
						onload: () => (done.add(src), ok()),
						onerror: (e) => (delete got[src], e.target.remove(), fail(e)),
					})
				)
			))
		: Promise.resolve();
const ready = (src) => !src || done.has(src);
const once = (el, fn) => 'pointerenter pointerdown touchstart focusin'.split(' ').forEach((ev) => el.addEventListener(ev, fn, { once: true, passive: true }));
const busy = (el, on) => (on ? el.setAttribute('aria-busy', 'true') : el.removeAttribute('aria-busy'));
const mega = (w) => Promise.all([load(w.dataset.megaCss, 1), load(w.dataset.megaJs)]);
KK.hdr = { load, ready, busy, mega, $$ };
def('sticky-header', class extends HTMLElement {
	connectedCallback() {
		const mode = this.dataset.sticky;
		let last = 0;
		const setH = () => document.documentElement.style.setProperty('--header-h', `${mode === 'none' || this.classList.contains('is-hidden') ? 0 : this.offsetHeight}px`);
		const hide = (h) => h !== this.classList.contains('is-hidden') && (this.classList.toggle('is-hidden', h), setH());
		setH();
		new ResizeObserver(setH).observe(this);
		if (mode === 'none') return;
		this.onScroll = () => {
			const y = scrollY;
			this.classList.toggle('is-scrolled', y > 8);
			if (Math.abs(y - last) > 4) {
				if (mode === 'scroll-up') hide(y > last && y > this.offsetHeight * 2 && !this.querySelector('.is-open,[aria-expanded="true"],[aria-busy]'));
				last = y;
			} else if (y < 8) last = y;
		};
		addEventListener('scroll', this.onScroll, { passive: true });
		this.addEventListener('focusin', () => hide(false));
		this.onScroll();
	}
	disconnectedCallback() {
		removeEventListener('scroll', this.onScroll);
	}
});
const dayFmt = [{ weekday: 'long' }, { weekday: 'short', day: 'numeric', month: 'short' }].map((o) => new Intl.DateTimeFormat(document.documentElement.lang || 'nl', { ...o, timeZone: 'UTC' }));
const DAYS = 'zo,ma,di,wo,do,vr,za'.split(',');
def('usp-rotator', class extends HTMLElement {
	connectedCallback() {
		const today = +new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam' }).format(new Date()).replace(/\D/g, '');
		$$(':scope>[data-from],:scope>[data-to]', this).forEach((el) => {
			const f = +el.dataset.from || 0;
			const t = +el.dataset.to || 0;
			(f && today < f) || (t && today > t) ? el.remove() : (el.hidden = false);
		});
		this.items = [...this.children];
		this.items.forEach((el, i) => el.classList.toggle('is-active', !i));
		this.bar = this.closest('.utility-bar');
		this.cd = this.querySelector('[data-bar-delivery]');
		this.btn = this.bar.querySelector('[data-rotator-toggle]');
		this.btn?.addEventListener('click', () => this.pause(!this.paused));
		this.bar.querySelector('[data-rotator-next]')?.addEventListener('click', () => this.go(this.p + 1));
		this.addEventListener('focusin', (e) => {
			const i = this.items.findIndex((el) => el.contains(e.target));
			if (i >= 0 && this.pages && !this.pages[this.p].includes(i)) this.go(this.pages.findIndex((p) => p.includes(i)));
		});
		this.pause(this.dataset.autoplay === 'false' || matchMedia('(prefers-reduced-motion:reduce)').matches);
		this.timer = setInterval(() => this.paused || this.hold || this.matches(':hover,:focus-within') || this.go(this.p + 1), +this.dataset.interval || 6000);
		this.tick = setInterval(() => this.layout(), 30000);
		new ResizeObserver(() => requestAnimationFrame(() => this.layout())).observe(this);
		document.fonts?.ready.then(() => this.layout());
		this.layout();
	}
	disconnectedCallback() {
		clearInterval(this.timer);
		clearInterval(this.tick);
	}
	texts() {
		const d = this.cd?.dataset;
		if (!d || !KK.delivery) return [];
		const r = KK.delivery.compute(this.cd);
		const left = r.minsLeft;
		const h = Math.floor(left / 60);
		const m = left % 60;
		const n = Math.round((r.ship - r.today) / 864e5);
		// weekend: 'zondag besteld, maandag verzonden'
		const wk = !(d.days || 'ma,di,wo,do,vr').includes(DAYS[r.today.getUTCDay()]);
		const shipDay = !wk && !(d.holidays || '').includes(r.today.toISOString().slice(0, 10));
		const v = {
			LEFT: h ? (m ? d.h : d.hw).replace('__H__', h).replace('__M__', m) : d.m.replace('__M__', m),
			TIME: r.cutoff,
			DAY: dayFmt[0].format(r.today),
			DATE: r.shipsToday ? d.today : n === 1 && shipDay ? d.tomorrow : dayFmt[n < 7 ? 0 : 1].format(r.ship).replace('.', ''),
		};
		return [...(r.shipsToday ? [left <= 360 ? d.cdL : d.todayL, d.cdM] : shipDay ? [d.after] : [wk && d.day ? d.day : d.later]), d.ships].map((s) =>
			s.replace(/__([A-Z]+)__/g, (all, x, i) => (x in v ? (i ? v[x] : v[x][0].toUpperCase() + v[x].slice(1)) : all))
		);
	}
	layout() {
		const cs = getComputedStyle(this);
		const w = this.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
		if (w <= 0) return;
		const gap = parseFloat(cs.columnGap) || 0;
		const span = this.cd?.querySelector('[data-delivery-text]');
		this.classList.add('is-measuring');
		if (span)
			for (const t of this.texts()) {
				span.innerHTML = t;
				if (this.cd.offsetWidth <= w) break;
			}
		const pages = [];
		let pg = [];
		let sum = 0;
		this.items.forEach((el, i) => {
			const iw = el.offsetWidth;
			if (pg.length && sum + gap + iw > w) pages.push(pg), (pg = []), (sum = 0);
			sum += (pg.length ? gap : 0) + iw;
			pg.push(i);
		});
		pages.push(pg);
		this.classList.remove('is-measuring');
		const cur = this.items.findIndex((el) => el.classList.contains('is-active'));
		this.pages = pages;
		this.dataset.paged = pages.length;
		this.bar.classList.toggle('is-rotating', pages.length > 1);
		this.go(Math.max(0, pages.findIndex((p) => p.includes(cur))));
	}
	go(n) {
		this.p = (n + this.pages.length) % this.pages.length;
		this.items.forEach((el, i) => el.classList.toggle('is-active', this.pages[this.p].includes(i)));
	}
	pause(p) {
		const b = this.btn;
		this.paused = p;
		if (!b) return;
		b.setAttribute('aria-pressed', p);
		b.setAttribute('aria-label', p ? b.dataset.labelPlay : b.dataset.labelPause);
	}
});
document.addEventListener('click', (e) => {
	const c = e.target.closest('[data-search-clear]');
	const i = c && !customElements.get('predictive-search') && c.form?.querySelector('input[type="search"]');
	if (i) (i.value = ''), (c.hidden = true), i.focus();
	$$('.hloc__details[open]').forEach((d) => d.contains(e.target) || (d.open = false));
});
document.addEventListener('keydown', (e) => {
	const d = e.key === 'Escape' && document.activeElement?.closest('.hloc__details[open]');
	if (d) (d.open = false), d.querySelector('summary').focus();
});
const order = (w) => {
	const s = w.querySelector('.header__search');
	const a = w.querySelector('.header__actions');
	if (CSS.supports?.('reading-flow', 'grid-rows') || !s || !a) return;
	if (wide.matches ? s.nextElementSibling !== a : a.nextElementSibling !== s) wide.matches ? a.before(s) : a.after(s);
};
const init = (w) => {
	if (w.dataset.hdr) return;
	w.dataset.hdr = 1;
	const { drawerCss, drawerJs } = w.dataset;
	$$('mega-menu', w).forEach((m) => once(m, () => mega(w).catch(() => {})));
	w.querySelector('.nav')?.addEventListener('click', (e) => {
		const t = e.target.closest('[data-mega-trigger]');
		if (!t || customElements.get('mega-menu')) return;
		busy(t, true);
		mega(w).then(() => (busy(t, false), t.closest('mega-menu').open(0, 'click')), () => (location.href = t.dataset.url));
	});
	const drawer = () => Promise.allSettled([load(drawerCss, 1), load(drawerJs)]);
	$$('[data-menu-open]', w).forEach((b) => {
		b.removeAttribute('commandfor');
		b.removeAttribute('command');
		once(b, drawer);
		b.addEventListener('click', (e) => {
			e.preventDefault();
			if (b.hasAttribute('aria-busy')) return;
			const go = () => (busy(b, false), KK.menu ? KK.menu.open(b) : KK.openDialog(document.getElementById('MenuDrawer'), b));
			if (ready(drawerCss) && ready(drawerJs)) return go();
			busy(b, true);
			drawer().then(go);
		});
	});
	const idle = () => (wide.matches ? mega(w) : load(drawerCss, 1)).catch(() => {});
	const later = () => ('requestIdleCallback' in window ? requestIdleCallback(idle, { timeout: 4000 }) : setTimeout(idle, 1200));
	document.readyState === 'complete' ? later() : addEventListener('load', later, { once: true });
	$$('predictive-search', w).forEach((el) => {
		if (el.dataset.src) once(el, () => (load(el.dataset.css, 1).catch(() => {}), customElements.get('predictive-search') || load(el.dataset.src).catch(() => {})));
	});
	order(w);
	wide.addEventListener('change', () => order(w));
};
const run = () => $$('.header-wrap').forEach(init);
document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', run) : run();
document.addEventListener('shopify:section:load', run);
})();
