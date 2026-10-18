/* Theme editor only (sections/header.liquid loads it when request.design_mode): selecting a 'Megamenu-promotie' block
	 opens its mega panel (desktop) or its mobile menu panel; selecting a USP message shows it and holds the rotation. */
(() => {
const KK = window.KK;
const wide = matchMedia('(min-width:990px)');
document.addEventListener('shopify:block:select', (e) => {
	const el = e.target;
	const usp = el.closest?.('.utility-bar__usp');
	if (usp) {
		const r = usp.closest('usp-rotator');
		const i = r.items.indexOf(usp);
		r.hold = true;
		return r.go(Math.max(0, r.pages.findIndex((p) => p.includes(i))));
	}
	const w = el.closest?.('.header-wrap') || document.querySelector('.header-wrap');
	if (!el.closest?.('.section-header') || !w) return;
	const m = el.closest('mega-menu');
	if (m && wide.matches) return KK.hdr.mega(w).then(() => m.open(0, 'editor'));
	if (wide.matches) return;
	const b = document.querySelector('[data-menu-open]');
	Promise.allSettled([KK.hdr.load(w.dataset.drawerCss, 1), KK.hdr.load(w.dataset.drawerJs)]).then(() => {
		const dlg = KK.menu?.open(b);
		const id = m?.querySelector('[data-mega-panel]').id.replace('Mega-', 'MenuPanel-');
		const btn = id && dlg?.querySelector(`[aria-controls="${id}"]`);
		if (btn) dlg.openPanel(btn);
	});
});
document.addEventListener('shopify:block:deselect', (e) => {
	const r = e.target.closest?.('usp-rotator');
	if (r) r.hold = false;
	e.target.closest?.('mega-menu')?.close(0);
});
})();
