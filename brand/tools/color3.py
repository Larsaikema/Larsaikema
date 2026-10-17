"""Colour science helpers + reproduction-reference matcher for the Klapklaar palette.

- sRGB <-> CIELAB (D65 and D50/Bradford), CIEDE2000
- nearest physical-standard references from open datasets (see SOURCES)
- CMYK via real ICC profiles (Adobe Coated FOGRA39 / Uncoated FOGRA29) with LittleCMS (Pillow ImageCms)

Run: python3 -I color3.py <colorsrc-dir> <out.json>
"""
import json, math, os, re, sys

def hex2rgb(h):
    h = h.lstrip('#'); return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
def rgb2hex(r, g, b): return '#%02X%02X%02X' % (round(r), round(g), round(b))
def lin(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
def srgb2xyz(h):
    r, g, b = (lin(c) for c in hex2rgb(h))
    return (0.4124564*r + 0.3575761*g + 0.1804375*b,
            0.2126729*r + 0.7151522*g + 0.0721750*b,
            0.0193339*r + 0.1191920*g + 0.9503041*b)
D65 = (0.95047, 1.0, 1.08883); D50 = (0.96422, 1.0, 0.82521)
BRAD = ((0.8951, 0.2664, -0.1614), (-0.7502, 1.7135, 0.0367), (0.0389, -0.0685, 1.0296))
BRADI = ((0.9869929, -0.1470543, 0.1599627), (0.4323053, 0.5183603, 0.0492912), (-0.0085287, 0.0400428, 0.9684867))
def mv(m, v): return tuple(sum(m[i][j] * v[j] for j in range(3)) for i in range(3))
def adapt(xyz, src, dst):
    s, d = mv(BRAD, src), mv(BRAD, dst)
    c = mv(BRAD, xyz); c = (c[0] * d[0] / s[0], c[1] * d[1] / s[1], c[2] * d[2] / s[2])
    return mv(BRADI, c)
def xyz2lab(xyz, wp):
    f = lambda t: t ** (1/3) if t > (6/29) ** 3 else t / (3 * (6/29) ** 2) + 4/29
    fx, fy, fz = (f(xyz[i] / wp[i]) for i in range(3))
    return (116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz))
def lab65(h): return xyz2lab(srgb2xyz(h), D65)
def lab50(h): return xyz2lab(adapt(srgb2xyz(h), D65, D50), D50)

def de2000(l1, l2):
    L1, a1, b1 = l1; L2, a2, b2 = l2
    C1, C2 = math.hypot(a1, b1), math.hypot(a2, b2); Cb = (C1 + C2) / 2
    G = 0.5 * (1 - math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)))
    a1p, a2p = (1 + G) * a1, (1 + G) * a2
    C1p, C2p = math.hypot(a1p, b1), math.hypot(a2p, b2)
    h1p = math.degrees(math.atan2(b1, a1p)) % 360; h2p = math.degrees(math.atan2(b2, a2p)) % 360
    dLp, dCp = L2 - L1, C2p - C1p
    dh = h2p - h1p
    if C1p * C2p == 0: dh = 0
    elif dh > 180: dh -= 360
    elif dh < -180: dh += 360
    dHp = 2 * math.sqrt(C1p * C2p) * math.sin(math.radians(dh / 2))
    Lbp, Cbp = (L1 + L2) / 2, (C1p + C2p) / 2
    if C1p * C2p == 0: hbp = h1p + h2p
    elif abs(h1p - h2p) <= 180: hbp = (h1p + h2p) / 2
    elif h1p + h2p < 360: hbp = (h1p + h2p + 360) / 2
    else: hbp = (h1p + h2p - 360) / 2
    Tt = (1 - 0.17 * math.cos(math.radians(hbp - 30)) + 0.24 * math.cos(math.radians(2 * hbp))
          + 0.32 * math.cos(math.radians(3 * hbp + 6)) - 0.20 * math.cos(math.radians(4 * hbp - 63)))
    dth = 30 * math.exp(-((hbp - 275) / 25) ** 2)
    Rc = 2 * math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7))
    Sl = 1 + 0.015 * (Lbp - 50) ** 2 / math.sqrt(20 + (Lbp - 50) ** 2)
    Sc = 1 + 0.045 * Cbp; Sh = 1 + 0.015 * Cbp * Tt
    Rt = -math.sin(math.radians(2 * dth)) * Rc
    return math.sqrt((dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh))

def lab_hue(lab): return math.degrees(math.atan2(lab[2], lab[1])) % 360

# ------------------------------------------------------------------ datasets
SOURCES = {
  'pantone_c': {'repo': 'https://github.com/aj90909/unofficial-pantone-solid-coated-2024-v5', 'commit': '3d6ad83683cebc13ec859a675eae2a4c29bfd4d8',
                'file': 'output.json', 'what': 'Pantone Solid Coated 2024 (3219 kleuren), Lab D50, onofficieel: gemeten uit de kleurvoorbeelden op pantone.com (README van de repo)'},
  'pantone_tcx': {'repo': 'https://github.com/pedroduke/pantone-tcx', 'commit': '566d68d90f35047a6a1dfca28786b149269184e1',
                  'file': 'src/pantoneColors.js', 'what': 'Pantone FHI Cotton TCX, naam + sRGB-hex, onofficieel'},
  'ral_a': {'repo': 'https://github.com/ieskudero/ral-colors', 'commit': '55e9cfc3d0b333af74c56acad6bd1aeee840d83a', 'file': 'RAL/classic.js',
            'what': 'RAL Classic, sRGB-hex (bron A)'},
  'ral_b': {'repo': 'https://github.com/office952/workos-vscode', 'commit': 'a1c28854dbeee553c8420c4639c8145ebe9d9230',
            'file': 'frontend/src/lib/colorRegistry/import/sources/ral_standard.csv', 'what': 'RAL Classic, sRGB-hex (bron B; de repo noemt het zelf "preview HEX approximate")'},
  'oracal651': {'repo': 'https://github.com/office952/workos-vscode', 'commit': 'a1c28854dbeee553c8420c4639c8145ebe9d9230',
                'file': 'frontend/src/lib/colorRegistry/import/sources/oracal651-orafol.txt', 'what': 'ORACAL 651 snijfolie, sRGB "parsed from ORAFOL ORACAL 651 product page (sample colors)"'},
  'icc_coated': {'repo': 'https://github.com/ConRes/conres.io', 'commit': '800dbc48d23cc3305c5176296a369e6af23ee1ab',
                 'file': 'testing/iso/ptf/2026/packages/color-engine-2026-04-20/tests/fixtures/profiles/cmyk/CoatedFOGRA39.icc',
                 'what': 'Adobe "Coated FOGRA39 (ISO 12647-2:2004)", git-lfs sha256 da2b9b59...ce77'},
  'icc_uncoated': {'repo': 'https://github.com/ConRes/conres.io', 'commit': '800dbc48d23cc3305c5176296a369e6af23ee1ab',
                   'file': 'testing/iso/ptf/2026/packages/color-engine-2026-04-20/tests/fixtures/profiles/cmyk/UncoatedFOGRA29.icc',
                   'what': 'Adobe "Uncoated FOGRA29 (ISO 12647-2:2004)", git-lfs sha256 9af0eb03...c392'},
}

def load(src):
    d = {}
    pc = json.load(open(os.path.join(src, 'aj90909_unofficial-pantone-solid-coated-2024-v5/output.json')))
    d['pantone_c'] = [(c['name'].replace('PANTONE ', ''), tuple(c['components'])) for c in pc['colors']]
    js = open(os.path.join(src, 'pedroduke_pantone-tcx/src/pantoneColors.js')).read()
    d['pantone_tcx'] = [(f'{m[2]} TCX {m[0]}', lab65(m[1])) for m in re.findall(r'name:\s*"([^"]+)",\s*hex:\s*"(#[0-9A-Fa-f]{6})",\s*tcx:\s*"([^"]+)"', js)]
    js = open(os.path.join(src, 'ieskudero_ral-colors/RAL/classic.js')).read()
    d['ral_a'] = [(f'RAL {m[0]} {m[1]}', lab65(m[2])) for m in re.findall(r"RAL(\d{4}):\s*\{\s*description:\s*'([^']+)',\s*HEX:\s*'(#[0-9A-Fa-f]{6})'", js)]
    rb = []
    for ln in open(os.path.join(src, 'office952_workos-vscode/frontend/src/lib/colorRegistry/import/sources/ral_standard.csv')).read().splitlines()[1:]:
        p = ln.split(',')
        if len(p) > 8 and p[2].startswith('#'): rb.append((f'{p[0]} {p[4]} ({p[8]})', lab65(p[2])))
    d['ral_b'] = rb
    lines = open(os.path.join(src, 'office952_workos-vscode/frontend/src/lib/colorRegistry/import/sources/oracal651-orafol.txt')).read().splitlines()
    oc = []; cur = None
    for ln in lines:
        if ln.startswith('sRGB'):
            cur = tuple(int(v) for v in ln[4:].split(','))
        elif ln.startswith('#') and cur and not ln.startswith('# '):
            m = re.match(r'#(\d{3}[A-Z]?)(.*)', ln)
            if m and 'transparent' not in m[2] and 'matte' not in m[2]:
                oc.append((f'ORACAL 651-{m[1]} {m[2]}', lab65(rgb2hex(*cur))))
            cur = None
    d['oracal651'] = oc
    return d

def nearest(lab, lst, n=3):
    return sorted(((de2000(lab, l), name, l) for name, l in lst), key=lambda t: t[0])[:n]

def cmyk(hexes, profile):
    from PIL import Image, ImageCms
    src = ImageCms.createProfile('sRGB')
    dst = ImageCms.getOpenProfile(profile)
    out = {}
    for intent, iname in ((ImageCms.Intent.RELATIVE_COLORIMETRIC, 'rel'), (ImageCms.Intent.PERCEPTUAL, 'perc')):
        t = ImageCms.buildTransform(src, dst, 'RGB', 'CMYK', renderingIntent=intent, flags=ImageCms.Flags.BLACKPOINTCOMPENSATION)
        for h in hexes:
            im = Image.new('RGB', (1, 1), hex2rgb(h))
            c = ImageCms.applyTransform(im, t).getpixel((0, 0))
            out.setdefault(h, {})[iname] = [round(v / 255 * 100) for v in c]
    # round-trip: what that CMYK looks like when printed on this stock (proof), back to sRGB -> deltaE
    back = ImageCms.buildTransform(dst, src, 'CMYK', 'RGB', renderingIntent=ImageCms.Intent.ABSOLUTE_COLORIMETRIC)
    for h in hexes:
        c = out[h]['rel']
        im = Image.new('CMYK', (1, 1), tuple(round(v / 100 * 255) for v in c))
        r = ImageCms.applyTransform(im, back).getpixel((0, 0))
        out[h]['proof_hex'] = rgb2hex(*r); out[h]['proof_de'] = round(de2000(lab65(h), lab65(rgb2hex(*r))), 1)
    return out

if __name__ == '__main__':
    src, outp = sys.argv[1], sys.argv[2]
    pal = json.loads(sys.argv[3]) if len(sys.argv) > 3 else {}
    d = load(src)
    res = {'sources': SOURCES, 'counts': {k: len(v) for k, v in d.items()}, 'colors': {}}
    coated = cmyk(list(pal.values()), os.path.join(src, 'icc/CoatedFOGRA39.icc'))
    unc = cmyk(list(pal.values()), os.path.join(src, 'icc/UncoatedFOGRA29.icc'))
    for name, h in pal.items():
        L65, L50 = lab65(h), lab50(h)
        e = {'hex': h, 'lab_d50': [round(v, 1) for v in L50], 'lab_d65': [round(v, 1) for v in L65],
             'cmyk_fogra39': coated[h]['rel'], 'cmyk_fogra39_perceptual': coated[h]['perc'], 'fogra39_proof_hex': coated[h]['proof_hex'], 'fogra39_proof_de': coated[h]['proof_de'],
             'cmyk_fogra29': unc[h]['rel'], 'fogra29_proof_hex': unc[h]['proof_hex'], 'fogra29_proof_de': unc[h]['proof_de']}
        e['pantone_c'] = [{'name': n, 'de': round(x, 1), 'lab_d50': list(l)} for x, n, l in nearest(L50, d['pantone_c'])]
        for k in ('pantone_tcx', 'ral_a', 'ral_b', 'oracal651'):
            e[k] = [{'name': n, 'de': round(x, 1)} for x, n, l in nearest(L65, d[k])]
        res['colors'][name] = e
    json.dump(res, open(outp, 'w'), indent=1, ensure_ascii=False)
    for name, e in res['colors'].items():
        print(f"\n{name} {e['hex']} Lab50 {e['lab_d50']}  CMYK39 {e['cmyk_fogra39']} (proof dE {e['fogra39_proof_de']})  CMYK29 {e['cmyk_fogra29']} (dE {e['fogra29_proof_de']})")
        for k in ('pantone_c', 'pantone_tcx', 'ral_a', 'ral_b', 'oracal651'):
            print('  ', k, ' | '.join(f"{x['name']} dE{x['de']}" for x in e[k]))
