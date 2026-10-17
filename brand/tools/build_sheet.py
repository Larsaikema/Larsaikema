"""Fill tools/sheet.template.html -> brand-sheet.html (v4): swatches, scheme states, contrast tables, construction
drawing, measured logo features, reproduction table, minimum sizes, render colour check.
    python3 build_sheet.py <brand-dir>"""
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
def hexof(n): return col[n]['value'] if n in col else n
def nm(k): return k.replace('-', ' ').capitalize()
def nl(x, d=2): return (f'{x:.{d}f}').replace('.', ',')
def n0(x): return f'{x:.0f}'

# ---------------------------------------------------------------- swatches grouped by role family
FAMS = [('merk & kopen', ['klaproos', 'klaproos-donker']), ('vlag & voordeel', ['zon']), ('vertrouwen & klaar', ['polder']),
        ('tekst', ['inkt', 'kiezel']), ('vlak', ['zand', 'duin', 'steen', 'wit', 'lijn']), ('fout', ['bordeaux']), ('wachten', ['oker'])]
def best_text(bg): return max(['#1D2420', '#FBF6EC', '#FFFFFF'], key=lambda c: cr(c, hexof(bg)))
sw = []
for fam, keys in FAMS:
    for k in keys:
        h = hexof(k); fg = best_text(k); r = cr(fg, h)
        border = 'box-shadow:inset 0 0 0 1px #E4D6BE;' if k in ('wit', 'zand', 'steen', 'duin', 'lijn') else ''
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

# ---------------------------------------------------------------- colour schemes with every button state
SCH = tok['color_schemes']
checks = {(c['scheme'], c['state']): c for c in con['scheme_checks']}
def btn_style(b, bgname):
    fill = 'transparent' if b['bg'] == 'transparent' else hexof(b['bg'])
    edge = hexof(bgname) if b['border'] == 'transparent' else hexof(b['border'])
    return f'background:{fill};color:{hexof(b["label"])};border-color:{edge}'
sch = []
for sid, s in SCH.items():
    bgn = s['background']
    cells = []
    for st, lab in (('primary', 'rust'), ('primary_hover', 'hover'), ('primary_active', 'ingedrukt'), ('secondary', 'tweede'), ('secondary_hover', 'tweede hover')):
        c = checks[(sid, st)]
        cells.append(f'<span class="sst"><span class="btn sm" style="{btn_style(s[st], bgn)}">{"Knop" if st.startswith("primary") else "Tweede"}</span>'
                     f'<small>{lab} · {nl(c["label_ratio"],1)} / {nl(c["shape_ratio"],1)}</small></span>')
    focus = hexof(s['focus'])
    cells.append(f'<span class="sst"><span class="btn sm" style="{btn_style(s["primary"], bgn)};outline:3px solid {focus};outline-offset:2px">Knop</span><small>focus</small></span>')
    sch.append(f'<div class="scheme" style="background:{hexof(bgn)};color:{hexof(s["text"])}"><div class="sn">{sid} · {s["naam"]}<span>tekst {nl(s["text_ratio"],1)}:1 · hover: {s["hover_change"]["how"]}</span></div>'
               f'<div class="srow">{"".join(cells)}</div></div>')
n_checks = len(con['scheme_checks']); n_fail = sum(1 for c in con['scheme_checks'] if not c['pass'])

surf = ''.join(f'<tr><td>{k.replace("–", " – ").title()}</td><td class="r">{nl(v["de2000"],1)}</td><td class="r">{nl(v["contrast"],2)}:1</td></tr>' for k, v in con['surfaces'].items())

# ---------------------------------------------------------------- construction drawing (v4)
svgsrc = open(os.path.join(B, 'logo.svg')).read()
paths = re.findall(r'<path fill="([^"]+)" d="([^"]+)"/>', svgsrc)
vw, vh = map(float, re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', svgsrc).groups())
G = meta['wordmark']['guides']
P = 18; R = '#982A0E'; LBLW = 104
g = [f'<svg viewBox="{-P} {-P} {vw + 2*P + LBLW} {vh + 2*P + 22}" role="img" aria-label="Constructie van het Klapklaar-logo met maatlijnen">']
for f, d in paths: g.append(f'<path fill="{f}" fill-opacity=".9" d="{d}"/>')
def hl(y, label, dash='3 3'):
    g.append(f'<line x1="{-P}" x2="{vw + 6}" y1="{y}" y2="{y}" stroke="{R}" stroke-width=".35" stroke-dasharray="{dash}"/>')
    g.append(f'<text x="{vw + 9}" y="{y + 1.8}" font-family="Figtree" font-weight="700" font-size="5.2" fill="#5D625C">{label}</text>')
hl(G['ascender_y'], 'stok = bovenrand band · 712'); hl(G['xheight_y'], 'x-hoogte · 500'); hl(G['baseline_y'], 'basislijn · 0 (de tent staat hier)')
hl(G['descender_y'], 'onderstok · −196'); hl(G['band_bottom_y'], 'onderrand band · 582'); hl(G['roofbase_y'], 'dakvoet · 777')
def label(x, y, t, anchor='start', size=5, fill=R):
    g.append(f'<text x="{x:.2f}" y="{y:.2f}" text-anchor="{anchor}" font-family="Figtree" font-weight="800" font-size="{size}" fill="{fill}">{t}</text>')
st, dn = G['stem'], G['dun']
x0, x1, xm = G['x0'], G['x1'], G['xm']
# leg width = DUN: measured across the right leg between the r and the band (y 545), label over the r
yl = G['baseline_y'] - 54.5
g.append(f'<path d="M{x1 - dn:.2f} {yl:.2f}h{dn:.2f}" stroke="{R}" stroke-width="1"/>'); label(x1 + 2.5, yl + 1.8, 'poot DUN 65')
# band = STOK (right of the band, above the r)
g.append(f'<path d="M{x1 + 3:.2f} {G["band_top_y"]:.2f}h2.2v{st:.2f}h-2.2" fill="none" stroke="{R}" stroke-width=".5"/>'); label(x1 + 7, G['band_top_y'] + st / 2 + 1.8, 'band STOK 130')
# roof-band opening = DUN
g.append(f'<path d="M{x1 - 12:.2f} {G["roofbase_y"]:.2f}v{dn:.2f}" stroke="{R}" stroke-width="1"/>'); label(x1 - 14, G['roofbase_y'] + dn / 2 + 1.8, '65', 'end')
# eave = DUN, left of the tent (free space above the l)
g.append(f'<path d="M{x0 - 3:.2f} {G["eavetop_y"]:.2f}h-2.2v{dn:.2f}h2.2" fill="none" stroke="{R}" stroke-width=".5"/>'); label(x0 - 7, G['eavetop_y'] + dn / 2 + 1.8, 'dakrand 65 · 111°', 'end')
# pole = DUN, clearance under the pennant
g.append(f'<path d="M{xm - dn/2:.2f} {G["poletop_y"] - 3:.2f}h{dn:.2f}" stroke="{R}" stroke-width="1"/>'); label(xm - dn / 2 - 2, G['poletop_y'] - 1, 'paal 65', 'end')
fb = G['flagbottom_y']; clr = meta['wordmark']['primary']['flag_roof_clearance_units'] * 0.1
g.append(f'<path d="M{xm + dn/2 + 1.5:.2f} {fb:.2f}v{clr / 0.934:.2f}" stroke="{R}" stroke-width=".8"/>'); label(xm + dn / 2 + 4, fb + 6, f'vrij {n0(meta["wordmark"]["primary"]["flag_roof_clearance_units"])}')
label(xm + dn / 2 + 24, G['poletop_y'] + 4, 'stompe punt 65')
# roof pitch
ry = G['eavetop_y']
g.append(f'<line x1="{x0 + 6:.2f}" y1="{ry - 6 * 0.3839:.2f}" x2="{x0 + 46:.2f}" y2="{ry - 46 * 0.3839:.2f}" stroke="{R}" stroke-width=".55" stroke-dasharray="2 1.5"/>'); label(x0 + 30, ry - 17, '21°', 'middle')
# k / l cut
kx0, ky0, kx1, ky1 = G['k1']
g.append(f'<line x1="{kx0 - 8:.2f}" y1="{ky0 + 8 * 0.3839:.2f}" x2="{kx1 + 14:.2f}" y2="{ky1 - 14 * 0.3839:.2f}" stroke="{R}" stroke-width=".55"/>'); label(kx0 - 2, ky0 - 5, '21°', 'end')
# stem
lx = G['l2_left']
g.append(f'<path d="M{lx:.2f} {G["baseline_y"] + 3:.2f}v2.2h{st:.2f}v-2.2" fill="none" stroke="{R}" stroke-width=".5"/>'); label(lx + st / 2, G['baseline_y'] + 11, '130', 'middle')
# spacing chain l | poot | a ... a | poot | r (below the baseline, second row)
ls = G['legsp']; yb = G['baseline_y'] + 17
for xa, xb, t in ((G['l2_right'], x0, ls['out']), (x0 + dn, G['a1_left'], ls['in_round']), (G['a2_right'], x1 - dn, ls['in_straight']), (x1, G['r_left'], ls['out'])):
    g.append(f'<path d="M{xa:.2f} {yb - 2:.2f}v4M{xb:.2f} {yb - 2:.2f}v4M{xa:.2f} {yb:.2f}H{xb:.2f}" stroke="{R}" stroke-width=".5"/>'); label((xa + xb) / 2, yb + 6.5, str(t), 'middle', 4.6)
g.append('</svg>')
construct = '\n'.join(g)

# ---------------------------------------------------------------- measured features
WM, MK, V3 = meta['wordmark'], meta['mark'], meta['v3_check']
strokes = ''.join(f'<tr><td>{k}</td><td class="r">{v}</td><td class="r">{nl(v / 130, 2)} S</td></tr>' for k, v in meta['strokes'].items())
gp = WM['primary']['gaps_between_shapes']
def pretty(b):
    """'k1 – l2' -> 'k–l (klap)'; 'a7 – frame' -> 'a – poot (links)'; 'frame – dak' -> 'poot/band – dak'."""
    import re as _re
    parts = [p.strip() for p in b.split('–')]
    out, idx = [], []
    for p in parts:
        m = _re.match(r'([a-z])(\d+)$', p)
        if m: out.append(m.group(1)); idx.append(int(m.group(2)))
        else: out.append({'frame': 'poot', 'dak': 'dak', 'tent': 'tent', 'luifelband': 'band'}.get(p, p))
    if 'frame' in parts and 'dak' in parts: return 'band – dak (opening)'
    if idx and len(idx) == 2: return f"{out[0]}–{out[1]} ({'klap' if max(idx) <= 4 else 'klaar' if min(idx) >= 5 else 'klap|klaar'})"
    if idx: return f"{out[0] if parts[0][0].isalpha() and parts[0][-1].isdigit() else out[1]} – poot ({'links' if idx[0] <= 7 and out[0] != 'r' else 'rechts'})" if 'frame' in parts else ' – '.join(out)
    return ' – '.join(out)
gaps = ''.join(f'<tr><td>{pretty(x["between"])}</td><td class="r">{n0(x["units"])}</td></tr>' for x in gp[:9])
def chk(x):
    t = x['thinnest_units']; n = x['narrowest_units']
    tt = 'naaldpunt' if t is not None and t <= 10 else (f'{n0(t)}' if t else '–')
    nn = 'naaldkier' if n is not None and n <= 10 else (f'{n0(n)}' if n else '–')
    return tt, nn
v3t, v3n = chk(V3['wordmark']); v4t, v4n = chk(WM['primary']['raster_check'])
v3mt, v3mn = chk(V3['mark']); v4mt, v4mn = chk(MK['primary']['raster_check'])
rcheck = (f'<tr><td>v3 logo.svg</td><td class="r bad">{v3t}</td><td class="r bad">{v3n}</td><td class="muted u">dakpunt 21° bij de dakrand; inkeping vlag/dak</td></tr>'
          f'<tr><td>v4 logo.svg</td><td class="r">{v4t}</td><td class="r">{v4n}</td><td class="muted u">tentpoot (65 bouw); a–poot (56 bouw)</td></tr>'
          f'<tr><td>v3 mark.svg</td><td class="r bad">{v3mt}</td><td class="r">{v3mn}</td><td class="muted u">dakpunt 21°</td></tr>'
          f'<tr><td>v4 mark.svg</td><td class="r">{v4mt}</td><td class="r">{v4mn}</td><td class="muted u">poot, paal; band–dak</td></tr>')

# ---------------------------------------------------------------- reproduction table
RC = rep['colors']
def cmyk(v): return ' '.join(f'{c}{x}' for c, x in zip('CMYK', v))
rep_rows = []
for k in ('klaproos', 'zon', 'polder', 'inkt', 'zand'):
    e = RC[k]; h = e['hex']
    pc = e['pantone_c'][0]; tcx = e['pantone_tcx'][0]; ra = e['ral_a'][0]; rb = e['ral_b'][0]; ora = e['oracal651'][0]
    ral = rb['name'].split(' (')[0]
    ral_note = '' if ra['name'].split(' ')[1] == rb['name'].split(' ')[1] else f'<br><span class="muted">bron A: {ra["name"]} (ΔE {nl(ra["de"],1)})</span>'
    pcu = pc['name'].replace(' C', ' U')
    rep_rows.append(
        f'<tr><td><span class="dot" style="background:{h}"></span><b>{nm(k)}</b><br><code>{h}</code></td>'
        f'<td class="num">L {nl(e["lab_d50"][0],1)}<br>a {nl(e["lab_d50"][1],1)} · b {nl(e["lab_d50"][2],1)}</td>'
        f'<td class="num">{cmyk(e["cmyk_fogra39"])}<br><span class="muted">ongestr.: {cmyk(e["cmyk_fogra29"])} (proef-ΔE {nl(e["fogra29_proof_de"],1)})</span></td>'
        f'<td><b>{pc["name"]}</b> <span class="de">ΔE {nl(pc["de"],1)}</span><br><span class="muted">{pcu}: kiezen op de U-waaier</span></td>'
        f'<td><b>{tcx["name"].split(" TCX ")[0]} TCX</b> <span class="de">ΔE {nl(tcx["de"],1)}</span><br><span class="muted">{tcx["name"].split(" TCX ")[1]}</span></td>'
        f'<td><b>{ral}</b> <span class="de">ΔE {nl(rb["de"],1)}</span>{ral_note}</td>'
        f'<td><b>{ora["name"].replace("ORACAL ", "")}</b> <span class="de">ΔE {nl(ora["de"],1)}</span></td>'
        f'<td class="sign">______</td></tr>')
rep_table = ''.join(rep_rows)

# ---------------------------------------------------------------- minimum sizes
methods = [m for m in WM['primary']['min_sizes'] if m != 'scherm']
def mm(x): return nl(x, 2).rstrip('0').rstrip(',')
ms_rows = []
for m in methods:
    d = WM['primary']['min_sizes'][m]
    ms_rows.append(f'<tr><td><b>{d["label"]}</b></td><td class="num muted">{mm(d["stroke_mm"])} / {mm(d["gap_mm"])} mm</td>'
                   f'<td class="r">{WM["primary"]["min_sizes"][m]["min_width_mm"]} mm</td><td class="r">{WM["klein"]["min_sizes"][m]["min_width_mm"]} mm</td>'
                   f'<td class="r">{MK["primary"]["min_sizes"][m]["min_width_mm"]} mm</td><td class="r">{MK["klein"]["min_sizes"][m]["min_width_mm"]} mm</td></tr>')
ms_rows.append(f'<tr class="screen"><td><b>Scherm</b></td><td class="num muted">2 px / 1,5 px</td>'
               f'<td class="r">{WM["primary"]["min_sizes"]["scherm"]["min_width_px"]} px</td><td class="r">{WM["klein"]["min_sizes"]["scherm"]["min_width_px"]} px</td>'
               f'<td class="r">{MK["primary"]["min_sizes"]["scherm"]["min_width_px"]} px</td><td class="r">{MK["klein"]["min_sizes"]["scherm"]["min_width_px"]} px</td></tr>')
ms_table = ''.join(ms_rows)
def F(x): return f'{n0(x["smallest_stroke_units"])} / {n0(x["smallest_gap_units"])} op {n0(x["width_units"])} breed'
feat = (f'kleinste lijn / opening: logo.svg {F(WM["primary"])} (tentpoot / k–l), logo-klein {F(WM["klein"])}, mark {F(MK["primary"])}, mark-klein {F(MK["klein"])}. '
        f'Lijn = de kleinste van bouwmaat en rastermeting; opening = de kleinste van alle afstanden tussen losse vormen, de vrije ruimte onder de vlag en de rastermeting.')

# ---------------------------------------------------------------- render colour check
def rc_block():
    if not rchk or 'tent-3x3-klaproos-hero.webp' not in rchk: return '<p class="muted">Nog niet gemeten.</p>'
    r = rchk['tent-3x3-klaproos-hero.webp']
    cells = ''.join(f'<div class="rcell"><span class="chipc" style="background:{r[k]["hex"]}"></span><b>{lab}</b><code>{r[k]["hex"]}</code><span class="de">ΔE {nl(r[k]["de2000"],1)}</span></div>'
                    for k, lab in (('lit', 'belicht dakvlak'), ('mid', 'middentoon'), ('shade', 'schaduwvlak')))
    return (f'<div class="rgrid"><div class="rcell"><span class="chipc" style="background:{r["target"]["hex"]}"></span><b>Klaproos-staal</b><code>{r["target"]["hex"]}</code><span class="de">doel</span></div>{cells}</div>'
            f'<p class="cap">Gemeten op img/tent-3x3-klaproos-hero.webp (v4-render: ingangskleur {tok["render"]["klaproos_albedo"]}, afwerking mat): gemiddelde in lineair licht van de verzadigde dakpixels, per lichtheidsband. '
            f'Eis: belicht vlak ΔE<sub>00</sub> ≤ 3. De schaduwzijde is bewust donkerder: dat is licht, geen kleurfout.</p>')

UNC = rep['colors']['klaproos']['fogra29_proof_de']
html = open(os.path.join(T, 'sheet.template.html')).read()
rep_map = {
  '{{SWATCHES}}': ''.join(sw), '{{ROWS_TEXT}}': rows_text, '{{ROWS_UI}}': rows_ui, '{{ROWS_FORBIDDEN}}': rows_forb,
  '{{CONSTRUCT}}': construct, '{{PAIRS_N}}': str(len(con['rows'])), '{{SCHEMES}}': ''.join(sch), '{{SCHEME_N}}': str(n_checks), '{{SCHEME_FAIL}}': str(n_fail),
  '{{SURFACES}}': surf, '{{STROKES}}': strokes, '{{GAPS}}': gaps, '{{RCHECK}}': rcheck,
  '{{MIN_TIP}}': nl(WM['primary']['corners']['min_tip_deg'], 0), '{{MIN_NOTCH}}': nl(WM['primary']['corners']['min_notch_deg'], 0),
  '{{REPRO_TABLE}}': rep_table, '{{MINSIZE_TABLE}}': ms_table, '{{FEATURES}}': feat, '{{RENDER_CHECK}}': rc_block(),
  '{{SEP_DE}}': nl(SEP['klaproos_vs_bordeaux']['de2000'], 1), '{{SEP_HK}}': nl(SEP['klaproos_vs_bordeaux']['hue_klaproos'], 0),
  '{{SEP_HB}}': nl(SEP['klaproos_vs_bordeaux']['hue_bordeaux'], 0), '{{HOVER_CR}}': nl(SEP['klaproos_vs_inkt_hover']['contrast']),
  '{{MIN_LOGO_PX}}': str(WM['primary']['min_sizes']['scherm']['min_width_px']), '{{MIN_KLEIN_PX}}': str(WM['klein']['min_sizes']['scherm']['min_width_px']),
  '{{MIN_MARK_PX}}': str(MK['primary']['min_sizes']['scherm']['min_width_px']),
  '{{EMB_LOGO}}': str(WM['primary']['min_sizes']['borduren']['min_width_mm']), '{{EMB_KLEIN}}': str(WM['klein']['min_sizes']['borduren']['min_width_mm']),
  '{{FLOCK_LOGO}}': str(WM['primary']['min_sizes']['flock']['min_width_mm']), '{{FLOCK_KLEIN}}': str(WM['klein']['min_sizes']['flock']['min_width_mm']),
  '{{EMB_MARK}}': str(MK['klein']['min_sizes']['borduren']['min_width_mm']), '{{UNC_DE}}': nl(UNC, 1),
  '{{K_ALBEDO}}': tok['render']['klaproos_albedo'], '{{KL_GAP}}': n0(gp[0]['units']),
  '{{FLAG_CLR}}': n0(WM['primary']['flag_roof_clearance_units']),
  '{{LT_GAP}}': n0(min(x['units'] for x in gp if any(t in x['between'] for t in ('frame', 'dak', 'tent')) and not all(t in x['between'] for t in ('frame', 'dak')))),
  '{{LUIFEL_W}}': nl(11.34 * WM['primary']['width_units'] / WM['primary']['height_units'], 0),
  '{{LUIFEL_PCT}}': nl(11.34 * WM['primary']['width_units'] / WM['primary']['height_units'] / 3, 0),
}
for k, v in rep_map.items(): html = html.replace(k, v)
left = re.findall(r'\{\{[A-Z_0-9]+\}\}', html)
if left: sys.exit(f'unfilled placeholders: {left}')
open(os.path.join(B, 'brand-sheet.html'), 'w').write(html)
print('ok', len(html))
