"""Build every Klapklaar logo/mark/favicon SVG from the constructed geometry in kk.py.

python3 build.py <outdir>
Writes clean SVGs (viewBox, no <text>, no external refs, relative path commands).
Descriptor lettering (luifel/zakelijk lock-ups) is Figtree (OFL) converted to outlines.
"""
import sys, os, math, json, importlib
import kk
from vfont import VFont

OUT = sys.argv[1] if len(sys.argv) > 1 else 'out'
os.makedirs(OUT, exist_ok=True)
VENDOR = os.environ.get('VENDOR')  # folder that contains gfonts/ofl/figtree/Figtree[wght].ttf
if not VENDOR: sys.exit('set VENDOR to the vendored Google Fonts folder (needs gfonts/ofl/figtree/Figtree[wght].ttf)')
FIG = VFont(VENDOR + '/gfonts/ofl/figtree/Figtree[wght].ttf')

C = dict(klaproos='#BE3A1D', inkt='#1D2420', zand='#FBF6EC', zon='#FFC23A', polder='#154F3E', wit='#FFFFFF')
SC = 0.1          # kk units -> svg units (x-height 500 -> 50)
PREC = 2

def fmt(v):
    s = ('%.*f' % (PREC, v)).rstrip('0').rstrip('.')
    return '0' if s in ('-0', '') else s

def to_d(contours, ox, oy, top, sc=SC):
    """kk contours (y-up) -> compact relative path data."""
    out = []
    for c in contours:
        def P(p): return (p[0] * sc + ox, (top - p[1]) * sc + oy)
        cur = P(c.start); first = cur
        out.append('M' + fmt(cur[0]) + ' ' + fmt(cur[1]))
        segs = list(c.segs)
        # drop a final line back to the start (Z closes it)
        if segs and segs[-1][0] == 'L':
            e = P(segs[-1][1])
            if abs(e[0] - first[0]) < 1e-6 and abs(e[1] - first[1]) < 1e-6: segs = segs[:-1]
        for s in segs:
            if s[0] == 'L':
                p = P(s[1]); dx, dy = p[0] - cur[0], p[1] - cur[1]
                if abs(dy) < 1e-6: out.append('h' + fmt(dx))
                elif abs(dx) < 1e-6: out.append('v' + fmt(dy))
                else: out.append('l' + fmt(dx) + ' ' + fmt(dy))
                cur = p
            else:
                c1, c2, p = P(s[1]), P(s[2]), P(s[3])
                vals = (c1[0]-cur[0], c1[1]-cur[1], c2[0]-cur[0], c2[1]-cur[1], p[0]-cur[0], p[1]-cur[1])
                out.append('c' + ' '.join(fmt(v) for v in vals))
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

def svg(w, h, paths, title, extra_attr=''):
    merged = []
    for f, d in paths:  # merge consecutive paths with the same fill (non-overlapping contours)
        if not d: continue
        if merged and merged[-1][0] == f: merged[-1] = (f, merged[-1][1] + d)
        else: merged.append((f, d))
    body = ''.join(f'<path fill="{f}" d="{d}"/>' for f, d in merged)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {fmt(w)} {fmt(h)}"{extra_attr} role="img">'
            f'<title>{title}</title>{body}</svg>\n')

# ------------------------------------------------------------------ wordmark
def wordmark_parts():
    cs, w, pos = kk.word_contours('klapklaar')
    g6, x6 = pos[6]; g7, x7 = pos[7]
    ovh = 22
    x0 = x6 + g6.bbox()[0] - ovh; x1 = x7 + g7.bbox()[2] + ovh
    roof, top = kk.canopy(x0, x1, kk.A - kk.S)
    wordmark_parts.geo = {'pos': {i: x for i, (g, x) in pos.items()}, 'x0': x0, 'x1': x1}
    return cs, roof

PRIMARY = {'logo.svg', 'logo-inverse.svg', 'mark.svg', 'favicon.svg'}
def write(name, s):
    sub = '' if (name in PRIMARY or name.startswith('_')) else 'svg'
    os.makedirs(os.path.join(OUT, sub), exist_ok=True)
    with open(os.path.join(OUT, sub, name), 'w') as f: f.write(s)

def build_wordmarks():
    cs, roof = wordmark_parts()
    bx = bbox(cs + roof)
    x0, y0, x1, y1 = bx
    W = (x1 - x0) * SC; Hh = (y1 - y0) * SC
    ox = -x0 * SC; top = y1
    dl = to_d(cs, ox, 0, top); dr = to_d(roof, ox, 0, top)
    geo = wordmark_parts.geo
    def S2(p): return [round(p[0] * SC + ox, 2), round((top - p[1]) * SC, 2)]
    t = math.tan(math.radians(kk.PITCH))
    xl2 = geo['pos'][5]; xk1 = geo['pos'][0]
    ry = kk.A + 26; xm = (geo['x0'] + geo['x1']) / 2
    guides = {'cut_l2': [S2((xl2, kk.A - kk.S * t)), S2((xl2 + kk.S, kk.A))],
              'cut_k1': [S2((xk1, kk.A - kk.S * t)), S2((xk1 + kk.S, kk.A))],
              'roof_left': [S2((geo['x0'], ry)), S2((xm, ry + (xm - geo['x0']) * t))],
              'band': S2((geo['x0'], kk.A)) + S2((geo['x1'], kk.A - kk.S)),
              'aa': [S2((geo['x0'] + 22, 0))[0], S2((geo['x1'] - 22, 0))[0]],
              'stem': kk.S * SC, 'pitch': kk.PITCH}
    meta = {'guides': guides, 'viewBox': [round(W, 2), round(Hh, 2)], 'units_per_xheight': kk.X * SC,
            'baseline_y': round(top * SC, 2), 'xheight_y': round((top - kk.X) * SC, 2),
            'ascender_y': round((top - kk.A) * SC, 2)}
    write('logo.svg', svg(W, Hh, [(C['inkt'], dl), (C['klaproos'], dr)], 'Klapklaar'))
    write('logo-inverse.svg', svg(W, Hh, [(C['zand'], dl), (C['zon'], dr)], 'Klapklaar'))
    write('logo-on-klaproos.svg', svg(W, Hh, [(C['zand'], dl), (C['zand'], dr)], 'Klapklaar'))
    write('logo-mono.svg', svg(W, Hh, [('currentColor', dl + dr)], 'Klapklaar'))
    # one-colour print artwork (valance, statafelrok): letters + roof in a single path
    write('print-wordmark.svg', svg(W, Hh, [('#000000', dl + dr)], 'Klapklaar drukbestand (1 kleur)'))
    return meta, (cs, roof, bx)

def build_luifel(cs, roof, bx, name, txt='PARTYTENTEN · STATAFELS', fg=C['inkt'], roofc=C['klaproos'], barc=C['klaproos'], txtc=C['zand']):
    x0, y0, x1, y1 = bx
    lx0, _, lx1, _ = bbox(cs)
    gap = 70
    bar_h = 300
    bar_top = kk.D - gap
    bar = kk.Contour((lx0, bar_top)); bar.L((lx1, bar_top)).L((lx1, bar_top - bar_h)).L((lx0, bar_top - bar_h)).L((lx0, bar_top))
    size = 205
    # natural width, then spread tracking so the line fills the bar minus padding
    t0, wn = text_contours(txt, size, 0, 0, 0)
    pad = 120
    avail = (lx1 - lx0) - 2 * pad
    tr = (avail - wn) / (size * (len(txt) - 1))
    tcs, tw = text_contours(txt, size, lx0 + pad, 0, tr)
    tb = bbox(tcs)
    capc = (tb[1] + tb[3]) / 2
    ymid = bar_top - bar_h / 2
    tcs = [c.transformed(lambda p, dy=ymid - capc: (p[0], p[1] + dy)) for c in tcs]
    allb = bbox(cs + roof + [bar])
    X0, Y0, X1, Y1 = allb
    W = (X1 - X0) * SC; Hh = (Y1 - Y0) * SC; ox = -X0 * SC
    paths = [(fg, to_d(cs, ox, 0, Y1)), (roofc, to_d(roof, ox, 0, Y1)),
             (barc, to_d([bar], ox, 0, Y1)), (txtc, to_d(tcs, ox, 0, Y1))]
    write(name, svg(W, Hh, paths, 'Klapklaar - partytenten en statafels'))
    return tr

def build_zakelijk(cs, roof, bx):
    x0, y0, x1, y1 = bx
    lx0, _, lx1, _ = bbox(cs)
    rule_x = x1 + 150
    rule_w = 26
    rule = kk.Contour((rule_x, kk.D)); rule.L((rule_x, kk.A)).L((rule_x + rule_w, kk.A)).L((rule_x + rule_w, kk.D)).L((rule_x, kk.D))
    # 'Zakelijk' set so its x-height matches the wordmark x-height (Figtree xh ~ 0.5 em at wght 700)
    FIG.set({'wght': 700})
    xc, _ = FIG.glyph(FIG.gid('x'))
    xh = max(p[1] for ct in xc for p in ct)
    size = kk.X / xh * FIG.upem * 0.80
    tcs, tw = text_contours('Zakelijk', size, rule_x + rule_w + 140, 0, 0.0, wght=650)
    allb = bbox(cs + roof + [rule] + tcs)
    X0, Y0, X1, Y1 = allb
    W = (X1 - X0) * SC; Hh = (Y1 - Y0) * SC; ox = -X0 * SC
    paths = [(C['inkt'], to_d(cs, ox, 0, Y1) + to_d(roof, ox, 0, Y1)), (C['polder'], to_d([rule] + tcs, ox, 0, Y1))]
    write('logo-zakelijk.svg', svg(W, Hh, paths, 'Klapklaar Zakelijk'))

# ------------------------------------------------------------------ mark (aa under the tent)
def aa_parts(stem=None, hor=None, gap_band=None, band=None, pole_h=100, flag=(150, 104), pole_w=30, roof_gap=20, ovh=22, sb=56):
    saved = (kk.S, kk.H)
    if stem: kk.S = stem
    if hor: kk.H = hor
    a = kk.glyph_a()
    cs = list(a.contours) + [c.transformed(lambda p: (p[0] + a.adv + sb, p[1])) for c in a.contours]
    x0 = a.bbox()[0] - ovh; x1 = a.adv * 2 + sb + ovh
    bh = band or kk.S
    base = (kk.X + gap_band) if gap_band is not None else (kk.A - kk.S)
    roof, top = kk.canopy(x0, x1, base, band_h=bh, gap=roof_gap, pole_h=pole_h, flag_w=flag[0], flag_h=flag[1], pole_w=pole_w)
    kk.S, kk.H = saved
    return cs, roof

def square(cs, roof, size, pad_frac, bg, fg_letters, fg_roof, fg_flag=None, radius=0.22, name='mark.svg', title='Klapklaar beeldmerk', dy_frac=0.0):
    b = bbox(cs + roof)
    cw, ch = b[2] - b[0], b[3] - b[1]
    inner = size * (1 - 2 * pad_frac)
    sc = inner / max(cw, ch)
    ox = (size - cw * sc) / 2 - b[0] * sc
    oy = (size - ch * sc) / 2 + dy_frac * size
    r = size * radius
    bgd = (f'M{fmt(r)} 0h{fmt(size - 2*r)}a{fmt(r)} {fmt(r)} 0 0 1 {fmt(r)} {fmt(r)}v{fmt(size - 2*r)}'
           f'a{fmt(r)} {fmt(r)} 0 0 1-{fmt(r)} {fmt(r)}h-{fmt(size - 2*r)}a{fmt(r)} {fmt(r)} 0 0 1-{fmt(r)}-{fmt(r)}'
           f'v-{fmt(size - 2*r)}a{fmt(r)} {fmt(r)} 0 0 1 {fmt(r)}-{fmt(r)}z')
    paths = []
    if bg: paths.append((bg, bgd))
    flag = roof[2:] if len(roof) > 2 else []
    body = roof[:2]
    paths.append((fg_letters, to_d(cs, ox, oy, b[3], sc)))
    if fg_flag and fg_flag != fg_roof:
        paths.append((fg_roof, to_d(body, ox, oy, b[3], sc)))
        paths.append((fg_flag, to_d(flag, ox, oy, b[3], sc)))
    else:
        paths.append((fg_roof, to_d(roof, ox, oy, b[3], sc)))
    write(name, svg(size, size, paths, title))

def build_marks():
    cs, roof = aa_parts()
    square(cs, roof, 512, 0.17, C['klaproos'], C['zand'], C['zand'], C['zon'], name='mark.svg', dy_frac=0.0)
    square(cs, roof, 512, 0.17, C['polder'], C['zand'], C['zon'], name='mark-polder.svg')
    square(cs, roof, 512, 0.17, C['zand'], C['inkt'], C['klaproos'], name='mark-zand.svg')
    # one-colour print symbol (no background) for statafelrokken etc.
    b = bbox(cs + roof)
    W = (b[2] - b[0]) * SC; Hh = (b[3] - b[1]) * SC
    write('print-mark.svg', svg(W, Hh, [('#000000', to_d(cs + roof, -b[0] * SC, 0, b[3]))], 'Klapklaar beeldmerk drukbestand (1 kleur)'))
    write('mark-mono.svg', svg(W, Hh, [('currentColor', to_d(cs + roof, -b[0] * SC, 0, b[3]))], 'Klapklaar beeldmerk'))
    # favicon: optical variant - heavier stems, tighter roof, bigger flag, no pole gap
    fcs, froof = aa_parts(stem=172, hor=150, gap_band=70, band=150, pole_h=70, flag=(210, 150), pole_w=56, roof_gap=40, ovh=34, sb=40)
    square(fcs, froof, 64, 0.06, C['klaproos'], C['zand'], C['zand'], C['zon'], radius=0.2, name='favicon.svg', title='Klapklaar')
    return fcs, froof

def build_favicon16():
    """16 px pictogram: an easy-up (roof, valance, legs, pennant) on a 16-grid, pixel-snapped."""
    r = 3
    bg = (f'M{r} 0h{16-2*r}a{r} {r} 0 0 1 {r} {r}v{16-2*r}a{r} {r} 0 0 1-{r} {r}h-{16-2*r}a{r} {r} 0 0 1-{r}-{r}v-{16-2*r}a{r} {r} 0 0 1 {r}-{r}z')
    # roof triangle 2..14 wide, apex y=3.5 -> eave y=7 ; valance band y 7..9 ; legs x 3..4.5 / 11.5..13 down to 13.5
    roof = 'M2 7.2L8 4.4 14 7.2z'
    band = 'M2 7.6h12v2H2z'
    legs = 'M2.5 9.6h1.5v4H2.5zM12 9.6h1.5v4H12z'
    pole = 'M7.5 1.5h1v3.2h-1z'
    flag = 'M8.9 1.5l3 1.1-3 1.1z'
    s = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" role="img"><title>Klapklaar</title>'
         f'<path fill="{C["klaproos"]}" d="{bg}"/><path fill="{C["zand"]}" d="{roof}{band}{legs}{pole}"/>'
         f'<path fill="{C["zon"]}" d="{flag}"/></svg>\n')
    write('favicon-16.svg', s)

def build_favicon_cart(fcs, froof):
    # cart-filled state: favicon + a Zon dot with Inkt ring at top-right
    square(fcs, froof, 64, 0.06, C['klaproos'], C['zand'], C['zand'], C['zon'], radius=0.2, name='_fav_tmp.svg', title='Klapklaar')
    s = open(os.path.join(OUT, '_fav_tmp.svg')).read(); os.remove(os.path.join(OUT, '_fav_tmp.svg'))
    dot = f'<circle cx="52" cy="12" r="12" fill="{C["inkt"]}"/><circle cx="52" cy="12" r="8.5" fill="{C["zon"]}"/>'
    s = s.replace('</svg>', dot + '</svg>').replace('<title>Klapklaar</title>', '<title>Klapklaar - artikelen in winkelwagen</title>')
    write('favicon-cart.svg', s)

# ------------------------------------------------------------------ pennant motif + bunting
def build_pennant():
    # the logo pennant on its pole, standalone (print motif / bullets / dividers)
    pole_w, pole_h, fw, fh, g = 30, 300, 150, 104, 10
    pole = kk.Contour((0, 0)); pole.L((0, pole_h)).L((pole_w, pole_h)).L((pole_w, 0)).L((0, 0))
    f = kk.Contour((pole_w + g, pole_h)); f.L((pole_w + g + fw, pole_h - fh / 2)).L((pole_w + g, pole_h - fh)).L((pole_w + g, pole_h))
    b = bbox([pole, f])
    W = (b[2] - b[0]) * SC; Hh = (b[3] - b[1]) * SC
    write('pennant.svg', svg(W, Hh, [(C['inkt'], to_d([pole], 0, 0, b[3])), (C['klaproos'], to_d([f], 0, 0, b[3]))], 'Klapklaar vlaggetje'))
    # bunting tile: sagging line + 4 pennants (Klaproos, Zon, Polder, Zon), 160 x 44, tiles horizontally
    w, h = 160, 44
    cols = [C['klaproos'], C['zon'], C['polder'], C['zon']]
    def sag(x): return 4 + 6 * math.sin(math.pi * x / w)
    parts = []
    def q(t): return (w * t, (1-t)**2 * 4 + 2*(1-t)*t*16 + t*t*4)
    for i in range(4):
        ta, tb = (12 + i * 40) / w, (36 + i * 40) / w
        a, b = q(ta), q(tb); m = q((ta + tb) / 2)
        parts.append(f'<path fill="{cols[i]}" d="M{fmt(a[0])} {fmt(a[1])}L{fmt(b[0])} {fmt(b[1])}L{fmt(m[0])} {fmt(m[1] + 26)}z"/>')
    parts.append(f'<path fill="none" stroke="{C["inkt"]}" stroke-width="1.5" d="M0 4Q{w/2} 16 {w} 4"/>')
    s = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" role="img"><title>Klapklaar vlaggenlijn</title>{"".join(parts)}</svg>\n'
    write('vlaggenlijn.svg', s)

if __name__ == '__main__':
    meta, (cs, roof, bx) = build_wordmarks()
    tr = build_luifel(cs, roof, bx, 'logo-luifel.svg')
    build_luifel(cs, roof, bx, 'logo-luifel-inverse.svg', fg=C['zand'], roofc=C['zon'], barc=C['zon'], txtc=C['inkt'])
    build_zakelijk(cs, roof, bx)
    fcs, froof = build_marks()
    build_favicon16()
    build_favicon_cart(fcs, froof)
    build_pennant()
    # valance-print artwork for the 3D renderer (single colour, path data + viewBox)
    x0, y0, x1, y1 = bx
    d = to_d(cs + roof, -x0 * SC, 0, y1)
    os.makedirs(os.path.join(OUT, 'tools'), exist_ok=True)
    json.dump({'viewBox': [(x1 - x0) * SC, (y1 - y0) * SC], 'd': d}, open(os.path.join(OUT, 'tools', 'print-wordmark.json'), 'w'))
    mcs, mroof = aa_parts()
    mb = bbox(mcs + mroof)
    json.dump({'viewBox': [(mb[2] - mb[0]) * SC, (mb[3] - mb[1]) * SC], 'd': to_d(mcs + mroof, -mb[0] * SC, 0, mb[3])}, open(os.path.join(OUT, 'tools', 'print-mark.json'), 'w'))
    json.dump(meta, open(os.path.join(OUT, 'tools', 'logo-meta.json'), 'w'), indent=1)
    print(json.dumps(meta), 'tracking', round(tr, 3))
