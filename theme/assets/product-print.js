/* Logo upload; documented in snippets/product-print.liquid. */
(() => {
const KK = window.KK;
const PRINT_EXT = /\.(pdf|ai|eps|svg|png|jpe?g)$/i;
const fmtSize = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(1).replace('.', ',')} MB` : `${Math.max(1, Math.round(b / 1024))} kB`);
const ICON_FILE = '<svg class="icon icon--sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 3.5h7l4 4v13h-11z M13.5 3.5v4h4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
const ICON_X = '<svg class="icon icon--sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
KK.printUpload = (pf) => {
	const root = pf.root;
	const q = (sel) => root.querySelector(sel);
	pf.printError = (msg, scroll = true) => {
		const box = q('[data-print-error]');
		if (!box) return;
		box.textContent = msg;
		box.hidden = false;
		if (scroll) box.closest('.print')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
	};
	const clearError = () => {
		const box = q('[data-print-error]');
		if (box) box.hidden = true;
	};
	pf.renderFiles = () => {
		const ul = q('[data-print-files]');
		if (!ul) return;
		ul.innerHTML = pf.files
			.map(
				(f, i) =>
					`<li class="print__file-item">${ICON_FILE}<span class="print__file-name">${KK.escape(f.name)}</span><span class="print__file-size">${fmtSize(f.size)}</span><button type="button" class="print__file-remove" data-remove-file="${i}" aria-label="${KK.escape(KK.t('fileRemove', { name: f.name }))}">${ICON_X}</button></li>`
			)
			.join('');
		ul.closest('.field')?.classList.toggle('has-file', !!pf.files.length);
	};
			const onFiles = (input, list) => {
		const box = input.closest('[data-print-upload]');
		const maxFiles = Number(box?.dataset.maxFiles || 5);
		const maxMb = Number(box?.dataset.maxMb || 20);
		clearError();
		const errors = [];
		list.forEach((f) => {
			if (!PRINT_EXT.test(f.name)) return errors.push(KK.t('fileType', { name: f.name }));
			if (f.size > maxMb * 1048576) return errors.push(KK.t('fileTooBig', { name: f.name, size: maxMb }));
			if (pf.files.some((x) => x.name === f.name && x.size === f.size)) return;
			if (pf.files.length >= maxFiles) return errors.push(KK.t('fileTooMany', { max: maxFiles }));
			pf.files.push(f);
		});
		input.value = '';
		pf.renderFiles();
		if (errors.length) pf.printError([...new Set(errors)].join(' '), false);
		if (pf.files.length) {
			const later = q('[data-print-later]');
			if (later) later.checked = false;
		}
	};
			const onLater = (box) => {
		clearError();
		const file = q('.print__file');
		if (!file) return;
		file.disabled = box.checked;
		file.closest('.field')?.classList.toggle('is-disabled', box.checked);
		if (box.checked && pf.files.length) {
			pf.files = [];
			pf.renderFiles();
		}
	};
	root.addEventListener('change', (e) => {
		if (e.target.matches('.print__file')) onFiles(e.target, [...(e.target.files || [])]);
		if (e.target.matches('[data-print-later]')) onLater(e.target);
	});
	root.addEventListener('click', (e) => {
		const rm = e.target.closest('[data-remove-file]');
		if (!rm) return;
		pf.files.splice(Number(rm.dataset.removeFile), 1);
		pf.renderFiles();
		q('.print__file')?.focus();
	});
	const drop = q('[data-print-drop]');
	if (drop) {
		['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => (e.preventDefault(), drop.classList.add('is-over'))));
		['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, () => drop.classList.remove('is-over')));
		drop.addEventListener('drop', (e) => {
			e.preventDefault();
			const input = q('.print__file');
			if (input && !input.disabled) onFiles(input, [...(e.dataTransfer?.files || [])]);
		});
	}
};
})();
