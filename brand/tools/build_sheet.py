"""Fill brand/tools/sheet.template.html -> brand/brand-sheet.html (swatches, contrast tables, construction drawing)."""
import json, os, re
T = os.path.dirname(os.path.abspath(__file__)); B = os.path.dirname(T)
tok = json.load(open(os.path.join(B, 'tokens.json')))
con = json.load(open(os.path.join(T, '_contrast.json')))
meta = json.load(open(os.path.join(T, 'logo-meta.json')))
from contrast import cr

col = tok['color']
def hexof(n): return col[n]['value']
ORDER = ['klaproos', 'zon', 'polder', 'inkt', 'kiezel', 'zand', 'duin', 'linnen', 'studio', 'wit', 'klaproos-donker', 'bordeaux', 'oker', 'foutroze', 'mos']
NAMES = {k: k.replace('-', ' ').capitalize() for k in ORDER}
def best_text(bg):
    return max(['#1D2420', '#FBF6EC', '#FFFFFF'], key=lambda c: cr(c, hexof(bg)))
sw = []
for k in ORDER:
    h = hexof(k); fg = best_text(k)
    r = cr(fg, h)
    border = 'box-shadow:inset 0 0 0 1px #E4D6BE;' if k in ('wit', 'zand', 'studio', 'linnen', 'foutroze', 'mos') else ''
    role = col[k]['role']
    sw.append(f'<div class="sw"><div class="c" style="background:{h};color:{fg};{border}"><span>Aa</span><span class="ratio">{r:.2f}:1</span></div>'
              f'<div class="t"><b>{NAMES[k]}</b><code>{h}</code><div style="margin-top:6px">{role}</div></div></div>')

def row(x):
    return (f'<tr><td><span class="pv" style="background:{x["bg_hex"]};color:{x["fg_hex"]}">{x["fg"]} op {x["bg"]}</span></td>'
            f'<td class="muted" style="font-size:13px">{x["use"]}</td><td class="r">{x["ratio"]:.2f}:1</td>'
            f'<td class="pass">{("AAA" if x["aaa"] else "AA") if x["kind"] == "text" else "≥ 3:1"}</td></tr>')
rows_text = ''.join(row(x) for x in con['rows'] if x['kind'] == 'text')
rows_ui = ''.join(row(x) for x in con['rows'] if x['kind'] == 'ui')
rows_forb = ''.join(f'<tr><td><span class="pv" style="background:{hexof(f["bg"])};color:{hexof(f["fg"])}">{f["fg"]} op {f["bg"]}</span></td><td class="muted" style="font-size:13px">{f["use"]}</td><td class="r" style="color:#8C1D2B">{f["ratio"]:.2f}:1</td><td style="color:#8C1D2B;font-weight:700">nee</td></tr>' for f in con['forbidden'])

# construction drawing: logo paths + guides
svg = open(os.path.join(B, 'logo.svg')).read()
paths = re.findall(r'<path fill="([^"]+)" d="([^"]+)"/>', svg)
vw, vh = meta['viewBox']
bl, xh, asc = meta['baseline_y'], meta['xheight_y'], meta['ascender_y']
desc = vh
P = 14
g = [f'<svg viewBox="{-P} {-P} {vw + 2*P + 66} {vh + 2*P}" role="img" aria-label="Constructie van het Klapklaar-logo">']
def hl(y, label, c='#BE3A1D', dash='4 4'):
    g.append(f'<line x1="{-P}" x2="{vw + P}" y1="{y}" y2="{y}" stroke="{c}" stroke-width=".35" stroke-dasharray="{dash}"/>')
    g.append(f'<text x="{vw + P + 4}" y="{y + 1.8}" font-family="Figtree" font-weight="700" font-size="5.4" fill="#5D625C">{label}</text>')
for f, d in paths:
    g.append(f'<path fill="{"#1D2420" if f == "#1D2420" else "#BE3A1D"}" fill-opacity="{0.92 if f == "#1D2420" else 0.95}" d="{d}"/>')
hl(asc, 'stok = luifelrand 712'); hl(xh, 'x-hoogte 500'); hl(bl, 'basislijn 0'); hl(desc, 'onderstok −196')
G = meta['guides']; R = '#9A2F17'
def ext(p, q, a, b):
    dx, dy = q[0] - p[0], q[1] - p[1]
    return (p[0] - dx * a, p[1] - dy * a, q[0] + dx * b, q[1] + dy * b)
def label(x, y, t, anchor='start', size=5.2, fill=R):
    g.append(f'<text x="{x:.2f}" y="{y:.2f}" text-anchor="{anchor}" font-family="Figtree" font-weight="700" font-size="{size}" fill="{fill}">{t}</text>')
for key in ('cut_k1', 'cut_l2'):
    p, q = G[key]
    x1, y1, x2, y2 = ext(p, q, 0.6, 1.4)
    g.append(f'<line x1="{x1:.2f}" y1="{y1:.2f}" x2="{x2:.2f}" y2="{y2:.2f}" stroke="{R}" stroke-width=".6"/>')
    label(p[0] - 2, p[1] - 4.5, '21°', 'end')
p, q = G['roof_left']
x1, y1, x2, y2 = ext(p, q, 0.25, 0.1)
g.append(f'<line x1="{x1:.2f}" y1="{y1:.2f}" x2="{x2:.2f}" y2="{y2:.2f}" stroke="{R}" stroke-width=".6"/>')
mx, my = p[0] + (q[0] - p[0]) * 0.55, p[1] + (q[1] - p[1]) * 0.55
label(mx - 3, my - 3, '21°', 'end')
bx0, by0, bx1, by1 = G['band']; st = G['stem']
# band thickness bracket (left of the band) and stem width bracket on the second l
g.append(f'<path d="M{bx1+3:.2f} {by0:.2f}h2v{st:.2f}h-2" fill="none" stroke="{R}" stroke-width=".5"/>')
label(bx1 + 7.5, by0 + st/2 + 1.8, '130 = stok', 'start', 4.6)
lx = G['cut_l2'][0][0]
g.append(f'<path d="M{lx:.2f} {bl+3:.2f}v2h{st:.2f}v-2" fill="none" stroke="{R}" stroke-width=".5"/>')
label(lx + st/2, bl + 10, '130', 'middle', 4.6)
a0, a1 = G['aa']
g.append(f'<path d="M{a0:.2f} {bl+3:.2f}v2H{a1:.2f}v-2" fill="none" stroke="{R}" stroke-width=".5"/>')
label((a0 + a1)/2, bl + 10, 'dak = aa + 2 × overstek', 'middle', 4.6)
g.append('</svg>')
construct = '\n'.join(g)

sch = []
for name, v in tok['shopify_color_schemes'].items():
    sch.append(f'<div style="background:{v["background"]};color:{v["foreground"]};border-radius:10px;padding:12px;box-shadow:inset 0 0 0 1px rgba(29,36,32,.12)">'
               f'<div style="font:700 12.5px/1.3 var(--b);margin-bottom:8px">{name}</div>'
               f'<span style="display:inline-block;background:{v["primary_button"]};color:{v["primary_button_label"]};font:700 12px/1 var(--b);padding:7px 9px;border-radius:6px">Knop</span> '
               f'<span style="display:inline-block;background:{v["secondary_button"]};color:{v["secondary_button_label"]};font:700 12px/1 var(--b);padding:7px 9px;border-radius:6px">Tweede</span></div>')
html = open(os.path.join(T, 'sheet.template.html')).read()
html = (html.replace('{{SWATCHES}}', ''.join(sw)).replace('{{ROWS_TEXT}}', rows_text).replace('{{ROWS_UI}}', rows_ui)
        .replace('{{ROWS_FORBIDDEN}}', rows_forb).replace('{{CONSTRUCT}}', construct).replace('{{PAIRS_N}}', str(len(con['rows']))).replace('{{SCHEMES}}', ''.join(sch)))
open(os.path.join(B, 'brand-sheet.html'), 'w').write(html)
print('ok', len(html))
