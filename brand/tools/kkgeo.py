"""Klapklaar v6 letter geometry: constructed capitals, the second A of KLAAR is an easy-up.

Units: y up, baseline 0, cap height CAP = 700. A contour is a list of vertices (x, y, r) where r is the
corner radius (0 = sharp). Outer contours run clockwise (y-up), counters counter-clockwise; nothing
overlaps, so every file prints in one pass without trapping.

Design rules (measured values are written to logo-meta.json by logo.py; brand.md quotes those):
  * heavy, slightly rounded capitals: stem STEM, bars BAR, every outside corner rounded with RC
    ("bent aluminium tube"), notches sharp;
  * the L of KL and the A of A(P) are joined: the L-foot runs into the A's left leg (one contour);
  * the tent-A: straight roof at PITCH degrees with a rounded hub at the apex, a thin seam, the valance
    band (= the crossbar) and two legs that splay a little, like a tent seen from close by. Its apex is
    exactly on the cap line: the tent adds no height to the word.
"""
import math

CAP = 700

# ------------------------------------------------------------------ path primitives
class Path:
    def __init__(self, start): self.start = start; self.segs = []
    def L(self, p): self.segs.append(('L', p)); return self
    def C(self, c1, c2, p): self.segs.append(('C', c1, c2, p)); return self
    def flatten(self, n=12):
        out = [self.start]; cur = self.start
        for s in self.segs:
            if s[0] == 'L': out.append(s[1])
            else:
                a, b, c, d = cur, s[1], s[2], s[3]
                for i in range(1, n + 1):
                    t = i / n; u = 1 - t
                    out.append((u*u*u*a[0] + 3*u*u*t*b[0] + 3*u*t*t*c[0] + t*t*t*d[0],
                                u*u*u*a[1] + 3*u*u*t*b[1] + 3*u*t*t*c[1] + t*t*t*d[1]))
            cur = s[-1]
        if abs(out[0][0] - out[-1][0]) < 1e-6 and abs(out[0][1] - out[-1][1]) < 1e-6: out = out[:-1]
        return out
    def area(self):
        p = self.flatten(16); a = 0
        for i in range(len(p)):
            a += p[i][0] * p[(i + 1) % len(p)][1] - p[(i + 1) % len(p)][0] * p[i][1]
        return a / 2
    def map(self, f):
        q = Path(f(self.start))
        for s in self.segs: q.segs.append((s[0],) + tuple(f(p) for p in s[1:]))
        return q
    def reversed(self):
        pts = [self.start] + [s[-1] for s in self.segs]
        q = Path(pts[-1])
        for i in range(len(self.segs) - 1, -1, -1):
            s = self.segs[i]
            if s[0] == 'L': q.segs.append(('L', pts[i]))
            else: q.segs.append(('C', s[2], s[1], pts[i]))
        return q

def move(paths, dx, dy=0): return [p.map(lambda q: (q[0] + dx, q[1] + dy)) for p in paths]
def scale(paths, s, ox=0, oy=0): return [p.map(lambda q: (q[0] * s + ox, q[1] * s + oy)) for p in paths]

def isect(p1, p2, p3, p4):
    x1, y1 = p1; x2, y2 = p2; x3, y3 = p3; x4, y4 = p4
    den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
    t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den
    return (x1 + t * (x2 - x1), y1 + t * (y2 - y1))

def lerp(a, b, t): return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)

SQ = 0.62 / 0.5523          # squircle boost over a circular arc (bowls and tube corners)

def rpoly(verts):
    """[(x, y, r)] -> Path; each corner with r > 0 is rounded (tangent distance r / tan(theta/2))."""
    dd = []
    for v in verts:
        if dd and abs(dd[-1][0] - v[0]) < 1e-6 and abs(dd[-1][1] - v[1]) < 1e-6:
            dd[-1] = (v[0], v[1], max(dd[-1][2], v[2])); continue
        dd.append(v)
    if abs(dd[0][0] - dd[-1][0]) < 1e-6 and abs(dd[0][1] - dd[-1][1]) < 1e-6: dd.pop()
    verts = dd; n = len(verts); pts = []
    for i in range(n):
        x, y, r = verts[i]
        if r <= 0: pts.append(('P', (x, y))); continue
        px, py, pr = verts[i - 1]; nx, ny, nr = verts[(i + 1) % n]
        v1 = (px - x, py - y); v2 = (nx - x, ny - y)
        l1 = math.hypot(*v1); l2 = math.hypot(*v2)
        u1 = (v1[0] / l1, v1[1] / l1); u2 = (v2[0] / l2, v2[1] / l2)
        theta = math.acos(max(-1, min(1, u1[0] * u2[0] + u1[1] * u2[1])))
        phi = math.pi - theta
        if phi < 1e-3: pts.append(('P', (x, y))); continue
        d = r / math.tan(theta / 2)
        d = min(d, l1 * (0.5 if pr > 0 else 0.98), l2 * (0.5 if nr > 0 else 0.98))
        t1 = (x + u1[0] * d, y + u1[1] * d); t2 = (x + u2[0] * d, y + u2[1] * d)
        h = min(4 / 3 * math.tan(phi / 4) / math.tan(phi / 2) * SQ, 0.95)
        pts.append(('R', t1, (t1[0] + (x - t1[0]) * h, t1[1] + (y - t1[1]) * h),
                    (t2[0] + (x - t2[0]) * h, t2[1] + (y - t2[1]) * h), t2))
    first = pts[0]
    p = Path(first[1] if first[0] == 'P' else first[4])
    for k in pts[1:] + pts[:1]:
        if k[0] == 'P': p.L(k[1])
        else: p.L(k[1]); p.C(k[2], k[3], k[4])
    return p

def _area(v):
    return sum(v[i][0] * v[(i + 1) % len(v)][1] - v[(i + 1) % len(v)][0] * v[i][1] for i in range(len(v))) / 2
def outer(v): return rpoly(v if _area(v) < 0 else list(reversed(v)))
def hole(v): return rpoly(v if _area(v) > 0 else list(reversed(v)))

# ------------------------------------------------------------------ parameters (units, cap height 700)
P = dict(
    STEM=142,       # vertical stems
    BAR=118,        # horizontal bars: L-foot, P/R bowl top and bottom, A crossbar (x 0.92)
    ARM=130, LEG=136,   # K arm / K leg, measured perpendicular to the stroke
    RC=18,          # outside corner radius ("tube")
    W_K=552, W_L=452, W_P=524, W_R=556, YB=280, RO=168,
    W_A=610, A_APEX=118, A_BAR=250,           # the regular A (flat apex)
    LA_TUCK=100,    # how far the A's baseline corner sits left of the L-foot's end (L+A joined)
    # tent-A
    T_W=580, T_PITCH=35.0, T_EAVE=26, T_SEAM=26, T_BAND=84, T_LEG=122, T_SPLAY=0.14, T_HUB=26,
    TRACK=24,
)
SB = dict(K=(48, 0), LA=(48, 4), P=(48, 26), R=(48, 0), A=(4, 4), T=(10, 10), L=(48, 0))

# ------------------------------------------------------------------ glyphs
class Glyph:
    def __init__(self, paths, adv, name, kind='letter', info=None):
        self.paths = paths; self.adv = adv; self.name = name; self.kind = kind; self.info = info or {}

def _counter(p, W, yb):
    S, BAR, RO = p['STEM'], p['BAR'], p['RO']
    SV = S * 0.98
    ri = max(RO - SV * 0.9, 30)
    return hole([(S, yb + BAR, 0), (S, CAP - BAR, 0), (W - SV, CAP - BAR, ri), (W - SV, yb + BAR, ri)])

def glyph_P(p=P):
    S, RO, W, yb, r = p['STEM'], p['RO'], p['W_P'], p['YB'], p['RC']
    o = outer([(0, 0, r), (0, CAP, r), (W, CAP, RO), (W, yb, RO), (S, yb, 0), (S, 0, r)])
    return Glyph([o, _counter(p, W, yb)], W, 'P')

def glyph_R(p=P):
    S, RO, yb, r, LEG, WR = p['STEM'], p['RO'], p['YB'], p['RC'], p['LEG'], p['W_R']
    W = p['W_P'] + 6
    xj = W - RO * 0.98
    th = math.atan2(yb, WR - xj)
    lw = LEG / math.sin(th)
    bl = (WR - lw, 0)
    tl = (bl[0] - (WR - xj), yb)
    o = outer([(0, 0, r), (0, CAP, r), (W, CAP, RO), (W, yb, RO * 0.9), (xj, yb, 0), (WR, 0, r), (bl[0], 0, r),
               (tl[0], yb, 0), (S, yb, 0), (S, 0, r)])
    return Glyph([o, _counter(p, W, yb)], WR, 'R', info={'leg_deg': math.degrees(th)})

def glyph_K(p=P):
    S, W, ARM, LEG, r = p['STEM'], p['W_K'], p['ARM'], p['LEG'], p['RC']
    yJ = 252
    th_a = math.atan2(CAP - yJ, W - S)
    up_top = (W - ARM / math.sin(th_a), CAP)
    yAU = isect(up_top, (up_top[0] - (W - S), yJ), (S, 0), (S, 1))[1]
    Q2 = lerp((S, yJ), (W, CAP), 0.40)
    xBR = W + 8
    th_l = math.atan2(Q2[1], xBR - Q2[0])
    xBL = xBR - LEG / math.sin(th_l)
    Q1 = isect((xBL, 0), (xBL + Q2[0] - xBR, Q2[1]), (W, CAP), (S, yJ))
    o = outer([(0, 0, r), (0, CAP, r), (S, CAP, r), (S, yAU, 0), (up_top[0], CAP, r), (W, CAP, r), (Q2[0], Q2[1], 0),
               (xBR, 0, r), (xBL, 0, r), (Q1[0], Q1[1], 0), (S, yJ, 0), (S, 0, r)])
    return Glyph([o], xBR, 'K', info={'arm_deg': math.degrees(th_a), 'leg_deg': math.degrees(th_l)})

def _a_frame(p):
    W, S = p['W_A'], p['STEM']
    tl = (W - p['A_APEX']) / 2
    th = math.atan2(CAP, tl)
    lw = S / math.sin(th)
    ia = isect((lw, 0), (lw + tl, CAP), (W - lw, 0), (W - lw - tl, CAP))
    bt, bb = p['A_BAR'], p['A_BAR'] - p['BAR'] * 0.92
    def xin(y): return lw + (ia[0] - lw) * y / ia[1]
    return W, tl, th, lw, ia, bt, bb, xin

def glyph_A(p=P):
    W, tl, th, lw, ia, bt, bb, xin = _a_frame(p); r = p['RC']
    o = outer([(0, 0, r), (tl, CAP, r * 0.8), (W - tl, CAP, r * 0.8), (W, 0, r), (W - lw, 0, r),
               (W - xin(bb), bb, 0), (xin(bb), bb, 0), (lw, 0, r)])
    cn = hole([(xin(bt), bt, 0), (ia[0], ia[1], 6), (W - xin(bt), bt, 0)])
    return Glyph([o, cn], W, 'A', info={'leg_deg': math.degrees(th)})

def glyph_LA(p=P):
    """L and A as one contour: the L-foot runs into the A's left leg."""
    S, BAR, WL, r = p['STEM'], p['BAR'], p['W_L'], p['RC']
    W, tl, th, lw, ia, bt, bb, xin = _a_frame(p)
    xa = WL - p['LA_TUCK']
    x_join = xa + tl * BAR / CAP                    # A's outer left edge at the top of the foot
    assert x_join < WL < xa + xin(BAR), 'L-foot must end inside the A leg'
    o = outer([(0, 0, r), (0, CAP, r), (S, CAP, r), (S, BAR, 0), (x_join, BAR, 0), (xa + tl, CAP, r * 0.8),
               (xa + W - tl, CAP, r * 0.8), (xa + W, 0, r), (xa + W - lw, 0, r), (xa + W - xin(bb), bb, 0),
               (xa + xin(bb), bb, 0), (xa + lw, 0, r)])
    cn = hole([(xa + xin(bt), bt, 0), (xa + ia[0], ia[1], 6), (xa + W - xin(bt), bt, 0)])
    return Glyph([o, cn], xa + W, 'LA', info={'leg_deg': math.degrees(th), 'join_x': x_join})

def glyph_tent(p=P, seam=True, leg=None):
    W, E, G, B = p['T_W'], p['T_EAVE'], p['T_SEAM'], p['T_BAND']
    LW = leg or p['T_LEG']; r = p['RC']; hub = p['T_HUB']
    rise = (W / 2) * math.tan(math.radians(p['T_PITCH']))
    ye = CAP - rise
    rb = ye - E
    band_top = rb - G if seam else rb
    band_bot = band_top - B
    sp = p['T_SPLAY'] * band_bot
    paths = []
    if seam:
        paths.append(outer([(0, rb, r * 0.6), (0, ye, 0), (W / 2, CAP, hub), (W, ye, 0), (W, rb, r * 0.6)]))
        top = [(0, band_top, r * 0.6), (W, band_top, r * 0.6)]
    else:
        top = [(0, ye, 0), (W / 2, CAP, hub), (W, ye, 0)]
    verts = [(0, 0, r * 0.6), (sp, band_bot, 0), (0, band_bot, r * 0.6)] + top + [
        (W, band_bot, r * 0.6), (W - sp, band_bot, 0), (W, 0, r * 0.6), (W - LW, 0, r * 0.6),
        (W - sp - LW, band_bot, 0), (sp + LW, band_bot, 0), (LW, 0, r * 0.6)]
    paths.append(outer(verts))
    return Glyph(paths, W, 'T', kind='tent', info={
        'pitch_deg': p['T_PITCH'], 'roof_eave_y': ye, 'roof_bottom_y': rb, 'band': (band_bot, band_top),
        'seam': G if seam else 0, 'leg': LW, 'splay_deg': math.degrees(math.atan2(sp, band_bot)), 'band_h': B})

def statafel(cx, h, tw=200, ww=54, bw=190, yw=None):
    """stretch statafel (hourglass) seen from the front; floor at y = 0."""
    yw = yw if yw is not None else h * 0.48
    pth = Path((cx - tw / 2, h))
    pth.L((cx + tw / 2, h))
    pth.C((cx + tw / 2 - (tw - ww) / 2 * 0.15, h - (h - yw) * 0.55), (cx + ww / 2, yw + (h - yw) * 0.35), (cx + ww / 2, yw))
    pth.C((cx + ww / 2, yw - yw * 0.45), (cx + bw / 2 - (bw - ww) / 2 * 0.35, yw * 0.12), (cx + bw / 2, 0))
    pth.L((cx - bw / 2, 0))
    pth.C((cx - bw / 2 + (bw - ww) / 2 * 0.35, yw * 0.12), (cx - ww / 2, yw - yw * 0.45), (cx - ww / 2, yw))
    pth.C((cx - ww / 2, yw + (h - yw) * 0.35), (cx - tw / 2 + (tw - ww) / 2 * 0.15, h - (h - yw) * 0.55), (cx - tw / 2, h))
    return pth if pth.area() < 0 else pth.reversed()

WORD = ['K', 'LA', 'P', 'K', 'LA', 'T', 'R']

def wordmark(p=P, seam=True, track=None, leg=None):
    """returns (letters, tent, width, items)"""
    track = p['TRACK'] if track is None else track
    x = 0; letters = []; tent = []; items = []
    for i, tok in enumerate(WORD):
        g = {'K': glyph_K, 'LA': glyph_LA, 'P': glyph_P, 'R': glyph_R}.get(tok)
        g = g(p) if g else glyph_tent(p, seam, leg)
        lsb, rsb = SB[tok]
        x += lsb
        ps = move(g.paths, x)
        (tent if tok == 'T' else letters).extend(ps)
        items.append((tok, x, g, ps))
        x += g.adv + rsb + track
    return letters, tent, x - track, items

def mark_geometry(p=P, seam=True, table=True):
    """tent with a statafel under it, in tent units (origin = tent's left foot)."""
    g = glyph_tent(p, seam)
    bb = g.info['band'][0]
    extra = [statafel(g.adv / 2, bb * 0.62, 200, 54, 190, bb * 0.30)] if table else []
    return g, extra
