"""Fill tools/sheet.template.html -> brand-sheet.html (v3): swatches, contrast tables, construction drawing,
reproduction table, minimum sizes, render colour check.   python3 build_sheet.py <brand-dir>"""
import json, os, re, sys
T = os.path.dirname(os.path.abspath(__file__))
B = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(T)
TOOLS = os.path.join(B, 'tools')
tok = json.load(open(os.path.join(B, 'tokens.json')))
con = json.load(open(os.path.join(TOOLS, '_contrast.json')))
meta = json.load(open(os.path.join(TOOLS, 'logo-meta.json')))
rep = json.load(open(os.path.join(TOOLS, '_repro.json')))
rchk = json.load(open(os.path.join(TOOLS, '_render_check.json'))) if os.path.exists(os.path.join(TOOLS, '_render_check.json')) else {}
sys.path.insert(0, T)
from contrast import cr

col = tok['color']
def hexof(n): return col[n]['value']
def nm(k): return k.replace('-', ' ').capitalize()
def nl(x, d=2): return (f'{x:.{d}f}').replace('.', ',')

# ---------------------------------------------------------------- swatches grouped by role family
FAMS = [('merk & kopen', ['klaproos', 'klaproos-donker']), ('feest & voordeel', ['zon']), ('vertrouwen', ['polder', 'mos']),
        ('tekst', ['inkt', 'kiezel']), ('vlak', ['zand', 'duin', 'linnen', 'studio', 'wit', 'lijn']),
        ('fout', ['bordeaux', 'foutroze']), ('wachten', ['oker', 'okerlicht'])]
def best_text(bg): return max(['#1D2420', '#FBF6EC', '#FFFFFF'], key=lambda c: cr(c, hexof(bg)))
sw = []
for fam, keys in FAMS:
    for k in keys:
        h = hexof(k); fg = best_text(k); r = cr(fg, h)
        border = 'box-shadow:inset 0 0 0 1px #E4D6BE;' if k in ('wit', 'zand', 'studio', 'linnen', 'foutroze', 'mos', 'okerlicht', 'duin', 'lijn') else ''
        sw.append(f'<div class="sw"><div class="c" style="background:{h};color:{fg};{border}"><span>Aa</span><span class="ratio">{nl(r)}:1</span></div>'
                  f'<div class="t"><span class="fam">{fam}</span><b>{nm(k)}</b><code>{h}</code><div class="role">{col[k]["role"]}</div></div></div>')

def pv(fg, bg, label): return f'<span class="pv" style="background:{bg};color:{fg}">{label}</span>'
def row(x):
    res = ('AAA' if x['aaa'] else 'AA') if x['kind'] == 'text' else ('AA groot' if x['kind'] == 'large' else '≥ 3:1')
    return (f'<tr><td>{pv(x["fg_hex"], x["bg_hex"], nm(x["fg"]) + " op " + x["bg"].replace("-", " "))}</td>'
            f'<td class="muted u">{x["use"]}</td><td class="r">{nl(x["ratio"])}:1</td><td class="pass">{res}</td></tr>')
rows_text = ''.join(row(x) for x in con['rows'] if x['kind'] in ('text', 'large'))
rows_ui = ''.join(row(x) for x in con['rows'] if x['kind'] == 'ui')
rows_forb = ''.join(f'<tr><td>{pv(hexof(f["fg"]), hexof(f["bg"]), nm(f["fg"]) + " op " + f["bg"])}</td><td class="muted u">{f["use"]}</td>'
                    f'<td class="r" style="color:var(--bordeaux)">{nl(f["ratio"])}:1</td><td class="no-go">nee</td></tr>' for f in con['forbidden'])
SEP = con['separation']

# ---------------------------------------------------------------- construction drawing
svg = open(os.path.join(B, 'logo.svg')).read()
paths = re.findall(r'<path fill="([^"]+)" d="([^"]+)"/>', svg)
vw, vh = map(float, re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', svg).groups())
G = meta['wordmark']['guides']
bl, xh, asc, desc = G['baseline_y'], G['xheight_y'], G['ascender_y'], G['descender_y']
P = 16; R = '#982A0E'; LBLW = 92
g = [f'<svg viewBox="{-P} {-P} {vw + 2*P + LBLW} {vh + 2*P + 16}" role="img" aria-label="Constructie van het Klapklaar-logo met maatlijnen">']
for f, d in paths:
    g.append(f'<path fill="{f}" fill-opacity=".93" d="{d}"/>')
def hl(y, label):
    g.append(f'<line x1="{-P}" x2="{vw + 6}" y1="{y}" y2="{y}" stroke="{R}" stroke-width=".35" stroke-dasharray="3 3"/>')
    g.append(f'<text x="{vw + 9}" y="{y + 1.8}" font-family="Figtree" font-weight="700" font-size="5.2" fill="#5D625C">{label}</text>')
hl(asc, 'stok = luifelrand · 712'); hl(xh, 'x-hoogte · 500'); hl(bl, 'basislijn · 0'); hl(desc, 'onderstok · −196')
hl(G['roofbase_y'], 'dakvoet · 777')
def label(x, y, t, anchor='start', size=4.8, fill=R):
    g.append(f'<text x="{x:.2f}" y="{y:.2f}" text-anchor="{anchor}" font-family="Figtree" font-weight="800" font-size="{size}" fill="{fill}">{t}</text>')
def ext(p, q, a, b):
    dx, dy = q[0] - p[0], q[1] - p[1]
    return (p[0] - dx * a, p[1] - dy * a, q[0] + dx * b, q[1] + dy * b)
for key in ('k1', 'l2'):
    x0, y0, x1, y1 = G[key]
    a = ext((x0, y0), (x1, y1), 0.9, 1.2)
    g.append(f'<line x1="{a[0]:.2f}" y1="{a[1]:.2f}" x2="{a[2]:.2f}" y2="{a[3]:.2f}" stroke="{R}" stroke-width=".55"/>')
    label(x0 - 2, y0 - 6, '21°', 'end')
rx0, ry0, rx1, ry1 = G['roof_left']
a = ext((rx0, ry0), (rx1, ry1), 0.3, 0.05)
g.append(f'<line x1="{a[0]:.2f}" y1="{a[1]:.2f}" x2="{a[2]:.2f}" y2="{a[3]:.2f}" stroke="{R}" stroke-width=".55"/>')
label(rx0 + 10, ry0 - 9, '21°', 'end')
bx0, by0, bx1, by1 = G['band']; st, gp = G['stem'], G['gap']
# band thickness = stem
g.append(f'<path d="M{bx1+3:.2f} {by0:.2f}h2.2v{st:.2f}h-2.2" fill="none" stroke="{R}" stroke-width=".5"/>'); label(bx1 + 7, by0 + st / 2 + 1.7, '130')
# roof gap = 65
g.append(f'<path d="M{bx1-14:.2f} {G["roofbase_y"]:.2f}v{gp:.2f}" stroke="{R}" stroke-width=".9"/>'); label(bx1 - 16, G['roofbase_y'] + gp / 2 + 1.7, '65', 'end')
# l - band opening = 65
yb = by0 + st / 2
g.append(f'<path d="M{G["l2_right"]:.2f} {yb:.2f}h{gp:.2f}" stroke="{R}" stroke-width=".9"/>'); label(G['l2_right'] + gp / 2, yb - 2.8, '65', 'middle')
# pole width = 65
xm = G['xm']
g.append(f'<path d="M{xm - gp/2:.2f} {G["poletop_y"] - 3:.2f}h{gp:.2f}" stroke="{R}" stroke-width=".9"/>'); label(xm - gp / 2 - 2, G['poletop_y'] - 1, '65', 'end')
# stem of second l = 130
lx = G['l2'][0]
g.append(f'<path d="M{lx:.2f} {bl+3:.2f}v2.2h{st:.2f}v-2.2" fill="none" stroke="{R}" stroke-width=".5"/>'); label(lx + st / 2, bl + 10, '130', 'middle')
a0, a1 = G['aa']
g.append(f'<path d="M{a0:.2f} {bl+3:.2f}v2.2H{a1:.2f}v-2.2" fill="none" stroke="{R}" stroke-width=".5"/>'); label((a0 + a1) / 2, bl + 10, 'luifelband = precies de aa', 'middle')
g.append('</svg>')
construct = '\n'.join(g)

# ---------------------------------------------------------------- schemes
sch = []
for name, v in tok['shopify_color_schemes'].items():
    sb = v.get('secondary_button_border')
    sec_style = f'background:{v["secondary_button"]};color:{v["secondary_button_label"]};' + (f'box-shadow:inset 0 0 0 1.5px {sb};' if sb else '')
    sch.append(f'<div class="scheme" style="background:{v["background"]};color:{v["foreground"]}">'
               f'<div class="sn">{name}</div>'
               f'<span class="mini" style="background:{v["primary_button"]};color:{v["primary_button_label"]}">Knop</span> '
               f'<span class="mini" style="{sec_style}">Tweede</span></div>')

# ---------------------------------------------------------------- reproduction table
RC = rep['colors']
def cmyk(v): return ' '.join(f'{c}{x}' for c, x in zip('CMYK', v))
rep_rows = []
for k in ('klaproos', 'zon', 'polder', 'inkt', 'zand'):
    e = RC[k]; h = e['hex']
    fg = best_text(k)
    pc = e['pantone_c'][0]; tcx = e['pantone_tcx'][0]; ra = e['ral_a'][0]; rb = e['ral_b'][0]; ora = e['oracal651'][0]
    ral = rb['name'].split(' (')[0]
    ral_note = '' if ra['name'].split(' ')[1] == rb['name'].split(' ')[1] else f'<br><span class="muted">bron A: {ra["name"]} (ΔE {nl(ra["de"],1)})</span>'
    pcu = pc['name'].replace(' C', ' U') if pc['name'][0].isdigit() else pc['name'].replace(' C', ' U')
    rep_rows.append(
        f'<tr><td><span class="dot" style="background:{h}"></span><b>{nm(k)}</b><br><code>{h}</code></td>'
        f'<td class="num">L {nl(e["lab_d50"][0],1)}<br>a {nl(e["lab_d50"][1],1)} · b {nl(e["lab_d50"][2],1)}</td>'
        f'<td class="num">{cmyk(e["cmyk_fogra39"])}<br><span class="muted">ongestr.: {cmyk(e["cmyk_fogra29"])}</span></td>'
        f'<td><b>{pc["name"]}</b> <span class="de">ΔE {nl(pc["de"],1)}</span><br><span class="muted">{pcu}: kiezen op de U-waaier</span></td>'
        f'<td><b>{tcx["name"].split(" TCX ")[0]} TCX</b> <span class="de">ΔE {nl(tcx["de"],1)}</span><br><span class="muted">{tcx["name"].split(" TCX ")[1]}</span></td>'
        f'<td><b>{ral}</b> <span class="de">ΔE {nl(rb["de"],1)}</span>{ral_note}</td>'
        f'<td><b>{ora["name"].replace("ORACAL ", "")}</b> <span class="de">ΔE {nl(ora["de"],1)}</span></td>'
        f'<td class="sign">______</td></tr>')
rep_table = ''.join(rep_rows)

# ---------------------------------------------------------------- minimum sizes
WM, MK = meta['wordmark'], meta['mark']
methods = [m for m in WM['primary']['min_sizes'] if m != 'scherm']
ms_rows = []
for m in methods:
    d = WM['primary']['min_sizes'][m]
    ms_rows.append(f'<tr><td><b>{d["label"]}</b></td><td class="num muted">{nl(d["stroke_mm"],2).rstrip("0").rstrip(",")} / {nl(d["gap_mm"],2).rstrip("0").rstrip(",")} mm</td>'
                   f'<td class="r">{WM["primary"]["min_sizes"][m]["min_width_mm"]} mm</td><td class="r">{WM["klein"]["min_sizes"][m]["min_width_mm"]} mm</td>'
                   f'<td class="r">{MK["primary"]["min_sizes"][m]["min_width_mm"]} mm</td><td class="r">{MK["klein"]["min_sizes"][m]["min_width_mm"]} mm</td></tr>')
ms_rows.append(f'<tr class="screen"><td><b>Scherm</b></td><td class="num muted">2 px / 1,5 px</td>'
               f'<td class="r">{WM["primary"]["min_sizes"]["scherm"]["min_width_px"]} px</td><td class="r">{WM["klein"]["min_sizes"]["scherm"]["min_width_px"]} px</td>'
               f'<td class="r">{MK["primary"]["min_sizes"]["scherm"]["min_width_px"]} px</td><td class="r">{MK["klein"]["min_sizes"]["scherm"]["min_width_px"]} px</td></tr>')
ms_table = ''.join(ms_rows)
feat = (f'logo.svg: kleinste lijn {WM["primary"]["smallest_stroke_units"]:.0f} eenheden (de vlaggenstok), kleinste opening {WM["primary"]["smallest_gap_units"]:.0f} ({WM["primary"]["smallest_gap_between"].replace("letter ", "").replace("0", "").replace("1", "")}) '
        f'op {WM["primary"]["width_units"]:.0f} breed. logo-klein: {WM["klein"]["smallest_stroke_units"]:.0f} / {WM["klein"]["smallest_gap_units"]:.0f} op {WM["klein"]["width_units"]:.0f}.')

# ---------------------------------------------------------------- render colour check
def rc_block():
    if not rchk: return '<p class="muted">Nog niet gemeten.</p>'
    r = rchk['tent-3x3-klaproos-hero.webp']
    cells = ''.join(f'<div class="rcell"><span class="chipc" style="background:{r[k]["hex"]}"></span><b>{lab}</b><code>{r[k]["hex"]}</code><span class="de">ΔE {nl(r[k]["de2000"],1)}</span></div>'
                    for k, lab in (('lit', 'belicht dakvlak'), ('mid', 'middentoon'), ('shade', 'schaduwvlak')))
    return (f'<div class="rgrid"><div class="rcell"><span class="chipc" style="background:{r["target"]["hex"]}"></span><b>Klaproos-staal</b><code>{r["target"]["hex"]}</code><span class="de">doel</span></div>{cells}</div>'
            f'<p class="cap">Gemeten op img/tent-3x3-klaproos-hero.webp (render met ingangskleur {tok["render"]["klaproos_albedo"]}, afwerking mat): gemiddelde in lineair licht van de verzadigde dakpixels, per lichtheidsband. '
            f'Eis: belicht vlak ΔE<sub>00</sub> ≤ 3. Ter vergelijking v2 (zelfde meting, staal #BE3A1D): belicht vlak {rchk["v2"]["lit"]["hex"]} (ΔE {nl(rchk["v2"]["lit"]["de2000"],1)}), middentoon {rchk["v2"]["mid"]["hex"]} (ΔE {nl(rchk["v2"]["mid"]["de2000"],1)}). Oorzaak was witte glans op het doek; de afwerking ‘mat’ en een gemeten ingangskleur lossen dat op.</p>')

html = open(os.path.join(T, 'sheet.template.html')).read()
rep_map = {
  '{{SWATCHES}}': ''.join(sw), '{{ROWS_TEXT}}': rows_text, '{{ROWS_UI}}': rows_ui, '{{ROWS_FORBIDDEN}}': rows_forb,
  '{{CONSTRUCT}}': construct, '{{PAIRS_N}}': str(len(con['rows'])), '{{SCHEMES}}': ''.join(sch),
  '{{REPRO_TABLE}}': rep_table, '{{MINSIZE_TABLE}}': ms_table, '{{FEATURES}}': feat, '{{RENDER_CHECK}}': rc_block(),
  '{{SEP_DE}}': nl(SEP['klaproos_vs_bordeaux']['de2000'], 1), '{{SEP_HK}}': nl(SEP['klaproos_vs_bordeaux']['hue_klaproos'], 0),
  '{{SEP_HB}}': nl(SEP['klaproos_vs_bordeaux']['hue_bordeaux'], 0), '{{HOVER_CR}}': nl(SEP['klaproos_vs_inkt_hover']['contrast']),
  '{{MIN_LOGO_PX}}': str(WM['primary']['min_sizes']['scherm']['min_width_px']), '{{MIN_KLEIN_PX}}': str(WM['klein']['min_sizes']['scherm']['min_width_px']),
  '{{MIN_MARK_PX}}': str(MK['primary']['min_sizes']['scherm']['min_width_px']),
  '{{EMB_LOGO}}': str(WM['primary']['min_sizes']['borduren']['min_width_mm']), '{{EMB_KLEIN}}': str(WM['klein']['min_sizes']['borduren']['min_width_mm']),
  '{{FLOCK_LOGO}}': str(WM['primary']['min_sizes']['flock']['min_width_mm']), '{{FLOCK_KLEIN}}': str(WM['klein']['min_sizes']['flock']['min_width_mm']),
  '{{EMB_MARK}}': str(MK['klein']['min_sizes']['borduren']['min_width_mm']),
  '{{K_ALBEDO}}': tok['render']['klaproos_albedo'],
}
for k, v in rep_map.items(): html = html.replace(k, v)
left = re.findall(r'\{\{[A-Z_]+\}\}', html)
if left: sys.exit(f'unfilled placeholders: {left}')
open(os.path.join(B, 'brand-sheet.html'), 'w').write(html)
print('ok', len(html))
