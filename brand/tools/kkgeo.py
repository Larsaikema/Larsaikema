"""Klapklaar v7 letter geometry: constructed capitals; the second A of KLAAR is a party tent.

Units: y up, baseline 0, cap height CAP = 700. Outer contours run clockwise (y-up), counters counter-clockwise;
nothing overlaps, so every file prints in one pass without trapping.

v7 changes (critic round 6):
  * the tent-A is redrawn as an easy-up / party tent, not a portico: a steep canopy (57 deg) with a pointed peak
    that overshoots the cap line, a scalloped valance whose band lines up with the A crossbar (same top, scallop
    tips on the crossbar bottom), thin poles (66 = 46 % of a stem) set in from the valance corners, no eave;
  * letter spacing is optical (equal white area per pair, tools/logo.py), not equal side bearings;
  * the lock-up lettering (ZAKELIJK, PARTYTENTEN · STATAFELS) is drawn from the same construction, so there is no
    second typeface next to the logo.

v7.1 (brand polish, three blind judges): glyph_tent_zwaar, the heavy tent-A for everything below 160 px, every
one-colour file, embroidery/flock/foil, the beeldmerk and the square icon: a straight roof at 50 deg (an easy-up, not a
circus top), an open seam that separates roof and valance in one colour (no spade, no drop), a heavier band with two
scallops and poles of 0.76 x the stem. Same width and pole inset as the slender tent, so it fits the same slot.
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

def _round(prev, v, nxt, r, lim1=0.5, lim2=0.5):
    """corner at v between directions to prev and nxt; returns ('R', t1, c1, c2, t2) or ('P', v)."""
    x, y = v
    v1 = (prev[0] - x, prev[1] - y); v2 = (nxt[0] - x, nxt[1] - y)
    l1 = math.hypot(*v1); l2 = math.hypot(*v2)
    if r <= 0 or l1 < 1e-9 or l2 < 1e-9: return ('P', v)
    u1 = (v1[0] / l1, v1[1] / l1); u2 = (v2[0] / l2, v2[1] / l2)
    theta = math.acos(max(-1, min(1, u1[0] * u2[0] + u1[1] * u2[1])))
    phi = math.pi - theta
    if phi < 1e-3: return ('P', v)
    d = r / math.tan(theta / 2)
    d = min(d, l1 * lim1, l2 * lim2)
    t1 = (x + u1[0] * d, y + u1[1] * d); t2 = (x + u2[0] * d, y + u2[1] * d)
    h = min(4 / 3 * math.tan(phi / 4) / math.tan(phi / 2) * SQ, 0.95)
    return ('R', t1, (t1[0] + (x - t1[0]) * h, t1[1] + (y - t1[1]) * h), (t2[0] + (x - t2[0]) * h, t2[1] + (y - t2[1]) * h), t2)

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
        px, py, pr = verts[i - 1]; nx, ny, nr = verts[(i + 1) % n]
        pts.append(_round((px, py), (x, y), (nx, ny), r, 0.5 if pr > 0 else 0.98, 0.5 if nr > 0 else 0.98))
    first = pts[0]
    p = Path(first[1] if first[0] == 'P' else first[4])
    for k in pts[1:] + pts[:1]:
        if k[0] == 'P': p.L(k[1])
        else: p.L(k[1]); p.C(k[2], k[3], k[4])
    return p

def rpath(seq):
    """Like rpoly but with curves: seq of ('V', x, y, r) and ('C', c1, c2) (a cubic from the vertex before to the
    vertex after). A rounded vertex next to a curve uses the curve's control point as its tangent direction."""
    n = len(seq)
    V = [i for i, s in enumerate(seq) if s[0] == 'V']
    out = {}
    for i in V:
        _, x, y, r = seq[i]
        pi, ni = seq[(i - 1) % n], seq[(i + 1) % n]
        prev = pi[2] if pi[0] == 'C' else (pi[1], pi[2])
        nxt = ni[1] if ni[0] == 'C' else (ni[1], ni[2])
        lim_p = 0.45 if pi[0] == 'C' else 0.5
        lim_n = 0.45 if ni[0] == 'C' else 0.5
        out[i] = _round(prev, (x, y), nxt, r, lim_p, lim_n)
    def entry(i): k = out[i]; return k[1] if k[0] == 'P' else k[1]
    def exitp(i): k = out[i]; return k[1] if k[0] == 'P' else k[4]
    p = Path(exitp(V[0]))
    i = V[0]
    for _ in range(n):
        j = (i + 1) % n
        if seq[j][0] == 'C':
            k = (j + 1) % n
            p.C(seq[j][1], seq[j][2], entry(k))
            kk = out[k]
            if kk[0] == 'R': p.C(kk[2], kk[3], kk[4])
            i = k
        else:
            p.L(entry(j))
            kk = out[j]
            if kk[0] == 'R': p.C(kk[2], kk[3], kk[4])
            i = j
        if i == V[0]: break
    return p

def _area(v):
    return sum(v[i][0] * v[(i + 1) % len(v)][1] - v[(i + 1) % len(v)][0] * v[i][1] for i in range(len(v))) / 2
def outer(v): return rpoly(v if _area(v) < 0 else list(reversed(v)))
def hole(v): return rpoly(v if _area(v) > 0 else list(reversed(v)))
def orient(p, cw=True):
    a = p.area()
    return p if (a < 0) == cw else p.reversed()

# ------------------------------------------------------------------ parameters (units, cap height 700)
P = dict(
    STEM=142,       # vertical stems
    BAR=118,        # horizontal bars: L-foot, P/R bowl top and bottom, E/F/T/Z bars; A crossbar = BAR x 0.92
    ARM=130, LEG=136,   # K arm / K leg, measured perpendicular to the stroke
    DIAG=146,       # N, Z, Y diagonals (perpendicular)
    RC=18,          # outside corner radius ("tube")
    W_K=552, W_L=452, W_P=524, W_R=556, YB=280, RO=168,
    W_A=610, A_APEX=118, A_BAR=250,           # the regular A (flat apex); crossbar 141.4-250
    LA_TUCK=100,    # how far the A's baseline corner sits left of the L-foot's end (L+A joined)
    # tent-A (party tent seen from the front)
    T_W=604,        # valance width
    T_OVER=26,      # peak above the cap line (optical overshoot of a pointed apex; the tip rounding takes ~8 back)
    T_TIP=12,       # tip rounding
    T_SAG=11,        # the canopy edges bow in a little (tensioned cloth), units at mid-edge
    T_SEAM=22,      # open seam between canopy and valance
    T_SCAL=3, T_SCAL_D=40,    # scallops between the poles, depth
    T_LEG=70,       # pole width (49 % of a stem)
    T_INSET=18,     # poles sit inside the valance corners: the cloth hangs past the frame
    # heavy tent-A (v7.1 brand polish): everything below 160 px, every one-colour file (embroidery, flock, foil, print,
    # stamp), the beeldmerk and the square icon. Same width (T_W) and pole inset (T_INSET) as the slender tent, so it
    # drops into the same slot with the same letter gaps. Lower straight roof, open seam, heavier band, poles and scallops.
    TZ_PITCH=50,    # roof, degrees from horizontal (slender tent: 56.4); straight edges, no inward bow
    TZ_OVER=16, TZ_TIP=16,    # peak above the cap line, tip rounding
    TZ_SEAM=72,     # open seam between roof and valance: in one colour it separates roof and "crossbar"; smallest opening
    TZ_BAND=82,     # valance band between the poles (slender: 68.6)
    TZ_SCAL=2, TZ_SCAL_D=50,  # two scallops, depth (slender: three, 40)
    TZ_LEG=108,     # pole width, 0.76 x stem (slender: 70)
    TRACK=0,
    # lock-up letters
    W_E=468, W_F=452, W_T=548, W_N=606, W_S=520, W_J=470, W_Z=532, W_Y=600,
)

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

def tent_dims(p=P):
    """the tent-A's key heights, all tied to the regular A: valance top = crossbar top, scallop tips = crossbar bottom."""
    W = p['T_W']
    val_top = p['A_BAR']
    tips = p['A_BAR'] - p['BAR'] * 0.92
    cusp = tips + p['T_SCAL_D']
    roof_b = val_top + p['T_SEAM']
    apex_y = CAP + p['T_OVER']
    pitch = math.degrees(math.atan2(apex_y - roof_b, W / 2))
    return dict(W=W, val_top=val_top, tips=tips, cusp=cusp, roof_b=roof_b, apex_y=apex_y, pitch=pitch)

def glyph_tent(p=P, seam=False, leg=None, scallops=None, over=None, scal_d=None):
    """the second A of KLAAR: canopy (steep, slightly bowed in, pointed peak above the cap line), open seam,
    valance band (= the A crossbar) with scallops between the poles, two thin poles set in from the corners."""
    q = dict(p)
    if over is not None: q['T_OVER'] = over
    if scal_d is not None: q['T_SCAL_D'] = scal_d
    d = tent_dims(q)
    W, LW, IN = d['W'], leg or q['T_LEG'], q['T_INSET']
    n = q['T_SCAL'] if scallops is None else scallops
    rc = q['RC'] * 0.5
    paths = []
    # canopy
    ab = d['roof_b'] if seam else d['val_top']
    apex = (W / 2, d['apex_y'])
    def bowed(a, b, sag):
        m = lerp(a, b, 0.5)
        dx, dy = b[0] - a[0], b[1] - a[1]; L = math.hypot(dx, dy)
        nx, ny = dy / L, -dx / L                     # right-hand normal (inward for a clockwise roof)
        c = (m[0] + nx * sag * 4 / 3, m[1] + ny * sag * 4 / 3)
        return lerp(a, c, 2 / 3), lerp(b, c, 2 / 3)
    seqs = []
    if seam:
        c1, c2 = bowed((0, ab), apex, q['T_SAG']); c3, c4 = bowed(apex, (W, ab), q['T_SAG'])
        roof = rpath([('V', 0, ab, 4), ('C', c1, c2), ('V', apex[0], apex[1], q['T_TIP']), ('C', c3, c4), ('V', W, ab, 4)])
        paths.append(orient(roof, True))
    # valance + poles, one contour (clockwise in y-up: left edge up, top edge right, right edge down, bottom left)
    vt = d['val_top']; cu = d['cusp']; tp = d['tips']
    xl0, xl1 = IN, IN + LW                    # left pole
    xr1, xr0 = W - IN, W - IN - LW            # right pole
    seq = [('V', 0, cu, 4), ('V', 0, vt, 4 if seam else 0)]
    if not seam:
        c1, c2 = bowed((0, vt), apex, q['T_SAG']); c3, c4 = bowed(apex, (W, vt), q['T_SAG'])
        seq += [('C', c1, c2), ('V', apex[0], apex[1], q['T_TIP']), ('C', c3, c4)]
    seq += [('V', W, vt, 4 if seam else 0), ('V', W, cu, 4), ('V', xr1, cu, 0), ('V', xr1, 0, rc), ('V', xr0, 0, rc), ('V', xr0, cu, 0)]
    # scallops from right to left between the poles
    span = (xr0 - xl1) / n
    for k in range(n):
        x1 = xr0 - k * span; x0 = x1 - span; xm = (x0 + x1) / 2
        C = (xm, cu - 2 * q['T_SCAL_D'])
        seq.append(('C', lerp((x1, cu), C, 2 / 3), lerp((x0, cu), C, 2 / 3)))
        if k < n - 1: seq.append(('V', x0, cu, 0))
    seq += [('V', xl1, cu, 0), ('V', xl1, 0, rc), ('V', xl0, 0, rc), ('V', xl0, cu, 0)]
    body = rpath(seq)
    paths.append(orient(body, True))
    return Glyph(paths, W, 'T', kind='tent', info=dict(d, leg=LW, inset=IN, seam=q['T_SEAM'] if seam else 0,
                                                     scallops=n, scallop_depth=q['T_SCAL_D'], band=(cu, vt), band_h=vt - cu))

def tent_zwaar_dims(p=P):
    """the heavy tent-A's key heights: straight roof at TZ_PITCH from the roof corners to the peak, open seam, band."""
    W = p['T_W']
    apex_y = CAP + p['TZ_OVER']
    roof_b = apex_y - W / 2 * math.tan(math.radians(p['TZ_PITCH']))
    val_top = roof_b - p['TZ_SEAM']
    cusp = val_top - p['TZ_BAND']
    tips = cusp - p['TZ_SCAL_D']
    return dict(W=W, apex_y=apex_y, roof_b=roof_b, val_top=val_top, cusp=cusp, tips=tips, pitch=p['TZ_PITCH'])

def glyph_tent_zwaar(p=P):
    """heavy tent-A for small sizes, one colour and the square icon: a straight, lower roof (an easy-up, not a circus
    top), an open seam, a heavy valance band (reads as the A crossbar) with two scallops, heavy poles at the corners."""
    d = tent_zwaar_dims(p)
    W, LW, IN, n, D = d['W'], p['TZ_LEG'], p['T_INSET'], p['TZ_SCAL'], p['TZ_SCAL_D']
    rb, rl = 8, p['RC'] * 0.5
    apex = (W / 2, d['apex_y'])
    roof = rpath([('V', 0, d['roof_b'], rb), ('V', apex[0], apex[1], p['TZ_TIP']), ('V', W, d['roof_b'], rb)])
    vt, cu = d['val_top'], d['cusp']
    xl0, xl1 = IN, IN + LW
    xr1, xr0 = W - IN, W - IN - LW
    seq = [('V', 0, cu, rb), ('V', 0, vt, rb), ('V', W, vt, rb), ('V', W, cu, rb),
           ('V', xr1, cu, 0), ('V', xr1, 0, rl), ('V', xr0, 0, rl), ('V', xr0, cu, 0)]
    span = (xr0 - xl1) / n
    for k in range(n):
        x1 = xr0 - k * span; x0 = x1 - span; xm = (x0 + x1) / 2
        C = (xm, cu - 2 * D)
        seq.append(('C', lerp((x1, cu), C, 2 / 3), lerp((x0, cu), C, 2 / 3)))
        if k < n - 1: seq.append(('V', x0, cu, 0))
    seq += [('V', xl1, cu, 0), ('V', xl1, 0, rl), ('V', xl0, 0, rl), ('V', xl0, cu, 0)]
    paths = [orient(roof, True), orient(rpath(seq), True)]
    return Glyph(paths, W, 'T', kind='tent', info=dict(d, leg=LW, inset=IN, seam=p['TZ_SEAM'], scallops=n,
                                                     scallop_depth=D, band=(cu, vt), band_h=vt - cu))

# ------------------------------------------------------------------ lock-up letters (same construction)
def glyph_L(p=P):
    S, BAR, W, r = p['STEM'], p['BAR'], p['W_L'], p['RC']
    return Glyph([outer([(0, 0, r), (0, CAP, r), (S, CAP, r), (S, BAR, 0), (W, BAR, r), (W, 0, r)])], W, 'L')

def glyph_I(p=P):
    S, r = p['STEM'], p['RC']
    return Glyph([outer([(0, 0, r), (0, CAP, r), (S, CAP, r), (S, 0, r)])], S, 'I')

def glyph_E(p=P, F=False):
    S, B, r = p['STEM'], p['BAR'], p['RC']
    W = p['W_F'] if F else p['W_E']
    Bm = B * 0.96; ym = CAP * 0.5 + 6
    Wm = W - 34
    v = [(0, 0 if not F else 0, r), (0, CAP, r), (W, CAP, r), (W, CAP - B, r), (S, CAP - B, 0), (S, ym + Bm / 2, 0), (Wm, ym + Bm / 2, r),
         (Wm, ym - Bm / 2, r), (S, ym - Bm / 2, 0)]
    v += [(S, 0, r)] if F else [(S, B, 0), (W, B, r), (W, 0, r)]
    return Glyph([outer(v)], W, 'F' if F else 'E')

def glyph_T(p=P):
    S, B, W, r = p['STEM'], p['BAR'], p['W_T'], p['RC']
    x0 = (W - S) / 2
    return Glyph([outer([(x0, 0, r), (x0, CAP - B, 0), (0, CAP - B, r), (0, CAP, r), (W, CAP, r), (W, CAP - B, r), (x0 + S, CAP - B, 0), (x0 + S, 0, r)])], W, 'T')

def glyph_N(p=P):
    S, W, D, r = p['STEM'], p['W_N'], p['DIAG'], p['RC']
    # diagonal band from the top-left to the bottom-right; point-symmetric; solve the cap-line width for thickness D
    y1 = 150
    def thick(xT):
        a, b = (xT, CAP), (W - S, y1)
        c = (S, CAP - y1)
        dx, dy = b[0] - a[0], b[1] - a[1]; L = math.hypot(dx, dy)
        return abs((c[0] - a[0]) * dy - (c[1] - a[1]) * dx) / L
    lo, hi = S, W - S
    for _ in range(60):
        m = (lo + hi) / 2
        if thick(m) < D: lo = m
        else: hi = m
    xT = (lo + hi) / 2
    o = outer([(0, 0, r), (0, CAP, r), (xT, CAP, 0), (W - S, y1, 0), (W - S, CAP, r), (W, CAP, r), (W, 0, r), (W - xT, 0, 0),
               (S, CAP - y1, 0), (S, 0, r)])
    return Glyph([o], W, 'N')

def glyph_Z(p=P):
    B, W, D, r = p['BAR'], p['W_Z'], p['DIAG'], p['RC']
    # top bar, diagonal from the top bar's right end down to the bottom bar's left end
    a = (W, CAP - B); b = (0, B)
    dx, dy = b[0] - a[0], b[1] - a[1]; L = math.hypot(dx, dy)
    w = D * L / abs(dy)                    # horizontal width of the diagonal band
    o = outer([(0, CAP, r), (W, CAP, r), (W, CAP - B, 0), (w, B, 0), (W, B, r), (W, 0, r), (0, 0, r), (0, B, 0),
               (W - w, CAP - B, 0), (0, CAP - B, r)])
    return Glyph([o], W, 'Z')

def glyph_Y(p=P):
    S, W, D, r = p['STEM'], p['W_Y'], p['DIAG'], p['RC']
    yj = 300                               # where the arms meet the stem
    x0 = (W - S) / 2
    th = math.atan2(CAP - yj, x0)          # arm angle (outer edges meet the stem edges at yj)
    w = D / math.sin(th)
    # inner crotch point: intersection of the inner edges of both arms
    li = ((w, CAP), (x0 + w, yj)); ri = ((W - w, CAP), (x0 + S - w, yj))
    cx = isect(li[0], li[1], ri[0], ri[1])
    o = outer([(x0, 0, r), (x0, yj, 0), (0, CAP, r), (w, CAP, r), (cx[0], cx[1], 0), (W - w, CAP, r), (W, CAP, r), (x0 + S, yj, 0), (x0 + S, 0, r)])
    return Glyph([o], W, 'Y')

def glyph_S(p=P):
    S, B, RO, r = p['STEM'], p['BAR'], p['RO'], p['RC']
    W = p['W_S']
    Bm = B * 1.0
    ym = CAP * 0.5 + 8
    Wt = W - 22                            # top terminal a little shorter than the bottom bowl
    ri = max(RO - S * 0.9, 30)
    o = outer([(Wt, CAP - B, 0), (Wt, CAP, r), (0, CAP, RO), (0, ym - Bm / 2, RO * 0.92), (W - S, ym - Bm / 2, 0),
               (W - S, B, ri * 0.0), (0, B, 0), (0, 0, r), (W, 0, RO), (W, ym + Bm / 2, RO * 0.92), (S, ym + Bm / 2, 0), (S, CAP - B, 0)])
    # inner corners of the bowls: round them like the P counter
    o = outer([(Wt, CAP - B, 0), (Wt, CAP, r), (0, CAP, RO), (0, ym - Bm / 2, RO * 0.92), (W - S, ym - Bm / 2, ri), (W - S, B, ri),
               (0, B, 0), (0, 0, r), (W, 0, RO), (W, ym + Bm / 2, RO * 0.92), (S, ym + Bm / 2, ri), (S, CAP - B, ri)])
    return Glyph([o], W, 'S')

def glyph_J(p=P):
    S, B, RO, r = p['STEM'], p['BAR'], p['RO'], p['RC']
    W = p['W_J']
    yt = 236                               # the hook's terminal height
    ri = max(RO - S * 0.9, 30)
    o = outer([(W - S, CAP, r), (W, CAP, r), (W, 0, RO), (0, 0, RO), (0, yt, r), (S * 0.96, yt, r), (S * 0.96, B, ri), (W - S, B, ri)])
    return Glyph([o], W, 'J')

def glyph_dot(p=P):
    s = p['BAR'] * 1.05; y = CAP / 2 - s / 2
    return Glyph([outer([(0, y, 10), (0, y + s, 10), (s, y + s, 10), (s, y, 10)])], s, '·')

def glyph_plus(p=P):
    t = p['BAR'] * 0.9; L = 420; c = L / 2; y0 = CAP / 2 - c
    o = outer([(c - t / 2, y0, 6), (c - t / 2, y0 + c - t / 2, 0), (0, y0 + c - t / 2, 6), (0, y0 + c + t / 2, 6), (c - t / 2, y0 + c + t / 2, 0),
               (c - t / 2, y0 + L, 6), (c + t / 2, y0 + L, 6), (c + t / 2, y0 + c + t / 2, 0), (L, y0 + c + t / 2, 6), (L, y0 + c - t / 2, 6),
               (c + t / 2, y0 + c - t / 2, 0), (c + t / 2, y0, 6)])
    return Glyph([o], L, '+')

GLYPHS = {'K': glyph_K, 'LA': glyph_LA, 'P': glyph_P, 'R': glyph_R, 'A': glyph_A, 'L': glyph_L, 'I': glyph_I,
          'E': glyph_E, 'F': lambda p=P: glyph_E(p, True), 'T': glyph_T, 'N': glyph_N, 'Z': glyph_Z, 'Y': glyph_Y,
          'S': glyph_S, 'J': glyph_J, '·': glyph_dot, '+': glyph_plus}

# ------------------------------------------------------------------ spacing
def profile(paths, n=141, y0=0, y1=CAP):
    """leftmost / rightmost ink x for n scanlines between y0 and y1 (None where the scanline has no ink)."""
    polys = [c.flatten(16) for c in paths]
    out = []
    for i in range(n):
        y = y0 + (y1 - y0) * (i + 0.5) / n
        xs = []
        for poly in polys:
            for k in range(len(poly)):
                (xa, ya), (xb, yb) = poly[k], poly[(k + 1) % len(poly)]
                if (ya <= y < yb) or (yb <= y < ya):
                    xs.append(xa + (y - ya) * (xb - xa) / (yb - ya))
        out.append((min(xs), max(xs)) if xs else None)
    return out

def white_area(pl, pr, offset, depth=0.30 * CAP):
    """mean white per scanline between two glyphs (right glyph shifted by offset), white inside each glyph's
    side capped at depth: the number brand.md quotes as 'optische ruimte'."""
    maxr = max(q[1] for q in pl if q); minl = min(q[0] for q in pr if q)
    v = []
    for a, b in zip(pl, pr):
        wa = min(maxr - (a[1] if a else -1e9), depth); wb = min((b[0] if b else 1e9) - minl, depth)
        v.append(wa + wb + (minl + offset - maxr))
    return sum(v) / len(v)

def hgap(pl, pr, offset):
    g = [b[0] + offset - a[1] for a, b in zip(pl, pr) if a and b]
    return min(g)

# Spacing is set by eye per pair, as the narrowest horizontal white between the two shapes (units). Shapes that
# open up (K's wedge, A's diagonal, the tent's canopy and inset poles, the open space under the P bowl) sit closer
# than two straight stems would; tools/logo.py writes both this gap and the white area per pair to logo-meta.json.
KERN = {('K', 'LA'): 64, ('LA', 'P'): 60, ('P', 'K'): 66, ('LA', 'TENT'): 58, ('TENT', 'R'): 52}
KERN_DEFAULT = 70

def build_word(tokens, p=P, kern=None, extra=0, tent_kw=None):
    """place glyphs; kern = {(a, b): narrowest gap}. Returns (letters, tent, width, items)."""
    kern = dict(KERN, **(kern or {}))
    gl = []
    def tent(kw):
        kw = dict(kw or {})
        return glyph_tent_zwaar(p) if kw.pop('zwaar', False) else glyph_tent(p, **kw)
    for tok in tokens:
        g = tent(tent_kw) if tok == 'TENT' else GLYPHS[tok](p)
        gl.append((tok, g, profile(g.paths)))
    x = 0; letters, tent, items = [], [], []
    for i, (tok, g, pr) in enumerate(gl):
        if i > 0:
            ptok, px, pg, pps, ppr = items[-1]
            want = kern.get((ptok, tok), KERN_DEFAULT) + extra
            x = px + (want - hgap(ppr, pr, 0))
        ps = move(g.paths, x)
        (tent if tok == 'TENT' else letters).extend(ps)
        items.append((tok, x, g, ps, pr))
    xs = [q[0] for c in letters + tent for q in c.flatten(8)]
    return letters, tent, max(xs) - min(xs), items

WORD = ['K', 'LA', 'P', 'K', 'LA', 'TENT', 'R']

def wordmark(p=P, extra=0, tent_kw=None):
    return build_word(WORD, p, extra=extra, tent_kw=dict({'seam': False}, **(tent_kw or {})))
