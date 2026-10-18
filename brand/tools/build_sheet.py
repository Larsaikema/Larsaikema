"""Render brand-sheet.html (v7) from tools/sheet.template.html with the real files, tokens and measurements.

    python3 build_sheet.py <brand-dir>
    node shot.mjs file://<brand-dir>/brand-sheet.html <brand-dir>/brand-sheet.png 1440 900 1

The sheet links fonts/ and img/ relatively, so open it from the brand folder.
"""
import json, os, re, sys, math
import jinja2
import kkgeo as G

B = sys.argv[1]
T = os.path.join(B, 'tools')
TOK = json.load(open(os.path.join(B, 'tokens.json')))
CON = json.load(open(os.path.join(T, '_contrast.json')))
META = json.load(open(os.path.join(T, 'logo-meta.json')))
REC = json.load(open(os.path.join(T, '_recognition_proxy.json')))

def raw(rel):
    s = open(os.path.join(B, rel)).read()
    return re.sub(r'<title>.*?</title>', '', s)

def inner(rel):
    s = raw(rel)
    return re.search(r'<svg[^>]*>(.*)</svg>', s, re.S).group(1), re.search(r'viewBox="([^"]+)"', s).group(1)

def sized(rel, cls='', style='', label='Klapklaar'):
    s = raw(rel)
    extra = f' class="{cls}"' if cls else ''
    extra += f' style="{style}"' if style else ''
    return s.replace('<svg ', f'<svg aria-label="{label}"{extra} ', 1)

files = ['logo.svg', 'logo-inverse.svg', 'mark.svg', 'favicon.svg', 'svg/logo-klein.svg', 'svg/logo-klein-inverse.svg',
         'svg/logo-mono.svg', 'svg/logo-klein-mono.svg', 'svg/logo-on-lampion.svg', 'svg/logo-klein-on-lampion.svg',
         'svg/logo-luifel.svg', 'svg/logo-luifel-inverse.svg', 'svg/logo-zakelijk.svg', 'svg/logo-zakelijk-inverse.svg',
         'svg/mark-lampion.svg', 'svg/mark-zand.svg', 'svg/mark-symbool.svg', 'svg/mark-mono.svg', 'svg/print-icon.svg', 'svg/apple-touch-icon.svg',
         'svg/favicon-16.svg', 'svg/favicon-cart.svg', 'svg/favicon-cart-16.svg', 'svg/vlaggenlijn.svg', 'svg/vlaggenlijn-inkt.svg',
         'svg/print-luifel.svg', 'svg/print-mark.svg', 'svg/print-wordmark.svg', 'svg/logo-inline.svg', 'svg/logo-klein-inline.svg']
def _mk(f):
    return lambda cls='', style='', label='Klapklaar': sized(f, cls, style, label)
S = {re.sub(r'[^a-z0-9]+', '_', f.replace('svg/', '').replace('.svg', '')): _mk(f) for f in files}

# ---------------------------------------------------------------- construction guides (svg units of logo.svg)
P = dict(G.P)
letters, tent, W, items = G.wordmark(P)
pts = [q for c in letters + tent for q in c.flatten(16)]
x0 = min(q[0] for q in pts); top = max(q[1] for q in pts)
SC = 0.1
X = lambda x: round((x - x0) * SC, 2)
Y = lambda y: round((top - y) * SC, 2)
tx = [x for tok, x, g, ps, pr in items if tok == 'TENT'][0]
la_x = [x for tok, x, g, ps, pr in items if tok == 'LA'][1]
la = G.glyph_LA(P)
td = G.tent_dims(P)
guide = {
    'vb_w': round((max(q[0] for q in pts) - x0) * SC, 2), 'vb_h': round(top * SC, 2),
    'cap': Y(700), 'base': Y(0), 'peak': Y(top), 'bar_top': Y(P['A_BAR']), 'bar_bot': Y(P['A_BAR'] - P['BAR'] * 0.92), 'cusp': Y(td['cusp']),
    'tent_x0': X(tx), 'tent_x1': X(tx + P['T_W']), 'tent_mid': X(tx + P['T_W'] / 2),
    'a_x0': X(la_x + P['W_L'] - P['LA_TUCK']), 'stem_w': round(P['STEM'] * SC, 2),
    'pole_x0': X(tx + P['T_INSET']), 'pole_x1': X(tx + P['T_INSET'] + P['T_LEG']),
    'join_x': X(la_x + la.info['join_x']), 'join_y': Y(P['BAR']),
    'over_units': round(top - 700, 1), 'over_pct': round((top - 700) / 7, 1),
}
def _d(paths, sc=0.1, ox=0.0, topy=None):
    topy = topy if topy is not None else top
    out = []
    for c in paths:
        P_ = lambda q: ((q[0] - ox) * sc, (topy - q[1]) * sc)
        x, y = P_(c.start); out.append(f'M{x:.2f} {y:.2f}')
        for sg in c.segs:
            if sg[0] == 'L': x, y = P_(sg[1]); out.append(f'L{x:.2f} {y:.2f}')
            else: out.append('C' + ' '.join(f'{P_(q)[0]:.2f} {P_(q)[1]:.2f}' for q in sg[1:]))
        out.append('Z')
    return ''.join(out)
tg = G.glyph_tent(P)
tt = max(q[1] for c in tg.paths for q in c.flatten(16))
A = G.glyph_A(P)
TX0 = (P['W_A'] + 90) * 0.1        # the regular A first, then the tent, as in the word
tent_detail = {'d': _d(tg.paths, ox=-(P['W_A'] + 90), topy=tt), 'a_d': _d(A.paths, topy=tt), 'w': P['T_W'] * 0.1, 'x0': TX0, 'peak': 0.0, 'cap': round((tt - 700) * 0.1, 2),
               'base': round(tt * 0.1, 2), 'vt': round((tt - td['val_top']) * 0.1, 2), 'cu': round((tt - td['cusp']) * 0.1, 2), 'tips': round((tt - td['tips']) * 0.1, 2),
               'pole0': TX0 + P['T_INSET'] * 0.1, 'pole1': TX0 + (P['T_INSET'] + P['T_LEG']) * 0.1, 'a_w': P['W_A'] * 0.1, 'x1': TX0 + P['T_W'] * 0.1}

# ---------------------------------------------------------------- recognition strip (silhouettes, 32 px)
def raster_svg(paths):
    xs = [q[0] for c in paths for q in c.flatten(16)]; ys = [q[1] for c in paths for q in c.flatten(16)]
    w, h = max(xs) - min(xs), max(ys) - min(ys); s = max(w, h)
    ox = min(xs) - (s - w) / 2; oy = max(ys) + (s - h) / 2
    d = []
    for c in paths:
        pt = lambda q: ((q[0] - ox) / s * 100, (oy - q[1]) / s * 100)
        x, y = pt(c.start); d.append(f'M{x:.2f} {y:.2f}')
        for sg in c.segs:
            if sg[0] == 'L': x, y = pt(sg[1]); d.append(f'L{x:.2f} {y:.2f}')
            else: d.append('C' + ' '.join(f'{pt(q)[0]:.2f} {pt(q)[1]:.2f}' for q in sg[1:]))
        d.append('Z')
    return ''.join(d)
tgz = G.glyph_tent_zwaar(P)
rec = {'v7': raster_svg(tg.paths), 'v71': raster_svg(tgz.paths), 'rows': REC['rows']}
# generic pictograms of the wrong readings, same geometry as tools/recognition.py (24 grid, y down)
def _tangent(apex, cx, cy, r):
    dx, dy = cx - apex[0], cy - apex[1]; dd = math.hypot(dx, dy); a = math.atan2(dy, dx); b = math.asin(r / dd); t = math.sqrt(dd * dd - r * r)
    return [apex, (apex[0] + t * math.cos(a - b), apex[1] + t * math.sin(a - b)), (cx, cy), (apex[0] + t * math.cos(a + b), apex[1] + t * math.sin(a + b))]
def _poly(pts): return 'M' + 'L'.join(f'{x:.2f} {y:.2f}' for x, y in pts) + 'Z'
rec['spade'] = (f'<circle cx="7.6" cy="13.2" r="4.6"/><circle cx="16.4" cy="13.2" r="4.6"/><path d="{_poly([(12, 2), (4.0, 10.4), (12, 15), (20.0, 10.4)])}"/>'
                f'<path d="{_poly([(10.8, 14), (9, 22), (15, 22), (13.2, 14)])}"/>')
rec['drop'] = f'<circle cx="12" cy="15" r="7"/><path d="{_poly(_tangent((12, 2), 12, 15, 7))}"/>'

# ---------------------------------------------------------------- the heavy tent-A beside the slender one (one colour)
tzd = G.tent_zwaar_dims(P)
ttop = max(tt, max(q[1] for c in tgz.paths for q in c.flatten(16)))
GAP = 120
zwaar = {'slank_d': _d(tg.paths, topy=ttop), 'zwaar_d': _d(tgz.paths, ox=-(P['T_W'] + GAP), topy=ttop), 'w': P['T_W'] * 0.1, 'x0': (P['T_W'] + GAP) * 0.1,
         'y': lambda v: round((ttop - v) * 0.1, 2), 'dims': tzd, 'p': P}
# v7 one colour (slender tent merged with the letters) next to v7.1 (heavy tent), for the before/after strip
def one_colour_svg(letters, tent, fill):
    pts = [q for c in letters + tent for q in c.flatten(12)]
    x0_, x1_ = min(q[0] for q in pts), max(q[0] for q in pts); y0_, y1_ = min(q[1] for q in pts), max(q[1] for q in pts)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {(x1_ - x0_) * 0.1:.2f} {(y1_ - y0_) * 0.1:.2f}" style="display:block;width:{{w}}px;height:auto" aria-label="Klapklaar">'
            f'<path fill="{fill}" d="{_d(letters + tent, ox=x0_, topy=y1_)}"/></svg>')
_l, _t, _w, _i = G.wordmark(P, extra=34, tent_kw={'leg': 86, 'scallops': 2})
v7_klein_mono = one_colour_svg(_l, _t, '#1D2420')
_l, _t, _w, _i = G.wordmark(P)
v7_mono = one_colour_svg(_l, _t, '#1D2420')

# ---------------------------------------------------------------- data for the template
col = TOK['color']
H = {k: v['value'] for k, v in col.items()}
H.update({k: v['value'] for k, v in TOK['color_derived'].items()})
rows = CON['rows']
def ratio(fg, bg, kind=None):
    for r in rows:
        if r['fg'] == fg and r['bg'] == bg and (kind is None or r['kind'] == kind): return r['ratio']
    from contrast import cr
    return round(cr(H[fg], H[bg]), 2)
sw_meta = {
    'lampion': ('inkt', 'Inkt op Lampion'), 'inkt': ('wit', 'Wit op Inkt'), 'zand': ('inkt', 'Inkt op Zand'),
    'wit': ('inkt', 'Inkt op Wit'), 'linnen': ('inkt', 'Inkt op Linnen'), 'lijn': (None, 'decoratief'), 'kiezel': ('wit', 'Kiezel op Wit'),
    'zon': ('inkt', 'Inkt op Zon'), 'polder': ('wit', 'Polder op Wit'), 'oker': ('wit', 'Oker op Wit'), 'bordeaux': ('wit', 'Bordeaux op Wit')}
swatches = []
for k, v in col.items():
    other, lab = sw_meta[k]
    if other is None: r = None
    elif k in ('kiezel', 'polder', 'oker', 'bordeaux'): r = ratio(k, other)
    else: r = ratio(other, k)
    fg = '#FFFFFF' if k in ('inkt', 'kiezel', 'polder', 'oker', 'bordeaux') else H['inkt']
    swatches.append({'key': k, 'name': k.capitalize(), 'hex': v['value'], 'family': v['family'], 'role': v['role'], 'ratio': r, 'ratio_label': lab, 'fg': fg})

def fmt(v): return f'{v:.2f}'.replace('.', ',')
LBL = {'buy': 'koop', 'buy_hover': 'koop hover', 'buy_active': 'koop ingedrukt', 'primary': 'hoofd', 'primary_hover': 'hoofd hover',
       'secondary': 'omlijnd', 'secondary_hover': 'omlijnd hover'}
schemes = []
for sid, s in TOK['color_schemes'].items():
    def hx(n): return H[s['background']] if n == 'transparent' else H[n]
    sc = [c for c in CON['scheme_checks'] if c['scheme'] == sid]
    st = []
    for key in ('buy', 'buy_hover', 'primary', 'primary_hover', 'secondary', 'secondary_hover'):
        if key not in s: continue
        b = s[key]
        st.append((LBL[key], hx(b['bg']), H[b['label']], hx(b['border']), key.startswith('buy'), next(c for c in sc if c['state'] == key)))
    schemes.append({'id': sid, 'naam': s['naam'], 'bg': H[s['background']], 'fg': H[s['text']], 'focus': H[s['focus']], 'states': st,
                    'min_label': fmt(min(c['label_ratio'] for c in sc)), 'min_shape': fmt(min(c['shape_ratio'] for c in sc))})

text_rows = [r for r in rows if r['kind'] in ('text', 'large')]
ui_rows = [r for r in rows if r['kind'] == 'ui']
for r in rows: r['r'] = fmt(r['ratio'])
for f in CON['forbidden']: f['r'] = fmt(f['ratio'])

wm = META['wordmark']
nl = lambda v: str(v).replace('.', ',')
d = {
    'H': H, 'swatches': swatches, 'schemes': schemes, 'text_rows': text_rows, 'ui_rows': ui_rows, 'forbidden': CON['forbidden'],
    'n_pairs': len(rows), 'n_fail': sum(not r['pass'] for r in rows), 'n_scheme': len(CON['scheme_checks']),
    'surfaces': CON['surfaces'], 'sep': CON['separation'], 'angles': META['angles_deg'], 'strokes': META['strokes_units'], 'g': guide, 'tentm': META['tent'],
    'switch': META['switch'],
    'min_mm': {'logo': wm['primary']['min_width_mm'], 'logo1': wm['primary_een_kleur']['min_width_mm'], 'klein': wm['klein']['min_width_mm'], 'mark': META['mark']['min_width_mm']},
    'tz': META['tent_zwaar'], 'icon_share': META['mark']['icon_tent_height_share'], 'zwaar': zwaar, 'v7_mono': v7_mono, 'v7_klein_mono': v7_klein_mono,
    'aspect': nl(wm['primary']['aspect']), 'gaps': wm['primary']['letter_gaps'], 'fonts': TOK['font'], 'scale': TOK['type_scale'], 'price': TOK['price_notation'],
    'tent': tent_detail, 'rec': rec, 'nl': nl, 'r_li': fmt(ratio('lampion', 'inkt')),
    'logo_inner': inner('logo.svg')[0], 'logo_vb': inner('logo.svg')[1],
    'icons': open(os.path.join(T, 'icons.svg')).read(),
    'icon_names': [('truck', 'Levering'), ('invoice', 'Factuur'), ('chat', 'App ons'), ('ruler', 'Maatgids'), ('upload', 'Logo uploaden'),
                   ('proof', 'Drukproef'), ('peg', 'Haring'), ('wind', 'Wind'), ('tent', 'Tent'), ('table', 'Statafel'), ('bulb', 'Verlichting'),
                   ('case', 'Zakelijk'), ('cart', 'Winkelwagen'), ('search', 'Zoeken'), ('user', 'Account'), ('plus', 'Meer'), ('min', 'Minder'),
                   ('check', 'Klaar'), ('info', 'Info'), ('alert', 'Let op'), ('clock', 'Levertijd'), ('phone', 'Bellen'), ('return', 'Retour'), ('menu', 'Menu'), ('close', 'Sluiten')],
}
env = jinja2.Environment(loader=jinja2.FileSystemLoader(T), autoescape=False, trim_blocks=True, lstrip_blocks=True)
html = env.get_template('sheet.template.html').render(d=d, S=S, fmt=fmt)
open(os.path.join(B, 'brand-sheet.html'), 'w').write(html)
print('sheet', len(html), 'guides', guide)
