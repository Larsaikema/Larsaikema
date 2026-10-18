# Shared helpers for the Klapklaar catalog skeleton generator.
import hashlib, re, unicodedata

PRODUCTS = []
HANDLES = {}

def cents(eur):
    return int(round(eur * 100))

COLOR_CODE = {
    'Wit': 'WIT', 'Zwart': 'ZWA', 'Antraciet': 'ANT', 'Grijs': 'GRS', 'Lichtgrijs': 'LGR', 'Zilver': 'ZIL',
    'Blauw': 'BLA', 'Marineblauw': 'MAR', 'Lichtblauw': 'LBL', 'Turquoise': 'TRQ', 'Rood': 'ROD',
    'Bordeaux': 'BOR', 'Roze': 'ROZ', 'Fuchsia': 'FUC', 'Paars': 'PRS', 'Groen': 'GRN',
    'Lichtgroen': 'LGN', 'Oranje': 'ORA', 'Geel': 'GEL', 'Goud': 'GOU', 'Beige': 'BEI', 'Zandkleur': 'ZND',
    'Taupe': 'TAU', 'Bruin': 'BRU', 'Camel': 'CAM', 'Crème': 'CRM', 'Champagne': 'CHA', 'Berken': 'BRK',
    'Houtlook': 'HLK', 'Transparant': 'TRP', 'Warm wit': 'WWT', 'Graniet': 'GRT',
}

# Hex values: the theme's swatch_colors default (settings_schema.json). Tents, walls, roofs and inflatables are sold in the
# supplier's stock red ('Rood'), never in brand Klaproos (brand.md §4.5: no own dye lot promised).
SWATCH_HEX = {
    'Wit': '#F3F3F0', 'Zwart': '#1D1E20', 'Antraciet': '#3F4247', 'Grijs': '#6E7276', 'Lichtgrijs': '#B9BBBD',
    'Zilver': '#BFC2C5', 'Blauw': '#1E4E9E', 'Marineblauw': '#1B2A4C', 'Lichtblauw': '#78A9D6', 'Turquoise': '#159FA3',
    'Rood': '#B5161E', 'Bordeaux': '#6B1A27', 'Roze': '#E27BA9', 'Fuchsia': '#C2206E',
    'Paars': '#57297F', 'Groen': '#1F6C3C', 'Lichtgroen': '#7DB744', 'Oranje': '#E2681B', 'Geel': '#F1C21A',
    'Goud': '#C49A45', 'Beige': '#D8CBB2', 'Zandkleur': '#CDBB98', 'Taupe': '#8B7D6E', 'Bruin': '#6A4A33',
    'Camel': '#B98A57', 'Crème': '#ECE3CF', 'Champagne': '#E4D6BC', 'Berken': '#D9B98C', 'Houtlook': '#8A6A48',
    'Transparant': '#E9EEF0', 'Warm wit': '#F4E3BC', 'Graniet': '#77736D',
}

def render_color(k):
    """Kleur value -> renderer colour param (renders/js/materials.js COLORS keys or hex)."""
    m = {'Crème': 'creme', 'Zandkleur': 'zand', 'Warm wit': '#F4E3BC',
         'Houtlook': '#8A6A48', 'Berken': '#D9B98C', 'Transparant': '#E9EEF0', 'Graniet': '#77736D'}
    return m.get(k, k.lower())

def render_finish(k):
    return {}

def slug(s):
    s = s.replace('Ø', 'd').replace('ø', 'd').replace('²', '2').replace(',', '-')
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode()
    s = s.lower()
    s = re.sub(r'\s*x\s*', 'x', s)
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
    return s

def code(s):
    """Maat value -> SKU fragment: '3 x 4,5 m' -> 3X45, 'Ø80-85 cm' -> D80-85, '10 m' -> 10M."""
    s = s.replace('Ø', 'D').replace(',', '')
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().upper().strip()
    has_x = ' X ' in s
    s = s.replace(' X ', 'X')
    m = re.match(r'^(.*?)\s*(CM|M)$', s)
    if m:
        s = m.group(1) + ('' if has_x or m.group(1).startswith('D') else m.group(2))
    return re.sub(r'[^A-Z0-9-]', '', s)

def jit(*parts):
    return int(hashlib.md5('|'.join(map(str, parts)).encode()).hexdigest()[:8], 16)

COLOR_WEIGHT = {'Wit': 1.5, 'Zwart': 1.4, 'Antraciet': 1.0, 'Crème': 0.8, 'Blauw': 0.6,
                'Marineblauw': 0.7, 'Groen': 0.5, 'Zandkleur': 0.4, 'Rood': 0.7, 'Bordeaux': 0.6}

def inv(base, sku, kleur=None, factor=1.0, zero_every=29):
    """Plausible launch stock (placeholder for the owner's real count)."""
    if base is None:
        return None
    j = jit(sku)
    if zero_every and j % zero_every == 0:
        return 0  # a few sold-out variants so the theme's 'Tijdelijk uitverkocht' state is exercised
    w = COLOR_WEIGHT.get(kleur, 0.55) if kleur else 1.0
    q = base * w * factor * (0.8 + (j % 41) / 100)
    return max(1, int(round(q)))

ANGLE_NL = {'hero': 'schuin vooraanzicht', 'front': 'vooraanzicht', 'side': 'zijaanzicht', 'back': 'achteraanzicht',
            'top': 'bovenaanzicht', 'low': 'laag standpunt', 'detail': 'detail'}

def img(file, role, priority, model, params, angle='hero', kleur=None, status='existing', alt=None, extra=None):
    d = {'file': file, 'role': role, 'priority': priority, 'kleur': kleur,
         'render': {'model': model, 'params': params, 'angle': angle}, 'model_status': status}
    if alt:
        d['alt_hint'] = alt
    if extra:
        d['render'].update(extra)
    return d

def variant(sku, opts, price, grams, inv_qty, tracked=True, policy='deny', qrule=None, shipping=True):
    v = {'sku': sku, 'option1': opts[0] if len(opts) > 0 else None,
         'option2': opts[1] if len(opts) > 1 else None, 'option3': opts[2] if len(opts) > 2 else None,
         'price': cents(price), 'compare_at_price': None,
         'inventory_management': 'shopify' if tracked else None,
         'inventory_policy': policy, 'inventory_quantity': inv_qty if tracked else None,
         'grams': int(grams), 'requires_shipping': shipping, 'taxable': True}
    if qrule:
        v['quantity_rule'] = qrule
    return v

def add(p):
    assert p['handle'] not in HANDLES, p['handle']
    defaults = {'vendor': 'Klapklaar', 'status': 'active', 'body_html': None, 'seo': {'title': None, 'description': None},
                'gift_card': False, 'template_suffix': None}
    for k, v in defaults.items():
        p.setdefault(k, v)
    # metafields: fill every contract key, null = for the copywriter / owner
    mf = {k: None for k in ['kenmerk_kort', 'usps', 'specificaties', 'staffelkorting', 'addons', 'past_op', 'levertijd',
                            'verzending', 'bedrukbaar', 'drukopties', 'downloads', 'faq', 'vergelijk_groep',
                            'gewicht_kg', 'verpakt', 'garantie']}
    mf.update(p.get('metafields', {}))
    if mf['bedrukbaar'] is None:
        mf['bedrukbaar'] = False
    p['metafields'] = mf
    HANDLES[p['handle']] = p
    PRODUCTS.append(p)
    return p

def opt(name, values):
    return {'name': name, 'values': list(values)}

def sp(groep, label, waarde):
    return {'groep': groep, 'label': label, 'waarde': waarde}

def kleur_images(handle, kleuren, model, params_fn, default, extra_imgs=(), status='existing', p2=2):
    """Hero per Kleur (variant images) + extra images. Returns (images, variant_images)."""
    imgs, vmap = [], {}
    for k in kleuren:
        f = f'{handle}-{slug(k)}-hero.webp'
        imgs.append(img(f, 'hero' if k == default else 'variant', 1 if k == default else p2, model, params_fn(k), 'hero', k, status))
        vmap[k] = f
    # default first
    imgs.sort(key=lambda i: 0 if i['kleur'] == default else 1)
    imgs.extend(extra_imgs)
    return imgs, vmap

# Staffels: one round scheme per family (B2B review: no arithmetic leftovers). Bundles use the scheme of their family
# too (kk_addons.bundle_staffels checks that a bundle never ends up dearer than its loose parts at any volume).
ST_TENT = [{'vanaf': 3, 'korting': 3}, {'vanaf': 5, 'korting': 5}, {'vanaf': 10, 'korting': 8}]       # tenten, frames, marktkraam
ST_GROOT = [{'vanaf': 2, 'korting': 3}, {'vanaf': 5, 'korting': 5}]                                    # event-/vrachttenten, karren, grote pakketten
ST_TEXTIEL = [{'vanaf': 10, 'korting': 5}, {'vanaf': 25, 'korting': 10}, {'vanaf': 50, 'korting': 15}]  # textiel, wanden, kleine onderdelen
ST_BEDRUKT = [{'vanaf': 10, 'korting': 10}, {'vanaf': 25, 'korting': 15}, {'vanaf': 50, 'korting': 20}, {'vanaf': 100, 'korting': 25}]
ST_MEUBEL = [{'vanaf': 10, 'korting': 5}, {'vanaf': 25, 'korting': 8}, {'vanaf': 50, 'korting': 12}]    # statafels, krukken, stoelen
ST_STATAFEL = ST_MEUBEL
ST_KLAPTAFEL = [{'vanaf': 5, 'korting': 5}, {'vanaf': 10, 'korting': 8}, {'vanaf': 25, 'korting': 12}]  # klaptafels, biertafels, prikkabels
ST_PRIK = ST_KLAPTAFEL
ST_LAMP = [{'vanaf': 50, 'korting': 10}, {'vanaf': 100, 'korting': 20}]
ST_GEWICHT = [{'vanaf': 3, 'korting': 5}, {'vanaf': 6, 'korting': 10}]
ST_SLANG = [{'vanaf': 25, 'korting': 5}, {'vanaf': 50, 'korting': 10}, {'vanaf': 100, 'korting': 15}]   # per meter / per m²
ST_KAR = ST_GROOT
ST_MARKT = ST_TENT

AANLEVERING = 'PDF, AI, EPS, SVG of PNG ≥ 300 dpi'
LT_DRUK = '10–15 werkdagen na akkoord drukproef'

TENT_KLEUREN = ['Rood', 'Wit', 'Zwart', 'Antraciet', 'Blauw', 'Groen', 'Zandkleur']
HD_KLEUREN = ['Wit', 'Zwart']
ROK_KLEUREN = ['Wit', 'Crème', 'Beige', 'Taupe', 'Zilver', 'Grijs', 'Antraciet', 'Zwart', 'Goud', 'Geel', 'Oranje',
               'Rood', 'Bordeaux', 'Roze', 'Fuchsia', 'Paars', 'Lichtblauw', 'Turquoise', 'Blauw', 'Marineblauw',
               'Lichtgroen', 'Groen', 'Camel', 'Bruin']
STRIK_KLEUREN = ['Wit', 'Crème', 'Champagne', 'Zilver', 'Antraciet', 'Zwart', 'Bordeaux', 'Marineblauw', 'Rood', 'Goud']
