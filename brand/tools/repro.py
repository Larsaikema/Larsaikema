"""Reproduction references for the Klapklaar v7 palette: CMYK (FOGRA39/29 ICC), nearest Pantone C, Pantone U, Pantone
TCX (textile), RAL, ORACAL 651 and embroidery thread (Madeira Polyneon, Isacord, Gunold Poly), all by CIEDE2000.

    python3 -I repro.py <colorsrc-dir> <brand-dir>/tools/_repro.json

Datasets are open, unofficial digital copies (sources + commits below); every match is a starting point for a
physical draw-down, never a final spec.
"""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import color3 as C

PAL = {'lampion': '#E66414', 'inkt': '#1D2420', 'zand': '#FBF6EC', 'polder': '#154F3E', 'zon': '#FFC23A'}

EXTRA = {
  'pantone_u': {'repo': 'https://github.com/jacobbubu/color-books', 'commit': '6edf3a058c0a40017f0c451f1910170433af70db',
                'file': 'color-books/PANTONE+ Solid Uncoated-V3.json', 'what': 'PANTONE+ Solid Uncoated (V3), Lab D50 uit een Adobe .acb-kleurboek (X-Rite 2014), onofficieel'},
  'threads': {'repo': 'https://github.com/inkstitch/inkstitch', 'commit': '6555892128e34c390493407d76f0fe9e0f7cf905',
              'file': 'palettes/InkStitch Madeira Polyneon.gpl · InkStitch Isacord Polyester.gpl · InkStitch Gunold Polyester.gpl',
              'what': 'Ink/Stitch-borduurpaletten (GPL-3.0): kleurnaam, nummer en een sRGB-benadering per garen'},
}

def gpl(path, label):
    out = []
    for ln in open(path, encoding='utf-8', errors='replace').read().splitlines():
        m = re.match(r'\s*(\d+)\s+(\d+)\s+(\d+)\s+(.+?)\s+(\S+)\s*$', ln)
        if m:
            h = C.rgb2hex(int(m[1]), int(m[2]), int(m[3]))
            out.append((f'{label} {m[5]} {m[4].strip()}', C.lab65(h)))
    return out

if __name__ == '__main__':
    src, outp = sys.argv[1], sys.argv[2]
    d = C.load(src)
    pu = json.load(open(os.path.join(src, 'jacobbubu_color-books/color-books/PANTONE+ Solid Uncoated-V3.json')))
    d['pantone_u'] = [(k.replace('PANTONE ', ''), tuple(v['components'])) for k, v in pu['records'].items()]
    pal = os.path.join(src, 'inkstitch/palettes')
    d['madeira'] = gpl(os.path.join(pal, 'InkStitch Madeira Polyneon.gpl'), 'Madeira Polyneon')
    d['isacord'] = gpl(os.path.join(pal, 'InkStitch Isacord Polyester.gpl'), 'Isacord')
    d['gunold'] = gpl(os.path.join(pal, 'InkStitch Gunold Polyester.gpl'), 'Gunold Poly')
    coated = C.cmyk(list(PAL.values()), os.path.join(src, 'icc/CoatedFOGRA39.icc'))
    unc = C.cmyk(list(PAL.values()), os.path.join(src, 'icc/UncoatedFOGRA29.icc'))
    res = {'sources': dict(C.SOURCES, **EXTRA), 'counts': {k: len(v) for k, v in d.items()}, 'colors': {}}
    for name, h in PAL.items():
        L65, L50 = C.lab65(h), C.lab50(h)
        e = {'hex': h, 'lab_d50': [round(v, 1) for v in L50], 'lab_d65': [round(v, 1) for v in L65],
             'cmyk_fogra39': coated[h]['rel'], 'fogra39_proof_de': coated[h]['proof_de'],
             'cmyk_fogra29': unc[h]['rel'], 'fogra29_proof_de': unc[h]['proof_de']}
        for k in ('pantone_c', 'pantone_u'):
            e[k] = [{'name': n, 'de': round(x, 1)} for x, n, l in C.nearest(L50, d[k])]
        for k in ('pantone_tcx', 'ral_a', 'ral_b', 'oracal651', 'madeira', 'isacord', 'gunold'):
            e[k] = [{'name': n, 'de': round(x, 1)} for x, n, l in C.nearest(L65, d[k])]
        res['colors'][name] = e
    json.dump(res, open(outp, 'w'), indent=1, ensure_ascii=False)
    for name, e in res['colors'].items():
        print(f"\n{name} {e['hex']} CMYK39 {e['cmyk_fogra39']} (dE {e['fogra39_proof_de']}) CMYK29 {e['cmyk_fogra29']} (dE {e['fogra29_proof_de']})")
        for k in ('pantone_c', 'pantone_u', 'pantone_tcx', 'ral_b', 'oracal651', 'madeira', 'isacord', 'gunold'):
            print('  ', k, ' | '.join(f"{x['name']} dE{x['de']}" for x in e[k]))
