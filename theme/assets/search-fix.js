/* Spelling fix for a search that finds nothing ('Bedoelde je …?' on the search page's dead end, sections/main-search.liquid):
   a known word stays, a misspelt one becomes the closest word in the shop's own names, types and variants (1 edit, 2 from
   7 letters; swapped neighbours count as one), at most two prefix lookups per word; a word nothing is near is dropped. Returns shop words only (letters, digits). */
(() => {
const KK = window.KK;
const dist = (a, b) => {
	const d = [...Array(a.length + 1)].map((_, i) => [i, ...Array(b.length).fill(0)]);
	for (let j = 1; j <= b.length; j++) d[0][j] = j;
	for (let i = 1; i <= a.length; i++)
		for (let j = 1; j <= b.length; j++) {
			d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] !== b[j - 1]));
			if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
		}
	return d[a.length][b.length];
};
const vocab = new Map();
const words = (p) =>
	vocab.get(p) ||
	vocab
		.set(
			p,
			fetch(`${KK.routes.predictiveSearch}.json?q=${encodeURIComponent(p)}&resources[type]=product,collection&resources[limit]=10&resources[options][fields]=title,product_type,variants.title`)
				.then((r) => (r.ok ? r.json() : {}))
				.catch(() => ({}))
				.then(({ resources: { results: x = {} } = {} }) =>
					[...(x.products || []).flatMap((o) => [o.title, o.type, ...(o.variants || []).map((v) => v.title)]), ...(x.collections || []).map((c) => c.title)]
						.join(' ')
						.toLowerCase()
						.split(/[^\p{L}\p{N}]+/u)
						.filter(Boolean)
				)
		)
		.get(p);
KK.searchFix = async (q) => {
	const ws = q.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 4);
	const out = await Promise.all(
		ws.map(async (w) => {
			if (w.length < 4 || /\d/.test(w)) return w;
			for (const n of [4, 3]) {
				const v = await words(w.slice(0, n));
				if (!v.length) continue;
				if (v.includes(w)) return w;
				let best = '';
				let bd = w.length > 6 ? 3 : 2;
				new Set(v).forEach((t) => {
					const d = Math.abs(t.length - w.length) > 2 ? 9 : dist(w, t);
					if (d < bd) (bd = d), (best = t);
				});
				if (best) return best;
			}
			return '';
		})
	);
	const fixed = out.filter(Boolean).join(' ');
	return fixed !== ws.join(' ') ? fixed : '';
};
})();
