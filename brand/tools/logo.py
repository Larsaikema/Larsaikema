"""Build every Klapklaar v7.1 logo, mark, lock-up, favicon and print SVG from kkgeo.py, and measure them.

    python3 logo.py <brand-dir>

Writes clean SVGs (viewBox, <title>, only <path>/<rect>, no <text>, no external refs, compact relative path data,
no overlapping subpaths) and tools/logo-meta.json with every measured angle, stroke, gap and the minimum size per
production method. All lettering, including the lock-up labels, is drawn with kkgeo.py: no font is involved.
"""
import sys, os, math, json
import kkgeo as G
from kkgeo import CAP, Path

B = sys.argv[1] if len(sys.argv) > 1 else '..'
os.makedirs(os.path.join(B, 'svg'), exist_ok=True)

COL = dict(lampion='#E66414', inkt='#1D2420', zand='#FBF6EC', wit='#FFFFFF', linnen='#ECE4D6')
SC = 0.1

def fmt(v, prec=2):
    s = ('%.*f' % (prec, v)).rstrip('0').rstrip('.')
    return '0' if s in ('-0', '') else s

def to_d(paths, ox=0.0, oy=0.0, top=CAP, sc=SC, prec=2):
    """kkgeo paths (y up) -> compact relative path data (y down)."""
    out = []
    for c in paths:
        def P(q): return (q[0] * sc + ox, (top - q[1]) * sc + oy)
        cur = P(c.start); first = cur
        out.append('M' + fmt(cur[0], prec) + ' ' + fmt(cur[1], prec))
        segs = list(c.segs)
        if segs and segs[-1][0] == 'L':
            e = P(segs[-1][1])
            if abs(e[0] - first[0]) < 1e-6 and abs(e[1] - first[1]) < 1e-6: segs = segs[:-1]
        for s in segs:
            if s[0] == 'L':
                q = P(s[1]); dx, dy = q[0] - cur[0], q[1] - cur[1]
                if abs(dy) < 5e-3 and abs(dx) < 5e-3: continue
                if abs(dy) < 5e-3: out.append('h' + fmt(dx, prec))
                elif abs(dx) < 5e-3: out.append('v' + fmt(dy, prec))
                else: out.append('l' + fmt(dx, prec) + ' ' + fmt(dy, prec))
                cur = (cur[0] + float(fmt(dx, prec)), cur[1] + float(fmt(dy, prec)))
            else:
                c1, c2, q = P(s[1]), P(s[2]), P(s[3])
                vals = [c1[0] - cur[0], c1[1] - cur[1], c2[0] - cur[0], c2[1] - cur[1], q[0] - cur[0], q[1] - cur[1]]
                out.append('c' + ' '.join(fmt(v, prec) for v in vals))
                cur = (cur[0] + float(fmt(vals[4], prec)), cur[1] + float(fmt(vals[5], prec)))
        out.append('z')
    return ''.join(out).replace(' -', '-')

def svg(w, h, layers, title, bg=None, rx=None):
    """layers: [(fill, d, extra_attrs)]"""
    s = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {fmt(w)} {fmt(h)}" role="img"><title>{title}</title>'
    if bg:
        s += f'<rect width="{fmt(w)}" height="{fmt(h)}"' + (f' rx="{fmt(rx)}"' if rx else '') + f' fill="{bg}"/>'
    for fill, d, extra in layers:
        if d: s += f'<path{extra} fill="{fill}" d="{d}"/>'
    return s + '</svg>'

def write(rel, s):
    p = os.path.join(B, rel); os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, 'w').write(s)

def bbox(paths):
    xs, ys = [], []
    for c in paths:
        for q in c.flatten(24): xs.append(q[0]); ys.append(q[1])
    return min(xs), min(ys), max(xs), max(ys)

# ------------------------------------------------------------------ measurements
def seg_dist(p, a, b):
    ax, ay = a; bx, by = b; px, py = p
    dx, dy = bx - ax, by - ay
    L2 = dx * dx + dy * dy
    t = 0 if L2 == 0 else max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / L2))
    return math.hypot(px - ax - t * dx, py - ay - t * dy)

def poly_dist(A, Bp):
    best = 1e9
    for P1, P2 in ((A, Bp), (Bp, A)):
        for p in P1:
            for i in range(len(P2)):
                best = min(best, seg_dist(p, P2[i], P2[(i + 1) % len(P2)]))
    return best

def pieces_dist(pa, pb):
    return min(poly_dist(a.flatten(10), b.flatten(10)) for a in pa for b in pb)

METHODS = [  # (name, min stroke mm, min opening mm): working assumptions, confirm with the supplier
    ('Borduren (satijnsteek)', 1.2, 1.0), ('Flock-transfer (geplot)', 1.5, 1.5), ('Flex-/snijfolie (textiel)', 1.0, 1.0),
    ('Snijfolie bus/bord', 1.5, 1.5), ('Zeefdruk textiel', 0.5, 0.6), ('DTF-transfer', 0.5, 0.5),
    ('Sublimatie (luifel, rok)', 0.3, 0.3), ('Offset/digitaal papier', 0.15, 0.15)]

def min_sizes(width_units, stroke_units, gap_units):
    out = {}
    for name, ms, mg in METHODS:
        out[name] = math.ceil(max(ms / stroke_units, mg / gap_units) * width_units)
    out['Scherm (px)'] = math.ceil(max(1.6 / stroke_units, 1.0 / gap_units) * width_units)   # thinnest stroke >= 1.6 px, opening >= 1 px
    return out

meta = {'units': 'kapitaalhoogte 700 = 100%', 'files': {}}
p = dict(G.P)

# ------------------------------------------------------------------ wordmarks
VARIANTS = {   # klein: 96-159 px on screen: more letter space and the heavy tent-A (kkgeo.glyph_tent_zwaar)
    'primary': dict(extra=0, tent_kw={}),
    'klein': dict(extra=34, tent_kw={'zwaar': True}),
}
# v7.1: the slender tent-A only appears in two colours from 160 px (logo.svg, logo-inverse, logo-inline, the colour
# luifel lock-ups). Every one-colour file, everything below 160 px, the beeldmerk and the square icon use the heavy tent-A:
# in one colour the slender tent merges with its own scallops into a spade or a drop. The heavy tent has the slender
# tent's width and pole inset, so in the primary one-colour files it sits in the same slot: same letters, same viewBox.
def measure(items, tg, thin_extra=()):
    gaps = []
    for (ta, xa, ga, pa, pra), (tb, xb, gb, pb, prb) in zip(items, items[1:]):
        gaps.append({'pair': ta.replace('TENT', 'tent') + '|' + tb.replace('TENT', 'tent'), 'units': round(pieces_dist(pa, pb), 1),
                     'white_units': round(G.white_area(pra, prb, xb - xa), 1)})
    thin_stroke = min(tg.info['leg'], tg.info['band_h'], p['BAR'] * 0.92, p['ARM'], p['LEG'], p['STEM'])
    Wa, tl, th, lw, ia, bt, bb, xin = G._a_frame(p)
    yq = bt + (ia[1] - bt) * 0.25
    a_counter = (Wa - 2 * xin(yq))
    openings = [g['units'] for g in gaps] + [a_counter] + ([tg.info['seam']] if tg.info.get('seam') else [])   # heavy tent: the seam
    thin_gap = min(openings)
    return gaps, thin_stroke, thin_gap, a_counter

def wordmark_files():
    out = {}
    for variant, kw in VARIANTS.items():
        letters, tent, W, items = G.wordmark(p, extra=kw['extra'], tent_kw=kw['tent_kw'])
        tg = [g for t, x, g, ps, pr in items if t == 'TENT'][0]
        tx = [x for t, x, g, ps, pr in items if t == 'TENT'][0]
        heavy = tent if kw['tent_kw'].get('zwaar') else G.move(G.glyph_tent_zwaar(p).paths, tx)
        x0, y0, x1, y1 = bbox(letters + tent + heavy)
        top = y1; Wv = (x1 - x0) * SC; Hv = (y1 - y0) * SC; ox = -x0 * SC
        dl = to_d(letters, ox, 0, top); dt = to_d(tent, ox, 0, top); dh = to_d(heavy, ox, 0, top)
        one = to_d(letters + heavy, ox, 0, top)           # one colour: always the heavy tent
        sfx = '' if variant == 'primary' else '-klein'
        name = 'Klapklaar'
        if variant == 'primary':
            write('logo.svg', svg(Wv, Hv, [(COL['inkt'], dl, ''), (COL['lampion'], dt, '')], name))
            write('logo-inverse.svg', svg(Wv, Hv, [(COL['zand'], dl, ''), (COL['lampion'], dt, '')], name))
            # screen one colour: letters and tent as two paths, so the theme can swap the tent (handoff.py)
            write('svg/logo-mono.svg', svg(Wv, Hv, [('currentColor', dl, ''), ('currentColor', dh, '')], name))
        else:
            write('svg/logo-klein.svg', svg(Wv, Hv, [(COL['inkt'], dl, ''), (COL['lampion'], dt, '')], name))
            write('svg/logo-klein-inverse.svg', svg(Wv, Hv, [(COL['zand'], dl, ''), (COL['lampion'], dt, '')], name))
            write('svg/logo-klein-mono.svg', svg(Wv, Hv, [('currentColor', one, '')], name))
        write(f'svg/logo{sfx}-inline.svg', svg(Wv, Hv, [('currentColor', dl, ''), (COL['lampion'], dt, ' class="kk-tent"')], name))
        write(f'svg/logo{sfx}-on-lampion.svg', svg(Wv, Hv, [(COL['inkt'], one, '')], name))
        write(f'svg/print-wordmark{sfx}.svg', svg(Wv, Hv, [('#000000', one, '')], name + ' (drukbestand, 1 kleur)'))
        gaps, thin_stroke, thin_gap, a_counter = measure(items, tg)
        out[variant] = {
            'viewBox': [round(Wv, 2), round(Hv, 2)], 'width_units': round(x1 - x0, 1), 'height_units': round(y1 - y0, 1),
            'aspect': round((x1 - x0) / CAP, 3), 'peak_above_cap_units': round(y1 - CAP, 1), 'extra_space_units': kw['extra'],
            'letter_gaps': gaps, 'thinnest_stroke_units': round(thin_stroke, 1), 'smallest_opening_units': round(thin_gap, 1),
            'a_counter_width_units': round(a_counter, 1), 'tent': 'zwaar' if kw['tent_kw'].get('zwaar') else 'slank',
            'tent_pole_units': tg.info['leg'], 'scallops': tg.info['scallops'], 'min_width_mm': min_sizes(x1 - x0, thin_stroke, thin_gap)}
        if variant == 'primary':
            # the one-colour primary (logo-mono, logo-on-lampion, print-wordmark): same letters, heavy tent in the same slot
            hg = G.glyph_tent_zwaar(p)
            hitems = [(t, x, hg, G.move(hg.paths, x), G.profile(hg.paths)) if t == 'TENT' else (t, x, g, ps, pr) for t, x, g, ps, pr in items]
            hgaps, hs, hgap, _ = measure(hitems, hg)
            out['primary_een_kleur'] = {
                'viewBox': [round(Wv, 2), round(Hv, 2)], 'width_units': round(x1 - x0, 1), 'files': ['svg/logo-mono.svg', 'svg/logo-on-lampion.svg', 'svg/print-wordmark.svg'],
                'tent': 'zwaar', 'letter_gaps': hgaps, 'thinnest_stroke_units': round(hs, 1), 'smallest_opening_units': round(hgap, 1),
                'tent_pole_units': hg.info['leg'], 'scallops': hg.info['scallops'], 'min_width_mm': min_sizes(x1 - x0, hs, hgap)}
        meta.setdefault('_parts', {})[variant] = (letters, tent, heavy, (x0, y0, x1, y1), Wv, Hv, items)
    return out

meta['wordmark'] = wordmark_files()

k = G.glyph_K(p); r = G.glyph_R(p); a = G.glyph_A(p); t = G.glyph_tent(p)
td = G.tent_dims(p); tz = G.tent_zwaar_dims(p); gz = G.glyph_tent_zwaar(p)
pz = [q for c in gz.paths for q in c.flatten(24)]
meta['angles_deg'] = {
    'K arm (vanaf horizontaal)': round(k.info['arm_deg'], 1), 'K been (vanaf horizontaal)': round(k.info['leg_deg'], 1),
    'R been (vanaf horizontaal)': round(r.info['leg_deg'], 1), 'A benen (vanaf horizontaal)': round(a.info['leg_deg'], 1),
    'tentdak, koorde top-hoek (vanaf horizontaal)': round(td['pitch'], 1), 'dak zware tent-A (vanaf horizontaal)': round(tz['pitch'], 1), 'tentpalen': 0.0}
meta['strokes_units'] = {'stok (K, L, P, R, E, F, I, N, T)': p['STEM'], 'balk (L-voet, P/R-boog, E, F, T, Z)': p['BAR'],
    'A-dwarsbalk': round(p['BAR'] * 0.92, 1), 'K arm (loodrecht)': p['ARM'], 'K been (loodrecht)': p['LEG'], 'diagonaal N, Z, Y (loodrecht)': p['DIAG'],
    'tentpaal': p['T_LEG'], 'luifelband (tussen de palen)': round(td['val_top'] - td['cusp'], 1),
    'schulpdiepte': p['T_SCAL_D'], 'paal ingesprongen vanaf de luifelhoek': p['T_INSET'], 'hoekradius': p['RC'], 'naar binnen gebogen dakrand (midden)': p['T_SAG'],
    'zware tent-A: paal': p['TZ_LEG'], 'zware tent-A: luifelband': p['TZ_BAND'], 'zware tent-A: schulpdiepte': p['TZ_SCAL_D'],
    'zware tent-A: open naad tussen dak en luifel': p['TZ_SEAM']}
meta['tent'] = {'valance_top': td['val_top'], 'scallop_tips': round(td['tips'], 1), 'cusps': round(td['cusp'], 1), 'a_crossbar': [round(p['A_BAR'] - p['BAR'] * 0.92, 1), p['A_BAR']],
                'peak_y': td['apex_y'], 'peak_over_cap': p['T_OVER'], 'width': p['T_W'], 'pole_to_stem': round(p['T_LEG'] / p['STEM'], 2),
                'pole_to_stem_v6': round(122 / 142, 2), 'pitch_v6': 35.0}
meta['tent_zwaar'] = {'what': 'zware tent-A (v7.1): onder 160 px, alle één-kleurbestanden, borduur/flock/folie/stempel, beeldmerk en vierkant icoon',
                      'width': tz['W'], 'peak_y': tz['apex_y'], 'peak_after_rounding': round(max(q[1] for q in pz), 1), 'roof_corners': round(tz['roof_b'], 1),
                      'seam': p['TZ_SEAM'], 'valance_top': round(tz['val_top'], 1), 'cusps': round(tz['cusp'], 1), 'scallop_tips': round(tz['tips'], 1),
                      'pitch_deg': tz['pitch'], 'pitch_slank_deg': round(td['pitch'], 1), 'pole': p['TZ_LEG'], 'pole_to_stem': round(p['TZ_LEG'] / p['STEM'], 2),
                      'band': p['TZ_BAND'], 'scallops': p['TZ_SCAL'], 'scallop_depth': p['TZ_SCAL_D'], 'pole_inset': p['T_INSET'],
                      'leg_opening_height': round(tz['tips'], 1), 'leg_opening_height_slank': round(td['tips'], 1)}

# ------------------------------------------------------------------ drawn lettering for the lock-ups
def drawn(txt, cap_h, x=0.0, baseline=0.0, track=60, word=170):
    """kkgeo letters at cap height cap_h; returns (paths, width). '·' and '+' get word space on both sides."""
    toks = [c for c in txt if c != ' ']
    sc = cap_h / CAP
    letters, tent, W, items = G.build_word(toks, p, kern={}, extra=track)
    # re-space around separators
    shift = 0; out = []; xs = []
    for tok, gx, g, ps, pr in items:
        if tok in ('·', '+'): shift += word
        q = G.scale(G.move(ps, shift), sc, x, baseline)
        out.extend(q)
        if tok in ('·', '+'): shift += word
    x0, y0, x1, y1 = bbox(out)
    return G.move(out, x - x0), x1 - x0

DESCRIPTOR = 'PARTYTENTEN · STATAFELS'

def luifel(name, fg, tentc, barc, txtc, knockout=True, variant='primary', heavy=False):
    letters, tent, tent_z, (x0, y0, x1, y1), Wv, Hv, items = meta['_parts'][variant]
    if heavy: tent = tent_z
    gap = 0.20 * CAP; bar_h = 0.40 * CAP
    bar_top = -gap; bar_bot = bar_top - bar_h
    cap_h = bar_h * 0.40
    tps, tw = drawn(DESCRIPTOR, cap_h, 0, 0)
    tps = G.move(tps, x0 + ((x1 - x0) - tw) / 2, bar_bot + (bar_h - cap_h) / 2)
    bar = G.rpoly([(x0, bar_bot, 0), (x0, bar_top, 0), (x1, bar_top, 0), (x1, bar_bot, 0)])
    top = y1; W2 = (x1 - x0) * SC; H2 = (top - bar_bot) * SC; ox = -x0 * SC
    layers = [(fg, to_d(letters, ox, 0, top), ''), (tentc, to_d(tent, ox, 0, top), '')]
    if knockout: layers.append((barc, to_d([bar] + tps, ox, 0, top), ' fill-rule="evenodd"'))
    else: layers += [(barc, to_d([bar], ox, 0, top), ''), (txtc, to_d(tps, ox, 0, top), '')]
    write(name, svg(W2, H2, layers, 'Klapklaar · partytenten en statafels'))
    return {'bar_height_units': bar_h, 'gap_units': gap, 'descriptor_cap_units': round(cap_h, 1), 'descriptor_width_share': round(tw / (x1 - x0), 3),
            'viewBox': [round(W2, 2), round(H2, 2)], 'descriptor': DESCRIPTOR}

meta['luifel'] = luifel('svg/logo-luifel.svg', COL['inkt'], COL['lampion'], COL['lampion'], COL['inkt'], knockout=False)
luifel('svg/logo-luifel-inverse.svg', COL['zand'], COL['lampion'], COL['lampion'], COL['inkt'], knockout=False)
luifel('svg/print-luifel.svg', '#000000', '#000000', '#000000', None, knockout=True, heavy=True)

def zakelijk():   # one colour, so the heavy tent
    letters, _, tent, (x0, y0, x1, y1), Wv, Hv, items = meta['_parts']['primary']
    cap_h = 0.40 * CAP
    tps, tw = drawn('ZAKELIJK', cap_h, 0, 0, track=70)
    padx = 0.26 * CAP
    tag_x0 = x1 + 0.30 * CAP; tag_x1 = tag_x0 + tw + 2 * padx
    tag = G.rpoly([(tag_x0, 0, 14), (tag_x0, CAP, 14), (tag_x1, CAP, 14), (tag_x1, 0, 14)])
    tps = G.move(tps, tag_x0 + padx, (CAP - cap_h) / 2)
    top = y1; W2 = (tag_x1 - x0) * SC; H2 = (y1 - y0) * SC; ox = -x0 * SC
    for fn, c in (('svg/logo-zakelijk.svg', COL['inkt']), ('svg/logo-zakelijk-inverse.svg', COL['zand'])):
        write(fn, svg(W2, H2, [(c, to_d(letters + tent, ox, 0, top), ''), (c, to_d([tag] + tps, ox, 0, top), ' fill-rule="evenodd"')], 'Klapklaar Zakelijk'))
    return {'tag_height_units': CAP, 'tag_cap_units': round(cap_h, 1), 'viewBox': [round(W2, 2), round(H2, 2)]}

meta['zakelijk'] = zakelijk()

# ------------------------------------------------------------------ beeldmerk and the square icon (v7.1: heavy tent-A)
ICON_SHARE = 0.72    # tent height / square side: inside the circle crop of an avatar, clear at 48 px
def mark_paths():
    g = G.glyph_tent_zwaar(p)
    return g.paths, g

def mark_svg(size, bg, fg, share=ICON_SHARE, rx=0.22, title='Klapklaar beeldmerk', square=True):
    paths, g = mark_paths()
    x0, y0, x1, y1 = bbox(paths)
    w, h = x1 - x0, y1 - y0
    if not square:
        sc = size / w
        return svg(w * sc, h * sc, [(fg, to_d(paths, -x0 * sc, 0, y1, sc), '')], title)
    sc = size * share / h
    ox = (size - w * sc) / 2 - x0 * sc; oy = (size - h * sc) / 2
    return svg(size, size, [(fg, to_d(paths, ox, oy, y1, sc), '')], title, bg=bg, rx=size * rx if rx else None)

def icon_stamp(size=512, rx=0.22, share=ICON_SHARE, title='Klapklaar icoon (stempel, drukbestand, 1 kleur)'):
    """the square icon in one colour: the rounded square with the tent knocked out (stamp, label, sticker, embossing)."""
    paths, g = mark_paths()
    x0, y0, x1, y1 = bbox(paths); w, h = x1 - x0, y1 - y0
    sc = size * share / h; ox = (size - w * sc) / 2 - x0 * sc; oy = (size - h * sc) / 2
    r = size * rx; S = fmt(size); R = fmt(r); L = fmt(size - 2 * r)
    sq = f'M{R} 0h{L}a{R} {R} 0 0 1 {R} {R}v{L}a{R} {R} 0 0 1-{R} {R}h-{L}a{R} {R} 0 0 1-{R}-{R}v-{L}a{R} {R} 0 0 1 {R}-{R}z'
    return svg(size, size, [('#000000', sq + to_d(paths, ox, oy, y1, sc), ' fill-rule="evenodd"')], title)

write('mark.svg', mark_svg(512, COL['inkt'], COL['lampion'], title='Klapklaar icoon'))
write('svg/mark-lampion.svg', mark_svg(512, COL['lampion'], COL['inkt'], title='Klapklaar icoon op Lampion'))
write('svg/mark-zand.svg', mark_svg(512, COL['zand'], COL['lampion'], title='Klapklaar icoon op Zand'))
write('svg/mark-symbool.svg', mark_svg(512, None, COL['lampion'], square=False))
write('svg/mark-mono.svg', mark_svg(512, None, 'currentColor', square=False))
write('svg/print-mark.svg', mark_svg(512, None, '#000000', square=False, title='Klapklaar beeldmerk (drukbestand, 1 kleur)'))
write('svg/print-icon.svg', icon_stamp())
write('svg/apple-touch-icon.svg', mark_svg(180, COL['inkt'], COL['lampion'], share=0.64, rx=0, title='Klapklaar'))   # iOS rounds the corners
for old in ('svg/mark-klein.svg', 'svg/print-mark-klein.svg'):   # v7: replaced by the heavy beeldmerk and the pixel icons
    if os.path.exists(os.path.join(B, old)): os.remove(os.path.join(B, old))

meta['mark'] = {'what': 'beeldmerk = de zware tent-A los (v7.1); vierkant icoon: mark.svg (vanaf 48 px), favicon.svg (32-raster, 24-47 px), svg/favicon-16.svg (tot 23 px)',
                'pole_units': p['TZ_LEG'], 'band_units': p['TZ_BAND'], 'seam_units': p['TZ_SEAM'], 'icon_tent_height_share': ICON_SHARE,
                'min_width_mm': min_sizes(p['T_W'], min(p['TZ_LEG'], p['TZ_BAND']), p['TZ_SEAM'])}

# ------------------------------------------------------------------ favicons (drawn on the pixel grid, v7.1)
def P_(pts): return 'M' + 'L'.join(f'{fmt(x)} {fmt(y)}' for x, y in pts) + 'z'

def fav32(cart=False):
    # the heavy tent-A on the 32 grid: roof 50 deg from y 16 to a 1.4 px flat peak on row 3, 1 px seam, 3 px valance
    # (rows 17-19) with two 1.7 px scallops, 3 px poles one pixel in from the valance ends, feet on row 29.
    d = (P_([(5, 16), (15.3, 3), (16.7, 3), (27, 16)]) + 'M5 17h22v3h-22z'
         + 'M9 20h7c-0.6 2.3-6.4 2.3-7 0zM16 20h7c-0.6 2.3-6.4 2.3-7 0z'
         + P_([(6, 20), (9, 20), (9, 29), (6, 29)]) + P_([(23, 20), (26, 20), (26, 29), (23, 29)]))
    s = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" role="img"><title>Klapklaar</title>'
         f'<rect width="32" height="32" rx="7" fill="{COL["inkt"]}"/><path fill="{COL["lampion"]}" d="{d}"/>')
    if cart: s += f'<circle cx="25.5" cy="6.5" r="5" fill="{COL["inkt"]}"/><circle cx="25.5" cy="6.5" r="3.6" fill="{COL["zand"]}"/>'
    return s + '</svg>'

def fav16(cart=False):
    # 16 grid: roof 50 deg from y 8 to a 1 px flat peak at y 1.5, 1 px seam, 2 px valance with one scallop, 2 px poles to row 14
    d = (P_([(2, 8), (7.5, 1.5), (8.5, 1.5), (14, 8)]) + 'M2 9h12v2h-12z' + 'M5 11h6c-0.4 1.5-5.6 1.5-6 0z'
         + P_([(3, 11), (5, 11), (5, 14), (3, 14)]) + P_([(11, 11), (13, 11), (13, 14), (11, 14)]))
    s = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" role="img"><title>Klapklaar</title>'
         f'<rect width="16" height="16" rx="3.5" fill="{COL["inkt"]}"/><path fill="{COL["lampion"]}" d="{d}"/>')
    if cart: s += f'<circle cx="12.5" cy="3.5" r="3" fill="{COL["inkt"]}"/><circle cx="12.5" cy="3.5" r="2.1" fill="{COL["zand"]}"/>'
    return s + '</svg>'

write('favicon.svg', fav32()); write('svg/favicon-16.svg', fav16())
write('svg/favicon-cart.svg', fav32(True)); write('svg/favicon-cart-16.svg', fav16(True))

# ------------------------------------------------------------------ bunting (vlaggenlijn)
def bunting(name, cols):
    w, h = 320, 30
    def q(tt): return (w * tt, (1 - tt) ** 2 * 4 + 2 * (1 - tt) * tt * 14 + tt * tt * 4)
    line = Path(q(0))
    for i in range(1, 41): line.L(q(i / 40))
    n = 13; per = {c: [] for c in cols}
    for i in range(n):
        t0 = (i + 0.18) / n; t1 = (i + 0.82) / n
        a, b = q(t0), q(t1); m = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + (17 if i % 2 == 0 else 13))
        per[cols[i % len(cols)]].append(P_([a, b, m]))
    s = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" role="img"><title>Vlaggenlijn</title>'
    s += f'<path fill="none" stroke="{COL["inkt"] if len(cols) == 1 else COL["zand"]}" stroke-width="1.5" d="M' + ' L'.join(f'{fmt(x)} {fmt(y)}' for x, y in line.flatten()) + '"/>'
    for c, ds in per.items(): s += f'<path fill="{c}" d="{"".join(ds)}"/>'
    return s + '</svg>'

write('svg/vlaggenlijn.svg', bunting('v', [COL['lampion']]))
write('svg/vlaggenlijn-inkt.svg', bunting('vi', [COL['lampion'], COL['zand']]))

# ------------------------------------------------------------------ meta
meta.pop('_parts')
meta['params'] = p
meta['kern'] = {f'{a}|{b}': v for (a, b), v in G.KERN.items()}
# switch by eye (proto sheet at 1x and 2x): below 160 px three 40-unit scallops are < 1.3 px and blur into a line, and a
# 70-unit pole drops under 2.2 px; logo-klein (heavy tent-A: 108-unit poles, 82 band, two 50-unit scallops, 60 seam, +34
# space) holds down to 96 px. One colour always uses the heavy tent-A, at every size.
meta['switch'] = {'logo.svg': 'vanaf 160 px breed (twee kleuren)', 'logo-klein': '96–159 px', 'mark': 'onder 96 px, of als het woordmerk niet past',
                  'icoon': 'mark.svg vanaf 48 px; favicon.svg (32-raster) 24–47 px; svg/favicon-16.svg tot 23 px',
                  'een_kleur': 'altijd de zware tent-A: svg/logo-mono.svg, svg/logo-on-lampion.svg, svg/print-*.svg, logo-zakelijk',
                  'technisch_minimum_px': {v: meta['wordmark'][v]['min_width_mm']['Scherm (px)'] for v in ('primary', 'klein')}}
json.dump(meta, open(os.path.join(B, 'tools', 'logo-meta.json'), 'w'), indent=1, ensure_ascii=False)
print(json.dumps({k: meta[k] for k in ('angles_deg', 'switch', 'tent')}, ensure_ascii=False))
for v in ('primary', 'klein'):
    w = meta['wordmark'][v]
    print(v, w['viewBox'], 'stroke', w['thinnest_stroke_units'], 'gap', w['smallest_opening_units'], 'gaps', [(g['pair'], g['units'], g['white_units']) for g in w['letter_gaps']])
    print('  min', w['min_width_mm'])
print('mark', meta['mark'])
print('tent_zwaar', meta['tent_zwaar'])
print('primary_een_kleur', meta['wordmark']['primary_een_kleur']['min_width_mm'], meta['wordmark']['primary_een_kleur']['letter_gaps'])
