// Local stand-in for Shopify's storefront standard-actions bundle (window.Shopify.actions).
(function () {
  var S = (window.Shopify = window.Shopify || {});
  if (S.actions) return;
  var EVENTS_URL = '/cdn/shopifycloud/storefront/standard-events.js';

  function makeAction(defaultHandler) {
    var config = {};
    var fn = function () {
      var args = Array.prototype.slice.call(arguments);
      if (typeof config.handler === 'function') {
        return config.handler.apply(null, [function () { return defaultHandler.apply(null, args); }].concat(args));
      }
      return defaultHandler.apply(null, args);
    };
    fn.configure = function (opts) {
      config = Object.assign({}, config, opts || {});
      return true;
    };
    fn.isDefault = function () { return typeof config.handler !== 'function'; };
    fn._config = function () { return config; };
    return fn;
  }

  function numericId(id) {
    var s = String(id || '');
    var m = s.match(/(\d+)(?:\?.*)?$/);
    return m ? m[1] : s;
  }

  function postJSON(url, body, signal) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      signal: signal,
    }).then(function (r) { return r.json(); });
  }

  function getCart(_payload, options) {
    return fetch('/cart.js', { signal: options && options.signal })
      .then(function (r) { return r.json(); })
      .then(function (cart) {
        return import(EVENTS_URL).then(function (m) {
          return { cart: m.CartLinesUpdateEvent.createCartFromAjaxResponse(cart) };
        });
      });
  }

  var updateCart = makeAction(function (payload, options) {
    payload = payload || {};
    options = options || {};
    var signal = options.signal;
    var chain = Promise.resolve();
    var action = 'update';
    (payload.lines || []).forEach(function (line) {
      chain = chain.then(function () {
        if (line.id) {
          action = line.quantity === 0 ? 'remove' : 'update';
          var key = String(line.id).replace(/^gid:\/\/shopify\/CartLine\//, '').split('?')[0];
          return postJSON('/cart/change.js', { id: key, quantity: line.quantity }, signal);
        }
        action = 'add';
        var props = {};
        (line.attributes || []).forEach(function (a) { props[a.key] = a.value; });
        return postJSON('/cart/add.js', { items: [{ id: numericId(line.merchandiseId), quantity: line.quantity, properties: props }] }, signal);
      });
    });
    if (typeof payload.note === 'string') {
      chain = chain.then(function () { return postJSON('/cart/update.js', { note: payload.note }, signal); });
    }
    if (payload.discountCodes) {
      chain = chain.then(function () { return postJSON('/cart/update.js', { discount: payload.discountCodes.join(',') }, signal); });
    }
    return chain
      .then(function () { return fetch('/cart.js', { signal: signal }); })
      .then(function (r) { return r.json(); })
      .then(function (ajaxCart) {
        return import(EVENTS_URL).then(function (m) {
          var cart = m.CartLinesUpdateEvent.createCartFromAjaxResponse(ajaxCart);
          var cfg = updateCart._config();
          var target = (cfg.eventTarget && cfg.eventTarget({ type: 'shopify:cart:lines-update', action: action })) || document;
          if (payload.lines && payload.lines.length) {
            var d = m.CartLinesUpdateEvent.createPromise();
            target.dispatchEvent(new m.CartLinesUpdateEvent({
              action: action,
              context: (options.event && options.event.context) || 'standard-action',
              lines: payload.lines.map(function (l) {
                return l.id ? { id: l.id, quantity: l.quantity } : { merchandiseId: l.merchandiseId, quantity: l.quantity };
              }),
              promise: d.promise,
              detail: options.event && options.event.detail,
            }));
            d.resolve({ cart: cart });
          }
          return { cart: cart, userErrors: [], warnings: [] };
        });
      });
  });

  var openCart = makeAction(function () {
    window.location.href = (window.Shopify.routes && window.Shopify.routes.root ? window.Shopify.routes.root : '/') + 'cart';
    return Promise.resolve();
  });

  S.actions = Object.freeze({ getCart: getCart, updateCart: updateCart, openCart: openCart });
})();
