#!/usr/bin/env python3
"""Validate the Klapklaar catalog against catalog/CONTRACT.md (python3 stdlib only).

    python3 catalog/validate.py           # human summary; exit 1 when there are errors
    python3 catalog/validate.py --json    # machine-readable result
    python3 catalog/validate.py -v        # also list every warning / info line

Reads catalog/catalog.json, catalog/export/*, catalog/preview-data.staging.json and CONTRACT.md itself (the
metafield tables, tags, collection/menu/page handles are parsed from the contract text, so a contract change
is picked up without editing this file). Run catalog/build.py first.

Levels: ERROR = contract or Shopify-import breakage (exit 1) · WARN = data to review (owner/supplier, theme side)
· INFO = expected state (e.g. images not rendered yet).
"""
from __future__ import annotations

import argparse
import csv
import io
import json
import re
import sys
import zlib
from collections import Counter, defaultdict
from pathlib import Path
from urllib.parse import parse_qs, unquote_plus, urlsplit

HERE = Path(__file__).resolve().parent
REPO = HERE.parent
EXPORT = HERE / 'export'
IMAGES = HERE / 'images'
FIXTURE = HERE / 'preview-data.staging.json'
LIVE_FIXTURE = HERE / 'preview-data.json'
THEME = REPO / 'theme'
IMAGE_BASE_URL = 'https://raw.githubusercontent.com/Larsaikema/Larsaikema/claude/shopify-webshop/catalog/images/'

sys.path.insert(0, str(HERE))
sys.dont_write_bytecode = True  # no catalog/__pycache__ in the repo
import build  # noqa: E402  (CSV writer + strip_comments + stable ids: validate the real export path)


class Report:
    def __init__(self):
        self.items = []

    def add(self, level, area, msg):
        self.items.append({'level': level, 'area': area, 'msg': msg})

    def e(self, area, msg):
        self.add('ERROR', area, msg)

    def w(self, area, msg):
        self.add('WARN', area, msg)

    def i(self, area, msg):
        self.add('INFO', area, msg)

    def count(self, level):
        return sum(1 for x in self.items if x['level'] == level)


# --------------------------------------------------------------------------------------------------
# CONTRACT.md parsing
# --------------------------------------------------------------------------------------------------
def section(md: str, title_start: str) -> str:
    m = re.search(r'^## ' + re.escape(title_start) + r'.*?$(.*?)(?=^## |\Z)', md, re.M | re.S)
    return m.group(1) if m else ''


def parse_contract(md: str):
    c = {}

    def table_types(sec):
        out = {}
        for line in sec.splitlines():
            m = re.match(r'\|\s*`([a-z_]+)`\s*\|\s*([a-z_.]+)', line)
            if m:
                out[m.group(1)] = m.group(2)
        return out
    c['product_mf'] = table_types(section(md, 'Product metafields'))
    c['variant_mf'] = table_types(section(md, 'Variant metafields'))
    c['collection_mf'] = table_types(section(md, 'Collection metafields'))
    c['tags'] = set(re.findall(r'`([a-z:\-]+)`', section(md, 'Tags')))
    c['collections'] = [h for h in re.findall(r'`([a-z0-9\-]+)`', section(md, 'Collections (handles)'))]
    c['menus'] = re.findall(r'`([a-z0-9\-]+)`', section(md, 'Menus (handles)'))
    pages = {}
    for h, suf in re.findall(r'`([a-z0-9\-]+)`\s*→\s*(page(?:\.[a-z\-]+)?)', section(md, 'Pages')):
        pages[h] = None if suf == 'page' else suf.split('.', 1)[1]
    c['pages'] = pages
    blog = section(md, 'Blog')
    m = re.search(r'Handle `([a-z\-]+)`\s*\(title "([^"]+)"\)', blog)
    c['blog_handle'], c['blog_title'] = (m.group(1), m.group(2)) if m else ('advies', None)
    c['option_names'] = re.findall(r'^\|\s*`([A-Z][a-z]+)`\s*\|', section(md, 'Product options'), re.M)
    av = re.search(r'`availability_status`.*', md)
    c['availability'] = re.findall(r'`(binnenkort|pre-order|permanent-uitverkocht)`', av.group(0)) if av else []
    return c


# --------------------------------------------------------------------------------------------------
# helpers
# --------------------------------------------------------------------------------------------------
HANDLE_RE = re.compile(r'^[a-z0-9]+(?:-[a-z0-9]+)*$')
FILE_RE = re.compile(r'^[a-z0-9]+(?:-[a-z0-9]+)*\.(?:webp|jpg|jpeg|png)$')
NUM = r'\d+(?:,\d+)?'
MAAT_RE = re.compile(
    rf'^(?:{NUM} x {NUM}(?: x {NUM})? (?:m|cm)'      # 3 x 3 m · 3 x 3 x 3 m · 183 x 76 cm
    rf'|Ø{NUM}(?:-{NUM})? (?:cm|m)'                   # Ø80 cm · Ø80-85 cm · Ø8 m
    rf'|{NUM} m(?: breed)?)$')                        # 3 m · 2,5 m · 3 m breed
KLEUR_RE = re.compile(r'^[A-ZÉ][a-zà-ÿ]+(?:-[a-zà-ÿ]+)?(?: [a-zà-ÿ]+)?$')   # 'Grijs-wit': a two-tone cloth (banen in grijs en wit)

FORBIDDEN = [
    (r'beste van nederland', 'superlative'), (r'\bnr\.?\s?1\b', 'nr. 1'), (r'\bnummer\s?(?:1|één|een)\b', 'nummer 1'),
    (r'\breviews?\b', 'reviews'), (r'\brecensies?\b', 'recensies'), (r'\bsterren\b', 'sterren'), (r'[★☆⭐]', 'star glyph'),
    (r'\b\d(?:[.,]\d)?\s*(?:/\s*(?:5|10)\b|uit 5\b)', 'rating score'), (r'tevreden klanten', 'customer count'),
    (r'\bbestsellers?\b', 'bestseller'), (r'\bbest verkochte?\b', 'best verkocht'), (r'\bmeest verkochte?\b', 'meest verkocht'),
    (r'\bbekend van\b', 'bekend van'), (r'\bwij scoren\b', 'score claim'), (r'\bklanten geven\b', 'score claim'),
    (r'\bonverwoestbaar\b', 'superlative'), (r'\bgoedkoopste\b', 'superlative'), (r'\bbeste prijs\b', 'superlative'),
    (r'\b(?:duizenden|honderden)\s+klanten\b', 'customer count'), (r'\bkeurmerk\b', 'trust badge'),
]
FORBIDDEN_RE = [(re.compile(p, re.I), why) for p, why in FORBIDDEN]
NEGATION = re.compile(r'\b(?:geen|niet|nooit|zonder|niets|verzinnen)\b', re.I)
FORMAL_RE = re.compile(r'(?<![\w’\'-])(?:u|uw|U|Uw)(?![\w’\'-])')
KLAP_RE = re.compile(r'\b(?:in één klap|klap)\b', re.I)
KLAP_CONTEXT = re.compile(r'\b(?:wind|storm|windkracht|stevig\w*|garantie)\b', re.I)
TAG_RE = re.compile(r'<[^>]+>')
LINK_RE = re.compile(r'href="(/[^"#?]*)(?:[?#][^"]*)?"')


def text_of(html: str) -> str:
    t = TAG_RE.sub(' ', html or '')
    return re.sub(r'\s+', ' ', t).strip()


def sentences(t: str):
    return re.split(r'(?<=[.!?:;])\s+|\n', t)


def check_copy(rep: Report, area: str, text: str, allowed_neg: list):
    if not text:
        return
    for sent in sentences(text):
        for rx, why in FORBIDDEN_RE:
            m = rx.search(sent)
            if not m:
                continue
            if NEGATION.search(sent[:m.start()]):
                allowed_neg.append(f'{area}: “{sent.strip()[:110]}”')
                continue
            rep.e('claims', f'{area}: forbidden {why} “{m.group(0)}” in “{sent.strip()[:120]}”')
        if KLAP_RE.search(sent) and KLAP_CONTEXT.search(sent):
            rep.w('voice', f'{area}: ‘klap’ next to wind/stevigheid/garantie (brand.md §7 rule 6): “{sent.strip()[:120]}”')
    if FORMAL_RE.search(text):
        m = FORMAL_RE.search(text)
        rep.w('voice', f'{area}: formal u/uw (brand voice is je/jij): …{text[max(0, m.start() - 40):m.end() + 40]}…')


def is_list_of_str(v):
    return isinstance(v, list) and all(isinstance(x, str) and x.strip() for x in v)


def theme_swatches():
    try:
        schema = json.loads((THEME / 'config' / 'settings_schema.json').read_text(encoding='utf-8'))
    except (OSError, ValueError):
        return None
    for g in schema:
        for st in g.get('settings', []) or []:
            if st.get('id') == 'swatch_colors':
                return {ln.split(':', 1)[0].strip() for ln in (st.get('default') or '').splitlines() if ':' in ln}
    return None


# --------------------------------------------------------------------------------------------------
# checks
# --------------------------------------------------------------------------------------------------
def check_metafield_value(rep, area, key, mtype, v, ctx):
    P, pages = ctx['products'], ctx['pages']
    if mtype == 'single_line_text_field':
        if not isinstance(v, str) or not v.strip() or '\n' in v:
            rep.e('metafields', f'{area}: {key} must be a one-line string')
        elif key in ctx['choices'] and v not in ctx['choices'][key]:
            rep.e('metafields', f'{area}: {key} = {v!r} not in {ctx["choices"][key]}')
    elif mtype == 'multi_line_text_field':
        if not isinstance(v, str) or not v.strip():
            rep.e('metafields', f'{area}: {key} must be text')
    elif mtype == 'list.single_line_text_field':
        if not is_list_of_str(v) or any('\n' in x for x in v):
            rep.e('metafields', f'{area}: {key} must be a list of one-line strings')
        elif key in ctx['choices'] and not set(v) <= set(ctx['choices'][key]):
            rep.e('metafields', f'{area}: {key} values {sorted(set(v) - set(ctx["choices"][key]))} not in {ctx["choices"][key]}')
    elif mtype == 'boolean':
        if not isinstance(v, bool):
            rep.e('metafields', f'{area}: {key} must be boolean')
    elif mtype == 'number_decimal':
        if isinstance(v, bool) or not isinstance(v, (int, float)) or v <= 0:
            rep.e('metafields', f'{area}: {key} must be a positive number')
    elif mtype == 'list.number_integer':
        if not isinstance(v, list) or not all(isinstance(x, int) and not isinstance(x, bool) and x > 0 for x in v):
            rep.e('metafields', f'{area}: {key} must be a list of positive integers')
    elif mtype == 'list.product_reference':
        if not is_list_of_str(v):
            rep.e('metafields', f'{area}: {key} must be a list of product handles')
        else:
            for h in v:
                if h not in P:
                    rep.e('metafields', f'{area}: {key} → unknown product {h}')
                if h == ctx.get('self'):
                    rep.e('metafields', f'{area}: {key} references the product itself')
            if len(set(v)) != len(v):
                rep.e('metafields', f'{area}: {key} has duplicates')
    elif mtype == 'page_reference':
        if v not in pages:
            rep.e('metafields', f'{area}: {key} → unknown page {v}')
    elif mtype == 'list.file_reference':
        if not is_list_of_str(v):
            rep.e('metafields', f'{area}: {key} must be a list of files')
    elif mtype == 'rich_text_field':
        if not (isinstance(v, dict) and v.get('type') == 'root' and v.get('children')):
            rep.e('metafields', f'{area}: {key} must be Shopify rich text JSON (type root with children)')
    elif mtype == 'json':
        check_json_mf(rep, area, key, v, ctx)
    elif mtype == 'list.variant_reference':
        pass  # per-variant, checked with bundles
    elif mtype == 'date':
        if not isinstance(v, str) or not re.match(r'^\d{4}-\d{2}-\d{2}$', v):
            rep.e('metafields', f'{area}: {key} must be a date YYYY-MM-DD')
    else:
        rep.e('metafields', f'{area}: {key} has unsupported type {mtype}')


def check_json_mf(rep, area, key, v, ctx):
    p = ctx.get('product') or {}
    if key == 'specificaties':
        if not isinstance(v, list) or not v or not all(
                isinstance(r, dict) and all(isinstance(r.get(k), str) and r.get(k).strip() for k in ('groep', 'label', 'waarde'))
                for r in v):
            rep.e('metafields', f'{area}: specificaties must be [{{groep,label,waarde}}] with non-empty strings')
        else:
            seen = Counter((r['groep'], r['label']) for r in v)
            for (g, l), n in seen.items():
                if n > 1:
                    rep.w('metafields', f'{area}: specificaties row {g} / {l} appears {n}×')
    elif key == 'staffelkorting':
        ok = isinstance(v, list) and v and all(isinstance(r, dict) and isinstance(r.get('vanaf'), int)
                                               and isinstance(r.get('korting'), (int, float)) for r in v)
        if not ok:
            rep.e('metafields', f'{area}: staffelkorting must be [{{vanaf:int, korting:number}}]')
        else:
            vs = [r['vanaf'] for r in v]
            ks = [r['korting'] for r in v]
            if vs != sorted(vs) or len(set(vs)) != len(vs) or vs[0] < 2:
                rep.e('metafields', f'{area}: staffelkorting tiers must be increasing and start at ≥ 2 ({vs})')
            if ks != sorted(ks) or not all(0 < k < 100 for k in ks):
                rep.e('metafields', f'{area}: staffelkorting percentages must be increasing, 0–100 ({ks})')
    elif key == 'faq':
        if not isinstance(v, list) or not v or not all(
                isinstance(r, dict) and isinstance(r.get('vraag'), str) and r['vraag'].strip()
                and isinstance(r.get('antwoord'), str) and r['antwoord'].strip() for r in v):
            rep.e('metafields', f'{area}: faq must be [{{vraag, antwoord}}] with text')
    elif key == 'drukopties':
        if not isinstance(v, dict):
            rep.e('metafields', f'{area}: drukopties must be an object')
            return
        for k in ('aanlevering', 'levertijd'):
            if not isinstance(v.get(k), str) or not v[k].strip():
                rep.e('metafields', f'{area}: drukopties.{k} missing')
        if not isinstance(v.get('posities', []), list):
            rep.e('metafields', f'{area}: drukopties.posities must be a list')
        if not isinstance(v.get('min_aantal', 1), int) or v.get('min_aantal', 1) < 1:
            rep.e('metafields', f'{area}: drukopties.min_aantal must be an integer ≥ 1')
        if v.get('optie'):
            names = [o['name'] for o in p.get('options', [])]
            if v['optie'] not in names:
                rep.e('metafields', f'{area}: drukopties.optie {v["optie"]} is not an option of the product')
            else:
                vals = next(o['values'] for o in p['options'] if o['name'] == v['optie'])
                for z in v.get('zonder') or []:
                    if z not in vals:
                        rep.e('metafields', f'{area}: drukopties.zonder value {z!r} is not a {v["optie"]} value')
                if all(x in (v.get('zonder') or []) for x in vals):
                    rep.e('metafields', f'{area}: drukopties.zonder covers every {v["optie"]} value (nothing printable)')
    elif key == 'configurator':
        if not isinstance(v, dict) or v.get('type') not in ('oppervlakte', 'lengte'):
            rep.e('metafields', f'{area}: configurator.type must be oppervlakte or lengte')
            return
        velden = v.get('velden') or []
        if not velden:
            rep.e('metafields', f'{area}: configurator.velden empty')
        for f in velden:
            try:
                if not (f['min'] <= f['standaard'] <= f['max']) or f['stap'] <= 0 or not f['id'] or not f['label']:
                    rep.e('metafields', f'{area}: configurator veld {f.get("id")} has inconsistent min/standaard/max/stap')
            except (KeyError, TypeError):
                rep.e('metafields', f'{area}: configurator veld {f.get("id")} misses id/label/min/max/stap/standaard')
        for k in v.get('keuzes') or []:
            if not k.get('label') or not is_list_of_str(k.get('opties')):
                rep.e('metafields', f'{area}: configurator keuze without label/opties')
        if v.get('type') == 'oppervlakte' and len(velden) < 2:
            rep.e('metafields', f'{area}: configurator oppervlakte needs two velden')
    elif key == 'verzendkosten_staffel':
        def tiers_ok(t):
            return (isinstance(t, list) and t and all(isinstance(r, dict) and isinstance(r.get('vanaf'), int) and r['vanaf'] >= 1
                                                       and isinstance(r.get('bedrag'), (int, float)) and r['bedrag'] >= 0 for r in t)
                    and t[0]['vanaf'] == 1 and [r['vanaf'] for r in t] == sorted({r['vanaf'] for r in t}))
        if not isinstance(v, dict) or v.get('eenheid') not in ('per zending', 'per stuk') or not tiers_ok(v.get('staffel')):
            rep.e('metafields', f'{area}: verzendkosten_staffel must be {{eenheid: per zending|per stuk, staffel: [{{vanaf:1, bedrag}} ...]}}')
            return
        po = v.get('per_optie')
        if po:
            names = [o['name'] for o in p.get('options', [])]
            if po.get('optie') not in names:
                rep.e('metafields', f'{area}: verzendkosten_staffel.per_optie.optie {po.get("optie")!r} is not an option')
            else:
                vals = set(next(o['values'] for o in p['options'] if o['name'] == po['optie']))
                w = po.get('waarden') or {}
                if set(w) != vals or not all(tiers_ok(t) for t in w.values()):
                    rep.e('metafields', f'{area}: verzendkosten_staffel.per_optie must give tiers for every {po["optie"]} value')
        lead = re.search(r'€\s?([\d.]+,\d{2})', (p.get('metafields') or {}).get('verzendkosten') or '')
        # 'vanaf € x': the lowest amount for one piece / one shipment (a quantity tier further down is not the lead amount)
        low = min([r['bedrag'] for r in v['staffel'] if r['vanaf'] <= 1] + [t[0]['bedrag'] for t in (po or {}).get('waarden', {}).values()])
        if not lead or abs(float(lead.group(1).replace('.', '').replace(',', '.')) - low) > 0.005:
            rep.e('metafields', f'{area}: custom.verzendkosten does not state the lowest amount of verzendkosten_staffel ({low:.2f})')
    elif key == 'addon_korting':
        addons = set((p.get('metafields') or {}).get('addons') or [])
        if not isinstance(v, dict) or not isinstance(v.get('procent'), int) or not 0 < v['procent'] < 50 or not is_list_of_str(v.get('op')):
            rep.e('metafields', f'{area}: addon_korting must be {{procent: 1-49, op: [handles]}}')
        elif not set(v['op']) <= addons:
            rep.e('metafields', f'{area}: addon_korting.op lists {sorted(set(v["op"]) - addons)} that are no add-ons of the product')
    else:
        if v is None:
            rep.e('metafields', f'{area}: {key} json is null')


def run(verbose=False):
    rep = Report()
    allowed_neg: list[str] = []
    md = (HERE / 'CONTRACT.md').read_text(encoding='utf-8')
    C = parse_contract(md)
    cat = json.loads((HERE / 'catalog.json').read_text(encoding='utf-8'))
    products = cat['products']
    P = {p['handle']: p for p in products}
    pages = {pg['handle']: pg for pg in cat['pages']}
    colls = {c['handle']: c for c in cat['collections']}
    blog = cat['blog']
    articles = {a['handle']: a for a in blog['articles']}
    ext = cat.get('contract_extensions') or []
    ext_text = json.dumps(ext, ensure_ascii=False)

    # ---- contract as code (from CONTRACT.md) + extensions
    pmf_types = dict(C['product_mf'])
    pmf_types['componenten'] = 'list.variant_reference'
    for m in re.finditer(r'product metafield custom\.([a-z_]+) \(([a-z_.]+)\)', ext_text):
        pmf_types[m.group(1)] = m.group(2)
    cmf_types = C['collection_mf']
    if len(pmf_types) < 20 or len(cmf_types) < 3:
        rep.e('contract', f'could not parse CONTRACT.md metafield tables ({len(pmf_types)} product, {len(cmf_types)} collection)')
    contract_tags = C['tags']
    ext_collections = set()
    for x in ext:
        m = re.match(r'collections (.*)', x.get('what', ''))
        if m:
            ext_collections.update(h.strip() for h in m.group(1).split(','))
    choices = {'verzending': ['pakket', 'pallet'], 'availability_status': C['availability'] or
               ['binnenkort', 'pre-order', 'permanent-uitverkocht'], 'gebruik': list(build.GEBRUIK_LABELS.values())}
    ctx = {'products': P, 'pages': pages, 'choices': choices}
    swatches = theme_swatches()

    # ================================================================ products
    sku_seen = {}
    kleur_used = set()
    for p in products:
        h = p['handle']
        a = f'product {h}'
        ctx['self'] = h
        ctx['product'] = p
        if not HANDLE_RE.match(h):
            rep.e('products', f'{a}: invalid handle')
        if not p.get('title') or len(p['title']) > 255:
            rep.e('products', f'{a}: title missing or > 255')
        if p.get('vendor') != 'Klapklaar':
            rep.e('products', f'{a}: vendor {p.get("vendor")!r} ≠ Klapklaar')
        if p.get('status') not in ('active', 'draft', 'archived'):
            rep.e('products', f'{a}: status {p.get("status")!r}')
        if not p.get('product_type'):
            rep.e('products', f'{a}: product_type missing')
        mf = p['metafields']
        # tags
        has_compare = any(v.get('compare_at_price') for v in p['variants'])
        for t in p['tags']:
            if t != t.lower():
                rep.e('tags', f'{a}: tag {t!r} not lowercase')
            if t not in contract_tags:
                rep.e('tags', f'{a}: tag {t!r} not in CONTRACT tags')
            if re.search(r'best|top|populair|favoriet', t):
                rep.e('tags', f'{a}: unverifiable tag {t!r}')
        if 'badge:actie' in p['tags'] and not has_compare:
            rep.e('tags', f'{a}: badge:actie without a compare-at price')
        if ('bedrukbaar' in p['tags']) != bool(mf.get('bedrukbaar')):
            rep.e('tags', f'{a}: tag bedrukbaar and custom.bedrukbaar disagree')
        if ('pallet' in p['tags']) != (mf.get('verzending') == 'pallet'):
            rep.w('tags', f'{a}: tag pallet and custom.verzending={mf.get("verzending")!r} disagree')
        if 'badge:nieuw' in p['tags']:
            rep.i('tags', f'{a}: badge:nieuw (keep only if genuinely new at launch)')
        # options
        opts = p['options']
        names = [o['name'] for o in opts]
        if len(opts) > 3:
            rep.e('options', f'{a}: more than 3 options')
        if len(set(names)) != len(names):
            rep.e('options', f'{a}: duplicate option names')
        for o in opts:
            n = o['name']
            if n not in C['option_names'] and not (n == 'Bedrag' and p.get('gift_card')):
                rep.e('options', f'{a}: option name {n!r} not in CONTRACT ({", ".join(C["option_names"])})')
            vals = o['values']
            if not vals or len(set(vals)) != len(vals) or not all(isinstance(x, str) and x.strip() for x in vals):
                rep.e('options', f'{a}: option {n} values empty or duplicated')
            for val in vals:
                if val != val.strip() or '  ' in val:
                    rep.e('options', f'{a}: {n} value {val!r} has stray whitespace')
                if n == 'Maat' and not MAAT_RE.match(val):
                    rep.e('options', f'{a}: Maat value {val!r} does not follow the CONTRACT format')
                if n == 'Kleur':
                    kleur_used.add(val)
                    if not KLEUR_RE.match(val):
                        rep.e('options', f'{a}: Kleur value {val!r} is not a capitalised Dutch colour name')
                if n == 'Uitvoering' and not (val[0].isupper() or val[0].isdigit()):
                    rep.e('options', f'{a}: Uitvoering value {val!r} should start with a capital')
        # variants
        vs = p['variants']
        if not vs:
            rep.e('variants', f'{a}: no variants')
        # Shopify takes up to 2048 variants per product; Liquid's product.variants returns at most 250 and the theme builds
        # its variant picker from it (merchandising review 3: the statafelpakketten have 216)
        if len(vs) > 2048:
            rep.e('variants', f'{a}: {len(vs)} variants (> 2048, the Shopify maximum)')
        elif len(vs) > 250:
            rep.w('variants', f'{a}: {len(vs)} variants (> 250: Liquid product.variants returns only the first 250)')
        combos = []
        used = defaultdict(set)
        img_files = [i['file'] for i in p['images']]
        for v in vs:
            va = f'{a} / {v.get("sku")}'
            vals = [v.get(f'option{i + 1}') for i in range(3)]
            for i in range(3):
                if i < len(opts):
                    if vals[i] is None:
                        rep.e('variants', f'{va}: option{i + 1} missing')
                    elif vals[i] not in opts[i]['values']:
                        rep.e('variants', f'{va}: option{i + 1} {vals[i]!r} not declared on {opts[i]["name"]}')
                    else:
                        used[i].add(vals[i])
                elif vals[i] is not None:
                    rep.e('variants', f'{va}: option{i + 1} set without an option')
            combos.append(tuple(vals[:len(opts)]))
            sku = v.get('sku')
            if not sku or not re.match(r'^[A-Z0-9][A-Z0-9\-]*$', sku):
                rep.e('variants', f'{va}: SKU missing or not uppercase A-Z0-9-')
            elif sku in sku_seen:
                rep.e('variants', f'{va}: SKU duplicate (also {sku_seen[sku]})')
            else:
                sku_seen[sku] = h
            price = v.get('price')
            if not isinstance(price, int) or isinstance(price, bool) or price <= 0:
                rep.e('prices', f'{va}: price {price!r} must be a positive integer (cents)')
            cap = v.get('compare_at_price')
            if cap is not None and (not isinstance(cap, int) or cap <= (price or 0)):
                rep.e('prices', f'{va}: compare_at_price {cap!r} must be > price')
            g = v.get('grams')
            if not isinstance(g, int) or g < 0:
                rep.e('variants', f'{va}: grams must be an integer ≥ 0')
            elif g == 0 and v.get('requires_shipping', True):
                rep.e('variants', f'{va}: 0 g on a shipped variant')
            if v.get('inventory_management') not in ('shopify', None):
                rep.e('variants', f'{va}: inventory_management {v.get("inventory_management")!r}')
            if v.get('inventory_policy') not in ('deny', 'continue'):
                rep.e('variants', f'{va}: inventory_policy {v.get("inventory_policy")!r}')
            if v.get('inventory_management') == 'shopify' and (
                    not isinstance(v.get('inventory_quantity'), int) or v['inventory_quantity'] < 0):
                rep.e('variants', f'{va}: tracked variant needs inventory_quantity ≥ 0')
            for k in ('requires_shipping', 'taxable'):
                if not isinstance(v.get(k), bool):
                    rep.e('variants', f'{va}: {k} must be boolean')
            if v.get('image') and v['image'] not in img_files:
                rep.e('variants', f'{va}: variant image {v["image"]} is not one of the product images')
            if v.get('export_image') and v['export_image'] not in [i['file'] for i in p['images'] if i.get('exported')]:
                rep.e('variants', f'{va}: export image {v["export_image"]} is not an exported (real) product image')
            # merchandising review: a variant image shows the variant's own Kleur (never a Zwart render on a Bordeaux variant)
            if v.get('export_image') and 'Kleur' in names:
                vk = v.get(f'option{names.index("Kleur") + 1}')
                ik = next((i.get('kleur') for i in p['images'] if i['file'] == v['export_image']), None)
                if ik != vk:
                    rep.e('images', f'{va}: variant image {v["export_image"]} shows Kleur {ik!r}, the variant is {vk!r}')
            if not v.get('image') and len(vs) > 1 and p['images'] and p.get('variant_image_by'):
                rep.w('variants', f'{va}: no variant image although images vary by {p["variant_image_by"]}')
            qr = v.get('quantity_rule')
            if qr:
                if not (isinstance(qr.get('min'), int) and qr['min'] >= 1 and isinstance(qr.get('increment'), int)
                        and (qr.get('max') is None or qr['max'] >= qr['min'])):
                    rep.e('variants', f'{va}: invalid quantity_rule {qr}')
        if len(set(combos)) != len(combos):
            rep.e('variants', f'{a}: duplicate option combinations')
        for i, o in enumerate(opts):
            unused = [x for x in o['values'] if x not in used[i]]
            if unused:
                rep.e('variants', f'{a}: {o["name"]} values without a variant: {unused}')
        full = 1
        for o in opts:
            full *= len(o['values'])
        if opts and full != len(set(combos)):
            rep.i('variants', f'{a}: sparse variant matrix {len(set(combos))}/{full} (intentional combinations only)')
        # images
        if not p['images']:
            rep.e('images', f'{a}: no images')
        elif not any(i.get('exported') for i in p['images']):
            rep.i('images', f'{a}: no real render yet; the CSV and the fixture carry no image for it (never a draft card)')
        if len(set(img_files)) != len(img_files):
            rep.e('images', f'{a}: duplicate image files')
        for img in p['images']:
            if not FILE_RE.match(img['file']):
                rep.e('images', f'{a}: image file name {img["file"]!r} not lowercase-dash .webp/.jpg/.png')
            if not (img.get('alt') or '').strip():
                rep.e('images', f'{a}: empty alt text for {img["file"]}')
            elif len(img['alt']) > 512:
                rep.e('images', f'{a}: alt text > 512 chars for {img["file"]}')
            if img.get('photo'):
                if not (HERE / 'images' / img['file']).exists():
                    rep.e('images', f'{a}: photo {img["file"]} is not in catalog/images (python3 catalog/tools/photos.py --src ...)')
            elif not (img.get('render') or {}).get('model'):
                rep.e('images', f'{a}: image {img["file"]} has no render spec')
            if 'opdruk' in img['file'] or 'print' in img['file'] or 'logo' in img['file']:
                if 'voorbeeld' not in img.get('alt', '').lower() and 'logo' not in img.get('alt', '').lower():
                    rep.w('images', f'{a}: print image {img["file"]} alt does not say voorbeeld/logo')
        # copy
        body = text_of(p.get('body_html'))
        if len(body) < 200:
            rep.e('copy', f'{a}: body_html missing or very short ({len(body)} chars)')
        if '<!--' in build.strip_comments(p.get('body_html')):
            rep.e('copy', f'{a}: HTML comment survives strip_comments')
        seo = p.get('seo') or {}
        if not seo.get('title') or not seo.get('description'):
            rep.e('copy', f'{a}: SEO title/description missing')
        else:
            if len(seo['title']) > 70:
                rep.e('copy', f'{a}: SEO title {len(seo["title"])} > 70 chars')
            elif len(seo['title']) > 60:
                rep.w('copy', f'{a}: SEO title {len(seo["title"])} > 60 chars')
            if len(seo['description']) > 320:
                rep.e('copy', f'{a}: SEO description {len(seo["description"])} > 320 chars')
            elif len(seo['description']) > 160:
                rep.w('copy', f'{a}: SEO description {len(seo["description"])} > 160 chars')
        if not mf.get('kenmerk_kort'):
            rep.e('copy', f'{a}: kenmerk_kort missing')
        elif len(mf['kenmerk_kort']) > 70:
            rep.w('copy', f'{a}: kenmerk_kort {len(mf["kenmerk_kort"])} chars (cards fit ~60)')
        if not mf.get('usps') or not (3 <= len(mf['usps']) <= 4):
            rep.e('copy', f'{a}: usps must have 3–4 items ({len(mf.get("usps") or [])})')
        if not mf.get('specificaties'):
            rep.e('copy', f'{a}: specificaties missing')
        if not mf.get('faq'):
            rep.w('copy', f'{a}: no faq')
        texts = [('body', body), ('kenmerk_kort', mf.get('kenmerk_kort') or ''), ('seo', f'{seo.get("title")}. {seo.get("description")}'),
                 ('usps', '. '.join(mf.get('usps') or [])), ('included', '. '.join(mf.get('included') or [])),
                 ('excluded', '. '.join(mf.get('excluded') or [])),
                 ('faq', ' '.join(f'{x.get("vraag")} {x.get("antwoord")}' for x in mf.get('faq') or [])),
                 ('specificaties', '. '.join(f'{x.get("label")}: {x.get("waarde")}' for x in mf.get('specificaties') or [])),
                 ('alts', '. '.join(i.get('alt', '') for i in p['images']))]
        for nm, t in texts:
            check_copy(rep, f'{a} {nm}', t, allowed_neg)
        # metafields
        for k, val in mf.items():
            if k not in pmf_types:
                rep.e('metafields', f'{a}: metafield {k} not in CONTRACT')
                continue
            if val is None or val == [] or val == '':
                continue
            check_metafield_value(rep, a, k, pmf_types[k], val, ctx)
        lev = mf.get('levertijd')
        if lev and 'drukproef' in lev:
            rep.e('metafields', f'{a}: levertijd carries a print lead time ({lev!r}); use drukopties.levertijd')
        if mf.get('bedrukbaar') and not mf.get('drukopties'):
            rep.e('metafields', f'{a}: bedrukbaar without drukopties')
        if mf.get('drukopties') and not mf.get('bedrukbaar'):
            rep.e('metafields', f'{a}: drukopties on a product that is not bedrukbaar')
        conf = mf.get('configurator')
        if conf:
            bad = [v['sku'] for v in vs if v.get('inventory_policy') != 'continue']
            if bad:
                rep.e('metafields', f'{a}: configurator variants need inventory_policy continue ({len(bad)} deny)')
            if not lev:
                rep.e('metafields', f'{a}: configurator product needs a levertijd')
            if conf.get('min_afname') and vs and vs[0].get('quantity_rule', {}).get('min') not in (None, conf['min_afname']):
                rep.w('metafields', f'{a}: configurator min_afname {conf["min_afname"]} ≠ quantity_rule.min')
        if (mf.get('maatwerk') or (conf or {}).get('maatwerk')) and 'retour' not in body.lower():
            rep.w('copy', f'{a}: maatwerk product body does not mention retour')
        for k in ('addons', 'past_op', 'andere_maten', 'alternatieven'):
            for ref in mf.get(k) or []:
                if ref in P and P[ref]['status'] != 'active':
                    rep.w('metafields', f'{a}: {k} → {ref} is not active')
        for ref in mf.get('andere_maten') or []:
            if ref in P and h not in (P[ref]['metafields'].get('andere_maten') or []):
                rep.w('metafields', f'{a}: andere_maten → {ref} is not reciprocal')
        if mf.get('availability_status') == 'permanent-uitverkocht' and not (mf.get('alternatieven') or mf.get('past_op')):
            rep.e('metafields', f'{a}: permanent-uitverkocht without alternatieven/past_op')
        # bundles
        is_set = 'set' in p['tags']
        comp_variants = [v for v in vs if v['metafields'].get('componenten')]
        if is_set and len(comp_variants) != len(vs):
            rep.e('bundles', f'{a}: tag set but {len(vs) - len(comp_variants)} variant(s) without componenten')
        if comp_variants and not is_set:
            rep.w('bundles', f'{a}: has componenten but no tag set')
        for v in comp_variants:
            cs, qs = v['metafields']['componenten'], v['metafields'].get('component_aantallen') or []
            if len(cs) != len(qs) or not cs:
                rep.e('bundles', f'{a} / {v["sku"]}: componenten and component_aantallen lengths differ')
            los = 0
            for s, q in zip(cs, qs):
                if s not in sku_index(products):
                    rep.e('bundles', f'{a} / {v["sku"]}: component SKU {s} unknown')
                    continue
                ch, cv = sku_index(products)[s]
                if ch == h:
                    rep.e('bundles', f'{a} / {v["sku"]}: bundle contains itself')
                los += cv['price'] * q
            if los and v['price'] >= los:
                rep.w('bundles', f'{a} / {v["sku"]}: bundle price {v["price"] / 100:.2f} not below the parts {los / 100:.2f}')
        check_addons(rep, a, p, P, C.get('variant_mf') or {})
        if p.get('gift_card'):
            if any(v.get('requires_shipping') for v in vs):
                rep.e('variants', f'{a}: gift card variants must not require shipping')
    check_frame_plus_roof(rep, P)
    check_printed_frame_roof(rep, P)
    check_parts_vs_complete(rep, P)
    check_size_ladder(rep, products)
    check_addon_fit(rep, products, P)
    check_round_fields(rep, products, P, cat)
    check_bundle_staffels(rep, products, P)
    check_round3(rep, products, P)
    check_shipping_weight(rep, products, P)
    check_round4(rep, products, P)
    check_seed(rep, products)
    for p in products:
        for f in p['metafields'].get('downloads') or []:
            if not (IMAGES / f).exists():
                rep.e('metafields', f'product {p["handle"]}: download {f} missing in catalog/images')
    # theme-side: colours
    if swatches is not None:
        missing = sorted(kleur_used - swatches)
        if missing:
            rep.w('theme', f'theme swatch_colors default lacks catalog colours: {", ".join(missing)} (CONTRACT: every colour listed)')
    for b in cat['build'].get('bundle_errors') or []:
        rep.e('bundles', b)

    # ================================================================ coverage (assortment bar)
    cov = cat.get('coverage') or {}
    try:
        assortment = json.loads((REPO / 'reference' / 'assortment.json').read_text(encoding='utf-8'))
        subcats = [c['id'] + '.' + s['id'] for c in assortment['categories'] for s in c.get('subcategories', [])]
    except (OSError, ValueError, KeyError):
        subcats = []
    for sc in subcats:
        if sc not in cov or not cov[sc]:
            rep.e('coverage', f'assortment subcategory {sc} has no product')
    for sc, hs in cov.items():
        for hd in hs:
            if hd not in P:
                rep.e('coverage', f'coverage {sc} → unknown product {hd}')

    # ================================================================ collections
    for hd in C['collections']:
        if hd not in colls:
            rep.e('collections', f'CONTRACT collection {hd} missing')
    for hd, c in colls.items():
        a = f'collection {hd}'
        if hd not in C['collections'] and hd not in ext_collections:
            rep.e('collections', f'{a}: handle not in CONTRACT or contract_extensions')
        if not HANDLE_RE.match(hd):
            rep.e('collections', f'{a}: invalid handle')
        if c.get('parent') and c['parent'] not in colls:
            rep.e('collections', f'{a}: parent {c["parent"]} unknown')
        if c['sort_order'] not in ('manual', 'best-selling', 'alpha-asc', 'alpha-desc', 'price-asc', 'price-desc',
                                   'created', 'created-desc'):
            rep.e('collections', f'{a}: sort_order {c["sort_order"]!r}')
        if c['type'] == 'smart':
            if not c.get('rules'):
                rep.e('collections', f'{a}: smart without rules')
            for r in c.get('rules') or []:
                if r.get('column') not in ('title', 'type', 'vendor', 'tag', 'variant_price', 'variant_compare_at_price',
                                           'variant_inventory', 'variant_title', 'variant_weight', 'is_price_reduced'):
                    rep.e('collections', f'{a}: rule column {r.get("column")!r}')
                if r.get('relation') not in ('equals', 'not_equals', 'greater_than', 'less_than', 'starts_with',
                                             'ends_with', 'contains', 'not_contains'):
                    rep.e('collections', f'{a}: rule relation {r.get("relation")!r}')
                if r.get('column') == 'tag' and r.get('condition') not in contract_tags:
                    rep.e('collections', f'{a}: rule on unknown tag {r.get("condition")!r}')
        elif c['type'] == 'manual':
            for x in c.get('products') or []:
                if x not in P:
                    rep.e('collections', f'{a}: manual product {x} unknown')
        else:
            rep.e('collections', f'{a}: type {c["type"]!r}')
        members = [m for m in c['members'] if m in P]
        if not members:
            rep.e('collections', f'{a}: no products')
        expected = sorted(x['handle'] for x in products if hd in (x.get('collections') or []))
        if sorted(members) != expected:
            extra = sorted(set(members) - set(expected))
            miss = sorted(set(expected) - set(members))
            rep.w('collections', f'{a}: rule result differs from product.collections (+{extra[:4]} −{miss[:4]})')
        mfc = c['metafields']
        for k, val in mfc.items():
            if k not in cmf_types:
                rep.e('metafields', f'{a}: metafield {k} not in CONTRACT')
            elif val in (None, '', []):
                rep.w('copy', f'{a}: {k} empty')
            else:
                check_metafield_value(rep, a, k, cmf_types[k], val, ctx)
        if not (c.get('body_html') or mfc.get('intro')):
            rep.e('copy', f'{a}: no description or intro')
        cimg = c.get('image') or {}
        if not cimg.get('src'):
            rep.w('images', f'{a}: no collection image (no real render among its candidates and members yet)')
        elif build.is_draft(cimg['src']) or not (IMAGES / cimg['src']).exists():
            rep.e('images', f'{a}: collection image {cimg["src"]} is a draft or missing')
        elif not (cimg.get('alt') or '').strip():
            rep.e('images', f'{a}: collection image without alt text')
        seo = c.get('seo') or {}
        if not seo.get('title') or not seo.get('description'):
            rep.e('copy', f'{a}: SEO title/description missing')
        elif len(seo['title']) > 70 or len(seo['description']) > 320:
            rep.e('copy', f'{a}: SEO title/description too long')
        for nm, t in (('body', text_of(c.get('body_html'))), ('intro', mfc.get('intro') or ''),
                      ('seo_tekst', text_of(c.get('seo_tekst_html'))), ('kenmerken', '. '.join(mfc.get('kenmerken') or []))):
            check_copy(rep, f'{a} {nm}', t, allowed_neg)

    # ================================================================ pages / blog
    for hd, suf in C['pages'].items():
        if hd not in pages:
            rep.e('pages', f'CONTRACT page {hd} missing')
        elif pages[hd]['template_suffix'] != suf:
            rep.e('pages', f'page {hd}: template_suffix {pages[hd]["template_suffix"]!r} ≠ CONTRACT {suf!r}')
    for hd, pg in pages.items():
        a = f'page {hd}'
        if hd not in C['pages']:
            rep.w('pages', f'{a}: not in CONTRACT')
        if pg['published'] and len(text_of(pg['body_html'])) < 40:
            rep.e('copy', f'{a}: body_html missing')
        if not (pg.get('seo') or {}).get('title') or not (pg.get('seo') or {}).get('description'):
            rep.e('copy', f'{a}: SEO missing')
        if pg['template_suffix'] and not (THEME / 'templates' / f'page.{pg["template_suffix"]}.json').exists():
            rep.w('theme', f'{a}: theme has no templates/page.{pg["template_suffix"]}.json')
        if not pg['published']:
            rep.i('pages', f'{a}: unpublished (owner must confirm before publishing)')
        for nm in ('body_html', 'long_html'):
            check_copy(rep, f'{a} {nm}', text_of(pg.get(nm)), allowed_neg)
        brackets = re.findall(r'\[[^\]]{1,40}\]', text_of(pg['body_html']))
        if brackets and pg['published']:
            rep.i('copy', f'{a}: bracket fields {sorted(set(brackets))[:6]} (intentional form text? check before launch)')
    if blog['handle'] != C['blog_handle']:
        rep.e('blog', f'blog handle {blog["handle"]} ≠ {C["blog_handle"]}')
    if C['blog_title'] and blog['title'] != C['blog_title']:
        rep.e('blog', f'blog title {blog["title"]!r} ≠ {C["blog_title"]!r}')
    required = ['easy-up-partytent-opzetten', 'welke-statafelrok-past', 'hoeveel-statafels-per-gast',
                'partytent-onderhouden-en-opbergen', 'partytent-verankeren-bij-wind', 'logo-aanleveren-voor-bedrukking']
    for hd in required:
        if hd not in articles:
            rep.e('blog', f'required article {hd} missing')
    for hd, art in articles.items():
        a = f'article {hd}'
        if len(text_of(art['body_html'])) < 1500:
            rep.w('copy', f'{a}: body shorter than expected')
        if not art.get('summary_html'):
            rep.e('copy', f'{a}: summary missing')
        if not (art.get('seo') or {}).get('title'):
            rep.e('copy', f'{a}: SEO missing')
        for t in art['tags']:
            if t != t.lower():
                rep.e('blog', f'{a}: tag {t!r} not lowercase')
            if t.startswith('collectie:') and t.split(':', 1)[1] not in colls:
                rep.e('blog', f'{a}: tag {t} → unknown collection')
        for x in art['metafields'].get('producten') or []:
            if x not in P:
                rep.e('blog', f'{a}: producten → unknown product {x}')
        img = art.get('image') or {}
        if not img.get('src') or not (img.get('alt') or '').strip():
            rep.e('blog', f'{a}: image src/alt missing')
        check_copy(rep, a, text_of(art['body_html']) + ' ' + text_of(art['summary_html']), allowed_neg)

    # ================================================================ internal links in copy
    pol = {'terms-of-service', 'privacy-policy', 'refund-policy', 'shipping-policy', 'contact-information', 'legal-notice'}

    def check_link(area, path):
        parts = [x for x in path.split('/') if x]
        if not parts:
            return
        kind = parts[0]
        if kind == 'products' and len(parts) == 2 and parts[1] not in P:
            rep.e('links', f'{area}: link to unknown product /products/{parts[1]}')
        elif kind == 'collections' and len(parts) >= 2 and parts[1] not in colls and parts[1] != 'all':
            rep.e('links', f'{area}: link to unknown collection /collections/{parts[1]}')
        elif kind == 'pages' and len(parts) == 2:
            if parts[1] not in pages:
                rep.e('links', f'{area}: link to unknown page /pages/{parts[1]}')
            elif not pages[parts[1]]['published']:
                rep.w('links', f'{area}: link to unpublished page /pages/{parts[1]}')
        elif kind == 'blogs' and len(parts) >= 2:
            if parts[1] != blog['handle']:
                rep.e('links', f'{area}: link to unknown blog {parts[1]}')
            elif len(parts) == 3 and parts[2] not in articles:
                rep.e('links', f'{area}: link to unknown article {parts[2]}')
        elif kind == 'policies' and len(parts) == 2 and parts[1] not in pol:
            rep.e('links', f'{area}: link to unknown policy {parts[1]}')

    for p in products:
        for path in LINK_RE.findall(p['body_html'] or ''):
            check_link(f'product {p["handle"]}', path)
        for f in p['metafields'].get('faq') or []:
            for path in LINK_RE.findall(f.get('antwoord') or ''):
                check_link(f'product {p["handle"]} faq', path)
    for c in cat['collections']:
        for path in LINK_RE.findall((c.get('body_html') or '') + (c.get('seo_tekst_html') or '')):
            check_link(f'collection {c["handle"]}', path)
    for pg in cat['pages']:
        blob = (pg.get('body_html') or '') + (pg.get('long_html') or '') + json.dumps(pg.get('template') or {}, ensure_ascii=False)
        for path in LINK_RE.findall(blob.replace('\\"', '"')):
            check_link(f'page {pg["handle"]}', path)
        for m in re.finditer(r'"(?:link|cta_\d_link|url)"\s*:\s*"(/[^"?#]*)', json.dumps(pg.get('template') or {}, ensure_ascii=False)):
            check_link(f'page {pg["handle"]} template', m.group(1))
        for m in re.finditer(r'"image"\s*:\s*"([^"]+\.(?:webp|jpg|png))"', json.dumps(pg.get('template') or {}, ensure_ascii=False)):
            if m.group(1) not in {i['file'] for p in products for i in p['images']} and not (IMAGES / m.group(1)).exists():
                rep.w('links', f'page {pg["handle"]} template: image {m.group(1)} is not a catalog image')
    for art in blog['articles']:
        for path in LINK_RE.findall((art.get('body_html') or '') + (art.get('summary_html') or '')):
            check_link(f'article {art["handle"]}', path)

    # ================================================================ menus
    for hd in C['menus']:
        if hd not in {m['handle'] for m in cat['menus']}:
            rep.e('menus', f'CONTRACT menu {hd} missing')
    option_values = {}
    for c in cat['collections']:
        vals = defaultdict(set)
        types = set()
        for m in c['members']:
            if m not in P:
                continue
            types.add(P[m]['product_type'])
            for o in P[m]['options']:
                vals[o['name'].lower()].update(o['values'])
        option_values[c['handle']] = (vals, types)

    def walk(menu, items, depth, trail):
        for it in items:
            a = f'menu {menu} › {" › ".join(trail + [it["title"]])}'
            if depth > 3:
                rep.e('menus', f'{a}: deeper than 3 levels')
            t = it.get('type')
            hd = it.get('handle')
            if t == 'collection' and hd not in colls:
                rep.e('menus', f'{a}: unknown collection {hd}')
            elif t == 'product' and hd not in P:
                rep.e('menus', f'{a}: unknown product {hd}')
            elif t == 'page':
                if hd not in pages:
                    rep.e('menus', f'{a}: unknown page {hd}')
                elif not pages[hd]['published']:
                    rep.e('menus', f'{a}: links to unpublished page {hd}')
            elif t == 'blog' and hd != blog['handle']:
                rep.e('menus', f'{a}: unknown blog {hd}')
            elif t == 'article':
                b, _, art = (hd or '').partition('/')
                if b != blog['handle'] or art not in articles:
                    rep.e('menus', f'{a}: unknown article {hd}')
            elif t == 'policy' and hd not in pol:
                rep.e('menus', f'{a}: unknown policy {hd}')
            elif t == 'http':
                url = it.get('url') or ''
                if not url.startswith('/') and not url.startswith('https://'):
                    rep.e('menus', f'{a}: url {url!r} not relative or https')
                sp = urlsplit(url)
                parts = [x for x in sp.path.split('/') if x]
                if parts[:1] == ['collections'] and len(parts) == 2:
                    ch = parts[1]
                    if ch not in colls:
                        rep.e('menus', f'{a}: unknown collection {ch}')
                    else:
                        vals, types = option_values[ch]
                        for k, vlist in parse_qs(sp.query).items():
                            for val in vlist:
                                if k.startswith('filter.v.option.'):
                                    on = k.split('.', 3)[3]
                                    if val not in vals.get(on, set()):
                                        rep.e('menus', f'{a}: filter {on}={val!r} matches no product in {ch}')
                                elif k == 'filter.p.product_type' and val not in types:
                                    rep.e('menus', f'{a}: product_type {val!r} not in {ch}')
                        ptypes = parse_qs(sp.query).get('filter.p.product_type')
                        if ptypes:
                            for child in it.get('items') or []:
                                if child.get('type') == 'product' and child.get('handle') in P and P[child['handle']]['product_type'] not in ptypes:
                                    rep.w('menus', f'{a}: child {child["handle"]} ({P[child["handle"]]["product_type"]}) is not on the filtered landing page')
                else:
                    check_link(a, sp.path)
            elif t not in ('collection', 'product', 'page', 'blog', 'article', 'policy', 'http', 'frontpage',
                           'search', 'catalog', 'collections'):
                rep.e('menus', f'{a}: link type {t!r}')
            walk(menu, it.get('items') or [], depth + 1, trail + [it['title']])
    for m in cat['menus']:
        walk(m['handle'], m['items'], 1, [])

    # ================================================================ image jobs
    try:
        jobs = json.loads((EXPORT / 'image-jobs.json').read_text(encoding='utf-8'))['jobs']
    except (OSError, ValueError, KeyError):
        jobs = []
        rep.e('images', 'export/image-jobs.json missing or invalid')
    jobfiles = {j['file']: j for j in jobs}
    for p in products:
        files = [i['file'] for i in p['images'] if not i.get('photo')]  # real photos (catalog/photos.json) have nothing to render
        if not files and any(i.get('photo') for i in p['images']):
            continue
        if not any(f in jobfiles for f in files):
            rep.e('images', f'product {p["handle"]}: no image job')
        for f in files:
            if f not in jobfiles:
                rep.e('images', f'product {p["handle"]}: image {f} has no render job')
    for j in jobs:
        if j['kind'] != 'brand-copy' and not (j.get('spec') or {}).get('model'):
            rep.e('images', f'job {j["file"]}: spec without model')
    present = sum(1 for j in jobs if (IMAGES / j['file']).exists())
    st = Counter(j.get('model_status') for j in jobs)
    rep.i('images', f'{len(jobs)} image jobs, {present} files present in catalog/images; model_status {dict(st)}')
    for art in blog['articles']:
        src = (art.get('image') or {}).get('use') or (art.get('image') or {}).get('src')
        if src and src not in jobfiles:
            rep.e('images', f'article {art["handle"]}: image {src} has no job')

    # ================================================================ CSV
    check_csv(rep, products)

    # ================================================================ exports for the seed script
    try:
        defs = json.loads((EXPORT / 'metafield-definitions.json').read_text(encoding='utf-8'))['definitions']
    except (OSError, ValueError, KeyError):
        defs = []
        rep.e('exports', 'metafield-definitions.json missing')
    dmap = {(d['owner_type'], d['key']): d['type'] for d in defs}
    for k, t in pmf_types.items():
        if dmap.get(('PRODUCT', k)) != t:
            rep.e('exports', f'definition PRODUCT custom.{k} ({t}) missing or wrong type ({dmap.get(("PRODUCT", k))})')
    for k, t in cmf_types.items():
        if dmap.get(('COLLECTION', k)) != t:
            rep.e('exports', f'definition COLLECTION custom.{k} ({t}) missing or wrong type')
    vmf_types = dict(C.get('variant_mf') or {}) or {'componenten': 'list.variant_reference', 'component_aantallen': 'list.number_integer'}
    for k, t in vmf_types.items():
        if dmap.get(('PRODUCTVARIANT', k)) != t:
            rep.e('exports', f'definition PRODUCTVARIANT custom.{k} ({t}) missing or wrong type')
    if dmap.get(('ARTICLE', 'producten')) != 'list.product_reference':
        rep.e('exports', 'definition ARTICLE custom.producten missing')
    for name, key, n in (('collections.json', 'collections', len(colls)), ('pages.json', 'pages', len(pages)),
                         ('menus.json', 'menus', len(cat['menus']))):
        try:
            d = json.loads((EXPORT / name).read_text(encoding='utf-8'))[key]
            if len(d) != n:
                rep.e('exports', f'{name}: {len(d)} entries, catalog has {n}')
            blob = json.dumps(d, ensure_ascii=False)
            if '<!--' in blob:
                rep.e('exports', f'{name}: HTML comments (claim markers) leak into the export')
        except (OSError, ValueError, KeyError):
            rep.e('exports', f'{name} missing or invalid')
    try:
        bj = json.loads((EXPORT / 'blog.json').read_text(encoding='utf-8'))['blog']
        if len(bj['articles']) != len(articles) or '<!--' in json.dumps(bj, ensure_ascii=False):
            rep.e('exports', 'blog.json article count differs or contains HTML comments')
    except (OSError, ValueError, KeyError):
        rep.e('exports', 'blog.json missing or invalid')
    try:
        refs = json.loads((EXPORT / 'product-references.json').read_text(encoding='utf-8'))['products']
        skus = sku_index(products)
        for r in refs:
            if r['handle'] not in P:
                rep.e('exports', f'product-references: unknown product {r["handle"]}')
            for m in r['metafields']:
                vals = m['value'] if isinstance(m['value'], list) else [m['value']]
                for x in vals:
                    if m['type'].endswith('product_reference') and x not in P:
                        rep.e('exports', f'product-references {r["handle"]}.{m["key"]}: unknown product {x}')
                    if m['type'] == 'page_reference' and x not in pages:
                        rep.e('exports', f'product-references {r["handle"]}.{m["key"]}: unknown page {x}')
            for v in r['variants']:
                for m in v['metafields']:
                    for x in m.get('value_skus') or []:
                        if x not in skus:
                            rep.e('exports', f'product-references {v["sku"]}: unknown component SKU {x}')
    except (OSError, ValueError, KeyError):
        rep.e('exports', 'product-references.json missing or invalid')

    # ================================================================ fixture
    check_fixture(rep, cat, products)

    # ================================================================ theme-side cross checks (informative)
    tdir = THEME / 'templates'
    if tdir.exists():
        for f in sorted(tdir.glob('*.json')):
            try:
                txt = f.read_text(encoding='utf-8')
            except OSError:
                continue
            for hd in set(re.findall(r'/products/([a-z0-9\-]+)', txt)):
                if hd not in P:
                    rep.w('theme', f'theme/templates/{f.name} links to unknown product {hd}')
            for hd in set(re.findall(r'"(?:product|products)"\s*:\s*"([a-z0-9\-]+)"', txt)):
                if hd not in P:
                    rep.w('theme', f'theme/templates/{f.name} references unknown product {hd}')
            for hd in set(re.findall(r'/collections/([a-z0-9\-]+)', txt)):
                if hd not in colls and hd != 'all':
                    rep.w('theme', f'theme/templates/{f.name} links to unknown collection {hd}')

    if LIVE_FIXTURE.is_symlink() and LIVE_FIXTURE.resolve() == FIXTURE.resolve():
        rep.i('fixture', 'catalog/preview-data.json is a symlink to preview-data.staging.json (the preview servers read the build output)')
    elif LIVE_FIXTURE.exists():
        rep.w('fixture', 'catalog/preview-data.json exists and is not the staging fixture: tools/dev.sh switches every preview server to it')

    rep.allowed_negations = allowed_neg
    return rep, cat


_SKU_INDEX = {}
SAME_KLEUR_EXEMPT = {'losse-strik-statafelhoes'}  # a contrast colour by design


def _diam(v):
    m = re.match(r'^Ø(\d+(?:,\d+)?)(?:-(\d+(?:,\d+)?))? cm$', v or '')
    if not m:
        return None
    lo = float(m.group(1).replace(',', '.'))
    hi = float((m.group(2) or m.group(1)).replace(',', '.'))
    return lo, hi


def check_addons(rep, a, p, P, vtypes):
    """custom.addon_varianten / addon_aantallen per variant: known SKUs, same lengths, and the add-on variant fits the main variant
    (same Maat/Kleur when the add-on offers it, rok range covers the blad, 'n m breed' = tent width, Set van N × aantal = poten)."""
    skus = sku_index(list(P.values()))
    names = [o['name'] for o in p['options']]
    addon_products = set()
    with_list = 0
    poten = next((r['waarde'] for r in p['metafields'].get('specificaties') or [] if r.get('label') == 'Aantal poten'), None)
    for v in p['variants']:
        vmf = v.get('metafields') or {}
        for k in vmf:
            if vtypes and k not in vtypes:
                rep.e('metafields', f'{a} / {v["sku"]}: variant metafield {k} not in CONTRACT')
        avs, aqs = vmf.get('addon_varianten'), vmf.get('addon_aantallen')
        if not avs:
            continue
        with_list += 1
        if not isinstance(aqs, list) or len(aqs) != len(avs) or not all(isinstance(q, int) and q > 0 for q in aqs):
            rep.e('addons', f'{a} / {v["sku"]}: addon_aantallen must be positive integers, same length as addon_varianten')
            continue
        mo = {n: v.get(f'option{i + 1}') for i, n in enumerate(names)}
        for s, q in zip(avs, aqs):
            if s not in skus:
                rep.e('addons', f'{a} / {v["sku"]}: add-on SKU {s} unknown')
                continue
            ah, av = skus[s]
            if ah == p['handle']:
                rep.e('addons', f'{a} / {v["sku"]}: add-on is the product itself')
            addon_products.add(ah)
            ap = P[ah]
            anames = [o['name'] for o in ap['options']]
            ao = {n: av.get(f'option{i + 1}') for i, n in enumerate(anames)}
            for opt in ('Maat', 'Kleur'):
                if opt in mo and opt in ao and mo[opt] != ao[opt]:
                    offered = next((o['values'] for o in ap['options'] if o['name'] == opt), [])
                    if mo[opt] in offered and not (opt == 'Kleur' and ah in SAME_KLEUR_EXEMPT):
                        rep.e('addons', f'{a} / {v["sku"]}: add-on {ah} has {opt} {ao[opt]!r} although {mo[opt]!r} exists')
            md, ad = _diam(mo.get('Maat')), _diam(ao.get('Maat'))
            if md and ad and ad[0] != ad[1] and not (ad[0] <= md[1] <= ad[1]):
                rep.e('addons', f'{a} / {v["sku"]}: {ah} {ao["Maat"]} does not fit {mo["Maat"]}')
            mb = re.match(r'^(\d+(?:,\d+)?) m breed$', ao.get('Maat') or '')
            mw = re.match(r'^(\d+(?:,\d+)?) x', mo.get('Maat') or '')
            if mb and mw and mb.group(1) != mw.group(1):
                rep.e('addons', f'{a} / {v["sku"]}: {ah} {ao["Maat"]} does not match tent width {mo["Maat"]}')
            ms = re.match(r'^Set van (\d+)$', ao.get('Uitvoering') or '')
            if ms and poten and poten.isdigit() and int(ms.group(1)) * q != int(poten):
                rep.e('addons', f'{a} / {v["sku"]}: {ah} {ao["Uitvoering"]} × {q} ≠ {poten} poten')
    if with_list and with_list != len(p['variants']):
        rep.w('addons', f'{a}: {len(p["variants"]) - with_list} of {len(p["variants"])} variants without addon_varianten (theme falls back to the first variant of each add-on)')
    pa = set(p['metafields'].get('addons') or [])
    if addon_products - pa:
        rep.e('addons', f'{a}: addon_varianten use {sorted(addon_products - pa)} but custom.addons does not list them')
    if pa and not with_list:
        for ah in pa:
            if ah in P and len(P[ah]['variants']) > 1:
                rep.w('addons', f'{a}: add-on {ah} has {len(P[ah]["variants"])} variants but no addon_varianten pick one (first variant lands in the cart)')
    if p['metafields'].get('addon_modus') not in (None, 'per-stuk', 'per-regel'):
        rep.e('metafields', f'{a}: addon_modus {p["metafields"]["addon_modus"]!r} not per-stuk/per-regel')


FRAME_ROOF = [  # (tent handle, tent selector, frame handle, roof Uitvoering)
    ('easy-up-partytent-premium-', None, 'los-frame-easy-up-premium', 'Polyester'),
    ('easy-up-partytent-professional-', 'Polyester', 'los-frame-easy-up-professional', 'Polyester'),
    ('easy-up-partytent-professional-', 'Heavy duty PVC', 'los-frame-easy-up-professional', 'Heavy duty PVC'),
]


def check_frame_plus_roof(rep, P):
    """A loose frame plus a loose roof of the same size must never be cheaper than the complete tent."""
    roofs = P.get('dakzeil-easy-up')
    if not roofs:
        return
    for prefix, uitv, frame_h, roof_u in FRAME_ROOF:
        frame = P.get(frame_h)
        if not frame:
            continue
        frame_price = {v['option1']: v['price'] for v in frame['variants']}
        for h, tent in P.items():
            if not (h.startswith(prefix) and h[-1].isdigit()):
                continue
            names = [o['name'] for o in tent['options']]
            for v in tent['variants']:
                o = {n: v.get(f'option{i + 1}') for i, n in enumerate(names)}
                # catalog round 4: the 2 x 2 and 5 x 5 m Professional have no one-value Uitvoering option (polyester only)
                if uitv and (o.get('Uitvoering') or 'Polyester') != uitv:
                    continue
                m = o.get('Maat')
                roof = [r['price'] for r in roofs['variants'] if r['option1'] == m and r['option2'] == roof_u]
                if m not in frame_price or not roof:
                    continue
                if frame_price[m] + min(roof) < v['price']:
                    rep.e('prices', f'{h} {m} {o.get("Uitvoering") or ""}: frame {frame_price[m] / 100:.2f} + dak {min(roof) / 100:.2f} '
                                    f'< tent {v["price"] / 100:.2f} (parts cheaper than the tent)')
                break  # one colour per size is enough (same price)


PRINTED_FRAME_ROOF = [  # (full colour tent, frame) — catalog round 5: los frame + bedrukt dakzeil of the same size and cloth >= the printed tent
    ('easy-up-partytent-professional-full-colour-bedrukt', 'los-frame-easy-up-professional'),
    ('easy-up-partytent-premium-full-colour-bedrukt', 'los-frame-easy-up-premium'),
]


def check_printed_frame_roof(rep, P):
    """Standing item d for the printed tents: a loose frame plus a loose printed roof (bedrukt-dakzeil-easy-up, same Maat and cloth) must
    never be cheaper than the full colour tent's 'Dak en luifel' variant (the cloth is the Uitvoering, Polyester when the tent has none)."""
    roofs = P.get('bedrukt-dakzeil-easy-up')
    if not roofs:
        return
    rn = [o['name'] for o in roofs['options']]
    roof = {}
    for v in roofs['variants']:
        o = {n: v.get(f'option{i + 1}') for i, n in enumerate(rn)}
        roof[(o['Maat'], o.get('Uitvoering') or 'Polyester')] = v['price']
    for th, fh in PRINTED_FRAME_ROOF:
        tent, frame = P.get(th), P.get(fh)
        if not tent or not frame:
            continue
        fp = {v['option1']: v['price'] for v in frame['variants']}
        tn = [o['name'] for o in tent['options']]
        for v in tent['variants']:
            o = {n: v.get(f'option{i + 1}') for i, n in enumerate(tn)}
            if (o.get('Samenstelling') or o.get('Uitvoering')) != 'Dak en luifel':
                continue
            cloth = o.get('Uitvoering') if o.get('Uitvoering') in ('Polyester', 'Heavy duty PVC') else 'Polyester'
            key = (o['Maat'], cloth)
            if o['Maat'] not in fp or key not in roof:
                if o['Maat'] in fp:
                    rep.e('parts', f'{th} {o["Maat"]} {cloth}: no bedrukt dakzeil in this size and cloth')
                continue
            if fp[o['Maat']] + roof[key] < v['price']:
                rep.e('prices', f'{th} {o["Maat"]} {cloth}: frame € {fp[o["Maat"]] / 100:.2f} + bedrukt dak € {roof[key] / 100:.2f} '
                                f'< tent € {v["price"] / 100:.2f} (parts cheaper than the printed tent)')


def check_parts_vs_complete(rep, P):
    """Standing item d: the loose parts of a complete product never undercut it. (1) custom.stuklijst (buizenframe and opslagtent, the
    bouwtekening): every row resolves to a variant of the named product, and frame parts + dakzeil + wanden cost at least the tent;
    (2) a loose onderstel compleet + los blad of the same size and colour cost at least the statafel Professional; (3) every stretchtent
    compleet variant has a stuklijst (stretchdoek los + palenset + spanbanden en haringen, + touwensets bij zware afspanning), so (1)
    holds for it too."""
    skus = sku_index(list(P.values()))
    for h, p in P.items():
        for v in p['variants']:
            rows = (v.get('metafields') or {}).get('stuklijst')
            if not rows:
                continue
            total = 0
            for r in rows:
                hit = skus.get(r.get('sku'))
                if not hit or hit[0] != r.get('handle') or not isinstance(r.get('aantal'), int) or r['aantal'] < 1:
                    rep.e('parts', f'product {h} / {v["sku"]}: stuklijst row {r.get("onderdeel")} → {r.get("handle")} {r.get("sku")} does not resolve')
                    continue
                total += hit[1]['price'] * r['aantal']
            if total < v['price']:
                rep.e('parts', f'product {h} / {v["sku"]}: stuklijst parts € {total / 100:.2f} < tent € {v["price"] / 100:.2f} (parts cheaper than the tent)')
    stf, ond, blad = P.get('statafel-inklapbaar-professional'), P.get('onderdelen-statafel'), P.get('los-statafelblad')
    if stf and ond and blad:
        onderstel = next((v['price'] for v in ond['variants'] if v['option1'] == 'Onderstel compleet'), None)
        bladen = {(v['option1'], v['option2']): v['price'] for v in blad['variants']}
        for v in stf['variants']:
            if v['option3'] != 'Binnen, zwart onderstel' or (v['option1'], v['option2']) not in bladen or onderstel is None:
                continue
            if onderstel + bladen[(v['option1'], v['option2'])] < v['price']:
                rep.e('parts', f'statafel {v["sku"]}: onderstel + los blad € {(onderstel + bladen[(v["option1"], v["option2"])]) / 100:.2f} < statafel € {v["price"] / 100:.2f}')
    # (3) the stretchtent compleet carries its own stuklijst (doek + palenset + afspanning, kk_bom.stretch), checked by (1) above
    tent = P.get('stretchtent-compleet')
    if tent:
        missing = [v['sku'] for v in tent['variants'] if not (v.get('metafields') or {}).get('stuklijst')]
        if missing:
            rep.e('parts', f'stretchtent-compleet: {len(missing)} variant(s) without custom.stuklijst (doek + palen + afspanning)')


def _lin(m):
    """'6 m' -> ('l', 600), '4,5 m breed' -> ('l', 450), '200 cm' -> ('l', 200), 'Ø80 cm' -> ('d', 80): a diameter compares with diameters
    only; None for anything else."""
    mm = re.fullmatch(r'(Ø)?(\d+(?:,\d+)?) (m|cm)( breed)?', m or '')
    if not mm:
        return None
    return ('d' if mm.group(1) else 'l', float(mm.group(2).replace(',', '.')) * (100 if mm.group(3) == 'm' else 1))


def check_size_ladder(rep, products):
    """Catalog round 2026-10-18: within one product, with the other options equal, a size that contains another size (both sides at
    least as long) never costs less than it (a 5 x 6 m tent under the 4 x 6 m reads as an error)."""
    def wd(m):
        try:
            return sorted(float(x.replace(',', '.')) for x in m.replace(' m', '').replace(' cm', '').split(' x '))[:2]
        except ValueError:
            return None
    for p in products:
        names = [o['name'] for o in p['options']]
        if 'Maat' not in names:
            continue
        i = names.index('Maat')
        groups = defaultdict(dict)
        for v in p['variants']:
            key = tuple(v.get(f'option{j + 1}') for j in range(len(names)) if j != i)
            m = v.get(f'option{i + 1}')
            groups[key][m] = min(groups[key].get(m, 10 ** 9), v['price'])
        for key, pr in groups.items():
            sizes = {m: wd(m) for m in pr if m.count(' x ') == 1}   # a driehoek (3 x 3 x 3 m) is another shape, not a bigger size
            sizes = {m: x for m, x in sizes.items() if x and len(x) == 2}
            for m, (a, b) in sizes.items():
                for m2, (a2, b2) in sizes.items():
                    if m2 != m and a2 <= a and b2 <= b and pr[m2] > pr[m]:
                        rep.w('prices', f'product {p["handle"]} {" · ".join(str(k) for k in key if k)}: {m} € {pr[m] / 100:.2f} is cheaper than the smaller {m2} € {pr[m2] / 100:.2f}')
            # catalog round 5 (low): single-dimension sizes too (a wall of 8 m under the 6 m in the same cloth and colour: '6 m', '4,5 m',
            # '8 m breed', '200 cm', 'Ø80 cm'); a longer or wider one never costs less than a shorter one
            lin = {m: _lin(m) for m in pr}
            lin = {m: x for m, x in lin.items() if x is not None}
            for m, a in lin.items():
                for m2, a2 in lin.items():
                    if a2[0] == a[0] and a2[1] < a[1] and pr[m2] > pr[m]:
                        rep.w('prices', f'product {p["handle"]} {" · ".join(str(k) for k in key if k)}: {m} € {pr[m] / 100:.2f} is cheaper than the smaller {m2} € {pr[m2] / 100:.2f}')


# products whose add-on fit is not given by past_op (consumables, karren that carry a whole family, lighting, seating around a table)
ADDON_PAST_OP_EXEMPT = set()


def check_addon_fit(rep, products, P):
    """Standing item d: every add-on reference resolves to a variant that fits the main variant. Beyond Maat/Kleur equality (check_addons):
    (1) an add-on product without a Kleur option whose specificaties fix one colour ('Kleur: Wit') is never offered on a variant of
    another colour (the white stertent walls on a Zwart tent); (2) an add-on that has a custom.past_op must list the main product
    (the standard inflatable wall on the higher Pro), or share a base product with it (a beschermplaat offered with a statafelrok)."""
    skus = sku_index(products)
    for p in products:
        names = [o['name'] for o in p['options']]
        for v in p['variants']:
            mo = {n: v.get(f'option{i + 1}') for i, n in enumerate(names)}
            for s_ in (v.get('metafields') or {}).get('addon_varianten') or []:
                if s_ not in skus:
                    continue
                ah, av = skus[s_]
                ap = P[ah]
                anames = [o['name'] for o in ap['options']]
                if 'Kleur' in mo and 'Kleur' not in anames:
                    fixed = next((r['waarde'] for r in ap['metafields'].get('specificaties') or [] if r.get('label') == 'Kleur'), None)
                    if fixed and re.fullmatch(r'[A-ZÉ][a-zà-ÿ]+(?:-[a-zà-ÿ]+)?', fixed) and fixed != mo['Kleur']:
                        rep.e('addons', f'product {p["handle"]} / {v["sku"]}: add-on {ah} is {fixed} only, the variant is {mo["Kleur"]}')
                po = ap['metafields'].get('past_op')
                # an accessory offered with another accessory of the same base (beschermplaat with a statafelrok: both go on the statafel)
                same_base = set(po or []) & set(p['metafields'].get('past_op') or [])
                if po and p['handle'] not in po and not same_base and ah not in ADDON_PAST_OP_EXEMPT and 'set' not in p['tags']:
                    rep.e('addons', f'product {p["handle"]}: add-on {ah} does not list it in custom.past_op (does it fit?)')
                    break


def check_round_fields(rep, products, P, cat):
    """Catalog round 2026-10-18 fields: onderdelen is the reverse of past_op; gebruik follows the tags; the filter set shows no raw tag;
    the preview fixture carries demo stock while products.csv keeps 0 (owner sets real stock)."""
    rev = defaultdict(set)
    for p in products:
        if 'set' in p['tags'] or p.get('gift_card'):
            continue
        for h in p['metafields'].get('past_op') or []:
            rev[h].add(p['handle'])
    for p in products:
        got = set(p['metafields'].get('onderdelen') or [])
        if got != rev.get(p['handle'], set()) - {p['handle']}:
            rep.e('metafields', f'product {p["handle"]}: custom.onderdelen is not the reverse of past_op')
        want = sorted(build.GEBRUIK_LABELS[t] for t in p['tags'] if t in build.GEBRUIK_LABELS)
        if sorted(p['metafields'].get('gebruik') or []) != want:
            rep.e('metafields', f'product {p["handle"]}: custom.gebruik does not follow the gebruik:* tags')
    for f in cat.get('filters') or []:
        if f.get('source') == 'tag':
            rep.e('filters', 'a tag filter shows raw tag values to shoppers (use custom.gebruik)')
        if f.get('source') == 'metafield' and build.PRODUCT_MF_TYPES.get(f.get('key')) == 'boolean' and not (f.get('value_labels') or {}).get('true'):
            rep.e('filters', f'boolean filter {f.get("key")} needs value_labels (Ja / Nee)')
    try:
        fx = json.loads(FIXTURE.read_text(encoding='utf-8'))
        if not (fx.get('meta') or {}).get('demo_stock'):
            rep.e('fixture', 'fixture meta.demo_stock is not set (the preview stock must be marked as demo stock)')
        tracked = [v for p in fx['products'] for v in p['variants'] if v.get('inventory_management') == 'shopify']
        states = Counter('backorder' if v['inventory_quantity'] == 0 else 'low' if v['inventory_quantity'] <= 3 else 'in' for v in tracked)
        if tracked and (states['in'] < 0.6 * len(tracked) or not states['low'] or not states['backorder']):
            rep.e('fixture', f'demo stock should be mostly in stock with some low and some backorder ({dict(states)})')
    except (OSError, ValueError):
        pass


# brand.md v7 §4.1/§4.2: names of the brand palette that are no product colour words (Wit and Bordeaux are ordinary colour words and stay
# allowed as cloth colours); 'Klaproos' is the v6 brand red
BRAND_ONLY_COLOURS = {'Lampion', 'Klaproos', 'Inkt', 'Zand', 'Linnen', 'Lijn', 'Kiezel', 'Zon', 'Polder', 'Oker'}


def _tiers_at(st, p, v, qty):
    """Shipping of qty pieces of variant v as custom.verzendkosten_staffel gives it (per zending: the line amount; per stuk: x qty)."""
    names = [o['name'] for o in p['options']]
    t = st.get('staffel') or []
    po = st.get('per_optie')
    if po and po.get('optie') in names:
        t = po['waarden'].get(v.get(f'option{names.index(po["optie"]) + 1}'), t)
    hit = [r for r in t if r['vanaf'] <= qty]
    if not hit:
        return None
    b = hit[-1]['bedrag']
    return round(b * qty, 2) if st.get('eenheid') == 'per stuk' else b


def check_round3(rep, products, P):
    """Catalog round 3 (2026-10-18 graded findings):
      1. a pakket never ships for less than its heaviest component would on its own, and in at least that component's class (the starters-
         pakket with a 3 x 6 m tent was € 6,95 next to € 49 for the tent alone);
      2. 'per zending' shipping tiers never get cheaper for a larger quantity;
      3. an easy-up wall set costs less than the same four loose walls (short sides dicht + deur, long sides 2 x raam);
      4. no brand palette name as a product colour (brand.md §4.2, standing item c), not in Kleur values, SKUs, image files or alt text;
      5. made to measure is never cheaper per unit than the stock product it replaces (prikkabel op maat per meter vs prikkabel E27;
         stretchdoek op maat per m² vs stretchdoek los)."""
    skus = sku_index(products)
    pakket_rate = 6.95
    for p in products:
        if 'set' not in p['tags']:
            continue
        for v in p['variants']:
            cs, qs = v['metafields'].get('componenten') or [], v['metafields'].get('component_aantallen') or []
            st = p['metafields'].get('verzendkosten_staffel')
            own = _tiers_at(st, p, v, 1) if st else (pakket_rate if p['metafields'].get('verzending') != 'pallet' else None)
            for s_, q in zip(cs, qs):
                if s_ not in skus:
                    continue
                ch, cv = skus[s_]
                cp = P[ch]
                cst = cp['metafields'].get('verzendkosten_staffel')
                comp = _tiers_at(cst, cp, cv, q) if cst else (pakket_rate if cp['metafields'].get('verzending') != 'pallet' else None)
                if comp is not None and (own is None or own + 0.005 < comp):
                    rep.e('shipping', f'product {p["handle"]} / {v["sku"]}: pakket ships for {own} but {q} x {ch} alone cost {comp:.2f} (a pakket ships for at least its heaviest component)')
                    break
                if cp['metafields'].get('verzending') == 'pallet' and p['metafields'].get('verzending') != 'pallet':
                    rep.e('shipping', f'product {p["handle"]}: component {ch} goes on a pallet, the pakket does not')
                    break
    for p in products:
        st = p['metafields'].get('verzendkosten_staffel')
        if not st or st.get('eenheid') != 'per zending':
            continue
        for t in [st.get('staffel') or []] + list(((st.get('per_optie') or {}).get('waarden') or {}).values()):
            amounts = [r['bedrag'] for r in t]
            if amounts != sorted(amounts):
                rep.e('shipping', f'product {p["handle"]}: per zending shipping tiers get cheaper for more pieces ({amounts})')
                break
    for h in build.WALL_SETS:
        p = P.get(h)
        if not p:
            continue
        rows = build.wall_set_rows(p, P)
        if not rows:
            rep.e('prices', f'product {h}: no wall-set comparison could be made (wall products or sizes missing)')
        for m, w, los, st_ in rows:
            if st_ >= los:
                rep.e('prices', f'product {h} {m}: set € {st_ / 100:.2f} is not under the 4 loose walls € {los / 100:.2f}')
    for p in products:
        for o in p['options']:
            if o['name'] == 'Kleur':
                bad = [x for x in o['values'] if x in BRAND_ONLY_COLOURS]
                if bad:
                    rep.e('brand', f'product {p["handle"]}: brand palette name as product colour {bad} (brand.md §4.2: name the cloth colour)')
        names = [i['file'] for i in p['images']] + [v['sku'] for v in p['variants']] + [i.get('alt') or '' for i in p['images']]
        hit = [n for n in names if re.search(r'klaproos|lampion', n, re.I)]
        if hit:
            rep.e('brand', f'product {p["handle"]}: brand colour name in SKU, image file or alt text: {hit[:3]}')
    pm, pk = P.get('prikkabel-op-maat'), P.get('prikkabel-e27')
    if pm and pk:
        stock = {}
        for v in pk['variants']:
            per_m = 2 if v.get('option3', '').startswith('2') else 1
            n = float(v['option1'].split()[0])
            stock[per_m] = max(stock.get(per_m, 0), v['price'] / n)
        for v in pm['variants']:
            u = v.get('option2') or ''
            mm = re.search(r'om de (\d+) cm', u)
            if not mm:
                continue
            per_m = 100 / int(mm.group(1))
            ref = stock.get(2) if per_m >= 2 else stock.get(1) if per_m >= 1 else None
            if ref and v['price'] + 0.5 < ref:
                rep.e('prices', f'product prikkabel-op-maat / {v["sku"]}: € {v["price"] / 100:.2f} per meter is under the stock prikkabel E27 (€ {ref / 100:.2f} per meter)')
    so, sl = P.get('stretchdoek-op-maat'), P.get('stretchdoek-los')
    if so and sl:
        per_m2 = []
        for v in sl['variants']:
            a, b = [float(x.replace(',', '.')) for x in v['option1'].replace(' m', '').split(' x ')]
            per_m2.append(v['price'] / (a * b))
        if min(v['price'] for v in so['variants']) + 0.5 < min(per_m2):
            rep.e('prices', f'product stretchdoek-op-maat: per m² under the cheapest stock stretchdoek per m² (€ {min(per_m2) / 100:.2f})')


# Weight-based shipping rates (catalog/tools/skeleton/kk_ship.py, docs/claims-to-confirm.md 'Verzendkosten per product'): the Shopify
# shipping profiles carry the same amounts, so the PDP and the cart estimate must never show less than checkout charges.
SHIP_PARCEL, SHIP_PARCEL_MAX = 6.95, 31.5
SHIP_GROOT = [(25, 19.95), (40, 39.9)]
SHIP_PALLET = [(150, 49.0), (400, 79.0), (700, 129.0), (1000, 175.0), (2000, 350.0), (3000, 525.0)]
SHIP_BULKY_TYPES = {'Statafel', 'Terrastafel', 'Klaptafel'}
SHIP_QTY_PIECES = 10   # a parcel product at the class rate must stay under 31,5 kg up to this many pieces (kk_ship.QTY_PIECES)


def _ship_rate(cls, kg):
    if cls == 'groot':
        for top, eur in SHIP_GROOT:
            if kg <= top:
                return eur
    elif cls == 'pakket' and kg <= SHIP_PARCEL_MAX:
        return SHIP_PARCEL
    for top, eur in SHIP_PALLET:
        if kg <= top:
            return eur
    return SHIP_PALLET[-1][1]


def _shown_shipping(p, v, n, pallet_rate=59.0):
    """What the PDP and the cart estimate show for n pieces of variant v: custom.verzendkosten_staffel, else the amount in
    custom.verzendkosten, else the class rate (theme settings shipping_cost_pakket / shipping_cost_pallet)."""
    mf = p['metafields']
    st = mf.get('verzendkosten_staffel')
    if st:
        return _tiers_at(st, p, v, n)
    txt = mf.get('verzendkosten') or ''
    m = re.search(r'€\s*([\d.]+,\d{2})', txt)
    if m:
        return float(m.group(1).replace('.', '').replace(',', '.'))
    if 'gratis' in txt.lower():
        return 0.0
    return pallet_rate if mf.get('verzending') == 'pallet' else SHIP_PARCEL


def check_shipping_weight(rep, products, P):
    """Catalog round 4 (blocker): the shipping check of the pakketten, extended to every product. Per variant, the amount the PDP and the
    cart estimate show (custom.verzendkosten_staffel, else custom.verzendkosten, else the class rate) is never under the weight-based rate
    of that shipment: above 31,5 kg nothing ships as a parcel (a 'Set van 8' voetgewichten of 120 kg showed € 6,95 against the € 49
    pallet rate at checkout). Products with tiers are checked at every quantity up to 100 pieces or 3.000 kg, parcels at the class rate up
    to 10 pieces; per-stuk products (betonblokken) carry their own per-piece rates and are left out. Parcels at the class rate whose
    shipment passes 31,5 kg only from 11 pieces on are counted as info (checkout takes the weight-based rate)."""
    skus = sku_index(products)
    quantity_only = []
    for p in products:
        if p.get('gift_card') or not any(v.get('requires_shipping', True) for v in p['variants']):
            continue
        mf = p['metafields']
        st = mf.get('verzendkosten_staffel')
        if st and st.get('eenheid') == 'per stuk':
            continue
        if mf.get('verzending') == 'pallet':
            cls = 'pallet'
        elif p['product_type'] in SHIP_BULKY_TYPES or (p.get('bundle') and any(
                P[skus[s_][0]]['product_type'] in SHIP_BULKY_TYPES for v in p['variants']
                for s_ in (v.get('metafields') or {}).get('componenten') or [] if s_ in skus)):
            cls = 'groot'
        else:
            cls = 'pakket'
        bad = None
        for v in p['variants']:
            kg = (v.get('grams') or 0) / 1000
            if not kg:
                continue
            top = (SHIP_QTY_PIECES if cls == 'pakket' else 1) if not st else max(1, min(100, int(3000 // kg)))
            for n in range(1, top + 1):
                shown, want = _shown_shipping(p, v, n), _ship_rate(cls, n * kg)
                if shown is None or shown + 0.005 < want:
                    bad = (v, n, kg, shown, want)
                    break
            if bad:
                break
            if not st and cls == 'pakket' and kg * 100 > SHIP_PARCEL_MAX:
                quantity_only.append(p['handle'])
        if bad:
            v, n, kg, shown, want = bad
            rep.e('shipping', f'product {p["handle"]} / {v["sku"]}: {n} x {kg:g} kg shows € {shown} shipping, the weight-based rate is € {want:.2f} '
                              f'(above 31,5 kg nothing ships as a parcel; PDP, cart and checkout must agree)')
    if quantity_only:
        rep.i('shipping', f'{len(set(quantity_only))} parcel products at the class rate pass 31,5 kg only from 11-100 pieces on; checkout takes the '
                          f'weight-based rate there (e.g. {", ".join(sorted(set(quantity_only))[:4])})')


def check_round4(rep, products, P):
    """Catalog round 4 (2026-10-22 graded findings):
      1. option noise: no Kleur, Uitvoering or Samenstelling option with a single value (it reads as a choice that is none: 'Kleur: Zwart' on a
         barkoelkast, 'Uitvoering: Polyester' on the Professional 2 x 2 m); a one-value Maat stays allowed (add-on fit and filters use it);
      2. a handle that names one length (bierbank-220) while the product sells several (180 and 220 cm) is a naming error;
      3. no option value reads as 'price on request' ('PVC 620 (op aanvraag)' sat on priced, buyable variants);
      4. an add-on that goes along once per order line (custom.addon_eenmalig) carries more than one piece of the main product: a kar that
         takes one koelkast follows the quantity;
      5. every product carries a price_ref; the ones without a reference price are listed (info), so an off-market price cannot hide
         behind 'prijs niet gevonden' (price_ref is refreshed from the live capture each round)."""
    for p in products:
        for o in p['options']:
            if o['name'] in ('Kleur', 'Uitvoering', 'Samenstelling') and len(o['values']) == 1:
                rep.e('options', f'product {p["handle"]}: option {o["name"]} has one value {o["values"][0]!r} (drop the option, put it in the specs)')
            for val in o['values']:
                if re.search(r'op aanvraag|prijs op', val, re.I):
                    rep.e('options', f'product {p["handle"]}: option value {val!r} reads as price on request on a priced variant')
        m = re.search(r'(?:^|-)([a-z0-9]+)-(\d{2,})(?:-(m|cm))?$', p['handle'])
        names = [o['name'] for o in p['options']]
        if m and m.group(1) not in ('pvc', 'pe', 'e27') and 'Maat' in names:
            maten = p['options'][names.index('Maat')]['values']
            if len(maten) > 1 and not all(m.group(2) in v.replace(',', '') for v in maten):
                rep.e('naming', f'product {p["handle"]}: the handle names {m.group(2)} but the product sells {", ".join(maten[:4])}')
    one_piece = {'transportkar-koelkasten'}
    for p in products:
        for h in p['metafields'].get('addon_eenmalig') or []:
            if h in one_piece:
                rep.e('addons', f'product {p["handle"]}: {h} carries one piece, so it must follow the quantity (not addon_eenmalig)')
    no_ref = [p['handle'] for p in products if not p.get('gift_card') and 'set' not in p['tags']
              and not re.search(r'\d', json.dumps({k: v for k, v in (p.get('price_ref') or {}).items() if k in ('outmate', 'statafelshop', 'band')}, ensure_ascii=False))]
    if no_ref:
        rep.i('prices', f'{len(no_ref)} products without a reference price in price_ref (owner sets these on their own): {", ".join(no_ref[:8])}…')


def _korting(st, n):
    k = 0
    for t in st or []:
        if n >= t['vanaf']:
            k = t['korting']
    return k


def check_bundle_staffels(rep, products, P, n_max=200):
    """Every bundle carries a staffel, and at every volume 1..n_max it is not dearer than its parts with their own staffels."""
    skus = sku_index(products)
    for p in products:
        if 'set' not in p['tags']:
            continue
        st = p['metafields'].get('staffelkorting')
        if not st:
            rep.w('bundles', f'product {p["handle"]}: bundle without staffelkorting')
        for v in p['variants']:
            cs = v['metafields'].get('componenten') or []
            qs = v['metafields'].get('component_aantallen') or []
            if not cs:
                continue
            for n in range(1, n_max + 1):
                parts = 0
                for s, q in zip(cs, qs):
                    ch, cv = skus[s]
                    parts += cv['price'] * q * (1 - _korting(P[ch]['metafields'].get('staffelkorting'), n * q) / 100)
                own = v['price'] * (1 - _korting(st, n) / 100)
                if own > parts + 0.5:
                    rep.e('bundles', f'product {p["handle"]} / {v["sku"]}: at {n} pakketten the bundle ({own / 100:.2f}) is dearer than its parts '
                                     f'with their staffels ({parts / 100:.2f})')
                    break




def sku_index(products):
    if not _SKU_INDEX:
        for p in products:
            for v in p['variants']:
                _SKU_INDEX[v['sku']] = (p['handle'], v)
    return _SKU_INDEX


def check_csv(rep, products):
    before = rep.count('ERROR')
    path = EXPORT / 'products.csv'
    try:
        raw = path.read_text(encoding='utf-8')
    except OSError:
        rep.e('csv', 'export/products.csv missing')
        return
    if raw.startswith('\ufeff'):
        rep.w('csv', 'products.csv starts with a BOM')
    rows = list(csv.DictReader(io.StringIO(raw, newline='')))
    header = next(csv.reader(io.StringIO(raw, newline='')))
    if header != build.CSV_COLUMNS:
        rep.e('csv', 'header differs from build.CSV_COLUMNS')
    for col in ('Handle', 'Title', 'Body (HTML)', 'Vendor', 'Type', 'Tags', 'Published', 'Option1 Name', 'Option1 Value',
                'Variant SKU', 'Variant Price', 'Image Src', 'Image Position', 'Image Alt Text', 'Status'):
        if col not in header:
            rep.e('csv', f'required column {col} missing')
    for col in header:
        m = re.match(r'^(.+) \((product|variant)\.metafields\.([a-z_]+)\.([a-z_]+)\)$', col)
        if '.metafields.' in col and not m:
            rep.e('csv', f'metafield column {col!r} not in "Label (product.metafields.ns.key)" form')
    # round trip: parse → write with the same dialect → identical text
    buf = io.StringIO(newline='')
    w = csv.DictWriter(buf, fieldnames=header, quoting=csv.QUOTE_MINIMAL, lineterminator='\n')
    w.writeheader()
    for r in rows:
        w.writerow(r)
    if buf.getvalue() != raw:
        rep.e('csv', 'products.csv does not round-trip (parse → write differs)')
    # regroup by handle
    groups = defaultdict(list)
    order = []
    for r in rows:
        hd = r['Handle']
        if hd not in groups:
            order.append(hd)
        elif order[-1] != hd:
            rep.e('csv', f'rows of {hd} are not contiguous')
        groups[hd].append(r)
    P = {p['handle']: p for p in products}
    if set(groups) != set(P):
        rep.e('csv', f'CSV handles differ from catalog (+{sorted(set(groups) - set(P))[:3]} −{sorted(set(P) - set(groups))[:3]})')
    mf_cols = [(c, re.search(r'metafields\.[a-z_]+\.([a-z_]+)\)', c).group(1)) for c in header if '.metafields.' in c]
    types = dict(build.PRODUCT_MF_TYPES)
    for hd, rs in groups.items():
        p = P.get(hd)
        if not p:
            continue
        a = f'csv {hd}'
        first = rs[0]
        if first['Title'] != p['title'] or first['Type'] != p['product_type'] or first['Vendor'] != p['vendor']:
            rep.e('csv', f'{a}: title/type/vendor differ')
        if any(r['Title'] for r in rs[1:]):
            rep.e('csv', f'{a}: Title repeated on a non-first row')
        if first['Body (HTML)'] != build.strip_comments(p['body_html']):
            rep.e('csv', f'{a}: body differs from catalog')
        if '<!--' in first['Body (HTML)']:
            rep.e('csv', f'{a}: body contains HTML comments')
        if [t.strip() for t in first['Tags'].split(',') if t.strip()] != p['tags']:
            rep.e('csv', f'{a}: tags differ')
        if first['Published'] not in ('TRUE', 'FALSE') or first['Status'] != p['status']:
            rep.e('csv', f'{a}: Published/Status')
        names = [first[f'Option{i} Name'] for i in (1, 2, 3) if first[f'Option{i} Name']]
        exp_names = [o['name'] for o in p['options']] or ['Title']
        if names != exp_names:
            rep.e('csv', f'{a}: option names {names} ≠ {exp_names}')
        vrows = [r for r in rs if r['Variant SKU']]
        if len(vrows) != len(p['variants']):
            rep.e('csv', f'{a}: {len(vrows)} variant rows, catalog has {len(p["variants"])}')
        if any(r['Variant SKU'] for r in rs[len(vrows):]) or any(not r['Variant SKU'] for r in rs[:len(vrows)]):
            rep.e('csv', f'{a}: variant rows are not first')
        for r, v in zip(vrows, p['variants']):
            vals = [r[f'Option{i} Value'] or None for i in (1, 2, 3)]
            exp = [v.get('option1'), v.get('option2'), v.get('option3')] if p['options'] else ['Default Title', None, None]
            if vals != exp:
                rep.e('csv', f'{a} {v["sku"]}: option values {vals} ≠ {exp}')
            if r['Variant SKU'] != v['sku'] or r['Variant Price'] != build.money(v['price']) or \
                    r['Variant Compare At Price'] != build.money(v.get('compare_at_price')):
                rep.e('csv', f'{a} {v["sku"]}: sku/price/compare-at differ')
            try:
                if float(r['Variant Price']) <= 0:
                    rep.e('csv', f'{a} {v["sku"]}: price ≤ 0')
            except ValueError:
                rep.e('csv', f'{a} {v["sku"]}: price not a number')
            if r['Variant Grams'] != str(int(v.get('grams') or 0)):
                rep.e('csv', f'{a} {v["sku"]}: grams differ')
            if r['Variant Inventory Policy'] not in ('deny', 'continue') or r['Variant Fulfillment Service'] != 'manual':
                rep.e('csv', f'{a} {v["sku"]}: inventory policy / fulfillment service')
            if r['Variant Inventory Tracker'] not in ('', 'shopify'):
                rep.e('csv', f'{a} {v["sku"]}: inventory tracker {r["Variant Inventory Tracker"]!r}')
            if r['Variant Requires Shipping'] not in ('TRUE', 'FALSE') or r['Variant Taxable'] not in ('TRUE', 'FALSE'):
                rep.e('csv', f'{a} {v["sku"]}: shipping/taxable not TRUE/FALSE')
            exp_img = build.image_url(v['export_image']) if v.get('export_image') else ''
            if r['Variant Image'] != exp_img:
                rep.e('csv', f'{a} {v["sku"]}: variant image differs')
        irows = [r for r in rs if r['Image Src']]
        if [r['Image Src'] for r in irows] != [build.image_url(i['file']) for i in p['images'] if i.get('exported')]:
            rep.e('csv', f'{a}: image list differs')
        # never a draft placeholder card or a missing file as a product photo (the CSV import would publish it)
        for r in irows + [r for r in vrows if r['Variant Image']]:
            for url in (r.get('Image Src'), r.get('Variant Image')):
                if url and url.startswith(IMAGE_BASE_URL):
                    f = url[len(IMAGE_BASE_URL):]
                    if build.is_draft(f):
                        rep.e('csv', f'{a}: exports the draft placeholder {f}')
                    elif not (IMAGES / f).exists():
                        rep.e('csv', f'{a}: exports {f}, which is not in catalog/images')
        if [r['Image Position'] for r in irows] != [str(i) for i in range(1, len(irows) + 1)]:
            rep.e('csv', f'{a}: image positions not 1..n')
        for r in irows:
            if not r['Image Src'].startswith(IMAGE_BASE_URL):
                rep.e('csv', f'{a}: image url {r["Image Src"]} not under the repo raw URL')
            if not r['Image Alt Text'].strip():
                rep.e('csv', f'{a}: empty Image Alt Text for {r["Image Src"]}')
        urls = {r['Image Src'] for r in irows}
        for r in vrows:
            if r['Variant Image'] and r['Variant Image'] not in urls:
                rep.e('csv', f'{a}: variant image not among product images')
        if any(r['Image Src'] == '' and r['Variant SKU'] == '' for r in rs):
            rep.e('csv', f'{a}: empty row')
        # metafields round trip
        for col, key in mf_cols:
            cell = first[col]
            val = p['metafields'].get(key)
            mtype = types[key]
            if mtype == 'boolean' and not val:
                val = None
            if build.empty(val):
                if cell:
                    rep.e('csv', f'{a}: {key} has a value but catalog is empty')
                continue
            try:
                if mtype.startswith('list.') or mtype == 'json':
                    back = json.loads(cell)
                elif mtype == 'boolean':
                    back = cell == 'true'
                elif mtype == 'number_decimal':
                    back = float(cell)
                    val = float(val)
                else:
                    back = cell
            except ValueError:
                rep.e('csv', f'{a}: {key} cell is not valid {mtype}')
                continue
            if back != val:
                rep.e('csv', f'{a}: {key} does not round-trip')
            if any(r[col] for r in rs[1:]):
                rep.e('csv', f'{a}: {key} repeated on a non-first row')
    rep.i('csv', f'products.csv: {len(rows)} rows, {len(groups)} products, {len(header)} columns '
                 f'({len(mf_cols)} metafield columns), round-trip OK' if rep.count('ERROR') == before else
          f'products.csv: {len(rows)} rows')


def check_fixture(rep, cat, products):
    try:
        fx = json.loads(FIXTURE.read_text(encoding='utf-8'))
    except (OSError, ValueError):
        rep.e('fixture', f'{FIXTURE.name} missing or invalid')
        return
    if fx.get('schema_version') != 1:
        rep.e('fixture', 'schema_version ≠ 1')
    for k in ('shop', 'products', 'collections', 'filters', 'menus', 'pages', 'blogs', 'policies'):
        if k not in fx:
            rep.e('fixture', f'top-level {k} missing')
    shop = fx.get('shop') or {}
    for k in ('name', 'currency', 'money_format', 'money_with_currency_format', 'primary_locale', 'country'):
        if not shop.get(k):
            rep.e('fixture', f'shop.{k} missing')
    if len(fx['products']) != len(products):
        rep.e('fixture', f'{len(fx["products"])} products, catalog has {len(products)}')
    vids = {}
    handles = {p['handle'] for p in fx['products']}
    pages = {pg['handle'] for pg in fx['pages']}
    missing_img = set()
    for p in fx['products']:
        a = f'fixture {p["handle"]}'
        for v in p['variants']:
            if not isinstance(v['price'], int) or v['price'] <= 0:
                rep.e('fixture', f'{a}: price must be integer cents > 0')
            if v.get('compare_at_price') is not None and not isinstance(v['compare_at_price'], int):
                rep.e('fixture', f'{a}: compare_at_price must be integer cents')
            exp = build.variant_id(p['handle'], [v.get('option1'), v.get('option2'), v.get('option3')])
            if v.get('id') != exp:
                rep.e('fixture', f'{a}: variant id {v.get("id")} ≠ renderer stable id {exp}')
            if v['id'] in vids:
                rep.e('fixture', f'{a}: variant id collision with {vids[v["id"]]}')
            vids[v['id']] = p['handle']
            if v.get('image') and v['image'] not in {i['src'] for i in p['images']}:
                rep.e('fixture', f'{a}: variant image not in images')
        for img in p['images']:
            if not (IMAGES / img['src']).exists():
                missing_img.add(img['src'])
            elif build.is_draft(img['src']):
                rep.e('fixture', f'{a}: draft placeholder {img["src"]} in the fixture')
            if not img.get('alt'):
                rep.e('fixture', f'{a}: image without alt')
        for m in p['metafields']:
            if not isinstance(m.get('value'), str):
                rep.e('fixture', f'{a}: metafield {m.get("key")} value must be an Admin-API string')
            if m['type'] == 'list.product_reference':
                for x in json.loads(m['value']):
                    if x not in handles:
                        rep.e('fixture', f'{a}: {m["key"]} → unknown product {x}')
            if m['type'] == 'page_reference' and m['value'] not in pages:
                rep.e('fixture', f'{a}: {m["key"]} → page {m["value"]} not in fixture')
            if m['type'] in ('json', 'rich_text_field') or m['type'].startswith('list.'):
                try:
                    json.loads(m['value'])
                except ValueError:
                    rep.e('fixture', f'{a}: {m["key"]} value is not JSON')
        if '<!--' in p.get('body_html', ''):
            rep.e('fixture', f'{a}: HTML comments in body')
    for p in fx['products']:
        for v in p['variants']:
            for m in v.get('metafields') or []:
                if m['type'] == 'list.variant_reference':
                    for g in json.loads(m['value']):
                        vid = int(re.search(r'(\d+)$', g).group(1))
                        if vid not in vids:
                            rep.e('fixture', f'fixture {p["handle"]} {v["sku"]}: component {g} unknown')
    for c in fx['collections']:
        for x in c.get('products') or []:
            if x not in handles:
                rep.e('fixture', f'fixture collection {c["handle"]}: unknown product {x}')
    for b in fx['blogs']:
        for art in b['articles']:
            src = (art.get('image') or {}).get('src')
            if src and not (IMAGES / src).exists():
                missing_img.add(src)
    if missing_img:
        rep.i('fixture', f'{len(missing_img)} fixture image files not in catalog/images yet (expected until rendered)')


def check_seed(rep, products):
    """Catalog round 5 (high): the reference and variant metafields reach Shopify through scripts/seed/seed.mjs, not the CSV.
    (1) export/product-references.json carries every reference metafield of catalog.json (product addons, addon_eenmalig, past_op,
    onderdelen, andere_maten, alternatieven, maatgids, downloads; variant addon_varianten/_aantallen, componenten/_aantallen, stuklijst);
    (2) the seed dry run (an in-memory store holding exactly what products.csv creates) resolves every one of them and sends only
    inputs the Admin API accepts."""
    import subprocess
    try:
        refs = json.loads((EXPORT / 'product-references.json').read_text(encoding='utf-8'))['products']
    except (OSError, ValueError, KeyError):
        rep.e('seed', 'export/product-references.json missing or unreadable')
        return
    R = {r['handle']: r for r in refs}
    ref_keys = [k for k, t, *_ in build.PRODUCT_MF if build.is_reference(t) and k != 'componenten']
    vkeys = ['addon_varianten', 'addon_aantallen', 'componenten', 'component_aantallen', 'stuklijst']
    n_p = n_v = 0
    for p in products:
        r = R.get(p['handle'], {'metafields': [], 'variants': []})
        have = {m['key']: m.get('value') for m in r['metafields']}
        for k in ref_keys:
            v = p['metafields'].get(k)
            if v in (None, [], ''):
                continue
            n_p += 1
            if have.get(k) != v:
                rep.e('seed', f'product {p["handle"]}: {k} not (or not the same) in product-references.json')
        rv = {x['sku']: {m['key']: m for m in x['metafields']} for x in r['variants']}
        for v in p['variants']:
            for k in vkeys:
                if (v.get('metafields') or {}).get(k):
                    n_v += 1
                    if k not in rv.get(v['sku'], {}):
                        rep.e('seed', f'{p["handle"]} / {v["sku"]}: variant {k} not in product-references.json')
    try:
        out = subprocess.run(['node', str(REPO / 'scripts' / 'seed' / 'seed.mjs'), '--dry-run'], capture_output=True, text=True, timeout=300)
    except (OSError, subprocess.TimeoutExpired) as e:
        rep.w('seed', f'seed dry run not run ({e.__class__.__name__}): node 22 needed for scripts/seed/seed.mjs')
        return
    errs = [ln[6:] for ln in out.stdout.splitlines() if ln.startswith('ERROR ')]
    for e in errs[:30]:
        rep.e('seed', f'seed dry run: {e}')
    if out.returncode and not errs:
        rep.e('seed', f'seed dry run failed: {(out.stderr or out.stdout).strip()[-400:]}')
    summary = next((ln for ln in out.stdout.splitlines() if ln.startswith('store after the run')), '')
    rep.i('seed', f'{n_p} product and {n_v} variant reference metafields go through scripts/seed/seed.mjs; dry run: {summary[21:]}')


def main(argv=None):
    ap = argparse.ArgumentParser(description='Validate the Klapklaar catalog against CONTRACT.md')
    ap.add_argument('--json', action='store_true')
    ap.add_argument('-v', '--verbose', action='store_true')
    args = ap.parse_args(argv)
    rep, cat = run(args.verbose)
    errors, warns, infos = rep.count('ERROR'), rep.count('WARN'), rep.count('INFO')
    if args.json:
        print(json.dumps({'errors': errors, 'warnings': warns, 'info': infos, 'items': rep.items,
                          'allowed_negations': rep.allowed_negations}, ensure_ascii=False, indent=1))
        return 1 if errors else 0
    c = cat['meta']['counts']
    print(f"catalog: {c['products']} products · {c['variants']} variants · {c['unique_images']} unique images · "
          f"{c['collections']} collections · {c['menus']} menus · {c['pages']} pages · {c['articles']} articles")
    by = defaultdict(Counter)
    for it in rep.items:
        by[it['level']][it['area']] += 1
    for lvl in ('ERROR', 'WARN', 'INFO'):
        if by[lvl]:
            print(f'{lvl:5} {sum(by[lvl].values()):4}  ' + ', '.join(f'{k} {n}' for k, n in sorted(by[lvl].items())))
    shown = 0
    for it in rep.items:
        if it['level'] == 'ERROR' or args.verbose:
            print(f"  {it['level']:5} [{it['area']}] {it['msg']}")
            shown += 1
        if not args.verbose and shown >= 80:
            print('  … (more; use -v or --json)')
            break
    if args.verbose and rep.allowed_negations:
        print(f'  negated claim words allowed ({len(rep.allowed_negations)}):')
        for x in rep.allowed_negations:
            print('   ', x)
    print('RESULT:', 'FAIL' if errors else 'OK', f'({errors} errors, {warns} warnings, {infos} info)')
    return 1 if errors else 0


if __name__ == '__main__':
    sys.exit(main())
