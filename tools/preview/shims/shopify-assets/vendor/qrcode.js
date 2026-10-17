/* Preview stand-in for Shopify's vendor/qrcode.js: draws a deterministic QR-like pattern (not scannable). */
(function () {
  function QRCode(el, opts) {
    if (typeof el === 'string') el = document.getElementById(el);
    opts = typeof opts === 'string' ? { text: opts } : opts || {};
    var size = opts.width || 120, n = 25, cell = size / n, text = String(opts.text || 'preview');
    var h = 0; for (var i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
    var dark = opts.colorDark || '#000', light = opts.colorLight || '#fff';
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + (opts.height || size) + '" viewBox="0 0 ' + n + ' ' + n + '" role="img" aria-label="QR code (preview)"><rect width="' + n + '" height="' + n + '" fill="' + light + '"/>';
    function finder(x, y) { svg += '<rect x="' + x + '" y="' + y + '" width="7" height="7" fill="' + dark + '"/><rect x="' + (x + 1) + '" y="' + (y + 1) + '" width="5" height="5" fill="' + light + '"/><rect x="' + (x + 2) + '" y="' + (y + 2) + '" width="3" height="3" fill="' + dark + '"/>'; }
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
      if ((x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9)) continue;
      h = (h * 1103515245 + 12345) >>> 0;
      if ((h >>> 16) & 1) svg += '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="' + dark + '"/>';
    }
    finder(0, 0); finder(n - 7, 0); finder(0, n - 7);
    el.innerHTML = svg + '</svg>';
    void cell;
  }
  QRCode.CorrectLevel = { L: 1, M: 0, Q: 3, H: 2 };
  window.QRCode = QRCode;
})();
