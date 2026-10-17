"""Fill tools/brand.template.md -> brand.md (v4) with tables from tokens.json and the measurements in tools/.
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
def n0(x): return f'{x:.0f}'
def name(k): return k.replace('-', ' ')
H = {k: v['value'] for k, v in tok['color'].items()}
def hx(n): return 'transparant' if n == 'transparent' else f'{name(n)} `{H[n]}`'

pal = '\n'.join(f"| {name(k).capitalize()} | `{v['value']}` | {v['family']} | {v['role']} |" for k, v in tok['color'].items())

rows = ['| Voorgrond | Achtergrond | Gebruik | Ratio | Eis | Resultaat |', '|---|---|---|---:|---:|---|']
for x in con['rows']:
    res = ('AAA' if x['aaa'] else 'AA') if x['kind'] == 'text' else ('AA groot' if x['kind'] == 'large' else 'voldoet (UI)')
    rows.append(f"| {name(x['fg'])} `{x['fg_hex']}` | {name(x['bg'])} `{x['bg_hex']}` | {x['use']}{' (UI-deel)' if x['kind'] == 'ui' else ''} | {nl(x['ratio'])}:1 | {nl(x['need'], 1)}:1 | {res} |")
for x in con.get('info_rows', []):
    rows.append(f"| {name(x['fg'])} `{x['fg_hex']}` | {name(x['bg'])} `{x['bg_hex']}` | {x['use']} | {nl(x['ratio'])}:1 | – | herkenbaar door de Zand-ring (Zand op Klaproos {nl(__import__('contrast').cr(H['zand'], H['klaproos']))}:1, Polder op Zand {nl(__import__('contrast').cr(H['polder'], H['zand']))}:1) |")
forb = '\n'.join(f"| {name(f['fg'])} | {name(f['bg'])} | {f['use']} | {nl(f['ratio'])}:1 | niet gebruiken |" for f in con['forbidden'])

# schemes
SC = tok['color_schemes']; chk = {(c['scheme'], c['state']): c for c in con['scheme_checks']}
sl = ['| Schema | Achtergrond / tekst | Primair: rust → hover → ingedrukt | Tweede knop: rust → hover | Kleinste label / vorm |', '|---|---|---|---|---|']
for sid, s in SC.items():
    def b(st):
        x = s[st]
        lab = f"{hx(x['bg'])} met {name(x['label'])}"
        if x['border'] != x['bg']: lab += f", rand {name(x['border'])}"
        return lab
    labs = [chk[(sid, st)]['label_ratio'] for st in ('primary', 'primary_hover', 'primary_active', 'secondary', 'secondary_hover')]
    shps = [chk[(sid, st)]['shape_ratio'] for st in ('primary', 'primary_hover', 'primary_active', 'secondary', 'secondary_hover')]
    sl.append(f"| {sid} · {s['naam']} | {name(s['background'])} / {name(s['text'])} ({nl(s['text_ratio'])}:1) | {b('primary')} → {b('primary_hover')} → {b('primary_active')} | {b('secondary')} → {b('secondary_hover')} | {nl(min(labs))}:1 / {nl(min(shps))}:1 |")
n_checks = len(con['scheme_checks']); n_fail = sum(1 for c in con['scheme_checks'] if not c['pass'])
surf = '\n'.join(f"| {k.replace('–', ' – ').title()} | {nl(v['de2000'], 1)} | {nl(v['contrast'])}:1 |" for k, v in con['surfaces'].items())

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

WM, MK, V3 = meta['wordmark'], meta['mark'], meta['v3_check']
ms = []
def mm(x): return nl(x, 2).rstrip('0').rstrip(',')
for m, d in WM['primary']['min_sizes'].items():
    if m == 'scherm': continue
    ms.append(f"| {d['label']} | {mm(d['stroke_mm'])} / {mm(d['gap_mm'])} mm | {d['min_width_mm']} mm | {WM['klein']['min_sizes'][m]['min_width_mm']} mm | {MK['primary']['min_sizes'][m]['min_width_mm']} mm | {MK['klein']['min_sizes'][m]['min_width_mm']} mm |")
ms.append(f"| Scherm (1x) | 2 px / 1,5 px | {WM['primary']['min_sizes']['scherm']['min_width_px']} px | {WM['klein']['min_sizes']['scherm']['min_width_px']} px | {MK['primary']['min_sizes']['scherm']['min_width_px']} px | {MK['klein']['min_sizes']['scherm']['min_width_px']} px |")
def F(x): return f"{n0(x['smallest_stroke_units'])} / {n0(x['smallest_gap_units'])}"
gp = WM['primary']['gaps_between_shapes']
feat = (f"Gemeten (tools/logo-meta.json): logo.svg kleinste lijn {n0(WM['primary']['smallest_stroke_units'])} (tentpoot en paal), kleinste opening "
        f"{n0(WM['primary']['smallest_gap_units'])} (k–l) op {n0(WM['primary']['width_units'])} breed; logo-klein {F(WM['klein'])} op {n0(WM['klein']['width_units'])}; "
        f"mark {F(MK['primary'])} op {n0(MK['primary']['width_units'])}; mark-klein {F(MK['klein'])} op {n0(MK['klein']['width_units'])}. Lijn = de kleinste van bouwmaat en "
        f"rastermeting; opening = de kleinste van alle afstanden tussen losse vormen, de vrije ruimte onder de vlag en de rastermeting (§3.2).")

strokes = '| Lijn | Eenheden | × STOK |\n|---|---:|---:|\n' + '\n'.join(f"| {k} | {v} | {nl(v / 130, 2)} |" for k, v in meta['strokes'].items())
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
gaps = '| Tussen | Eenheden |\n|---|---:|\n' + '\n'.join(f"| {pretty(x['between'])} | {n0(x['units'])} |" for x in gp[:9])
def chk2(x):
    t = x['thinnest_units']; n = x['narrowest_units']
    return ('naaldpunt' if t is not None and t <= 10 else (n0(t) if t else '–')), ('naaldkier' if n is not None and n <= 10 else (n0(n) if n else '–'))
a, b_ = chk2(V3['wordmark']); c, d = chk2(WM['primary']['raster_check']); e_, f_ = chk2(V3['mark']); g_, h_ = chk2(MK['primary']['raster_check'])
rcheck = ('| Bestand | Dunste vorm | Nauwste opening | Waar |\n|---|---:|---:|---|\n'
          f"| v3 logo.svg | {a} | {b_} | dakpunt van 21° bij de dakrand; inkeping tussen vlag en dak |\n"
          f"| v4 logo.svg | {c} | {d} | tentpoot (bouwmaat 65); a–poot (bouwmaat 56) |\n"
          f"| v3 mark.svg | {e_} | {f_} | dakpunt van 21° |\n"
          f"| v4 mark.svg | {g_} | {h_} | poot en paal; band–dak |")

r = rchk['tent-3x3-klaproos-hero.webp']
rc = f"| v4 `img/tent-3x3-klaproos-hero.webp` | {r['lit']['hex']} (ΔE {nl(r['lit']['de2000'],1)}) | {r['mid']['hex']} (ΔE {nl(r['mid']['de2000'],1)}) | {r['shade']['hex']} (ΔE {nl(r['shade']['de2000'],1)}) | {r['target']['hex']} |"
SEP = con['separation']['klaproos_vs_bordeaux']
minp = WM['primary']['min_sizes']['scherm']['min_width_px']
ls = meta['wordmark']['guides']['legsp']
lt = min(x['units'] for x in gp if any(t in x['between'] for t in ('frame', 'dak', 'tent')) and not all(t in x['between'] for t in ('frame', 'dak')))
lw = 11.34 * WM['primary']['width_units'] / WM['primary']['height_units']
M = {
  '{{PALETTE}}': pal, '{{CONTRAST}}': '\n'.join(rows), '{{FORBIDDEN}}': forb, '{{PAIRS_N}}': str(len(con['rows'])),
  '{{SCHEMES}}': '\n'.join(sl), '{{SCHEME_N}}': str(n_checks), '{{SCHEME_FAIL}}': str(n_fail), '{{SURFACES}}': surf,
  '{{REPRO}}': '\n'.join(rr), '{{SOURCES}}': src, '{{MINSIZES}}': '\n'.join(ms), '{{FEATURES}}': feat, '{{RENDERCHECK}}': rc,
  '{{STROKES}}': strokes, '{{GAPS}}': gaps, '{{RCHECK}}': rcheck,
  '{{MIN_TIP}}': nl(WM['primary']['corners']['min_tip_deg'], 0), '{{MIN_NOTCH}}': nl(WM['primary']['corners']['min_notch_deg'], 0),
  '{{ARM}}': str(meta['strokes']['arm k (loodrecht)']), '{{LEG}}': str(meta['strokes']['been k (loodrecht)']),
  '{{KL_GAP}}': n0(gp[0]['units']), '{{FLAG_CLR}}': n0(WM['primary']['flag_roof_clearance_units']), '{{TRACY_N}}': str(meta['spacing']['tracy_n']),
  '{{LEG_OUT}}': str(ls['out']), '{{LEG_IN}}': str(ls['in_round']), '{{LEG_IN2}}': str(ls['in_straight']), '{{LT_GAP}}': n0(lt),
  '{{LUIFEL_W}}': nl(lw, 0), '{{LUIFEL_PCT}}': nl(lw / 3, 0),
  '{{SEP_DE}}': nl(SEP['de2000'], 1), '{{SEP_HK}}': nl(SEP['hue_klaproos'], 0), '{{SEP_HB}}': nl(SEP['hue_bordeaux'], 0),
  '{{HOVER_CR}}': nl(con['separation']['klaproos_vs_inkt_hover']['contrast']),
  '{{MIN_LOGO_PX}}': str(minp), '{{MIN_LOGO_PX_1}}': str(minp - 1), '{{MIN_KLEIN_PX}}': str(WM['klein']['min_sizes']['scherm']['min_width_px']),
  '{{MIN_MARK_PX}}': str(MK['primary']['min_sizes']['scherm']['min_width_px']),
  '{{F_P}}': F(WM['primary']), '{{F_K}}': F(WM['klein']), '{{F_MP}}': F(MK['primary']), '{{F_MK}}': F(MK['klein']),
  '{{EMB_LOGO}}': str(WM['primary']['min_sizes']['borduren']['min_width_mm']), '{{FLOCK_LOGO}}': str(WM['primary']['min_sizes']['flock']['min_width_mm']),
  '{{EMB_KLEIN}}': str(WM['klein']['min_sizes']['borduren']['min_width_mm']), '{{FLOCK_KLEIN}}': str(WM['klein']['min_sizes']['flock']['min_width_mm']),
  '{{EMB_MARK}}': str(MK['klein']['min_sizes']['borduren']['min_width_mm']),
  '{{UNC_DE}}': nl(rep['colors']['klaproos']['fogra29_proof_de'], 1), '{{K_ALBEDO}}': tok['render']['klaproos_albedo'],
}
sys.path.insert(0, T)
md = open(os.path.join(T, 'brand.template.md')).read()
for k, v in M.items(): md = md.replace(k, v)
left = re.findall(r'\{\{[A-Z_0-9]+\}\}', md)
if left: sys.exit(f'unfilled: {left}')
open(os.path.join(B, 'brand.md'), 'w').write(md)
print('ok', len(md))
