"""Klapklaar v5: constructed letterforms + the easy-up tent (no font outlines).

Units: font-style, y up, x-height X = 500. Every shape is an explicit, non-overlapping contour (outer
clockwise in y-up, counters counter-clockwise) built from lines and cubic Beziers.

v5 rules (technisch.md 1):
  * two measures: STOK S = 130 (stems, valance band) and DUN G = 65 (tent legs, roof eave, the opening between
    roof and band). Diagonals are optically corrected to 0.94-0.97 S, bowl tops/bottoms to 0.86 S (H = 112).
  * one angle, 21 deg: the roof and every terminal that rises towards it (k and l tops, k arm, r arm). What stands
    on the ground is flat: the baseline, the tent legs and (new in v5) the p descender, shortened to -165.
  * the tent is an easy-up seen from the front and nothing else: roof, valance band, two legs. v4's pole and
    pennant are gone (read as circus tent / kermis booth; the blunt pennant looked like an axe head).
  * the legs never group with the letters: every leg-letter gap is >= 1.15 x the straight-straight letter gap
    of the same version (primary 88 -> >= 101; klein 124 -> >= 143), so a one-colour print reads 'kl aa r',
    never 'klIaaIr'.
  * spacing is optical (Tracy method): straight side n, round side 0.45 n, open k side 8.
"""
import math

# ---------------------------------------------------------------- metrics
X = 500          # x-height
A = 712          # ascender (highest point of the cut)
D = -165         # descender (flat; v4: -196 with a 21 deg cut)
S = 130          # STOK: vertical stem, valance band
H = 112          # bowl top/bottom (optical 0.86 S)
G = 65           # DUN: legs, roof-band opening, eave height
OV = 9           # overshoot of rounds
K = 0.66         # squircle handle factor (0.5523 = circle)
PITCH = 21.0     # roof pitch in degrees; also the terminal cut angle of k, l, r (not p: v5)
T = math.tan(math.radians(PITCH))
ARM = 122        # k arm, perpendicular (0.94 S)
LEG = 126        # k leg, perpendicular (0.97 S)

# ---------------------------------------------------------------- bezier helpers
def lerp(a, b, t): return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)

def bez(p, t):
    a, b, c, d = p
    u = 1 - t
    return (u*u*u*a[0] + 3*u*u*t*b[0] + 3*u*t*t*c[0] + t*t*t*d[0],
            u*u*u*a[1] + 3*u*u*t*b[1] + 3*u*t*t*c[1] + t*t*t*d[1])

def split(p, t):
    a, b, c, d = p
    ab, bc, cd = lerp(a, b, t), lerp(b, c, t), lerp(c, d, t)
    abc, bcd = lerp(ab, bc, t), lerp(bc, cd, t)
    m = lerp(abc, bcd, t)
    return (a, ab, abc, m), (m, bcd, cd, d)

def solve_x(p, x, lo=0.0, hi=1.0):
    flo = bez(p, lo)[0] - x
    for _ in range(80):
        mid = (lo + hi) / 2
        fm = bez(p, mid)[0] - x
        if (fm < 0) == (flo < 0): lo, flo = mid, fm
        else: hi = mid
    return (lo + hi) / 2

def quarter(c, rx, ry, q, k=K):
    cx, cy = c
    if q == 'tr': return ((cx, cy+ry), (cx+k*rx, cy+ry), (cx+rx, cy+k*ry), (cx+rx, cy))
    if q == 'br': return ((cx+rx, cy), (cx+rx, cy-k*ry), (cx+k*rx, cy-ry), (cx, cy-ry))
    if q == 'bl': return ((cx, cy-ry), (cx-k*rx, cy-ry), (cx-rx, cy-k*ry), (cx-rx, cy))
    if q == 'tl': return ((cx-rx, cy), (cx-rx, cy+k*ry), (cx-k*rx, cy+ry), (cx, cy+ry))

def rev_cubic(c): return (c[3], c[2], c[1], c[0])

def line_isect(p1, p2, p3, p4):
    x1, y1 = p1; x2, y2 = p2; x3, y3 = p3; x4, y4 = p4
    den = (x1-x2)*(y3-y4) - (y1-y2)*(x3-x4)
    t = ((x1-x3)*(y3-y4) - (y1-y3)*(x3-x4)) / den
    return (x1 + t*(x2-x1), y1 + t*(y2-y1))

class Contour:
    def __init__(self, start): self.start = start; self.segs = []
    def L(self, p): self.segs.append(('L', p)); return self
    def C(self, cub): self.segs.append(('C', cub[1], cub[2], cub[3])); return self
    def pts(self):
        out = [self.start]
        for s in self.segs: out.append(s[-1])
        return out
    def transformed(self, f):
        c = Contour(f(self.start))
        for s in self.segs: c.segs.append((s[0],) + tuple(f(p) for p in s[1:]))
        return c
    def reversed(self):
        pts = [self.start]
        for s in self.segs: pts.append(s[-1])
        c = Contour(pts[-1])
        for i in range(len(self.segs) - 1, -1, -1):
            s = self.segs[i]; p0 = pts[i]
            if s[0] == 'L': c.segs.append(('L', p0))
            else: c.segs.append(('C', s[2], s[1], p0))
        return c
    def area(self):
        poly = self.flatten(16); a = 0
        for i in range(len(poly)):
            x1, y1 = poly[i]; x2, y2 = poly[(i+1) % len(poly)]
            a += x1*y2 - x2*y1
        return a / 2
    def flatten(self, n=16):
        out = [self.start]; cur = self.start
        for s in self.segs:
            if s[0] == 'L': out.append(s[1])
            else:
                cub = (cur, s[1], s[2], s[3])
                for i in range(1, n+1): out.append(bez(cub, i/n))
            cur = s[-1]
        return out[:-1] if out[0] == out[-1] else out
    def corners(self):
        """interior angle (deg) at every vertex where two straight segments meet. Outer contours are
        clockwise (y-up): a convex corner turns right. Returns [(point, angle, 'tip'|'notch')]."""
        if any(s[0] == 'C' for s in self.segs): pass
        pts = self.pts()
        if pts[0] == pts[-1]: pts = pts[:-1]
        kinds = {}
        segkind = [s[0] for s in self.segs]
        n = len(pts); out = []
        orient = -1 if self.area() < 0 else 1           # -1 = clockwise (outer)
        for i in range(n):
            # only corners between two straight segments
            if segkind[i - 1] != 'L' or segkind[i % len(segkind)] != 'L': continue
            a, b, c = pts[i - 1], pts[i], pts[(i + 1) % n]
            v1 = (a[0] - b[0], a[1] - b[1]); v2 = (c[0] - b[0], c[1] - b[1])
            l1, l2 = math.hypot(*v1), math.hypot(*v2)
            if l1 < 1e-6 or l2 < 1e-6: continue
            ang = math.degrees(math.acos(max(-1, min(1, (v1[0]*v2[0] + v1[1]*v2[1]) / (l1 * l2)))))
            cross = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0])
            convex = (cross < 0) if orient == -1 else (cross > 0)
            if abs(ang - 180) < 1e-3: continue
            out.append((b, ang if convex else 360 - ang, 'tip' if convex else 'notch'))
        return out

class Glyph:
    def __init__(self, contours, adv, name=''):
        self.contours = contours; self.adv = adv; self.name = name; self.info = {}
    def bbox(self):
        xs, ys = [], []
        for c in self.contours:
            for p in c.flatten(24): xs.append(p[0]); ys.append(p[1])
        return min(xs), min(ys), max(xs), max(ys)

def mirror_x(contours, w):
    return [c.transformed(lambda p: (w - p[0], p[1])).reversed() for c in contours]

def rect(x0, y0, x1, y1):
    c = Contour((x0, y0)); c.L((x0, y1)).L((x1, y1)).L((x1, y0)).L((x0, y0)); return c

def poly(pts):
    """closed polygon, clockwise in y-up is the caller's job"""
    c = Contour(pts[0])
    for p in pts[1:]: c.L(p)
    c.L(pts[0]); return c

# ---------------------------------------------------------------- glyphs
def bowl_glyph(W, stem_lo, stem_hi_left, stem_hi_right, desc_cut=False):
    """Single-storey 'a' (bowl left, stem right). The p is its mirror with a descender."""
    xs = W - S
    xr = xs + 0.56 * S
    cx, cy = xr / 2, X / 2
    rx, ry = xr / 2, X / 2 + OV
    ixl = S * 0.94
    ixr = xs + 0.42 * S
    icx, icy = (ixl + ixr) / 2, X / 2
    irx, iry = (ixr - ixl) / 2, X / 2 + OV - H
    ki = K + 0.03
    tr = quarter((cx, cy), rx, ry, 'tr'); br = quarter((cx, cy), rx, ry, 'br')
    bl = quarter((cx, cy), rx, ry, 'bl'); tl = quarter((cx, cy), rx, ry, 'tl')
    t_up = solve_x(tr, xs); t_lo = solve_x(br, xs)
    tr_a, _ = split(tr, t_up); _, br_b = split(br, t_lo)
    j_lo = br_b[0]
    c = Contour((xs, stem_hi_left))
    c.L((W, stem_hi_right)).L((W, stem_lo)).L((xs, stem_lo)).L(j_lo)
    c.C(br_b); c.C(bl); c.C(tl); c.C(tr_a)
    c.L((xs, stem_hi_left))
    itr = quarter((icx, icy), irx, iry, 'tr', ki); ibr = quarter((icx, icy), irx, iry, 'br', ki)
    ibl = quarter((icx, icy), irx, iry, 'bl', ki); itl = quarter((icx, icy), irx, iry, 'tl', ki)
    ti_up = solve_x(itr, xs); ti_lo = solve_x(ibr, xs)
    itr_a, _ = split(itr, ti_up); _, ibr_b = split(ibr, ti_lo)
    cc = Contour(itr_a[3])
    cc.C(rev_cubic(itr_a)); cc.C(rev_cubic(itl)); cc.C(rev_cubic(ibl)); cc.C(rev_cubic(ibr_b))
    cc.L(itr_a[3])
    return [c, cc]

def glyph_a():
    W = 470
    return Glyph(bowl_glyph(W, 0, X, X), W, name='a')

def glyph_p():
    """mirror of the a with a flat descender (v5): the ground is flat, only what rises is cut at the pitch."""
    W = 470
    cs = bowl_glyph(W, D, X, X)
    return Glyph(mirror_x(cs, W), W, name='p')

def glyph_l():
    c = Contour((0, 0)); c.L((0, A - S * T)).L((S, A)).L((S, 0)).L((0, 0))
    return Glyph([c], S, name='l')

def glyph_k(ta=ARM, tl=LEG, Wk=468, yJ=168, q=0.5):
    """k with arm and leg drawn to a PERPENDICULAR thickness (v3's leg was 164 = 1.26 S)."""
    xTR = Wk
    th_a = math.atan2(X - yJ, xTR - S)
    xTL = xTR - ta / math.sin(th_a)
    lo_a, lo_b = (xTR, X), (S, yJ)
    dx, dy = lo_a[0] - lo_b[0], lo_a[1] - lo_b[1]
    up_a, up_b = (xTL, X), (xTL - dx, X - dy)
    yAU = line_isect(up_a, up_b, (S, 0), (S, 1))[1]
    xBR = Wk + 8
    Q2 = lerp(lo_b, lo_a, q)
    th_l = math.atan2(Q2[1], xBR - Q2[0])
    xBL = xBR - tl / math.sin(th_l)
    Q1 = line_isect((xBL, 0), (xBL + Q2[0] - xBR, Q2[1]), lo_a, lo_b)
    # the arm's terminal is cut at the roof pitch, falling to the right like the roof's right slope:
    # outer corner 68 deg instead of a 47 deg point
    tip = line_isect((xTL, X), (xTL + 100, X - 100 * T), lo_b, lo_a)
    c = Contour((0, 0))
    c.L((0, A - S * T)).L((S, A)).L((S, yAU)).L((xTL, X)).L(tip).L(Q2)
    c.L((xBR, 0)).L((xBL, 0)).L(Q1).L((S, yJ)).L((S, 0)).L((0, 0))
    g = Glyph([c], xBR, name='k')
    g.info = {'arm_perp': ta, 'leg_perp': tl, 'arm_deg': round(math.degrees(th_a), 1), 'leg_deg': round(math.degrees(th_l), 1)}
    return g

def glyph_r():
    Wr = 318; R1 = 150; Ht = H + OV; yTop = X + OV; R2 = 64
    tcut = Ht * T
    c = Contour((0, 0))
    c.L((0, yTop - R1))
    c.C(((0, yTop - R1), (0, yTop - R1 + K * R1), (R1 - K * R1, yTop), (R1, yTop)))
    c.L((Wr, yTop)).L((Wr - tcut, yTop - Ht))
    c.L((S + R2, yTop - Ht))
    c.C(((S + R2, yTop - Ht), (S + R2 - K * R2, yTop - Ht), (S, yTop - Ht - R2 + K * R2), (S, yTop - Ht - R2)))
    c.L((S, 0)).L((0, 0))
    return Glyph([c], Wr, name='r')

GLYPHS = {'a': glyph_a, 'p': glyph_p, 'l': glyph_l, 'k': glyph_k, 'r': glyph_r}

# ---------------------------------------------------------------- spacing (Tracy method)
N = 44                      # straight side
SB = {'k': (N, 0), 'l': (N, N), 'a': (round(0.45 * N), N), 'p': (N, round(0.45 * N)), 'r': (N, 0)}
LEG_FACTOR = {'straight': 1.30, 'round': 1.15}   # leg gap = factor x the straight-straight letter gap (2N + track)

def leg_gaps(track):
    ss = 2 * N + track
    return {'letter_ss': ss, 'out': round(LEG_FACTOR['straight'] * ss), 'in_round': round(LEG_FACTOR['round'] * ss),
            'in_straight': round(LEG_FACTOR['straight'] * ss)}

def layout(word, track=0, legs=None):
    """(glyph, x) list. legs = (i_first_a, i_after, leg_width) inserts a tent leg before index i_first_a and
    before index i_after (the r). Returns items, width, leg x positions, gaps used."""
    LG = leg_gaps(track)
    x = 0; items = []; legx = []
    for i, ch in enumerate(word):
        g = GLYPHS[ch](); bb = g.bbox()
        if legs and i == legs[0]:
            prev, px = items[-1]; right = px + prev.bbox()[2]
            L0 = right + LG['out']; legx.append(L0)
            x = L0 + legs[2] + LG['in_round'] - bb[0]
        elif legs and i == legs[1]:
            prev, px = items[-1]; right = px + prev.bbox()[2]
            L0 = right + LG['in_straight']; legx.append(L0)
            x = L0 + legs[2] + LG['out'] - bb[0]
        else:
            if i: x += track
            x += SB[ch][0] - bb[0]
        items.append((g, x)); x += bb[2] + SB[ch][1]
    return items, x, legx, LG

# ---------------------------------------------------------------- the tent
TENT = {
    # primary: roof and valance band separate (one DUN apart), legs one DUN
    'primary': dict(band=S, gap=G, eave=G, leg=G, fused=False),
    # klein: roof + band in one piece, heavier legs: for small screen sizes and small embroidery/flock
    'klein':   dict(band=S, gap=0, eave=G, leg=100, fused=True),
}

def cw(c): return c if c.area() < 0 else c.reversed()

def tent(x0, x1, base, band=S, gap=G, eave=G, leg=G, fused=False, legs=True):
    """Easy-up seen from the front, standing on the baseline (y=0).
    Legs [x0, x0+leg] and [x1-leg, x1] from 0 to `base`; valance band [x0,x1] x [base, base+band];
    roof (PITCH) above a `gap`, ending in vertical eaves of height `eave`.
    Returns dict: parts [(label, contour)], welded (one-colour outlines), info."""
    xm = (x0 + x1) / 2
    ry = base + band + gap                     # roof bottom
    ye = ry + eave                             # eave top
    apex = ye + (xm - x0) * T
    roof = [(x0, ry), (x0, ye), (xm, apex), (x1, ye), (x1, ry)]
    if fused:
        pts = ([(x0, 0)] if legs else [(x0, base)]) + [(x0, ye), (xm, apex), (x1, ye)]
        pts += [(x1, 0), (x1 - leg, 0), (x1 - leg, base), (x0 + leg, base), (x0 + leg, 0)] if legs else [(x1, base)]
        one = cw(poly(pts))
        parts = [('tent', one)]; welded = [one]
    else:
        roof_c = cw(poly(roof))
        if legs:
            frame = cw(poly([(x0, 0), (x0, base + band), (x1, base + band), (x1, 0), (x1 - leg, 0), (x1 - leg, base), (x0 + leg, base), (x0 + leg, 0)]))
        else:
            frame = cw(rect(x0, base, x1, base + band))
        parts = [('frame', frame), ('dak', roof_c)]; welded = [frame, roof_c]
    info = {'xm': xm, 'roof_base': ry, 'eave_top': ye, 'apex': apex, 'base': base,
            'band': (x0, base, x1, base + band), 'x0': x0, 'x1': x1, 'leg': leg, 'gap': gap, 'eave': eave}
    return {'parts': parts, 'welded': welded, 'info': info}

# ---------------------------------------------------------------- compositions
WORD = 'klapklaar'

def wordmark(variant='primary', track=None):
    """letters + tent over the double aa. primary: track 0; klein: +36 per pair and the one-piece tent."""
    cfg = dict(TENT[variant])
    if track is None: track = 0 if variant == 'primary' else 36
    items, w, legx, LG = layout(WORD, track, legs=(6, 8, cfg['leg']))
    cs = []
    for g, x in items:
        for c in g.contours: cs.append(c.transformed(lambda p, x=x: (p[0] + x, p[1])))
    x0, x1 = legx[0], legx[1] + cfg['leg']
    base = A - S + (0 if variant == 'primary' else 30)
    t = tent(x0, x1, base, **cfg)
    t['info'].update({'pos': [x for g, x in items], 'track': track, 'legx': legx, 'leg_gaps': LG,
                      'letters': [(WORD[i], g, x) for i, (g, x) in enumerate(items)]})
    return cs, t

def mark(variant='primary', width=1050):
    """'k onder de tent': the k of Klapklaar standing under the same easy-up."""
    cfg = dict(TENT[variant])
    k = glyph_k(); kb = k.bbox()
    kc = (kb[0] + kb[2]) / 2 - 15              # optical centre (the k's right side is open)
    if variant == 'klein': width = 1110
    x0, x1 = kc - width / 2, kc + width / 2
    base = A + (G if variant == 'primary' else 100)
    t = tent(x0, x1, base, **cfg)
    return list(k.contours), t
