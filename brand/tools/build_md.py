"""Fill tools/brand.template.md -> brand.md with tables from tokens.json and the measurements in tools/.
    python3 build_md.py <brand-dir>"""
import json, os, re, sys
T = os.path.dirname(os.path.abspath(__file__))
B = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(T)
TOOLS = os.path.join(B, 'tools')
tok = json.load(open(os.path.join(B, 'tokens.json')))
con = json.load(open(os.path.join(TOOLS, '_contrast.json')))
rep = json.load(open(os.path.join(TOOLS, '_repro.json')))
meta = json.load(open(os.path.join(TOOLS, 'logo-meta.json')))
rchk = json.load(open(os.path.join(TOOLS, '_render_check.json')))

def nl(x, d=2): return (f'{x:.{d}f}').replace('.', ',')
def name(k): return k.replace('-', ' ')
pal = '\n'.join(f"| {name(k).capitalize()} | `{v['value']}` | {v['family']} | {v['role']} |" for k, v in tok['color'].items())

rows = ['| Voorgrond | Achtergrond | Gebruik | Ratio | Eis | Resultaat |', '|---|---|---|---:|---:|---|']
for x in con['rows']:
    res = ('AAA' if x['aaa'] else 'AA') if x['kind'] == 'text' else ('AA groot' if x['kind'] == 'large' else 'voldoet (UI)')
    rows.append(f"| {name(x['fg'])} `{x['fg_hex']}` | {name(x['bg'])} `{x['bg_hex']}` | {x['use']}{' (UI-deel)' if x['kind'] == 'ui' else ''} | {nl(x['ratio'])}:1 | {nl(x['need'], 1)}:1 | {res} |")
forb = '\n'.join(f"| {name(f['fg'])} | {name(f['bg'])} | {f['use']} | {nl(f['ratio'])}:1 | niet gebruiken |" for f in con['forbidden'])

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
src = '\n'.join(f"- {v['what']}: {v['repo']}/blob/{v['commit']}/{v['file']}" for k, v in S.items())
src = 'Datasets (alle onofficieel; aantallen: ' + ', '.join(f"{k} {n}" for k, n in rep['counts'].items()) + '):\n\n' + src

WM, MK = meta['wordmark'], meta['mark']
ms = []
for m, d in WM['primary']['min_sizes'].items():
    if m == 'scherm': continue
    ms.append(f"| {d['label']} | {nl(d['stroke_mm'],2).rstrip('0').rstrip(',')} / {nl(d['gap_mm'],2).rstrip('0').rstrip(',')} mm | {d['min_width_mm']} mm | {WM['klein']['min_sizes'][m]['min_width_mm']} mm | {MK['primary']['min_sizes'][m]['min_width_mm']} mm | {MK['klein']['min_sizes'][m]['min_width_mm']} mm |")
ms.append(f"| Scherm (1x) | 2 px / 1,5 px | {WM['primary']['min_sizes']['scherm']['min_width_px']} px | {WM['klein']['min_sizes']['scherm']['min_width_px']} px | {MK['primary']['min_sizes']['scherm']['min_width_px']} px | {MK['klein']['min_sizes']['scherm']['min_width_px']} px |")
def F(x): return f"{x['smallest_stroke_units']:.0f} / {x['smallest_gap_units']:.0f}"
feat = (f"Kleinste lijn en opening: logo.svg {WM['primary']['smallest_stroke_units']:.0f} (vlaggenstok) en {WM['primary']['smallest_gap_units']:.0f} (k–l) op "
        f"{WM['primary']['width_units']:.0f} breed; logo-klein {WM['klein']['smallest_stroke_units']:.0f} en {WM['klein']['smallest_gap_units']:.0f} op {WM['klein']['width_units']:.0f}; "
        f"mark {MK['primary']['smallest_stroke_units']:.0f} en {MK['primary']['smallest_gap_units']:.0f} op {MK['primary']['width_units']:.0f}; mark-klein {MK['klein']['smallest_stroke_units']:.0f} en "
        f"{MK['klein']['smallest_gap_units']:.0f}. Openingen zijn gemeten als kortste afstand tussen twee losse vormen (`tools/build.py` → `min_gap`).")

r = rchk['tent-3x3-klaproos-hero.webp']; v2 = rchk['v2']
rc = (f"| v3 `img/tent-3x3-klaproos-hero.webp` | {r['lit']['hex']} (ΔE {nl(r['lit']['de2000'],1)}) | {r['mid']['hex']} (ΔE {nl(r['mid']['de2000'],1)}) | {r['shade']['hex']} (ΔE {nl(r['shade']['de2000'],1)}) | {r['target']['hex']} |\n"
      f"| v2 (staal #BE3A1D) | {v2['lit']['hex']} (ΔE {nl(v2['lit']['de2000'],1)}) | {v2['mid']['hex']} (ΔE {nl(v2['mid']['de2000'],1)}) | {v2['shade']['hex']} (ΔE {nl(v2['shade']['de2000'],1)}) | {v2['target']['hex']} |")
SEP = con['separation']['klaproos_vs_bordeaux']
minp = WM['primary']['min_sizes']['scherm']['min_width_px']
M = {
  '{{PALETTE}}': pal, '{{CONTRAST}}': '\n'.join(rows), '{{FORBIDDEN}}': forb, '{{PAIRS_N}}': str(len(con['rows'])),
  '{{REPRO}}': '\n'.join(rr), '{{SOURCES}}': src, '{{MINSIZES}}': '\n'.join(ms), '{{FEATURES}}': feat, '{{RENDERCHECK}}': rc,
  '{{RC_LIT}}': r['lit']['hex'], '{{RC_LIT_DE}}': nl(r['lit']['de2000'], 1),
  '{{SEP_DE}}': nl(SEP['de2000'], 1), '{{SEP_HK}}': nl(SEP['hue_klaproos'], 0), '{{SEP_HB}}': nl(SEP['hue_bordeaux'], 0),
  '{{MIN_LOGO_PX}}': str(minp), '{{MIN_LOGO_PX_1}}': str(minp - 1), '{{MIN_KLEIN_PX}}': str(WM['klein']['min_sizes']['scherm']['min_width_px']),
  '{{MIN_MARK_PX}}': str(MK['primary']['min_sizes']['scherm']['min_width_px']),
  '{{F_P}}': F(WM['primary']), '{{F_K}}': F(WM['klein']), '{{F_MP}}': F(MK['primary']), '{{F_MK}}': F(MK['klein']),
  '{{EMB_LOGO}}': str(WM['primary']['min_sizes']['borduren']['min_width_mm']), '{{FLOCK_LOGO}}': str(WM['primary']['min_sizes']['flock']['min_width_mm']),
  '{{EMB_KLEIN}}': str(WM['klein']['min_sizes']['borduren']['min_width_mm']), '{{FLOCK_KLEIN}}': str(WM['klein']['min_sizes']['flock']['min_width_mm']),
  '{{UNC_DE}}': nl(rep['colors']['klaproos']['fogra29_proof_de'], 0), '{{K_ALBEDO}}': tok['render']['klaproos_albedo'],
}
md = open(os.path.join(T, 'brand.template.md')).read()
for k, v in M.items(): md = md.replace(k, v)
left = re.findall(r'\{\{[A-Z_0-9]+\}\}', md)
if left: sys.exit(f'unfilled: {left}')
open(os.path.join(B, 'brand.md'), 'w').write(md)
print('ok', len(md))
