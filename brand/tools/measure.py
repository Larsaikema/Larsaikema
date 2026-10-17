"""Fabric/print check for constructed logo artwork (v4). Pure numpy + Pillow.

Two independent measurements:
  1. analytic: exact shortest distance between every pair of separate shapes (letters, tent parts) and the
     angle of every straight-edged corner (tips = outside corners, notches = inside corners);
  2. raster morphology at `upp` units per pixel: the thinnest feature is the smallest disc diameter whose
     OPENING removes a blob larger than 1.0 r^2 (a stroke narrower than the disc, or a tip sharper than
     ~50 deg); the narrowest opening is the smallest diameter whose CLOSING fills a blob larger than
     1.5 r^2 (a gap narrower than the disc, or a notch sharper than ~40 deg). 90-deg corners lose only
     0.21 r^2 and are not counted. This catches what a construction table can miss (v3: 21-deg eave tips,
     a 40-deg notch under the pennant).
"""
import math
import numpy as np
from PIL import Image, ImageDraw

def rasterize(contours, upp, pad=52):
    pts_all = [c.flatten(32) for c in contours]
    xs = [p[0] for P in pts_all for p in P]; ys = [p[1] for P in pts_all for p in P]
    x0, y0, x1, y1 = min(xs), min(ys), max(xs), max(ys)
    W = int(math.ceil((x1 - x0) / upp)) + 2 * pad; H = int(math.ceil((y1 - y0) / upp)) + 2 * pad
    im = Image.new('L', (W, H), 0); d = ImageDraw.Draw(im)
    def T(p): return ((p[0] - x0) / upp + pad, (y1 - p[1]) / upp + pad)
    outers = [(c, P) for c, P in zip(contours, pts_all) if c.area() < 0]
    holes = [(c, P) for c, P in zip(contours, pts_all) if c.area() >= 0]
    for c, P in outers: d.polygon([T(p) for p in P], fill=1)
    for c, P in holes: d.polygon([T(p) for p in P], fill=0)
    return np.asarray(im, dtype=bool), (x0, y1, pad)

def edt(mask, R=48):
    """Euclidean distance from every True pixel to the nearest False pixel, exact up to R px (values above R
    are only guaranteed to be > R). Row pass exact via running min/max, column pass windowed to |dy| <= R."""
    Hh, W = mask.shape
    idx = np.arange(W)
    bg = ~mask
    big = 10 ** 6
    left = np.maximum.accumulate(np.where(bg, idx, -big), axis=1)
    right = np.minimum.accumulate(np.where(bg, idx, big)[:, ::-1], axis=1)[:, ::-1]
    d = np.minimum(idx - left, right - idx).astype(np.float64)
    g = np.minimum(d * d, 4.0 * R * R + 1)
    out = g.copy()
    for k in range(1, R + 1):
        kk2 = float(k * k)
        np.minimum(out[k:], g[:-k] + kk2, out=out[k:])
        np.minimum(out[:-k], g[k:] + kk2, out=out[:-k])
    return np.sqrt(out)

def opening_loss(mask, r, dfg=None):
    if dfg is None: dfg = edt(mask)
    eroded = dfg > r
    if not eroded.any(): return mask.copy()
    d_to_er = edt(~eroded, int(r) + 3)            # distance from non-eroded pixels to the eroded set
    opened = eroded | (d_to_er <= r)
    return mask & ~opened

def closing_fill(mask, r, dbg=None):
    if dbg is None: dbg = edt(~mask)
    dil = dbg <= r                     # dilation of the shape (distance to shape <= r)
    d_out = edt(dil, int(r) + 3)                   # distance from dilated pixels to outside of dilation
    closed = d_out > r
    return closed & ~mask

def _scan(test, r0=2.0, r1=44.0, step=0.5):
    r = r0
    while r <= r1:
        hit, where = test(r)
        if hit: return r, where
        r += step
    return None, None

def thinnest(mask, upp, kappa=0.40):
    """smallest disc diameter (units) whose opening removes a region with an inscribed radius > kappa*r.
    A stroke of width w is removed as soon as 2r > w (inscribed radius w/2 ~ r); a tip of angle theta keeps
    only r*(1-sin(theta/2))/(1+sin(theta/2)): 0.17 r at 90 deg, 0.28 r at 69 deg, 0.40 r at 50 deg, 0.69 r at 21 deg."""
    dfg = edt(mask)
    def test(r):
        lost = opening_loss(mask, r, dfg)
        if not lost.any(): return False, None
        e = edt(lost, int(r) + 3); m = e.max()
        return bool(m - 1.0 > kappa * r), np.unravel_index(int(e.argmax()), e.shape)
    r, where = _scan(test)
    if r is None: return None, None
    return round(2 * r * upp, 1), (where[1], where[0])

def narrowest(mask, upp, kappa=0.48):
    """smallest disc diameter (units) whose closing fills a region with an inscribed radius > kappa*r:
    gaps narrower than the disc, or notches sharper than ~40 deg (the k's 43 deg crotch keeps 0.46 r)."""
    dbg = edt(~mask)
    def test(r):
        fill = closing_fill(mask, r, dbg)
        if not fill.any(): return False, None
        e = edt(fill, int(r) + 3); m = e.max()
        return bool(m - 1.0 > kappa * r), np.unravel_index(int(e.argmax()), e.shape)
    r, where = _scan(test)
    if r is None: return None, None
    return round(2 * r * upp, 1), (where[1], where[0])

def to_units(where, origin, upp):
    if where is None: return None
    x0, y1, pad = origin
    return (round((where[0] - pad) * upp + x0), round(y1 - (where[1] - pad) * upp))

def analyse(contours, upp=2.0):
    mask, origin = rasterize(contours, upp)
    t, tw = thinnest(mask, upp)
    n, nw = narrowest(mask, upp)
    return {'thinnest_units': t, 'thinnest_at': to_units(tw, origin, upp),
            'narrowest_units': n, 'narrowest_at': to_units(nw, origin, upp), 'units_per_px': upp}
