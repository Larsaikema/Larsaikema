// Klapklaar favicon cart state (brand v7.1, technisch.md 6.5).
// Put this inside KK.updateCartCount(count) in theme/assets/global.js, in place of the block that reads
// link[data-favicon] and KK.faviconCart. KK.favicons comes from handoff/favicon-head.liquid.
document.querySelectorAll('link[data-favicon]').forEach((link) => {
  const f = KK.favicons && KK.favicons[link.dataset.favicon];
  if (f) link.href = count > 0 ? f.cart : f.base;
});
