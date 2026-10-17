"""Build every Klapklaar logo / mark / favicon SVG (v3) from the constructed geometry in kk.py.

    VENDOR=<folder with gfonts/ofl/figtree/Figtree[wght].ttf> python3 build.py <brand-dir>

Writes clean SVGs (viewBox, <title>, no <text>, no external refs, compact relative paths, no
overlapping subpaths) plus tools/logo-meta.json (construction guides, measured smallest features and
minimum sizes per reproduction method) and tools/print-*.json (path data for the 3D renderer).
Descriptor lettering in the lock-ups is Figtree ExtraBold (SIL OFL 1.1) converted to outlines, in capitals.
"""
import sys, os, math, json
import kk
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
    """Figtree outlines as kk-style contours (quadratic -> cubic), y-up, in kk units."""
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
    merged = []
    for f, d in paths:  # merge consecutive paths with the same fill (contours never overlap)
        if not d: continue
        if merged and merged[-1][0] == f: merged[-1] = (f, merged[-1][1] + d)
        else: merged.append((f, d))
    body = ''.join(f'<path fill="{f}" d="{d}"/>' for f, d in merged)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {fmt(w)} {fmt(h)}" role="img">'
            f'<title>{title}</title>{extra}{body}</svg>\n')

PRIMARY = {'logo.svg', 'logo-inverse.svg', 'mark.svg', 'favicon.svg'}
WRITTEN = []
def write(name, s):
    sub = '' if (name in PRIMARY or name.startswith('_')) else 'svg'
    os.makedirs(os.path.join(OUT, sub), exist_ok=True)
    with open(os.path.join(OUT, sub, name), 'w') as f: f.write(s)
    WRITTEN.append(os.path.join(sub, name))

# ------------------------------------------------------------------ geometry checks
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
            # cheap bbox reject
            if min(p[0], q[0]) - best > max(a[0], b[0]) or min(a[0], b[0]) - best > max(p[0], q[0]): continue
            if min(p[1], q[1]) - best > max(a[1], b[1]) or min(a[1], b[1]) - best > max(p[1], q[1]): continue
            best = min(best, seg_dist(p, q, a, b))
    return best

def min_gap(pieces):
    """pieces: list of (label, [outer contours]) -> smallest distance between two different pieces."""
    flat = [(lab, [c.flatten(12) for c in cs]) for lab, cs in pieces]
    best = (1e9, None)
    for i in range(len(flat)):
        for j in range(i + 1, len(flat)):
            for A in flat[i][1]:
                for B in flat[j][1]:
                    d = poly_dist(A, B)
                    if d < best[0]: best = (d, f'{flat[i][0]} - {flat[j][0]}')
    return best

# smallest stroke widths per construction (units), see kk.py
K_ARM = 178 * math.sin(math.atan((500 - 168) / (468 - 130)))     # perpendicular thickness of the k arm

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
    # screen: opening >= 1.5 px and stroke >= 2 px
    out['scherm'] = {'label': 'Scherm (1x)', 'min_width_px': math.ceil(max(2.0 * width_units / stroke_units, 1.5 * width_units / gap_units))}
    return out

# ------------------------------------------------------------------ wordmarks
def build_wordmarks():
    meta = {}
    for variant in ('primary', 'klein'):
        cs, body, flag, info = kk.wordmark(variant)
        if variant == 'klein':
            # klein: canopy 30 units higher -> opening between band and aa >= 100
            body = [c.transformed(lambda p: (p[0], p[1] + 30)) for c in body]
            info['band'] = (info['band'][0], info['band'][1] + 30, info['band'][2], info['band'][3] + 30)
            info['pole_top'] += 30
        allc = cs + body + flag
        x0, y0, x1, y1 = bbox(allc)
        W = (x1 - x0) * SC; Hh = (y1 - y0) * SC
        ox = -x0 * SC; top = y1
        dl, db, df = to_d(cs, ox, 0, top), to_d(body, ox, 0, top), to_d(flag, ox, 0, top)
        # one outline for roof + pennant wherever they share a colour (no touching contours)
        welded = body if not flag else [body[0], info['roof_with_flag'].transformed(lambda p: (p[0], p[1] + (30 if variant == 'klein' else 0)))]
        dw = to_d(welded, ox, 0, top)
        suf = '' if variant == 'primary' else '-klein'
        if variant == 'primary':
            write('logo.svg', svg(W, Hh, [(C['inkt'], dl), (C['klaproos'], dw)], 'Klapklaar'))
            write('logo-inverse.svg', svg(W, Hh, [(C['zand'], dl), (C['zon'], dw)], 'Klapklaar'))
            write('logo-on-klaproos.svg', svg(W, Hh, [(C['zand'], dl + db), (C['zon'], df)], 'Klapklaar'))
        else:
            write('logo-klein.svg', svg(W, Hh, [(C['inkt'], dl), (C['klaproos'], db + df)], 'Klapklaar (klein)'))
            write('logo-klein-inverse.svg', svg(W, Hh, [(C['zand'], dl), (C['zon'], db + df)], 'Klapklaar (klein)'))
        write(f'logo{suf}-mono.svg', svg(W, Hh, [('currentColor', dl + dw)], 'Klapklaar'))
        write(f'print-wordmark{suf}.svg', svg(W, Hh, [('#000000', dl + dw)], f'Klapklaar drukbestand{" klein" if suf else ""} (1 kleur)'))
        # features
        pieces = [(f'letter{i}', [g_c]) for i, g_c in enumerate([c for c in cs if c.area() < 0])]
        # outer contours of letters are clockwise in y-up -> negative area; counters positive
        outer = [c for c in cs if c.area() < 0]
        pieces = [(f'letter {"klapklaar"[i]}{i}', [c]) for i, c in enumerate(outer)]
        if variant == 'primary':
            pieces += [('luifelband', [body[0]]), ('dak', [body[1]])]
            stroke = min(kk.G, kk.H, K_ARM)            # pole = G is the thinnest stroke
        else:
            pieces += [('luifel (1 stuk)', body)]
            stroke = min(kk.S, kk.H, K_ARM)
        gap, where = min_gap(pieces)
        Wu = x1 - x0
        meta[variant] = {
            'file': f'logo{suf}.svg' if variant == 'primary' else 'svg/logo-klein.svg',
            'viewBox': [round(W, 2), round(Hh, 2)], 'width_units': round(Wu, 1),
            'smallest_stroke_units': round(stroke, 1), 'smallest_gap_units': round(gap, 1), 'smallest_gap_between': where,
            'smallest_stroke_pct': round(stroke / Wu * 100, 2), 'smallest_gap_pct': round(gap / Wu * 100, 2),
            'min_sizes': min_sizes(Wu, stroke, gap),
        }
        if variant == 'primary':
            t = math.tan(math.radians(kk.PITCH))
            def S2(p): return [round(p[0] * SC + ox, 2), round((top - p[1]) * SC, 2)]
            pos = info['pos']
            bx0, by0, bx1, by1 = info['band']
            meta['guides'] = {
                'baseline_y': round(top * SC, 2), 'xheight_y': round((top - kk.X) * SC, 2), 'ascender_y': round((top - kk.A) * SC, 2),
                'descender_y': round((top - kk.D) * SC, 2), 'roofbase_y': round((top - info['roof_base']) * SC, 2),
                'apex_y': round((top - info['apex']) * SC, 2), 'poletop_y': round((top - info['pole_top']) * SC, 2),
                'band': S2((bx0, by1)) + S2((bx1, by0)), 'xm': round(info['xm'] * SC + ox, 2),
                'l2_right': round((pos[5] + kk.S) * SC + ox, 2), 'k1': S2((pos[0], kk.A - kk.S * t)) + S2((pos[0] + kk.S, kk.A)),
                'l2': S2((pos[5], kk.A - kk.S * t)) + S2((pos[5] + kk.S, kk.A)),
                'roof_left': S2((bx0, info['roof_base'])) + S2((info['xm'], info['apex'])),
                'stem': kk.S * SC, 'gap': kk.G * SC, 'pitch': kk.PITCH,
                'aa': [round(bx0 * SC + ox, 2), round(bx1 * SC + ox, 2)],
            }
            meta['primary_parts'] = (cs, welded, [], (x0, y0, x1, y1))
        else:
            meta['klein_parts'] = (cs, welded, [], (x0, y0, x1, y1))
    return meta

# ------------------------------------------------------------------ lock-ups (capitals, Figtree 800 outlined)
def build_luifel(meta, name, fg, canc, barc, txtc, txt='PARTYTENTEN · STATAFELS'):
    cs, body, flag, bx = meta['primary_parts']
    lx0, _, lx1, _ = bbox(cs)
    bar_top = kk.D - kk.S                    # one stem below the descender: p never touches the bar
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
    X0, Y0, X1, Y1 = bbox(cs + body + flag + [bar])
    W = (X1 - X0) * SC; Hh = (Y1 - Y0) * SC; ox = -X0 * SC
    paths = [(fg, to_d(cs, ox, 0, Y1)), (canc, to_d(body + flag, ox, 0, Y1)), (barc, to_d([bar], ox, 0, Y1)), (txtc, to_d(tcs, ox, 0, Y1))]
    write(name, svg(W, Hh, paths, 'Klapklaar - partytenten en statafels'))
    return {'descender_to_bar_units': kk.S, 'tracking_em': round(tr, 3), 'cap_height_units': round(tb[3] - tb[1], 1), 'width_units': round(X1 - X0, 1)}

def build_zakelijk(meta):
    """Wordmark (Inkt, canopy Polder) + a Polder tag 'ZAKELIJK' on the x-height band: sober, no red, no wink."""
    cs, body, flag, bx = meta['primary_parts']
    lx1 = bbox(cs)[2]
    size = 300
    tcs, tw = text_contours('ZAKELIJK', size, 0, 0, 0.04)
    tb = bbox(tcs)
    padx = 150
    tag_x0 = lx1 + kk.S
    tag = kk.rect(tag_x0, 0, tag_x0 + tw + 2 * padx, kk.X)
    dx = tag_x0 + padx - tb[0]; dy = kk.X / 2 - (tb[1] + tb[3]) / 2
    tcs = [c.transformed(lambda p, dx=dx, dy=dy: (p[0] + dx, p[1] + dy)) for c in tcs]
    X0, Y0, X1, Y1 = bbox(cs + body + flag + [tag])
    W = (X1 - X0) * SC; Hh = (Y1 - Y0) * SC; ox = -X0 * SC
    paths = [(C['inkt'], to_d(cs, ox, 0, Y1)), (C['polder'], to_d(body + flag + [tag], ox, 0, Y1)), (C['zand'], to_d(tcs, ox, 0, Y1))]
    # the tag text sits inside the Polder tag: draw tag first, letters on top (separate fills)
    paths = [(C['inkt'], to_d(cs, ox, 0, Y1)), (C['polder'], to_d(body + flag, ox, 0, Y1)), (C['polder'], to_d([tag], ox, 0, Y1)), (C['zand'], to_d(tcs, ox, 0, Y1))]
    write('logo-zakelijk.svg', svg(W, Hh, paths, 'Klapklaar Zakelijk'))
    return {'tag_height_units': kk.X, 'cap_height_units': round(tb[3] - tb[1], 1)}

# ------------------------------------------------------------------ marks (k onder de tent)
def rounded_square_d(size, r):
    return (f'M{fmt(r)} 0h{fmt(size - 2*r)}a{fmt(r)} {fmt(r)} 0 0 1 {fmt(r)} {fmt(r)}v{fmt(size - 2*r)}'
            f'a{fmt(r)} {fmt(r)} 0 0 1-{fmt(r)} {fmt(r)}h-{fmt(size - 2*r)}a{fmt(r)} {fmt(r)} 0 0 1-{fmt(r)}-{fmt(r)}'
            f'v-{fmt(size - 2*r)}a{fmt(r)} {fmt(r)} 0 0 1 {fmt(r)}-{fmt(r)}z')

def square(k, body, flag, size, pad, bg, fk, fbody, fflag, name, title, radius=0.22):
    b = bbox(k + body + flag)
    cw, ch = b[2] - b[0], b[3] - b[1]
    inner = size * (1 - 2 * pad)
    sc = inner / max(cw, ch)
    ox = (size - cw * sc) / 2 - b[0] * sc
    oy = (size - ch * sc) / 2
    paths = [(bg, rounded_square_d(size, size * radius))] if bg else []
    paths += [(fk, to_d(k, ox, oy, b[3], sc)), (fbody, to_d(body, ox, oy, b[3], sc)), (fflag, to_d(flag, ox, oy, b[3], sc))]
    write(name, svg(size, size, paths, title))

def build_marks():
    meta = {}
    for variant in ('primary', 'klein'):
        k, body, flag, info = kk.mark(variant)
        suf = '' if variant == 'primary' else '-klein'
        welded = body if not flag else [body[0], info['roof_with_flag']]
        b = bbox(k + body + flag)
        W = (b[2] - b[0]) * SC; Hh = (b[3] - b[1]) * SC
        d_all = to_d(k + welded, -b[0] * SC, 0, b[3])
        write(f'mark{suf}-mono.svg', svg(W, Hh, [('currentColor', d_all)], 'Klapklaar beeldmerk'))
        write(f'print-mark{suf}.svg', svg(W, Hh, [('#000000', d_all)], f'Klapklaar beeldmerk drukbestand{" klein" if suf else ""} (1 kleur)'))
        if variant == 'primary':
            square(k, body, flag, 512, 0.15, C['klaproos'], C['zand'], C['zand'], C['zon'], 'mark.svg', 'Klapklaar beeldmerk')
            square(k, welded, [], 512, 0.15, C['polder'], C['zand'], C['zon'], C['zon'], 'mark-polder.svg', 'Klapklaar beeldmerk')
            square(k, welded, [], 512, 0.15, C['zand'], C['inkt'], C['klaproos'], C['klaproos'], 'mark-zand.svg', 'Klapklaar beeldmerk')
            meta['parts'] = (k, welded, [], b)
        else:
            square(k, body, flag, 512, 0.15, C['klaproos'], C['zand'], C['zand'], C['zand'], 'mark-klein.svg', 'Klapklaar beeldmerk (klein, 1 stuk)')
        pieces = [('k', [k[0]])] + ([('luifelband', [body[0]]), ('dak', [body[1]])] if variant == 'primary' else [('luifel (1 stuk)', body)])
        gap, where = min_gap(pieces)
        stroke = min(kk.G if variant == 'primary' else kk.S, kk.H, K_ARM)
        Wu = b[2] - b[0]
        meta[variant] = {'file': 'mark.svg' if variant == 'primary' else 'svg/mark-klein.svg', 'width_units': round(Wu, 1),
                         'smallest_stroke_units': round(stroke, 1), 'smallest_gap_units': round(gap, 1), 'smallest_gap_between': where,
                         'min_sizes': min_sizes(Wu, stroke, gap), 'note': 'maat = breedte van het symbool zelf (zonder vlak)'}
    return meta

# ------------------------------------------------------------------ favicons: hand-hinted on the pixel grid
def k_pixels(x0, base, top, stem_px):
    """The constructed k mapped onto a pixel grid: stem exactly stem_px wide with whole-pixel edges,
    baseline/top on whole pixels; arm and leg keep the construction's slopes (anti-aliased)."""
    k = kk.glyph_k()
    sy = (base - top) / kk.A
    sx = stem_px / kk.S
    def P(p):
        x = x0 + p[0] * sx; y = base - p[1] * sy
        if abs(p[0]) < 1e-6 or abs(p[0] - kk.S) < 1e-6: x = round(x)        # stem edges on the grid
        if abs(p[1]) < 1e-6 or abs(p[1] - kk.A) < 1e-6 or abs(p[1] - kk.X) < 1e-6: y = round(y)
        return (x, y)
    pts = [P(p) for p in k.contours[0].pts()]
    d = 'M' + 'L'.join(f'{fmt(x)} {fmt(y)}' for x, y in pts[:-1]) + 'z'
    return d, max(x for x, y in pts)

def build_favicons():
    """32 px: 'k onder de tent' drawn on the 32 grid; 16 px: tent pictogram on the 16 grid. Every
    horizontal and vertical edge sits on a whole pixel; only roof slopes, k diagonals and pennant are
    anti-aliased. Optical sizes: stems are relatively heavier than in mark.svg."""
    K_, Z_, ZO = C['klaproos'], C['zand'], C['zon']
    t = math.tan(math.radians(kk.PITCH))
    # --- 32 px
    bx0, bx1, by0, by1 = 5, 27, 12, 15          # valance band 22 x 3 px
    roof_base = 11                               # 1 px opening between roof and band
    xm = 16; hw = 1                              # pole 2 px wide
    ya = roof_base - (xm - hw - bx0) * t
    canopy = (f'M{bx0} {roof_base}L{xm - hw} {fmt(ya)}V2h{2 * hw}V{fmt(ya)}L{bx1} {roof_base}z'
              f'M{bx0} {by0}h{bx1 - bx0}v{by1 - by0}h-{bx1 - bx0}z')
    flag = f'M{xm + hw} 2l6 2.25-6 2.25z'
    kd, kx1 = k_pixels(0, 29, 17, 4)
    shift = round((32 - kx1) / 2)               # centre the k on whole pixels
    kd, kx1 = k_pixels(shift, 29, 17, 4)
    s32 = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" role="img"><title>Klapklaar</title>'
           f'<path fill="{K_}" d="{rounded_square_d(32, 7)}"/><path fill="{Z_}" d="{canopy}{kd}"/><path fill="{ZO}" d="{flag}"/></svg>\n')
    write('favicon.svg', s32)
    dot = f'<circle cx="6.5" cy="6.5" r="6" fill="{C["inkt"]}"/><circle cx="6.5" cy="6.5" r="4.2" fill="{ZO}"/>'
    write('favicon-cart.svg', s32.replace('</svg>', dot + '</svg>').replace('<title>Klapklaar</title>', '<title>Klapklaar - artikelen in winkelwagen</title>'))
    # --- 16 px: one-piece tent (roof + band + legs + pole) + 3x3 px pennant
    s16 = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" role="img"><title>Klapklaar</title>'
           f'<path fill="{K_}" d="{rounded_square_d(16, 3)}"/>'
           f'<path fill="{Z_}" d="M7 1h2v4l5 2v2h-1v5h-2V9H5v5H3V9H2V7l5-2z"/>'
           f'<path fill="{ZO}" d="M9 1h3v3H9z"/></svg>\n')
    write('favicon-16.svg', s16)

# ------------------------------------------------------------------ pennant + bunting
def build_pennant():
    pole_w, pole_h, fw, fh = kk.G, 520, 220, 156
    pole = kk.rect(0, 0, pole_w, pole_h)
    f = kk.Contour((pole_w, pole_h)); f.L((pole_w + fw, pole_h - fh / 2)).L((pole_w, pole_h - fh)).L((pole_w, pole_h))
    b = bbox([pole, f])
    W = (b[2] - b[0]) * SC; Hh = (b[3] - b[1]) * SC
    write('pennant.svg', svg(W, Hh, [(C['inkt'], to_d([pole], 0, 0, b[3])), (C['klaproos'], to_d([f], 0, 0, b[3]))], 'Klapklaar vlaggetje'))
    w, h = 160, 44
    cols = [C['klaproos'], C['zon'], C['polder'], C['zon']]
    def q(t): return (w * t, (1-t)**2 * 4 + 2*(1-t)*t*16 + t*t*4)
    parts = []
    for i in range(4):
        ta, tb = (12 + i * 40) / w, (36 + i * 40) / w
        a, bq = q(ta), q(tb); m = q((ta + tb) / 2)
        parts.append(f'<path fill="{cols[i]}" d="M{fmt(a[0])} {fmt(a[1])}L{fmt(bq[0])} {fmt(bq[1])}L{fmt(m[0])} {fmt(m[1] + 26)}z"/>')
    parts.append(f'<path fill="none" stroke="{C["inkt"]}" stroke-width="1.5" d="M0 4Q{w//2} 16 {w} 4"/>')
    write('vlaggenlijn.svg', f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" role="img"><title>Klapklaar vlaggenlijn</title>{"".join(parts)}</svg>\n')

if __name__ == '__main__':
    wm = build_wordmarks()
    lu = build_luifel(wm, 'logo-luifel.svg', C['inkt'], C['klaproos'], C['klaproos'], C['zand'])
    build_luifel(wm, 'logo-luifel-inverse.svg', C['zand'], C['zon'], C['zon'], C['inkt'])
    zk = build_zakelijk(wm)
    mk = build_marks()
    build_favicons()
    build_pennant()
    os.makedirs(os.path.join(OUT, 'tools'), exist_ok=True)
    # path data for the renderer (valance + statafelrok prints), single colour
    for key, parts in (('print-wordmark', wm['primary_parts']), ('print-wordmark-klein', wm['klein_parts'])):
        cs, body, flag, (x0, y0, x1, y1) = parts
        json.dump({'viewBox': [round((x1 - x0) * SC, 2), round((y1 - y0) * SC, 2)], 'd': to_d(cs + body + flag, -x0 * SC, 0, y1)}, open(os.path.join(OUT, 'tools', key + '.json'), 'w'))
    k, body, flag, b = mk['parts']
    json.dump({'viewBox': [round((b[2] - b[0]) * SC, 2), round((b[3] - b[1]) * SC, 2)], 'd': to_d(k + body + flag, -b[0] * SC, 0, b[3])}, open(os.path.join(OUT, 'tools', 'print-mark.json'), 'w'))
    for d in (wm, mk):
        for key in ('primary_parts', 'klein_parts', 'parts'): d.pop(key, None)
    meta = {'version': 3, 'units': 'kk-eenheden: x-hoogte 500, stok 130, tussenmaat 65', 'wordmark': wm, 'mark': mk,
            'luifel': lu, 'zakelijk': zk, 'methods_note': 'werkaannames per methode (kleinste lijn/opening in mm), niet met een leverancier geverifieerd',
            'written': WRITTEN}
    json.dump(meta, open(os.path.join(OUT, 'tools', 'logo-meta.json'), 'w'), indent=1, ensure_ascii=False)
    print(json.dumps({k: (v if not isinstance(v, dict) else {kk_: vv for kk_, vv in v.items() if kk_ != 'min_sizes'}) for k, v in meta.items() if k in ('wordmark', 'mark')}, indent=1, ensure_ascii=False)[:3000])
