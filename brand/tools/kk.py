"""Klapklaar custom letterforms + tent canopy, constructed geometry (no font outlines). v3.

Units: font-style, y up. x-height X=500. Every glyph is built as explicit, non-overlapping
contours (outer clockwise, counters counter-clockwise) from lines and cubic Beziers, so the
SVG output has no overlapping subpaths (plotter/vinyl safe) and no font dependency.

Design rules (see brand.md "Logo-constructie"):
  * one stroke weight S for verticals, H for horizontals (optical contrast ~0.86)
  * bowls are squircles (Bezier handle k=0.66) - sturdy, 'steel tube' feel
  * every terminal that leaves the x-height zone (k/l ascenders, p descender) is cut at the
    roof pitch PITCH, the same angle as the tent roof - the 'klap' cut
  * the roof is part of the type: the valance band is one stem S thick, its top sits on the
    ascender line, its width is exactly the 'aa' pair
  * v3: two measures only. S (stem, 130) for everything that carries weight (stems, valance band,
    flag height ~ S*1.2), G = S/2 (65) for every opening (roof-band gap, l-band gap, pole width).
    The small version (klein) closes the roof-band gap and widens every opening to >= 0.7 S.
"""
import math

# ---------------------------------------------------------------- metrics
X = 500          # x-height
A = 712          # ascender (highest point of the cut)
D = -196         # descender (lowest point of the cut)
S = 130          # vertical stem
H = 112          # horizontal stroke (bowl top/bottom)
G = 65           # v3: the one 'opening' measure = S/2 (roof gap, l-band gap, pole width)
OV = 9           # overshoot of rounds
K = 0.66         # squircle handle factor (0.5523 = circle)
PITCH = 21.0     # roof pitch in degrees; also the terminal cut angle
T = math.tan(math.radians(PITCH))

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
    """t where bezier x(t)==x, assuming monotone in [lo,hi]."""
    flo = bez(p, lo)[0] - x
    for _ in range(80):
        mid = (lo + hi) / 2
        fm = bez(p, mid)[0] - x
        if (fm < 0) == (flo < 0): lo, flo = mid, fm
        else: hi = mid
    return (lo + hi) / 2

def quarter(c, rx, ry, q, k=K):
    """Quarter squircle as cubic, clockwise (y-up) order of quadrants:
    q='tr' top->right, 'br' right->bottom, 'bl' bottom->left, 'tl' left->top."""
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

# A contour is a list of segments; each segment is ('L', p_end) or ('C', c1, c2, p_end),
# preceded by a start point. Representation: {'start': p, 'segs': [...]}
class Contour:
    def __init__(self, start): self.start = start; self.segs = []
    def L(self, p): self.segs.append(('L', p)); return self
    def C(self, cub):  # cub = (p0,c1,c2,p3); p0 must equal current point
        self.segs.append(('C', cub[1], cub[2], cub[3])); return self
    def pts(self):
        out = [self.start]
        for s in self.segs: out.append(s[-1])
        return out
    def transformed(self, f):
        c = Contour(f(self.start))
        for s in self.segs:
            c.segs.append((s[0],) + tuple(f(p) for p in s[1:]))
        return c
    def reversed(self):
        # rebuild in reverse order
        pts = [self.start]
        for s in self.segs: pts.append(s[-1])
        c = Contour(pts[-1])
        for i in range(len(self.segs) - 1, -1, -1):
            s = self.segs[i]; p0 = pts[i]
            if s[0] == 'L': c.segs.append(('L', p0))
            else: c.segs.append(('C', s[2], s[1], p0))
        return c
    def area(self):
        # signed area via flattening (y-up: positive = counter-clockwise)
        poly = self.flatten(16)
        a = 0
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

class Glyph:
    def __init__(self, contours, adv, lsb=0, name=''):
        self.contours = contours; self.adv = adv; self.lsb = lsb; self.name = name
    def bbox(self):
        xs, ys = [], []
        for c in self.contours:
            for p in c.flatten(24): xs.append(p[0]); ys.append(p[1])
        return min(xs), min(ys), max(xs), max(ys)

def mirror_x(contours, w):
    return [c.transformed(lambda p: (w - p[0], p[1])).reversed() for c in contours]

# ---------------------------------------------------------------- glyphs
def bowl_glyph(W, stem_lo, stem_hi_left, stem_hi_right, desc_cut=False):
    """Single-storey 'a' geometry (bowl left, stem right).  W = advance-free width.
    Stem x in [W-S, W]. The p is the mirror (with a descender stem)."""
    xs = W - S                         # stem left edge
    # outer bowl: x in [0, xr], y in [-OV, X+OV]
    xr = xs + 0.56 * S
    cx, cy = xr / 2, X / 2
    rx, ry = xr / 2, X / 2 + OV
    # inner counter: left wall slightly heavier than S*0.93 (optical), top/bottom H
    ixl = S * 0.94
    ixr = xs + 0.42 * S
    icx, icy = (ixl + ixr) / 2, X / 2
    irx, iry = (ixr - ixl) / 2, X / 2 + OV - H
    ki = K + 0.03                      # counters a touch squarer -> even colour
    # --- outer contour (clockwise, y-up): stem top-left -> stem top-right -> down -> bottom -> bowl
    tr = quarter((cx, cy), rx, ry, 'tr'); br = quarter((cx, cy), rx, ry, 'br')
    bl = quarter((cx, cy), rx, ry, 'bl'); tl = quarter((cx, cy), rx, ry, 'tl')
    t_up = solve_x(tr, xs)              # tr goes x: cx -> xr (increasing)
    t_lo = solve_x(br, xs)              # br goes x: xr -> cx (decreasing)
    tr_a, _ = split(tr, t_up)           # cx..xs part (top)
    _, br_b = split(br, t_lo)           # xs..cx part (bottom)
    j_up, j_lo = tr_a[3], br_b[0]
    c = Contour((xs, stem_hi_left))
    c.L((W, stem_hi_right)).L((W, stem_lo))
    c.L((xs, stem_lo if not desc_cut else stem_lo + S * T))
    c.L(j_lo)
    c.C(br_b); c.C(bl); c.C(tl); c.C(tr_a)
    c.L((xs, stem_hi_left))
    # --- counter (counter-clockwise): clip inner squircle at x = xs
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
    W = 470
    # build like 'a' with a descender stem cut at the pitch, then mirror
    # stem in the a-frame runs x in [W-S, W]; after mirroring it is x in [0, S]
    cs = bowl_glyph(W, D, X, X, desc_cut=False)
    # replace stem bottom with a slanted cut: in a-frame the stem bottom goes (W, D) -> (xs, D)
    # after mirror the cut must rise to the right (same direction as k/l tops):
    # mirrored x' = W - x, so a-frame point (W, ...) -> x'=0 ; (xs, ...) -> x'=S
    # we want bottom-left (x'=0) lowest: a-frame (W, D) and (xs, D + S*T)
    o = cs[0]
    segs = []
    for s in o.segs:
        if s[0] == 'L' and abs(s[1][0] - (W - S)) < 1e-6 and abs(s[1][1] - D) < 1e-6:
            segs.append(('L', (W - S, D + S * T)))
        else: segs.append(s)
    o.segs = segs
    return Glyph(mirror_x(cs, W), W, name='p')

def glyph_l():
    c = Contour((0, 0))
    c.L((0, A - S * T)).L((S, A)).L((S, 0)).L((0, 0))
    return Glyph([c], S, name='l')

def glyph_k():
    Wk = 468
    aw = 178           # horizontal width of the arm stroke at the x-height
    xTR = Wk; xTL = Wk - aw
    yJ = 168           # where the arm's lower edge would meet the stem (y at x=S)
    # arm lower/right edge: through (xTR, X) and direction to (S, yJ)
    arm_lo_a, arm_lo_b = (xTR, X), (S, yJ)
    dx, dy = arm_lo_a[0] - arm_lo_b[0], arm_lo_a[1] - arm_lo_b[1]
    # arm upper/left edge: parallel, through (xTL, X)
    arm_up_a, arm_up_b = (xTL, X), (xTL - dx, X - dy)
    yAU = line_isect(arm_up_a, arm_up_b, (S, 0), (S, 1))[1]
    # leg: bottom from xBL to xBR, edges parallel; leg direction up-left
    lw = 186           # horizontal width of the leg at the baseline
    xBR = Wk + 8; xBL = xBR - lw
    # the leg's right edge meets the arm's lower edge at Q2, chosen at fraction along the arm
    Q2 = lerp(arm_lo_b, arm_lo_a, 0.50)
    ldx, ldy = Q2[0] - xBR, Q2[1] - 0
    Q1 = line_isect((xBL, 0), (xBL + ldx, ldy), arm_lo_a, arm_lo_b)
    c = Contour((0, 0))
    c.L((0, A - S * T)).L((S, A)).L((S, yAU)).L((xTL, X)).L((xTR, X)).L(Q2)
    c.L((xBR, 0)).L((xBL, 0)).L(Q1).L((S, yJ)).L((S, 0)).L((0, 0))
    return Glyph([c], Wk + 8, name='k')

def glyph_r():
    Wr = 318
    R1 = 150                     # outer shoulder radius
    Ht = H + OV                  # arm thickness
    yTop = X + OV
    R2 = 64                      # inner corner radius
    tcut = Ht * T                # terminal cut offset (pitch, rotated 90deg)
    c = Contour((0, 0))
    c.L((0, yTop - R1))
    c.C(((0, yTop - R1), (0, yTop - R1 + K * R1), (R1 - K * R1, yTop), (R1, yTop)))
    c.L((Wr, yTop)).L((Wr - tcut, yTop - Ht))
    c.L((S + R2, yTop - Ht))
    c.C(((S + R2, yTop - Ht), (S + R2 - K * R2, yTop - Ht), (S, yTop - Ht - R2 + K * R2), (S, yTop - Ht - R2)))
    c.L((S, 0)).L((0, 0))
    return Glyph([c], Wr, name='r')

GLYPHS = {'a': glyph_a, 'p': glyph_p, 'l': glyph_l, 'k': glyph_k, 'r': glyph_r}

# sidebearings (left, right) in units; straight sides get more room than rounds/diagonals
SB = {'k': (36, 20), 'l': (36, 34), 'a': (20, 36), 'p': (36, 20), 'r': (36, 4)}
KERN = {('k', 'l'): 0, ('l', 'a'): 11, ('a', 'p'): 0, ('p', 'k'): 0, ('a', 'a'): 0, ('a', 'r'): 0}

def layout(word, track=0):
    """Return list of (glyph, x_offset) and total width."""
    x = 0; out = []
    prev = None
    for ch in word:
        g = GLYPHS[ch]()
        l, r = SB[ch]
        if prev is not None:
            x += KERN.get((prev, ch), 0) + track
        x += l
        out.append((g, x))
        x += g.adv + r
        prev = ch
    return out, x

# ---------------------------------------------------------------- canopy (tent), v3
def rect(x0, y0, x1, y1):
    c = Contour((x0, y0)); c.L((x0, y1)).L((x1, y1)).L((x1, y0)).L((x0, y0)); return c

CANOPY = {
    # primary: band S, gap G, pole G wide and S tall above the apex, pennant fixed to the pole
    'primary': dict(band=S, gap=G, pole_w=G, pole_h=S, flag_w=220, flag_h=156, solid=False),
    # klein: one piece (band + roof fused), stub pole one stem wide, bigger pennant fused to the pole
    'klein':   dict(band=S, gap=0, pole_w=S, pole_h=120, flag_w=280, flag_h=200, solid=True),
}

def canopy(x0, x1, base, band=S, gap=G, pole_w=G, pole_h=S, flag_w=220, flag_h=156, solid=False, pitch=PITCH):
    """Easy-up seen from the front. Valance band [x0,x1] x [base, base+band]; pyramid roof (base = band
    width, pitch 21 deg) above a gap; a pole at the apex with a pennant fixed to it (pointing right).
    Returns (body_contours, flag_contours, info). solid=True: band + roof + pole + pennant as ONE contour."""
    t = math.tan(math.radians(pitch))
    xm = (x0 + x1) / 2
    rise = (x1 - x0) / 2 * t
    hw = pole_w / 2
    ry = base + band + gap                      # roof base
    ya = ry + rise - hw * t                     # roof edge where it meets the pole
    ptop = ry + rise + pole_h                   # pole top = pennant top
    info = {'xm': xm, 'roof_base': ry, 'apex': ry + rise, 'pole_top': ptop, 'rise': rise,
            'flag': (xm + hw, ptop - flag_h, xm + hw + flag_w, ptop)}
    if solid:
        c = Contour((x0, base)); c.L((x0, ry))
        c.L((xm - hw, ya)).L((xm - hw, ptop)).L((xm + hw + flag_w, ptop - flag_h / 2))
        c.L((xm + hw, ptop - flag_h)).L((xm + hw, ya)).L((x1, ry)).L((x1, base)).L((x0, base))
        return [c], [], info
    band_c = rect(x0, base, x1, base + band)
    r = Contour((x0, ry))
    r.L((xm - hw, ya)).L((xm - hw, ptop)).L((xm + hw, ptop)).L((xm + hw, ya)).L((x1, ry)).L((x0, ry))
    f = Contour((xm + hw, ptop)); f.L((xm + hw + flag_w, ptop - flag_h / 2)).L((xm + hw, ptop - flag_h)).L((xm + hw, ptop))
    # the same roof with the pennant welded on (one outline): for one-colour artwork, plotter and embroidery
    u = Contour((x0, ry))
    u.L((xm - hw, ya)).L((xm - hw, ptop)).L((xm + hw, ptop)).L((xm + hw + flag_w, ptop - flag_h / 2)).L((xm + hw, ptop - flag_h))
    u.L((xm + hw, ya)).L((x1, ry)).L((x0, ry))
    info['roof_with_flag'] = u
    return [band_c, r], [f], info

# ---------------------------------------------------------------- svg output
def fmt(v):
    s = ('%.1f' % v).rstrip('0').rstrip('.')
    return '0' if s in ('-0', '') else s

def to_d(contours, ox=0.0, oy=0.0, sc=1.0, top=0.0):
    """Path data with y flipped: y_svg = (top - y)*sc + oy. Uses relative commands, H/V when possible."""
    out = []
    for c in contours:
        def P(p): return ((p[0] * sc) + ox, (top - p[1]) * sc + oy)
        cur = P(c.start)
        out.append('M' + fmt(cur[0]) + ' ' + fmt(cur[1]))
        first = cur
        for i, s in enumerate(c.segs):
            if s[0] == 'L':
                p = P(s[1])
                if i == len(c.segs) - 1 and abs(p[0] - first[0]) < 0.05 and abs(p[1] - first[1]) < 0.05:
                    break  # closing line implied by Z
                dx, dy = p[0] - cur[0], p[1] - cur[1]
                if abs(dy) < 0.05: out.append('h' + fmt(dx))
                elif abs(dx) < 0.05: out.append('v' + fmt(dy))
                else: out.append('l' + fmt(dx) + ' ' + fmt(dy))
                cur = p
            else:
                c1, c2, p = P(s[1]), P(s[2]), P(s[3])
                out.append('c' + ' '.join(fmt(v) for v in (c1[0]-cur[0], c1[1]-cur[1], c2[0]-cur[0], c2[1]-cur[1], p[0]-cur[0], p[1]-cur[1])))
                cur = p
        out.append('z')
    d = ''.join(out)
    d = d.replace(' -', '-')
    return d

def word_contours(word='klapklaar', track=0):
    items, w = layout(word, track)  # track: extra units between every pair
    cs = []
    pos = {}
    for i, (g, x) in enumerate(items):
        for c in g.contours:
            cs.append(c.transformed(lambda p, x=x: (p[0] + x, p[1])))
        pos[i] = (g, x)
    return cs, w, pos


# ---------------------------------------------------------------- v3 compositions
def wordmark(variant='primary'):
    """letters, canopy body, pennant, info. primary: tracking 0; klein: tracking +40, solid canopy."""
    track = 0 if variant == 'primary' else 40
    cs, w, pos = word_contours('klapklaar', track)
    g6, x6 = pos[6]; g7, x7 = pos[7]
    x0 = x6 + g6.bbox()[0]; x1 = x7 + g7.bbox()[2]           # band = exactly the 'aa'
    body, flag, info = canopy(x0, x1, A - S, **CANOPY[variant])
    info.update({'band': (x0, A - S, x1, A), 'pos': {i: x for i, (g, x) in pos.items()}, 'track': track})
    return cs, body, flag, info

def mark(variant='primary', pad=170):
    """'k onder de tent': the k of Klapklaar under the same canopy (band = k width + pad each side)."""
    k = glyph_k()
    kb = k.bbox()
    x0, x1 = kb[0] - pad, kb[2] + pad
    gap = G if variant == 'primary' else S          # klein: wider opening between k and band
    body, flag, info = canopy(x0, x1, A + gap, **CANOPY[variant])
    info.update({'band': (x0, A + gap, x1, A + gap + S), 'k_gap': gap})
    return list(k.contours), body, flag, info
