"""Fill tools/brand.template.md -> brand.md and tools/technisch.template.md -> technisch.md (v5) with tables from
tokens.json and the measurements in tools/.
    python3 build_md.py <brand-dir>"""
import json, os, re, sys
T = os.path.dirname(os.path.abspath(__file__))
B = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(T)
TOOLS = os.path.join(B, 'tools')
sys.path.insert(0, T)
from contrast import cr
tok = json.load(open(os.path.join(B, 'tokens.json')))
con = json.load(open(os.path.join(TOOLS, '_contrast.json')))
rep = json.load(open(os.path.join(TOOLS, '_repro.json')))
meta = json.load(open(os.path.join(TOOLS, 'logo-meta.json')))
rchk = json.load(open(os.path.join(TOOLS, '_render_check.json')))

def nl(x, d=2): return (f'{x:.{d}f}').replace('.', ',')
def n0(x): return f'{x:.0f}'
NAMES = {'tint-zand': 'tint op Zand', 'tint-wit': 'tint op Wit', 'tint-duin': 'tint op Duin', 'tint-steen': 'tint op Steen',
         'tintd-polder': 'tint op Polder', 'tintd-inkt': 'tint op Inkt'}
def name(k): return NAMES.get(k, k.replace('-', ' '))
H = {k: v['value'] for k, v in tok['color'].items()}
H.update({k: v['value'] for k, v in tok['color_derived'].items()})
def hx(n): return 'transparant' if n == 'transparent' else name(n)
def cap(s): return s[:1].upper() + s[1:]

# ---------------------------------------------------------------- palette, contrast, schemes
pal = ['| Kleur | Hex | Familie | Rol |', '|---|---|---|---|']
pal += [f"| **{cap(name(k))}** | `{v['value']}` | {v['family']} | {v['role']} |" for k, v in tok['color'].items()]
pal.append('')
pal.append('Afgeleid (alleen schermen, hover van de omlijnde knop): ' + ', '.join(f"{name(k)} `{v['value']}`" for k, v in tok['color_derived'].items()) + '.')

def lab(n): return cap(name(n))
def res(x): return ('AAA' if x['aaa'] else 'AA') if x['kind'] == 'text' else ('AA groot' if x['kind'] == 'large' else '≥ 3:1')
rows = ['**Tekst** (eis 4,5:1; display-tekst ≥ 24 px vet 3:1)', '', '| Tekst op vlak | Gebruik | Ratio | Resultaat |', '|---|---|---:|---|']
rows += [f"| {lab(x['fg'])} op {name(x['bg'])} | {x['use']} | {nl(x['ratio'])}:1 | {res(x)} |" for x in con['rows'] if x['kind'] in ('text', 'large')]
rows += ['', '**UI-delen** (knopvlakken, randen, focusringen, iconen en stippen; eis 3:1)', '', '| Vorm tegen vlak | Gebruik | Ratio | Resultaat |', '|---|---|---:|---|']
rows += [f"| {lab(x['fg'])} tegen {name(x['bg'])} | {x['use']} | {nl(x['ratio'])}:1 | {res(x)} |" for x in con['rows'] if x['kind'] == 'ui']
for x in con.get('info_rows', []):
    rows.append(f"| {lab(x['fg'])} tegen {name(x['bg'])} | {x['use']} | {nl(x['ratio'])}:1 | herkenbaar door de Zand-ring (Zand op Klaproos {nl(cr(H['zand'], H['klaproos']))}:1, Polder op Zand {nl(cr(H['polder'], H['zand']))}:1) |")
forb = '\n'.join(f"| {name(f['fg'])} | {name(f['bg'])} | {f['use']} | {nl(f['ratio'])}:1 |" for f in con['forbidden'])

SC = tok['color_schemes']; chk = {(c['scheme'], c['state']): c for c in con['scheme_checks']}
sl = ['| Schema | Achtergrond / tekst | Primair: rust → hover → ingedrukt | Omlijnd: rust → hover | Kleinste label / vorm |', '|---|---|---|---|---|']
for sid, s in SC.items():
    def b(st):
        x = s[st]
        lab = f"{hx(x['bg'])} met {name(x['label'])}"
        if x['border'] != x['bg']: lab += f", rand {name(x['border'])}"
        if x.get('inset'): lab += ' + inzet-schaduw'
        return lab
    sts = ('primary', 'primary_hover', 'primary_active', 'secondary', 'secondary_hover')
    labs = [chk[(sid, st)]['label_ratio'] for st in sts]; shps = [chk[(sid, st)]['shape_ratio'] for st in sts]
    sl.append(f"| {sid} · {s['naam']} | {name(s['background'])} / {name(s['text'])} ({nl(s['text_ratio'])}:1) | {b('primary')} → {b('primary_hover')} → {b('primary_active')} | {b('secondary')} → {b('secondary_hover')} | {nl(min(labs))}:1 / {nl(min(shps))}:1 |")
n_checks = len(con['scheme_checks']); n_fail = sum(1 for c in con['scheme_checks'] if not c['pass'])

# ---------------------------------------------------------------- reproduction
def cmyk(v): return ' '.join(f'{c}{x}' for c, x in zip('CMYK', v))
rr = []
for k in ('klaproos', 'zon', 'polder', 'inkt', 'zand'):
    e = rep['colors'][k]
    rr.append(f"| **{k.capitalize()}** | `{e['hex']}` | {nl(e['lab_d50'][0],1)} / {nl(e['lab_d50'][1],1)} / {nl(e['lab_d50'][2],1)} | {cmyk(e['cmyk_fogra39'])} | {cmyk(e['cmyk_fogra29'])} | "
              f"{e['pantone_c'][0]['name']} (ΔE {nl(e['pantone_c'][0]['de'],1)}); alt. {e['pantone_c'][1]['name']} ({nl(e['pantone_c'][1]['de'],1)}) | "
              f"{e['pantone_tcx'][0]['name']} (ΔE {nl(e['pantone_tcx'][0]['de'],1)}) | "
              f"{e['ral_b'][0]['name'].split(' (')[0]} ({nl(e['ral_b'][0]['de'],1)}) / {e['ral_a'][0]['name']} ({nl(e['ral_a'][0]['de'],1)}) | "
              f"{e['oracal651'][0]['name'].replace('ORACAL ', '')} (ΔE {nl(e['oracal651'][0]['de'],1)}) |")
S = rep['sources']
src = 'Datasets (alle onofficieel; aantallen: ' + ', '.join(f"{k} {n}" for k, n in rep['counts'].items()) + '):\n\n' + '\n'.join(f"- {v['what']}: {v['repo']}/blob/{v['commit']}/{v['file']}" for k, v in S.items())

# ---------------------------------------------------------------- logo measurements
WM, MK, GR = meta['wordmark'], meta['mark'], meta['grouping']
def mm(x): return nl(x, 2).rstrip('0').rstrip(',')
ms = []
for m, d in WM['primary']['min_sizes'].items():
    if m == 'scherm': continue
    ms.append(f"| {d['label']} | {mm(d['stroke_mm'])} / {mm(d['gap_mm'])} mm | {d['min_width_mm']} mm | {WM['klein']['min_sizes'][m]['min_width_mm']} mm | {MK['primary']['min_sizes'][m]['min_width_mm']} mm | {MK['klein']['min_sizes'][m]['min_width_mm']} mm |")
ms.append(f"| Scherm (1x) | 2 px / 1,5 px | {WM['primary']['min_sizes']['scherm']['min_width_px']} px | {WM['klein']['min_sizes']['scherm']['min_width_px']} px | {MK['primary']['min_sizes']['scherm']['min_width_px']} px | {MK['klein']['min_sizes']['scherm']['min_width_px']} px |")
def F(x): return f"{n0(x['smallest_stroke_units'])} / {n0(x['smallest_gap_units'])}"
feat = (f"Gemeten (`tools/logo-meta.json`): logo.svg kleinste lijn {n0(WM['primary']['smallest_stroke_units'])} (tentpoot), kleinste opening "
        f"{n0(WM['primary']['smallest_gap_units'])} (k–l) op {n0(WM['primary']['width_units'])} breed; logo-klein {F(WM['klein'])} op {n0(WM['klein']['width_units'])}; "
        f"mark {F(MK['primary'])} op {n0(MK['primary']['width_units'])}; mark-klein {F(MK['klein'])} op {n0(MK['klein']['width_units'])}. Lijn = de kleinste van "
        f"bouwmaat en rastermeting; opening = de kleinste van alle afstanden tussen losse vormen en de rastermeting.")
strokes = '| Lijn | Eenheden | × STOK |\n|---|---:|---:|\n' + '\n'.join(f"| {k} | {v} | {nl(v / 130, 2)} |" for k, v in meta['strokes'].items())
LEGMIN = GR['v5']['leg_letter_min'] - 0.5
def pretty(b, units=0):
    parts = [p.strip() for p in b.split('–')]
    out, idx = [], []
    for p in parts:
        m = re.match(r'([a-z])(\d+)$', p)
        if m: out.append(m.group(1)); idx.append(int(m.group(2)))
        else: out.append({'frame': 'poot', 'dak': 'dak', 'tent': 'tent'}.get(p, p))
    if 'frame' in parts and 'dak' in parts: return 'band – dak (opening)'
    if len(idx) == 2: return f"{out[0]}–{out[1]} ({'klap' if max(idx) <= 4 else 'klaar' if min(idx) >= 5 else 'klap|klaar'})"
    if 'frame' in parts and idx: return f"{[o for o in out if o != 'poot'][0]} – {'poot' if units >= LEGMIN else 'luifelband (erboven)'}"
    return ' – '.join(out)
gaps = '| Tussen | Eenheden |\n|---|---:|\n' + '\n'.join(f"| {pretty(x['between'], x['units'])} | {n0(x['units'])} |" for x in WM['primary']['gaps_between_shapes'][:10])
def chk2(x): return (n0(x['thinnest_units']) if x['thinnest_units'] else '–'), (n0(x['narrowest_units']) if x['narrowest_units'] else '–')
v4w, v4m = GR['v4_raster']['wordmark'], GR['v4_raster']['mark']
a, b_ = chk2(v4w); c, d = chk2(WM['primary']['raster_check']); e_, f_ = chk2(v4m); g_, h_ = chk2(MK['primary']['raster_check'])
ck, dk = chk2(WM['klein']['raster_check'])
rcheck = ('| Bestand | Dunste vorm | Nauwste opening | Waar |\n|---|---:|---:|---|\n'
          f"| v4 logo.svg | {a} | {b_} | tentpoot (65); a–poot (56) |\n"
          f"| v5 logo.svg | {c} | {d} | tentpoot (65); k–l en de kom van de a (de poten staan nu verder weg) |\n"
          f"| v5 logo-klein | {ck} | {dk} | tentpoot (100); dak–band (100) |\n"
          f"| v4 mark.svg | {e_} | {f_} | poot, paal; band–dak |\n"
          f"| v5 mark.svg | {g_} | {h_} | poot; band–dak |")
r = rchk['tent-3x3-klaproos-hero.webp']
rc = f"| v5 `img/tent-3x3-klaproos-hero.webp` | {r['lit']['hex']} (ΔE {nl(r['lit']['de2000'],1)}) | {r['mid']['hex']} (ΔE {nl(r['mid']['de2000'],1)}) | {r['shade']['hex']} (ΔE {nl(r['shade']['de2000'],1)}) | {r['target']['hex']} |"

# ---------------------------------------------------------------- misc numbers
minp = WM['primary']['min_sizes']['scherm']['min_width_px']
lg = meta['spacing']['tent_legs_primary']; lk = meta['spacing']['tent_legs_klein']
hdr = tok['logo']['header']
def hsize(sv): return sv.split(' inline, ')[1]
zak = open(os.path.join(B, 'svg', 'logo-zakelijk.svg')).read()
zvb = re.search(r'viewBox="([^"]+)"', zak).group(1); zw, zh = map(float, zvb.split()[2:])
zak_w = 584; zak_h = round(zak_w * zh / zw)
xh48 = lambda hu: nl(48 * 500 / hu, 1)
ct = tok['color_derived']
M = {
  '{{PALETTE}}': '\n'.join(pal), '{{CONTRAST}}': '\n'.join(rows), '{{FORBIDDEN}}': forb, '{{PAIRS_N}}': str(len(con['rows'])),
  '{{SCHEMES}}': '\n'.join(sl), '{{SCHEME_N}}': str(n_checks), '{{SCHEME_FAIL}}': str(n_fail),
  '{{SEP_DE}}': nl(con['separation']['klaproos_vs_bordeaux']['de2000'], 1), '{{ZS_DE}}': nl(con['surfaces']['zand–steen']['de2000'], 1),
  '{{REPRO}}': '\n'.join(rr), '{{SOURCES}}': src, '{{MINSIZES}}': '\n'.join(ms), '{{FEATURES}}': feat, '{{RENDERCHECK}}': rc,
  '{{STROKES}}': strokes, '{{GAPS}}': gaps, '{{RCHECK}}': rcheck,
  '{{MIN_TIP}}': nl(WM['primary']['corners']['min_tip_deg'], 0), '{{MIN_NOTCH}}': nl(WM['primary']['corners']['min_notch_deg'], 0),
  '{{TRACY_N}}': str(meta['spacing']['tracy_n']),
  '{{LEG_OUT}}': str(lg['out']), '{{LEG_IN}}': str(lg['in_round']), '{{LEG_IN2}}': str(lg['in_straight']),
  '{{KLEIN_LEGS}}': f"l–poot {lk['out']}, poot–a {lk['in_round']}, a–poot {lk['in_straight']}, poot–r {lk['out']} (letters recht–recht {lk['letter_ss']})",
  '{{LEG_MIN}}': n0(GR['v5']['leg_letter_min']),
  '{{V4_LEG}}': n0(GR['v4']['leg_letter_min']), '{{V4_RATIO}}': nl(GR['v4']['ratio']), '{{V5_LEG}}': n0(GR['v5']['leg_letter_min']), '{{V5_RATIO}}': nl(GR['v5']['ratio']),
  '{{V5K_LEG}}': n0(GR['v5_klein']['leg_letter_min']), '{{V5K_RATIO}}': nl(GR['v5_klein']['ratio']),
  '{{ASPECT_V4}}': nl(GR['bbox_aspect']['v4']), '{{ASPECT_V5}}': nl(GR['bbox_aspect']['v5']),
  '{{XH48_V4}}': xh48(GR['v4_height_units']), '{{XH48_V5}}': xh48(WM['primary']['height_units']),
  '{{MIN_LOGO_PX}}': str(minp), '{{MIN_LOGO_PX_1}}': str(minp - 1), '{{MIN_KLEIN_PX}}': str(WM['klein']['min_sizes']['scherm']['min_width_px']),
  '{{MIN_MARK_PX}}': str(MK['primary']['min_sizes']['scherm']['min_width_px']),
  '{{HEADER_DESK}}': hsize(hdr['desktop']), '{{HEADER_MOB}}': hsize(hdr['mobile_390']),
  '{{EMB_LOGO}}': str(WM['primary']['min_sizes']['borduren']['min_width_mm']), '{{FLOCK_LOGO}}': str(WM['primary']['min_sizes']['flock']['min_width_mm']),
  '{{EMB_KLEIN}}': str(WM['klein']['min_sizes']['borduren']['min_width_mm']), '{{SUB_LOGO}}': str(WM['primary']['min_sizes']['sublimatie']['min_width_mm']),
  '{{UNC_DE}}': nl(rep['colors']['klaproos']['fogra29_proof_de'], 1), '{{K_ALBEDO}}': tok['render']['klaproos_albedo'],
  '{{ZAK_VB}}': zvb, '{{ZAK_WH}}': f'`width="{zak_w}" height="{zak_h}"`',
  '{{TINT_ZAND}}': ct['tint-zand']['value'], '{{TINT_WIT}}': ct['tint-wit']['value'], '{{TINT_DUIN}}': ct['tint-duin']['value'], '{{TINT_STEEN}}': ct['tint-steen']['value'],
  '{{TINTD_POLDER}}': ct['tintd-polder']['value'], '{{TINTD_INKT}}': ct['tintd-inkt']['value'],
}
for tpl, out in (('brand.template.md', 'brand.md'), ('technisch.template.md', 'technisch.md')):
    md = open(os.path.join(T, tpl)).read()
    for k, v in M.items(): md = md.replace(k, v)
    left = re.findall(r'\{\{[A-Z_0-9]+\}\}', md)
    if left: sys.exit(f'{tpl}: unfilled {left}')
    open(os.path.join(B, out), 'w').write(md)
    print(out, len(md.encode()), 'bytes')
