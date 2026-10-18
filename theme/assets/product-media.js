/* Product gallery video and 3D (loaded by main-product only for products with such media): a video that scrolls out of
   view pauses (uploaded, YouTube, Vimeo); 3D models get Shopify's model viewer UI via Shopify.loadFeatures. */
(() => {
	const slides = document.querySelector('[data-gallery-slides]');
	if (!slides) return;
	let t;
	slides.addEventListener(
		'scroll',
		() => {
			clearTimeout(t);
			t = setTimeout(() => {
				const cur = Math.round(slides.scrollLeft / Math.max(1, slides.clientWidth));
				[...slides.children].forEach((li, i) => {
					if (i === cur) return;
					li.querySelector('video')?.pause();
					li.querySelector('iframe[src*="youtube"]')?.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
					li.querySelector('iframe[src*="vimeo"]')?.contentWindow?.postMessage('{"method":"pause"}', '*');
				});
			}, 120);
		},
		{ passive: true }
	);
	if (slides.querySelector('model-viewer'))
		window.Shopify?.loadFeatures?.([
			{
				name: 'model-viewer-ui',
				version: '1.0',
				onLoad: (err) => err || !window.Shopify.ModelViewerUI || slides.querySelectorAll('model-viewer').forEach((m) => new window.Shopify.ModelViewerUI(m)),
			},
		]);
})();
