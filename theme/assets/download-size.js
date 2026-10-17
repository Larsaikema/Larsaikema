/* file size for download links ([data-file-size-src]); loaded only where downloads are listed */
(() => {
  /* file size for download links (Liquid does not expose it): one HEAD request once the link is on screen */
  if ('IntersectionObserver' in window) {
    const sizeIO = new IntersectionObserver((entries) =>
      entries.forEach(async (e) => {
        if (!e.isIntersecting) return;
        sizeIO.unobserve(e.target);
        try {
          const r = await fetch(e.target.href, { method: 'HEAD' });
          const len = Number(r.headers.get('content-length'));
          const out = e.target.querySelector('[data-file-size]');
          if (!r.ok || !len || !out) return;
          const mb = len / 1048576;
          out.textContent = ` · ${mb >= 1 ? `${mb.toLocaleString('nl', { maximumFractionDigits: 1 })} MB` : `${Math.max(1, Math.round(len / 1024))} kB`}`;
        } catch (err) {}
      })
    );
    document.querySelectorAll('[data-file-size-src]').forEach((a) => sizeIO.observe(a));
  }

})();
