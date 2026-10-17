/* Delivery promise: turns the owner's settings (cutoff, shipping days, carrier delivery days, holidays, transit days
   per shipping class, extra days for BE) into a concrete countdown + expected date in Europe/Amsterdam time.
   Elements: [data-delivery] with data-cutoff, data-days, data-delivery-days, data-holidays, data-transit (already
   including the market's extra days), data-state; children [data-delivery-countdown], [data-delivery-eta],
   [data-delivery-short]. */
(() => {
  const KK = window.KK || {};
  const DAYS = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
  const TZ = 'Europe/Amsterdam';
  const fmtParts = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const nice = new Intl.DateTimeFormat(document.documentElement.lang || 'nl', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

  /** current wall-clock time in Amsterdam as {y,m,d,h,mi,s} */
  function nowNL() {
    const p = Object.fromEntries(fmtParts.formatToParts(new Date()).map((x) => [x.type, x.value]));
    return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour % 24, mi: +p.minute, s: +p.second };
  }
  const iso = (dt) => dt.toISOString().slice(0, 10);
  const addDays = (dt, n) => new Date(dt.getTime() + n * 864e5);

  function compute(el) {
    const n = nowNL();
    const [ch, cm] = (el.dataset.cutoff || '14:00').split(':').map(Number);
    const days = (el.dataset.days || 'ma,di,wo,do,vr').split(',').map((d) => DAYS.indexOf(d.trim().toLowerCase())).filter((i) => i >= 0);
    const holidays = (el.dataset.holidays || '').split(',').filter(Boolean);
    const transit = Number(el.dataset.transit || 1);
    const isShipDay = (dt) => days.includes(dt.getUTCDay()) && !holidays.includes(iso(dt));
    // carrier days (theme setting delivery_days, default ma–vr): transit only counts, and delivery only lands, on these
    const carrier = (el.dataset.deliveryDays || 'ma,di,wo,do,vr').split(',').map((d) => DAYS.indexOf(d.trim().toLowerCase())).filter((i) => i >= 0);
    const isWorkDay = (dt) => carrier.includes(dt.getUTCDay()) && !holidays.includes(iso(dt));
    const today = new Date(Date.UTC(n.y, n.m - 1, n.d));
    const minsLeft = ch * 60 + cm - (n.h * 60 + n.mi);
    let ship = today;
    const shipsToday = isShipDay(today) && minsLeft > 0;
    if (!shipsToday) {
      ship = addDays(today, 1);
      for (let i = 0; i < 14 && !isShipDay(ship); i++) ship = addDays(ship, 1);
    }
    let eta = ship;
    for (let i = 0; i < transit; ) {
      eta = addDays(eta, 1);
      if (isWorkDay(eta)) i++;
    }
    return { shipsToday, minsLeft, ship, eta, today, cutoff: el.dataset.cutoff || '14:00' };
  }

  function label(dt, today) {
    const diff = Math.round((dt - today) / 864e5);
    if (diff === 0) return KK.strings?.today || 'vandaag';
    if (diff === 1) return KK.strings?.tomorrow || 'morgen';
    return nice.format(dt).replace('.', '');
  }

  function duration(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h ? KK.t('hours', { h, m }) : KK.t('minutes', { m });
  }

  function update(el) {
    if (el.dataset.state && el.dataset.state !== 'stock') return;
    const r = compute(el);
    const cd = el.querySelector('[data-delivery-countdown]');
    if (cd && KK.t) {
      if (r.shipsToday && r.minsLeft <= 6 * 60) cd.innerHTML = KK.t('countdown', { time: duration(r.minsLeft) });
      else if (r.shipsToday) cd.innerHTML = KK.t('shipsToday', { time: r.cutoff });
      else cd.innerHTML = KK.t('shipsOn', { date: label(r.ship, r.today) });
    }
    const eta = el.querySelector('[data-delivery-eta]');
    if (eta && KK.t) {
      eta.innerHTML = KK.t('arrives', { date: label(r.eta, r.today) });
      const row = eta.closest('[data-delivery-eta-row]');
      if (row) row.hidden = false;
    }
    const short = el.querySelector('[data-delivery-short]');
    if (short) short.textContent = el.dataset.ship === 'pallet' ? '' : ` · ${KK.t('etaShort', { date: label(r.eta, r.today) })}`;
  }

  const run = (root = document) => root.querySelectorAll('[data-delivery]').forEach(update);
  KK.delivery = { run, compute };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => run());
  else run();
  setInterval(run, 60000);
  // re-run after section re-renders (variant change, facets, cart)
  new MutationObserver((list) => {
    for (const m of list) for (const node of m.addedNodes) if (node.nodeType === 1 && (node.matches?.('[data-delivery]') || node.querySelector?.('[data-delivery]'))) return run();
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
