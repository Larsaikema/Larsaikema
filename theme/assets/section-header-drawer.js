/* Menu drawer (below 990 px): modal <dialog>; a top item (a link without JS) becomes the button of its panel; the USP bar's service links are copied in */
(() => {
const KK = window.KK;
const { $$ } = KK.hdr;
const init = (dlg) => {
	const root = dlg.querySelector('[data-mdrawer-root]');
	if (dlg.dataset.mdrawer || !root) return;
	dlg.dataset.mdrawer = 1;
	$$('a[data-mdrawer-open]', dlg).forEach((a) => {
		const b = Object.assign(document.createElement('button'), { type: 'button', className: a.className });
		b.dataset.mdrawerOpen = '';
		b.setAttribute('aria-controls', a.dataset.controls);
		b.setAttribute('aria-expanded', 'false');
		b.append(...a.childNodes);
		a.replaceWith(b);
	});
	let cur;
	const back = (instant) => {
		if (!cur) return;
		const { btn, panel } = cur;
		cur = null;
		root.inert = false;
		root.classList.remove('is-behind');
		btn.setAttribute('aria-expanded', 'false');
		panel.classList.remove('is-open');
		setTimeout(() => panel.classList.contains('is-open') || (panel.hidden = true), instant ? 0 : 260);
		if (!instant) btn.focus({ preventScroll: true });
	};
	dlg.openPanel = (btn) => {
		const panel = document.getElementById(btn.getAttribute('aria-controls'));
		if (!panel) return;
		back(true);
		cur = { btn, panel };
		$$('img', panel).forEach((i) => (i.loading = 'eager'));
		panel.hidden = false;
		panel.querySelector('.mdrawer__body').scrollTop = 0;
		btn.setAttribute('aria-expanded', 'true');
		root.inert = true;
		void panel.offsetWidth;
		panel.classList.add('is-open');
		root.classList.add('is-behind');
		panel.querySelector('[data-mdrawer-back]').focus({ preventScroll: true });
	};
	dlg.addEventListener('click', (e) => {
		const btn = e.target.closest('[data-mdrawer-open]');
		if (btn) return e.preventDefault(), dlg.openPanel(btn);
		if (e.target.closest('[data-mdrawer-back]')) back();
	});
	dlg.addEventListener('cancel', (e) => cur && (e.preventDefault(), back()));
	dlg.addEventListener('close', () => {
		back(true);
		$$('.mdrawer__group[open]', dlg).forEach((d) => (d.open = false));
	});
};
KK.menu = {
	open(btn) {
		const dlg = document.getElementById('MenuDrawer');
		if (!dlg) return;
		init(dlg);
		const ul = dlg.querySelector('[data-service-links]');
		if (ul) {
			$$('[data-from-bar]', ul).forEach((n) => n.remove());
			ul.prepend(...$$('template[data-bar-links]').flatMap((t) => $$('li', t.content.cloneNode(true))).map((li) => ((li.dataset.fromBar = 1), li)));
		}
		KK.openDialog(dlg, btn);
		return dlg;
	},
};
matchMedia('(min-width:990px)').addEventListener('change', (e) => e.matches && KK.closeDialog(document.getElementById('MenuDrawer')));
})();
