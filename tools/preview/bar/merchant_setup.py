#!/usr/bin/env python3
"""Merchant setup for the Horizon bar.

The A/B bar is "Shopify Horizon, set up by a skilled merchant with exactly the same products". A fresh
Horizon install shows English demo copy ("Welcome to our store", "Shop all", "Join our email list"),
colour options as text buttons (variant picker show_swatches: false) and a cart drawer that does not
open after add-to-cart. A merchant would change those in the theme editor in ten minutes, so every
blind comparison against stock Horizon would be biased toward our theme.

This script writes that merchant configuration as an OVERLAY directory (templates/*.json, section
groups, config/settings_data.json) next to the pristine Horizon copy; the preview server serves it
with --overlay. Horizon itself is never modified and nothing derived from it is committed.

  python3 tools/preview/bar/merchant_setup.py --horizon $SCRATCH/bar/horizon \
      --data catalog/preview-data.json --out $SCRATCH/bar/horizon-merchant

Store-dependent choices (hero image, collections on the home page) are read from the fixture, so the
overlay follows the catalog when it changes. tools/dev.sh runs this before starting the bar server.
"""
import argparse
import copy
import json
import os
import re
import sys

# English demo copy in stock Horizon 4.x templates/section groups -> what a Dutch merchant writes.
COPY = {
    '<h1>Page not found</h1>': '<h1>Pagina niet gevonden</h1>',
    '<p>The link may be incorrect, or the page has been removed. </p>': '<p>De link klopt niet of de pagina bestaat niet meer.</p>',
    'Continue shopping': 'Verder winkelen',
    '<p>Discover something new</p>': '<p>Ontdek ons assortiment</p>',
    'Cart': 'Winkelwagen',
    '<h2>You may also like</h2>': '<h2>Misschien ook interessant</h2>',
    '<h2>You may also like </h2>': '<h2>Misschien ook interessant</h2>',
    'View all': 'Bekijk alles',
    '<p>Browse our latest products</p>': '<p>Alles voor je feest, markt of evenement</p>',
    'Shop all': 'Bekijk het assortiment',
    '<h1>Shop by collection</h1>': '<h1>Alle collecties</h1>',
    'Submit': 'Versturen',
    '<h1>Opening soon</h1>': '<h1>We openen binnenkort</h1>',
    '<p>Sign up for our newsletter to be the first to know when we launch.</p>':
        '<p>Schrijf je in voor de nieuwsbrief en hoor als eerste wanneer we live gaan.</p>',
    'Sign up': 'Aanmelden',
    'Welcome to our store': 'Partytenten, statafels en accessoires voor elk feest',
    '<h2>Join our email list</h2>': '<h2>Schrijf je in voor de nieuwsbrief</h2>',
    '<p>Get exclusive deals and early access to new products.</p>':
        '<p>Ontvang acties en nieuwe producten als eerste in je inbox.</p>',
}

FILES = [
    'config/settings_data.json',
    'sections/header-group.json',
    'sections/footer-group.json',
    'templates/index.json',
    'templates/product.json',
    'templates/collection.json',
    'templates/cart.json',
    'templates/404.json',
    'templates/list-collections.json',
    'templates/page.contact.json',
    'templates/page.json',
    'templates/password.json',
    'templates/search.json',
    'templates/blog.json',
    'templates/article.json',
]


def load(path):
    text = open(path, encoding='utf-8').read()
    text = re.sub(r'^\s*/\*.*?\*/', '', text, flags=re.S)  # Shopify's auto-generated header comment
    return json.loads(text)


def translate(node, untranslated):
    if isinstance(node, dict):
        return {k: translate(v, untranslated) for k, v in node.items()}
    if isinstance(node, list):
        return [translate(v, untranslated) for v in node]
    if isinstance(node, str) and node in COPY:
        return COPY[node]
    return node


def walk_blocks(node, fn):
    if isinstance(node, dict):
        if 'type' in node and isinstance(node.get('settings'), dict):
            fn(node)
        for k in ('sections', 'blocks'):
            if isinstance(node.get(k), dict):
                for child in node[k].values():
                    walk_blocks(child, fn)


def schema_preset(horizon, section, name):
    src = open(os.path.join(horizon, 'sections', f'{section}.liquid'), encoding='utf-8').read()
    m = re.search(r'{%-?\s*schema\s*-?%}(.*?){%-?\s*endschema\s*-?%}', src, re.S)
    schema = json.loads(m.group(1))
    for p in schema.get('presets', []):
        if p.get('name') == name:
            return copy.deepcopy(p)
    raise SystemExit(f'preset {name} not found in sections/{section}.liquid')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--horizon', required=True)
    ap.add_argument('--data', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--images', help='images dir of the fixture (default: <data dir>/images)')
    a = ap.parse_args()

    fixture = json.load(open(a.data, encoding='utf-8'))
    images_dir = a.images or os.path.join(os.path.dirname(os.path.abspath(a.data)), 'images')
    collections = [c for c in fixture.get('collections', []) if c.get('handle') not in ('all', 'frontpage')]
    with_products = [c for c in collections if c.get('rules') or c.get('products') or c.get('product_handles')]
    home_collections = [c['handle'] for c in (with_products or collections) if c.get('image')][:4] or \
        [c['handle'] for c in collections][:4]

    def image_src(img):
        if not img:
            return None
        src = img['src'] if isinstance(img, dict) else img
        return src if os.path.exists(os.path.join(images_dir, src)) else None

    hero_src = None
    for c in collections:
        hero_src = image_src(c.get('image'))
        if hero_src:
            break
    if not hero_src:
        for p in fixture.get('products', []):
            if p.get('images'):
                hero_src = image_src(p['images'][0])
                if hero_src:
                    break

    untranslated = []
    for rel in FILES:
        src = os.path.join(a.horizon, rel)
        if not os.path.exists(src):
            continue
        data = translate(load(src), untranslated)

        if rel == 'config/settings_data.json':
            cur = data['current'] if isinstance(data.get('current'), dict) else data['presets'][data['current']]
            cur['auto_open_cart_drawer'] = True  # add to cart opens the drawer
        elif rel == 'templates/product.json':
            def swatches(b):
                if b['type'] == 'variant-picker':
                    b['settings']['show_swatches'] = True
            walk_blocks(data, swatches)
        elif rel == 'templates/index.json':
            secs = data['sections']
            hero = next((k for k, s in secs.items() if s['type'] == 'hero'), None)
            if hero and hero_src:
                secs[hero]['settings']['image_1'] = f'shopify://shop_images/{hero_src}'
            if home_collections:
                preset = schema_preset(a.horizon, 'collection-list', 't:names.collections_grid')
                sec = {'type': 'collection-list', 'blocks': preset['blocks'], 'block_order': preset['block_order'],
                       'name': 'Categorieën', 'settings': preset['settings']}
                sec['settings'].update({'collection_list': home_collections, 'columns': min(4, len(home_collections)),
                                        'padding-block-start': 48, 'padding-block-end': 24})
                for b in sec['blocks'].values():
                    for cb in (b.get('blocks') or {}).values():
                        if cb.get('type') == 'text':
                            cb['settings']['text'] = '<h3>Kies een categorie</h3>'
                secs['collection_list_merchant'] = sec
                order = data['order']
                order.insert(order.index(hero) + 1 if hero in order else 0, 'collection_list_merchant')
        elif rel == 'sections/footer-group.json':
            headings = {'footer': 'Klantenservice', 'main-menu': 'Assortiment'}

            def menu_heading(b):
                if b['type'] == 'menu' and not b['settings'].get('heading'):
                    b['settings']['heading'] = headings.get(b['settings'].get('menu'), '')
            walk_blocks(data, menu_heading)

        out = os.path.join(a.out, rel)
        os.makedirs(os.path.dirname(out), exist_ok=True)
        with open(out, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    # report English strings that are still left (new Horizon versions add demo copy)
    left = []
    for rel in FILES:
        p = os.path.join(a.out, rel)
        if not os.path.exists(p):
            continue
        def scan(node, path=''):
            if isinstance(node, dict):
                for k, v in node.items():
                    scan(v, f'{path}.{k}')
            elif isinstance(node, list):
                for i, v in enumerate(node):
                    scan(v, f'{path}[{i}]')
            elif isinstance(node, str) and path.rsplit('.', 1)[-1] in ('text', 'label', 'title', 'heading') \
                    and re.search(r'\b(the|our|your|and|you|shop|all|page|sign|view|join)\b', re.sub('<[^>]+>', ' ', node), re.I) \
                    and '{{' not in node:
                left.append(f'{rel}{path}: {node[:80]}')
        scan(load(p))
    print(f'merchant overlay written to {a.out} (hero image: {hero_src}, home collections: {home_collections})')
    for l in left:
        print(f'  still English? {l}', file=sys.stderr)


if __name__ == '__main__':
    main()
