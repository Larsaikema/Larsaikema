/* copy-to-clipboard buttons ([data-copy]); loaded by the gift card page only */
(() => {
  const KK = window.KK || {};
  /* copy-to-clipboard buttons */
  document.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-copy]');
    if (!b) return;
    try {
      await navigator.clipboard.writeText(b.dataset.copy);
      const old = b.innerHTML;
      b.textContent = b.dataset.copied || (KK.strings && KK.strings.copied);
      setTimeout(() => (b.innerHTML = old), 1600);
    } catch (err) {}
  });

})();
