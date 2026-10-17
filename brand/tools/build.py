"""Build every Klapklaar logo / mark / favicon SVG (v5) from the constructed geometry in kk.py and
measure what fabric and print will do with it (measure.py).

    VENDOR=<folder with gfonts/ofl/figtree/Figtree[wght].ttf> python3 build.py <brand-dir>

Writes clean SVGs (viewBox, <title>, no <text>, no external refs, compact relative paths, no overlapping
subpaths) plus tools/logo-meta.json (construction guides, measured features, minimum sizes per method)
and tools/print-*.json (path data for the 3D renderer). Descriptor lettering in the lock-ups is Figtree
ExtraBold (SIL OFL 1.1) converted to outlines, in capitals.
"""
import sys, os, math, json
import kk, measure
from vfont import VFont

OUT = sys.argv[1] if len(sys.argv) > 1 else 'out'
os.makedirs(OUT, exist_ok=True)
VENDOR = os.environ.get('VENDOR')
if not VENDOR: sys.exit('set VENDOR to the vendored Google Fonts folder (needs gfonts/ofl/figtree/Figtree[wght].ttf)')
FIG = VFont(VENDOR + '/gfonts/ofl/figtree/Figtree[wght].ttf')

C = dict(klaproos='#C83812', inkt='#1D2420', zand='#FBF6EC', zon='#FFC23A', polder='#154F3E', wit='#FFFFFF')
SC = 0.1          # kk units -> svg units for the line logos (x-height 500 -> 50)
PREC = 2

def fmt(v, prec=PREC):
    s = ('%.*f' % (prec, v)).rstrip('0').rstrip('.')
    return '0' if s in ('-0', '') else s

def to_d(contours, ox, oy, top, sc=SC, prec=PREC):
    """kk contours (y-up) -> compact relative path data (y flipped)."""
    out = []
    for c in contours:
        def P(p): return (p[0] * sc + ox, (top - p[1]) * sc + oy)
        cur = P(c.start); first = cur
        out.append('M' + fmt(cur[0], prec) + ' ' + fmt(cur[1], prec))
        segs = list(c.segs)
        if segs and segs[-1][0] == 'L':
            e = P(segs[-1][1])
            if abs(e[0] - first[0]) < 1e-6 and abs(e[1] - first[1]) < 1e-6: segs = segs[:-1]
        for s in segs:
            if s[0] == 'L':
                p = P(s[1]); dx, dy = p[0] - cur[0], p[1] - cur[1]
                if abs(dy) < 1e-6: out.append('h' + fmt(dx, prec))
                elif abs(dx) < 1e-6: out.append('v' + fmt(dy, prec))
                else: out.append('l' + fmt(dx, prec) + ' ' + fmt(dy, prec))
                cur = p
            else:
                c1, c2, p = P(s[1]), P(s[2]), P(s[3])
                vals = (c1[0]-cur[0], c1[1]-cur[1], c2[0]-cur[0], c2[1]-cur[1], p[0]-cur[0], p[1]-cur[1])
                out.append('c' + ' '.join(fmt(v, prec) for v in vals))
                cur = p
        out.append('z')
    return ''.join(out).replace(' -', '-')

def text_contours(txt, size, x, baseline, tracking=0.0, wght=800):
    """Figtree outlines as kk contours (quadratic -> cubic), y-up, in kk units."""
    FIG.set({'wght': wght})
    sc = size / FIG.upem
    cs = []; cx = x
    for i, ch in enumerate(txt):
        conts, adv = FIG.glyph(FIG.gid(ch))
        for ct in conts:
            if not ct: continue
            pts = list(ct)
            si = next((j for j, p in enumerate(pts) if p[2]), None)
            if si is None:
                a, b = pts[0], pts[1]; pts.insert(0, ((a[0]+b[0])/2, (a[1]+b[1])/2, True)); si = 0
            pts = pts[si:] + pts[:si]
            T = lambda p: (cx + p[0] * sc, baseline + p[1] * sc)
            c = kk.Contour(T(pts[0]))
            cur = T(pts[0]); prev_off = None
            for p in pts[1:] + [pts[0]]:
                if p[2]:
                    q = T(p)
                    if prev_off is not None:
                        o = T(prev_off)
                        c.segs.append(('C', (cur[0] + 2/3*(o[0]-cur[0]), cur[1] + 2/3*(o[1]-cur[1])),
                                       (q[0] + 2/3*(o[0]-q[0]), q[1] + 2/3*(o[1]-q[1])), q)); prev_off = None
                    else: c.segs.append(('L', q))
                    cur = q
                else:
                    if prev_off is not None:
                        mid = ((prev_off[0]+p[0])/2, (prev_off[1]+p[1])/2)
                        o = T(prev_off); q = T(mid)
                        c.segs.append(('C', (cur[0] + 2/3*(o[0]-cur[0]), cur[1] + 2/3*(o[1]-cur[1])),
                                       (q[0] + 2/3*(o[0]-q[0]), q[1] + 2/3*(o[1]-q[1])), q)); cur = q
                    prev_off = p
            cs.append(c)
        cx += adv * sc + (tracking * size if i < len(txt) - 1 else 0)
    return cs, cx - x

def bbox(contours):
    xs, ys = [], []
    for c in contours:
        for p in c.flatten(24): xs.append(p[0]); ys.append(p[1])
    return min(xs), min(ys), max(xs), max(ys)

def svg(w, h, paths, title, extra=''):
    """paths: (fill, d) or (fill, d, attrs). Consecutive paths with the same fill are merged."""
    merged = []
    for item in paths:
        f, d = item[0], item[1]; attrs = item[2] if len(item) > 2 else ''
        if not d: continue
        if merged and merged[-1][0] == f and merged[-1][2] == attrs: merged[-1] = (f, merged[-1][1] + d, attrs)
        else: merged.append((f, d, attrs))
    body = ''.join(f'<path{(" " + a) if a else ""} fill="{f}" d="{d}"/>' for f, d, a in merged)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {fmt(w)} {fmt(h)}" role="img">'
            f'<title>{title}</title>{extra}{body}</svg>\n')

PRIMARY = {'logo.svg', 'logo-inverse.svg', 'mark.svg', 'favicon.svg'}
WRITTEN = []
def write(name, s):
    sub = '' if name in PRIMARY else 'svg'
    os.makedirs(os.path.join(OUT, sub), exist_ok=True)
    with open(os.path.join(OUT, sub, name), 'w') as f: f.write(s)
    WRITTEN.append(os.path.join(sub, name))

# ------------------------------------------------------------------ analytic checks
def seg_dist(p, q, a, b):
    def pt_seg(p, a, b):
        ax, ay = a; bx, by = b; px, py = p
        dx, dy = bx - ax, by - ay
        L = dx * dx + dy * dy
        t = 0 if L == 0 else max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / L))
        return math.hypot(px - (ax + t * dx), py - (ay + t * dy))
    return min(pt_seg(p, a, b), pt_seg(q, a, b), pt_seg(a, p, q), pt_seg(b, p, q))

def poly_dist(A, B):
    best = 1e9
    for i in range(len(A)):
        p, q = A[i], A[(i + 1) % len(A)]
        for j in range(len(B)):
            a, b = B[j], B[(j + 1) % len(B)]
            if min(p[0], q[0]) - best > max(a[0], b[0]) or min(a[0], b[0]) - best > max(p[0], q[0]): continue
            if min(p[1], q[1]) - best > max(a[1], b[1]) or min(a[1], b[1]) - best > max(p[1], q[1]): continue
            best = min(best, seg_dist(p, q, a, b))
    return best

def gaps(pieces, near=200):
    """pieces: [(label, [outer contours])] -> every pair closer than `near`, sorted."""
    flat = [(lab, [c.flatten(12) for c in cs], bbox(cs)) for lab, cs in pieces]
    out = []
    for i in range(len(flat)):
        for j in range(i + 1, len(flat)):
            bi, bj = flat[i][2], flat[j][2]
            if bi[0] - near > bj[2] or bj[0] - near > bi[2] or bi[1] - near > bj[3] or bj[1] - near > bi[3]: continue
            d = min(poly_dist(A, B) for A in flat[i][1] for B in flat[j][1])
            if d < near: out.append((round(d, 1), flat[i][0], flat[j][0]))
    return sorted(out)

def corner_report(contours):
    tips, notches = [], []
    for c in contours:
        for p, a, kind in c.corners():
            if kind == 'tip': tips.append(round(a, 1))
            else: notches.append(round(360 - a, 1))
    return {'min_tip_deg': min(tips) if tips else None, 'min_notch_deg': min(notches) if notches else None}

# reproduction methods: working assumptions for the smallest printable line and opening (mm).
# NOT verified with a supplier - see brand.md 4.5. screen: px at 1x.
METHODS = [
    ('borduren', 'Borduren (satijnsteek)', 1.2, 1.0),
    ('flock', 'Flock-transfer (geplot)', 1.5, 1.5),
    ('flex', 'Flex-/snijfolie (textiel, geplot)', 1.0, 1.0),
    ('folie', 'Snijfolie op bus/bord (Oracal)', 1.5, 1.5),
    ('zeefdruk', 'Zeefdruk op textiel', 0.5, 0.6),
    ('dtf', 'DTF-transfer', 0.5, 0.5),
    ('sublimatie', 'Sublimatie / digitaal op polyester (luifel, rok)', 0.3, 0.3),
    ('papier', 'Offset / digitaal op papier', 0.15, 0.15),
]

def min_sizes(width_units, stroke_units, gap_units):
    out = {}
    for key, label, s_mm, g_mm in METHODS:
        w = max(s_mm * width_units / stroke_units, g_mm * width_units / gap_units)
        out[key] = {'label': label, 'stroke_mm': s_mm, 'gap_mm': g_mm, 'min_width_mm': math.ceil(w)}
    out['scherm'] = {'label': 'Scherm (1x)', 'min_width_px': math.ceil(max(2.0 * width_units / stroke_units, 1.5 * width_units / gap_units))}
    return out

def features(label, letters, tent, file, extra_pieces=()):
    """letters: [(name, [contours])]; tent: kk.tent() result (one-colour = welded outlines)."""
    outer_letters = [(n, [c for c in cs if c.area() < 0]) for n, cs in letters]
    pieces = outer_letters + [(lab, [c]) for lab, c in tent['parts']] + list(extra_pieces)
    allc = [c for _, cs in letters for c in cs] + tent['welded']
    b = bbox(allc); Wu = b[2] - b[0]
    gp = gaps(pieces)
    rast = measure.analyse(allc, 2.0)
    construct_stroke = tent['info']['leg']
    stroke = min(construct_stroke, rast['thinnest_units'] or 1e9)
    gap = min([g[0] for g in gp] + ([rast['narrowest_units']] if rast['narrowest_units'] else []))
    return {
        'file': file, 'width_units': round(Wu, 1), 'height_units': round(b[3] - b[1], 1),
        'gaps_between_shapes': [{'units': g[0], 'between': f'{g[1]} – {g[2]}'} for g in gp[:12]],
        'corners': corner_report(allc),
        'raster_check': rast,
        'construction_thinnest_units': construct_stroke,
        'smallest_stroke_units': round(stroke, 1), 'smallest_gap_units': round(gap, 1),
        'min_sizes': min_sizes(Wu, stroke, gap),
    }

# ------------------------------------------------------------------ wordmarks
def build_wordmarks():
    meta = {}
    for variant in ('primary', 'klein'):
        cs, t = kk.wordmark(variant)
        parts = [c for _, c in t['parts']]
        allc = cs + t['welded']
        x0, y0, x1, y1 = bbox(allc)
        W = (x1 - x0) * SC; Hh = (y1 - y0) * SC
        ox = -x0 * SC; top = y1
        dl = to_d(cs, ox, 0, top); dw = to_d(t['welded'], ox, 0, top)
        suf = '' if variant == 'primary' else '-klein'
        if variant == 'primary':
            write('logo.svg', svg(W, Hh, [(C['inkt'], dl), (C['klaproos'], dw)], 'Klapklaar'))
            write('logo-inverse.svg', svg(W, Hh, [(C['zand'], dl), (C['zon'], dw)], 'Klapklaar'))
            write('logo-on-klaproos.svg', svg(W, Hh, [(C['zand'], dl + dw)], 'Klapklaar'))
            write('logo-inline.svg', svg(W, Hh, [('currentColor', dl), (C['klaproos'], dw, 'class="kk-tent"')], 'Klapklaar'))
            # documentation only (technisch.md): what survives a rename to a reserve name ending in -klaar
            lets = t['info']['letters']
            pre = [c.transformed(lambda p, x=x: (p[0] + x, p[1])) for ch, g, x in lets[:4] for c in g.contours]
            post = [c.transformed(lambda p, x=x: (p[0] + x, p[1])) for ch, g, x in lets[4:] for c in g.contours]
            os.makedirs(os.path.join(OUT, 'tools'), exist_ok=True)
            open(os.path.join(OUT, 'tools', '_naamwissel.svg'), 'w').write(svg(W, Hh, [('#E4D6BE', to_d(pre, ox, 0, top)), (C['inkt'], to_d(post, ox, 0, top)), (C['klaproos'], dw)], 'Wat blijft bij een reservenaam op -klaar'))
        else:
            write('logo-klein.svg', svg(W, Hh, [(C['inkt'], dl), (C['klaproos'], dw)], 'Klapklaar'))
            write('logo-klein-inverse.svg', svg(W, Hh, [(C['zand'], dl), (C['zon'], dw)], 'Klapklaar'))
            write('logo-klein-inline.svg', svg(W, Hh, [('currentColor', dl), (C['klaproos'], dw, 'class="kk-tent"')], 'Klapklaar'))
        write(f'logo{suf}-mono.svg', svg(W, Hh, [('currentColor', dl + dw)], 'Klapklaar'))
        write(f'print-wordmark{suf}.svg', svg(W, Hh, [('#000000', dl + dw)], f'Klapklaar drukbestand{" klein" if suf else ""} (1 kleur)'))
        letters = [(f'{ch}{i + 1}', [c.transformed(lambda p, x=x: (p[0] + x, p[1])) for c in g.contours]) for i, (ch, g, x) in enumerate(t['info']['letters'])]
        f = features(variant, letters, t, 'logo.svg' if variant == 'primary' else 'svg/logo-klein.svg')
        meta[variant] = f
        if variant == 'primary':
            inf = t['info']
            def Y(v): return round((top - v) * SC, 2)
            def Xx(v): return round(v * SC + ox, 2)
            lets = inf['letters']
            meta['guides'] = {
                'viewBox': [round(W, 2), round(Hh, 2)],
                'baseline_y': Y(0), 'xheight_y': Y(kk.X), 'ascender_y': Y(kk.A), 'descender_y': Y(kk.D),
                'band_bottom_y': Y(inf['base']), 'band_top_y': Y(inf['base'] + kk.S), 'roofbase_y': Y(inf['roof_base']),
                'eavetop_y': Y(inf['eave_top']), 'apex_y': Y(inf['apex']),
                'x0': Xx(inf['x0']), 'x1': Xx(inf['x1']), 'xm': Xx(inf['xm']), 'leg': inf['leg'] * SC,
                'l2_left': Xx(lets[5][2]), 'l2_right': Xx(lets[5][2] + kk.S), 'a1_left': Xx(lets[6][2] + lets[6][1].bbox()[0]),
                'a2_right': Xx(lets[7][2] + lets[7][1].bbox()[2]), 'r_left': Xx(lets[8][2]),
                'k1': [Xx(lets[0][2]), Y(kk.A - kk.S * kk.T), Xx(lets[0][2] + kk.S), Y(kk.A)],
                'stem': kk.S * SC, 'dun': kk.G * SC, 'pitch': kk.PITCH, 'legsp': inf['leg_gaps'],
            }
            meta['primary_parts'] = (cs, t, (x0, y0, x1, y1))
        else:
            meta['klein_parts'] = (cs, t, (x0, y0, x1, y1))
    return meta

# ------------------------------------------------------------------ lock-ups (capitals, Figtree 800 outlined)
def build_luifel(meta, name, fg, tentc, barc, txtc, txt='PARTYTENTEN · STATAFELS'):
    cs, t, bx = meta['primary_parts']
    lx0, _, lx1, _ = bbox(cs + t['welded'])
    bar_top = kk.D - kk.S
    bar_h = 300
    bar = kk.rect(lx0, bar_top - bar_h, lx1, bar_top)
    size = 210
    _, wn = text_contours(txt, size, 0, 0, 0)
    pad = 120
    tr = ((lx1 - lx0) - 2 * pad - wn) / (size * (len(txt) - 1))
    tcs, tw = text_contours(txt, size, lx0 + pad, 0, tr)
    tb = bbox(tcs)
    dy = (bar_top - bar_h / 2) - (tb[1] + tb[3]) / 2
    tcs = [c.transformed(lambda p, dy=dy: (p[0], p[1] + dy)) for c in tcs]
    X0, Y0, X1, Y1 = bbox(cs + t['welded'] + [bar])
    W = (X1 - X0) * SC; Hh = (Y1 - Y0) * SC; ox = -X0 * SC
    paths = [(fg, to_d(cs, ox, 0, Y1)), (tentc, to_d(t['welded'], ox, 0, Y1)), (barc, to_d([bar], ox, 0, Y1)), (txtc, to_d(tcs, ox, 0, Y1))]
    write(name, svg(W, Hh, paths, 'Klapklaar - partytenten en statafels'))
    return {'descender_to_bar_units': kk.S, 'tracking_em': round(tr, 3), 'cap_height_units': round(tb[3] - tb[1], 1), 'width_units': round(X1 - X0, 1)}

def build_zakelijk(meta):
    """Wordmark (Inkt, tent Polder) + a Polder tag 'ZAKELIJK' on the x-height: sober, no red, no wink."""
    cs, t, bx = meta['primary_parts']
    lx1 = bbox(cs)[2]
    size = 300
    tcs, tw = text_contours('ZAKELIJK', size, 0, 0, 0.04)
    tb = bbox(tcs)
    padx = 150
    tag_x0 = lx1 + kk.S
    tag = kk.rect(tag_x0, 0, tag_x0 + tw + 2 * padx, kk.X)
    dx = tag_x0 + padx - tb[0]; dy = kk.X / 2 - (tb[1] + tb[3]) / 2
    tcs = [c.transformed(lambda p, dx=dx, dy=dy: (p[0] + dx, p[1] + dy)) for c in tcs]
    X0, Y0, X1, Y1 = bbox(cs + t['welded'] + [tag])
    W = (X1 - X0) * SC; Hh = (Y1 - Y0) * SC; ox = -X0 * SC
    paths = [(C['inkt'], to_d(cs, ox, 0, Y1)), (C['polder'], to_d(t['welded'] + [tag], ox, 0, Y1)), (C['zand'], to_d(tcs, ox, 0, Y1))]
    write('logo-zakelijk.svg', svg(W, Hh, paths, 'Klapklaar Zakelijk'))
    return {'tag_height_units': kk.X, 'cap_height_units': round(tb[3] - tb[1], 1)}

# ------------------------------------------------------------------ marks (k onder de tent)
def rounded_square_d(size, r, x=0, y=0):
    return (f'M{fmt(x + r)} {fmt(y)}h{fmt(size - 2*r)}a{fmt(r)} {fmt(r)} 0 0 1 {fmt(r)} {fmt(r)}v{fmt(size - 2*r)}'
            f'a{fmt(r)} {fmt(r)} 0 0 1-{fmt(r)} {fmt(r)}h-{fmt(size - 2*r)}a{fmt(r)} {fmt(r)} 0 0 1-{fmt(r)}-{fmt(r)}'
            f'v-{fmt(size - 2*r)}a{fmt(r)} {fmt(r)} 0 0 1 {fmt(r)}-{fmt(r)}z')

def square(groups, size, pad, bg, name, title, radius=0.22, square_bg=False):
    """groups: [(fill, contours)] placed centred in a size x size tile."""
    allc = [c for _, cs in groups for c in cs]
    b = bbox(allc)
    cw, ch = b[2] - b[0], b[3] - b[1]
    sc = size * (1 - 2 * pad) / max(cw, ch)
    ox = (size - cw * sc) / 2 - b[0] * sc
    oy = (size - ch * sc) / 2
    paths = []
    if bg: paths.append((bg, f'M0 0h{size}v{size}h-{size}z' if square_bg else rounded_square_d(size, size * radius)))
    paths += [(f, to_d(cs, ox, oy, b[3], sc)) for f, cs in groups]
    s = svg(size, size, paths, title)
    if name: write(name, s)
    return s

def build_marks():
    meta = {}
    for variant in ('primary', 'klein'):
        k, t = kk.mark(variant)
        suf = '' if variant == 'primary' else '-klein'
        b = bbox(k + t['welded'])
        W = (b[2] - b[0]) * SC; Hh = (b[3] - b[1]) * SC
        d_all = to_d(k + t['welded'], -b[0] * SC, 0, b[3])
        write(f'mark{suf}-mono.svg', svg(W, Hh, [('currentColor', d_all)], 'Klapklaar beeldmerk'))
        write(f'print-mark{suf}.svg', svg(W, Hh, [('#000000', d_all)], f'Klapklaar beeldmerk drukbestand{" klein" if suf else ""} (1 kleur)'))
        if variant == 'primary':
            square([(C['zand'], k + t['welded'])], 512, 0.14, C['klaproos'], 'mark.svg', 'Klapklaar beeldmerk')
            square([(C['zand'], k + t['welded'])], 180, 0.17, C['klaproos'], 'apple-touch-icon.svg', 'Klapklaar', square_bg=True)
            square([(C['zand'], k), (C['zon'], t['welded'])], 512, 0.14, C['polder'], 'mark-polder.svg', 'Klapklaar beeldmerk')
            square([(C['inkt'], k), (C['klaproos'], t['welded'])], 512, 0.14, C['zand'], 'mark-zand.svg', 'Klapklaar beeldmerk')
            meta['parts'] = (k, t, b)
        else:
            square([(C['zand'], k + t['welded'])], 512, 0.14, C['klaproos'], 'mark-klein.svg', 'Klapklaar beeldmerk (klein, 1 stuk)')
        f = features(variant, [('k', k)], t, 'mark.svg' if variant == 'primary' else 'svg/mark-klein.svg')
        f['note'] = 'maat = breedte van het symbool zelf (zonder vlak)'
        meta[variant] = f
    return meta

# ------------------------------------------------------------------ favicons: drawn on the pixel grid
def P(pts): return 'M' + 'L'.join(f'{fmt(x)} {fmt(y)}' for x, y in pts) + 'z'

def k_pixels(x0, base, top, stem_px):
    """the constructed k on a pixel grid: stem exactly stem_px wide on whole pixels; baseline, x-height and
    top on whole pixels; arm and leg keep the construction's slopes."""
    k = kk.glyph_k()
    sy = (base - top) / kk.A; sx = stem_px / kk.S
    def Q(p):
        x = x0 + p[0] * sx; y = base - p[1] * sy
        if abs(p[0]) < 1e-6 or abs(p[0] - kk.S) < 1e-6: x = round(x)
        if abs(p[1]) < 1e-6 or abs(p[1] - kk.A) < 1e-6: y = round(y)
        return (x, y)
    pts = [Q(p) for p in k.contours[0].pts()[:-1]]
    return P(pts), max(x for x, y in pts)

FAV32 = dict(x0=4, x1=28, leg=2, base=28, band=(10, 13), roof_b=9, eave_t=8, k_top=14, k_stem=3)
FAV16 = dict(x0=1, x1=15, leg=2, base=14, band=(6, 8), roof_b=5, eave_t=4.5, apex=1.5)

def roof_px(x0, x1, eave_y, rise=None, n=4, q=0.25):
    """the concave roof on the pixel grid (y down): kk.roof_top sampled n times per slope, snapped to 1/4 px.
    `rise` overrides the 21 deg chord (optical correction for the 16 px drawing)."""
    hw = (x1 - x0) / 2
    k_ = (rise / hw) if rise else kk.T
    T0 = kk.T; kk.T = k_
    try: segs, apex = kk.roof_top(x0, x1, 0)
    finally: kk.T = T0
    pts = []; cur = (x0, 0)
    for sg in segs:
        cub = (cur, sg[1], sg[2], sg[3])
        for i in range(1, n + 1):
            x, y = kk.bez(cub, i / n); pts.append((round(x / q) * q, round((eave_y - y) / q) * q))
        cur = sg[3]
    return pts[:-1], eave_y - apex

def fav32_paths():
    f = FAV32
    x0, x1, lw, by = f['x0'], f['x1'], f['leg'], f['base']
    bt, bb = f['band']
    top, apex = roof_px(x0, x1, f['eave_t'])
    tent = (P([(x0, by), (x0, bt), (x1, bt), (x1, by), (x1 - lw, by), (x1 - lw, bb), (x0 + lw, bb), (x0 + lw, by)])
            + P([(x0, f['roof_b']), (x0, f['eave_t'])] + top + [(x1, f['eave_t']), (x1, f['roof_b'])]))
    kd, kx1 = k_pixels(0, by, f['k_top'], f['k_stem'])
    shift = round((32 - kx1) / 2)
    kd, kx1 = k_pixels(shift, by, f['k_top'], f['k_stem'])
    return tent, kd, apex

def fav16_path():
    """16 px: the tent alone, drawn as an open canopy (v4's one-piece pentagon read as a house): roof with a
    1 px opening above a 2 px band, 2 px legs, 10 px of open space between them. The roof chord is steeper
    than 24 deg (3 px rise) so the sag still shows on the grid: optical correction, not a new angle."""
    f = FAV16
    x0, x1, lw, by = f['x0'], f['x1'], f['leg'], f['base']
    bt, bb = f['band']
    top, _ = roof_px(x0, x1, f['eave_t'], rise=f['eave_t'] - f['apex'], n=4, q=0.25)
    return (P([(x0, by), (x0, bt), (x1, bt), (x1, by), (x1 - lw, by), (x1 - lw, bb), (x0 + lw, bb), (x0 + lw, by)])
            + P([(x0, f['roof_b']), (x0, f['eave_t'])] + top + [(x1, f['eave_t']), (x1, f['roof_b'])]))

def build_favicons():
    K_, Z_, PO = C['klaproos'], C['zand'], C['polder']
    tent32, kd, apex = fav32_paths()
    s32 = svg(32, 32, [(K_, rounded_square_d(32, 7)), (Z_, tent32 + kd)], 'Klapklaar')
    write('favicon.svg', s32)
    dot = f'<circle cx="25" cy="7" r="6" fill="{Z_}"/><circle cx="25" cy="7" r="4.5" fill="{PO}"/>'
    write('favicon-cart.svg', s32.replace('</svg>', dot + '</svg>').replace('<title>Klapklaar</title>', '<title>Klapklaar - artikelen in winkelwagen</title>'))
    s16 = svg(16, 16, [(K_, rounded_square_d(16, 3)), (Z_, fav16_path())], 'Klapklaar')
    write('favicon-16.svg', s16)
    dot16 = f'<circle cx="12.5" cy="3.5" r="3.5" fill="{Z_}"/><circle cx="12.5" cy="3.5" r="2.5" fill="{PO}"/>'
    write('favicon-cart-16.svg', s16.replace('</svg>', dot16 + '</svg>').replace('<title>Klapklaar</title>', '<title>Klapklaar - artikelen in winkelwagen</title>'))
    f = FAV32
    return {'32': {'tent_px': [f['x0'], f['x1']], 'legs_px': f['leg'], 'band_px': f['band'][1] - f['band'][0], 'roof_band_gap_px': f['band'][0] - f['roof_b'],
                   'k_stem_px': f['k_stem'], 'k_height_px': f['base'] - f['k_top'], 'apex_y': round(apex, 2)},
            '16': {'drawing': 'tent zonder k, als open luifel: dak (doorhangend, 3 px hoog), 1 px opening, band 2 px, poten 2 px, 10 px open tussen de poten'},
            'cart_dot': 'rechtsboven: Polder-stip r 4,5 (32) / 2,5 (16) met Zand-ring 1,5 / 1 px'}

# ------------------------------------------------------------------ bunting (vlaggenlijn)
def build_bunting():
    """v5: no Polder in the bunting (red-yellow-green read as a national flag). Light surfaces: one colour,
    Klaproos, two pennant lengths (shape varies, not hue). On Inkt: Klaproos, Zon, Zand. Never on Polder."""
    w, h = 240, 44
    def q(tt): return (w * tt, (1 - tt) ** 2 * 4 + 2 * (1 - tt) * tt * 24 + tt * tt * 4)   # the line: y 4 -> 14 -> 4
    def pennants(cols, lens):
        out = []
        n = len(cols); step = w / n
        for i in range(n):
            ta, tb = (i * step + 7) / w, (i * step + step - 7) / w
            a, bq = q(ta), q(tb); m = q((ta + tb) / 2)
            L = lens[i % len(lens)]
            out.append(f'<path fill="{cols[i]}" d="M{fmt(a[0])} {fmt(a[1])}L{fmt(bq[0])} {fmt(bq[1])}L{fmt(m[0] + 2.5)} {fmt(m[1] + L)}L{fmt(m[0] - 2.5)} {fmt(m[1] + L)}z"/>')
        return out
    line = lambda c: f'<path fill="none" stroke="{c}" stroke-width="1.5" d="M0 4Q{w // 2} 24 {w} 4"/>'
    light = pennants([C['klaproos']] * 6, [26, 18])
    dark = pennants([C['klaproos'], C['zon'], C['zand']] * 2, [24])
    head = lambda t: f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" role="img"><title>{t}</title>'
    write('vlaggenlijn.svg', head('Klapklaar vlaggenlijn') + ''.join(light) + line(C['inkt']) + '</svg>\n')
    write('vlaggenlijn-inkt.svg', head('Klapklaar vlaggenlijn op Inkt') + ''.join(dark) + line(C['zand']) + '</svg>\n')

# ------------------------------------------------------------------ v4 -> v5: do the tent legs group with the letters?
def leg_grouping(cs, t):
    """smallest leg-letter gap vs the straight-straight letter gap (88 + track). >= 1 means the legs stand
    further from the letters than the letters stand from each other."""
    inf = t['info']
    lets = inf['letters']
    leg = inf['leg']; base = inf['base']
    legs = [kk.rect(inf['x0'], 0, inf['x0'] + leg, base), kk.rect(inf['x1'] - leg, 0, inf['x1'], base)]
    pieces = [(f'{ch}{i + 1}', [c.transformed(lambda p, x=x: (p[0] + x, p[1])) for c in g.contours if c.area() < 0]) for i, (ch, g, x) in enumerate(lets)]
    near = []
    for L in legs:
        LP = L.flatten(4)
        best = min((min(poly_dist(LP, c.flatten(12)) for c in cs_), lab) for lab, cs_ in pieces)
        near.append((round(best[0], 1), best[1]))
    ss = 2 * kk.N + inf['track']
    m = min(n[0] for n in near)
    return {'leg_letter_min': m, 'letter_straight_straight': ss, 'ratio': round(m / ss, 2), 'nearest': near}

if __name__ == '__main__':
    wm = build_wordmarks()
    lu = build_luifel(wm, 'logo-luifel.svg', C['inkt'], C['klaproos'], C['klaproos'], C['zand'])
    build_luifel(wm, 'logo-luifel-inverse.svg', C['zand'], C['zon'], C['zon'], C['inkt'])
    zk = build_zakelijk(wm)
    mk = build_marks()
    fv = build_favicons()
    build_bunting()
    os.makedirs(os.path.join(OUT, 'tools'), exist_ok=True)
    for key, parts in (('print-wordmark', wm['primary_parts']), ('print-wordmark-klein', wm['klein_parts'])):
        cs, t, (x0, y0, x1, y1) = parts
        json.dump({'viewBox': [round((x1 - x0) * SC, 2), round((y1 - y0) * SC, 2)], 'd': to_d(cs + t['welded'], -x0 * SC, 0, y1)}, open(os.path.join(OUT, 'tools', key + '.json'), 'w'))
    k, t, b = mk['parts']
    json.dump({'viewBox': [round((b[2] - b[0]) * SC, 2), round((b[3] - b[1]) * SC, 2)], 'd': to_d(k + t['welded'], -b[0] * SC, 0, b[3])}, open(os.path.join(OUT, 'tools', 'print-mark.json'), 'w'))
    grouping = {'v5': leg_grouping(*wm['primary_parts'][:2]), 'v5_klein': leg_grouping(*wm['klein_parts'][:2])}
    # the same test on the archived v4 geometry (kk_v4.py), plus a one-colour v4 file for the side-by-side
    import kk_v4
    cs4, t4 = kk_v4.wordmark('primary')
    t4['info'].setdefault('track', 0)
    lets4 = t4['info']['letters']; inf4 = t4['info']
    legs4 = [kk.rect(inf4['x0'], 0, inf4['x0'] + inf4['leg'], inf4['base']), kk.rect(inf4['x1'] - inf4['leg'], 0, inf4['x1'], inf4['base'])]
    pcs4 = [(f'{ch}{i + 1}', [c.transformed(lambda p, x=x: (p[0] + x, p[1])) for c in g.contours if c.area() < 0]) for i, (ch, g, x) in enumerate(lets4)]
    near4 = [min((min(poly_dist(L.flatten(4), c.flatten(12)) for c in cs_), lab) for lab, cs_ in pcs4) for L in legs4]
    m4 = min(n[0] for n in near4)
    grouping['v4'] = {'leg_letter_min': round(m4, 1), 'letter_straight_straight': 88, 'ratio': round(m4 / 88, 2), 'nearest': [(round(a, 1), b) for a, b in near4]}
    b4 = bbox(cs4 + t4['welded'])
    open(os.path.join(OUT, 'tools', '_v4-print-wordmark.svg'), 'w').write(svg((b4[2] - b4[0]) * SC, (b4[3] - b4[1]) * SC, [('#1D2420', to_d(cs4 + t4['welded'], -b4[0] * SC, 0, b4[3]))], 'Klapklaar v4 (archief, ter vergelijking)'))
    bp = wm['primary_parts'][2]
    k4, t4m = kk_v4.mark('primary')
    grouping['v4_raster'] = {'wordmark': measure.analyse(cs4 + t4['welded'], 2.0), 'mark': measure.analyse(list(k4) + t4m['welded'], 2.0)}
    grouping['v4_corners'] = corner_report(cs4 + t4['welded'])
    grouping['v4_height_units'] = round(b4[3] - b4[1], 1)
    grouping['bbox_aspect'] = {'v4': round((b4[2] - b4[0]) / (b4[3] - b4[1]), 2), 'v5': round((bp[2] - bp[0]) / (bp[3] - bp[1]), 2)}
    for d in (wm, mk):
        for key in ('primary_parts', 'klein_parts', 'parts'): d.pop(key, None)
    kg = kk.glyph_k()
    meta = {'version': 5, 'units': 'kk-eenheden: x-hoogte 500, STOK 130, DUN 65',
            'strokes': {'stok (k, l, a, p, r stam)': kk.S, 'kom boven/onder (a, p)': kk.H, 'arm k (loodrecht)': kg.info['arm_perp'], 'been k (loodrecht)': kg.info['leg_perp'],
                        'arm r (verticaal)': kk.H + kk.OV, 'luifelband': kk.S, 'tentpoot': kk.G},
            'spacing': {'tracy_n': kk.N, 'sidebearings': kk.SB, 'leg_factor': kk.LEG_FACTOR, 'tent_legs_primary': kk.leg_gaps(0), 'tent_legs_klein': kk.leg_gaps(36)},
            'grouping': grouping,
            'wordmark': wm, 'mark': mk, 'luifel': lu, 'zakelijk': zk, 'favicon': fv,
            'methods_note': 'werkaannames per methode (kleinste lijn/opening in mm), niet met een leverancier geverifieerd',
            'written': WRITTEN}
    json.dump(meta, open(os.path.join(OUT, 'tools', 'logo-meta.json'), 'w'), indent=1, ensure_ascii=False)
    for v in ('primary', 'klein'):
        x = wm[v]; print('wordmark', v, x['width_units'], x['height_units'], 'stroke', x['smallest_stroke_units'], 'gap', x['smallest_gap_units'], x['corners'], x['raster_check'], x['gaps_between_shapes'][:4], x['min_sizes']['scherm'], x['min_sizes']['borduren']['min_width_mm'])
        x = mk[v]; print('mark', v, x['width_units'], 'stroke', x['smallest_stroke_units'], 'gap', x['smallest_gap_units'], x['corners'], x['raster_check'], x['gaps_between_shapes'][:3], x['min_sizes']['scherm'])
    print('grouping', json.dumps(grouping))
