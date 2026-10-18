#!/usr/bin/env python3
"""Merchant setup for the Horizon bar.

The A/B bar is "Shopify Horizon, set up by a skilled merchant with exactly the same products". A fresh
Horizon install shows English demo copy, Horizon's own neutral palette, no logo, colour options as text
buttons and a two-section home page. Comparing against that would bias every blind judgement toward our
theme. This script plays the merchant (or a Shopify Partner on a one-day setup budget) who configures
Horizon for the Klapklaar store in the theme editor:

  * brand: logo + inverse logo + favicon uploaded to Files, colour palette in the Klapklaar tokens
    (Zand page, Inkt text, Lampion primary buttons, Linnen/Lijn surfaces, Wit cards and drawers),
    Figtree via the font pickers (figtree_n4 body, n6 subheadings, n8 headings, n7 buttons/prices),
    brand radii, Zon sale badge, Linnen selected option chip
  * header: announcement bar with the same USP texts as our theme (Lampion band, Inkt text), logo,
    the real main-menu as mega menu, predictive search, cart bubble in Lampion
  * home page built from Horizon's own sections with the same content as theme/templates/index.json
    (hero, USPs, category tiles, featured collections, "met jouw logo", zakelijk band, FAQ, blog)
  * product page: carousel gallery with thumbnails (counter on a phone), product type eyebrow, spec line
    from the custom.kenmerk_kort metafield, colour swatches + option buttons, stock status, one buy button
    (no second "Buy now", brand rule), USP list from custom.usps, product description open, "Wat zit erin"
    (custom.included / custom.excluded), delivery/zakelijk accordion, complementary + related products
  * collection and search pages: sidebar filters, sorting, cards with spec line and swatches
  * every page template of ours with a suffix (zakelijk, offerte, bedrukken, faq, garantie, vergelijking,
    handleidingen, contact) gets a Horizon page template with the same suffix and the same content, built
    from the home page's building blocks (section + groups, contact form, product list, accordion)
  * cart drawer that opens after add-to-cart, cart note on, no express buttons
  * footer with the real footer menus, contact, newsletter, payment icons, legal links
  * Dutch copy everywhere: Horizon's nl locale plus the merchant's "Edit default theme content"
    overrides (btw instead of "belastingen", "In mijn winkelwagen", search placeholder, a few
    mistranslations fixed)

Everything is written as an OVERLAY (templates/*.json, sections/*-group.json, config/settings_data.json,
locales/nl.json), i.e. only what the theme editor produces; the preview server serves it with
--overlay. Horizon itself is never modified and nothing derived from it is committed.

Store files (Shopify admin > Content > Files) live in the fixture's images directory. The logo, the
inverse logo, the favicon and brand renders our theme shows from its own assets are "uploaded" there
as merchant-*.png/webp (created only when missing or outdated).

Content follows our theme: hero, USP, category, featured-collection, FAQ, blog and announcement copy is
read from theme/templates/index.json and theme/sections/header-group.json / footer-group.json (schema
defaults included), so the bar shows the same words when our copy changes. Every lookup falls back to
the current Klapklaar copy.

  python3 tools/preview/bar/merchant_setup.py --horizon $SCRATCH/bar/horizon \
      --data catalog/preview-data.json --out $SCRATCH/bar/horizon-merchant

tools/dev.sh runs this before starting the bar server.
"""
import argparse
import copy
import json
import os
import re
import shutil
import sys

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
OURS = os.path.join(REPO, 'theme')
BRAND = os.path.join(REPO, 'brand')

# Klapklaar tokens (brand/tokens.json, v7)
ZAND, INKT, LAMPION, LINNEN, LIJN, KIEZEL, WIT, ZON = (
    '#FBF6EC', '#1D2420', '#E66414', '#ECE4D6', '#DDD2BF', '#5D625C', '#FFFFFF', '#FFC23A')
P_BG, P_FG, P_LAMPION, P_LINNEN, P_LIJN, P_KIEZEL = (
    '{{ settings.color_palette.background }}', '{{ settings.color_palette.foreground }}',
    '{{ settings.color_palette.color1 }}', '{{ settings.color_palette.color2 }}',
    '{{ settings.color_palette.color3 }}', '{{ settings.color_palette.color4 }}')

# English demo copy in stock Horizon 4.x templates/section groups -> what a Dutch merchant writes.
COPY = {
    '<h1>Page not found</h1>': '<h1>Pagina niet gevonden</h1>',
    '<p>The link may be incorrect, or the page has been removed. </p>': '<p>De link klopt niet of de pagina bestaat niet meer.</p>',
    'Continue shopping': 'Verder winkelen',
    '<p>Discover something new</p>': '<h3>Misschien zoek je dit</h3>',
    'Cart': 'Winkelwagen',
    '<h2>You may also like</h2>': '<h2>Misschien ook interessant</h2>',
    '<h2>You may also like </h2>': '<h2>Misschien ook interessant</h2>',
    'View all': 'Bekijk alles',
    '<p>Browse our latest products</p>': '<p>Alles voor je feest, markt of evenement</p>',
    'Shop all': 'Bekijk het assortiment',
    '<h1>Shop by collection</h1>': '<h1>Alle categorieën</h1>',
    'Submit': 'Versturen',
    '<h1>Opening soon</h1>': '<h1>We gaan bijna open</h1>',
    '<p>Sign up for our newsletter to be the first to know when we launch.</p>':
        '<p>Schrijf je in en hoor als eerste wanneer we live gaan.</p>',
    'Sign up': 'Aanmelden',
    'Welcome to our store': 'Partytenten, statafels en accessoires voor elk feest',
    '<h2>Join our email list</h2>': '<h2>Schrijf je in voor de nieuwsbrief</h2>',
    '<p>Get exclusive deals and early access to new products.</p>':
        '<p>Ontvang acties en nieuwe producten als eerste in je inbox.</p>',
}

# Horizon nl.json: the merchant's "Edit default theme content" changes (brand voice, btw, fixes).
LOCALE_OVERRIDES = {
    'actions.add_to_cart': 'In mijn winkelwagen',
    'products.product.add_to_cart': 'In mijn winkelwagen',
    'products.product.added_to_cart': 'Staat in je winkelwagen',
    'content.search_input_placeholder': 'Zoek op product, maat of artikelnummer',
    'content.items_added_to_cart.one': '1 artikel toegevoegd aan je winkelwagen',     # stock nl says "verwijderd"
    'content.items_added_to_cart.other': '{{ count }} artikelen toegevoegd aan je winkelwagen',
    'content.recently_viewed_products': 'Recent bekeken',                            # stock: "Recent beoordeeld"
    'content.read_more': 'Lees verder',
    'content.product_badge_sale': 'Actie',
    'content.seller_note': 'Opmerking bij je bestelling',
    'content.cart_estimated_total': 'Totaal',
    'content.inventory_low_stock': 'Bijna uitverkocht',
    'content.inventory_out_of_stock': 'Tijdelijk uitverkocht',
    'content.search_results_resource_articles': 'Advies',
    'content.price_from': 'vanaf {{ price }}',
    'content.your_cart': 'Je winkelwagen',
    'content.view_cart': 'Naar je winkelwagen',
    # "Wissen" is cut off in the predictive search box (the reset button is one touch target wide: reads "Wisser")
    'actions.clear': 'Wis',
    'blocks.email_signup.success': 'Gelukt, je staat op de lijst.',
    'blocks.email_signup.placeholder': 'Je e-mailadres',
    'content.taxes_included': 'Incl. btw. ',            # trailing space: price.liquid glues the shipping line on
    'content.duties_and_taxes_included': 'Incl. btw. ',
    'content.shipping_policy': 'Verzendkosten zie je bij het afrekenen.',
    'content.shipping_policy_html': '<a href="{{ link }}">Verzendkosten</a> zie je bij het afrekenen.',
}


def tax_copy(value):
    """Shopify's generic duties/taxes wording -> how a Dutch shop says it (prices incl. btw)."""
    v = value
    for a, b in (('Douanerechten en belastingen inbegrepen.', 'Incl. btw.'), ('Belastingen inbegrepen.', 'Incl. btw.'),
                 ('Douanerechten inbegrepen. ', ''), ('Douanerechten inbegrepen.', ''),
                 ('Belastingen, kortingen en', 'Btw, kortingen en'), ('Belastingen en', 'Btw en'),
                 ('worden bij de checkout berekend', 'zie je bij het afrekenen'),
                 ('worden berekend bij de checkout', 'zie je bij het afrekenen'),
                 ('worden bij de checkout getoond', 'zie je bij het afrekenen'),
                 ('bij de checkout', 'bij het afrekenen')):
        v = v.replace(a, b)
    v = re.sub(r'\.(?=[A-Z<])', '. ', v)
    return re.sub(r'\s+', ' ', v).strip()


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

# our theme's icon names -> Horizon icon block options
ICONS = {'truck': 'truck', 'invoice': 'clipboard', 'proof': 'check_box', 'chat': 'chat_bubble', 'euro': 'price_tag',
         'clock': 'stopwatch', 'phone': 'chat_bubble', 'logo': 'check_box', 'return': 'return', 'box': 'box',
         'ruler': 'ruler', 'lock': 'lock', 'star': 'star', 'map': 'map_pin', 'pallet': 'box', 'shield': 'lock',
         'check': 'check_box', 'info': 'question_mark', 'mail': 'chat_bubble', 'upload': 'arrow'}


# ---------------------------------------------------------------- helpers
def load(path):
    text = open(path, encoding='utf-8').read()
    text = re.sub(r'^\s*/\*.*?\*/', '', text, flags=re.S)  # Shopify's auto-generated header comment
    return json.loads(text)


def try_load(path, default=None):
    try:
        return load(path)
    except Exception:  # noqa: BLE001 - our theme may be mid-edit; the bar must still start
        return default


def schema_of(path):
    try:
        src = open(path, encoding='utf-8').read()
        m = re.search(r'{%-?\s*schema\s*-?%}(.*?){%-?\s*endschema\s*-?%}', src, re.S)
        return json.loads(m.group(1)) if m else {}
    except Exception:  # noqa: BLE001
        return {}


def translate(node):
    if isinstance(node, dict):
        return {k: translate(v) for k, v in node.items()}
    if isinstance(node, list):
        return [translate(v) for v in node]
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


def blocks(*pairs):
    """[(id, block), ...] -> {'blocks': {...}, 'block_order': [...]}"""
    return {'blocks': {k: v for k, v in pairs}, 'block_order': [k for k, _ in pairs]}


def text(html, preset='rte', **kw):
    s = {'text': html, 'type_preset': preset, 'width': kw.pop('width', '100%'), 'max_width': kw.pop('max_width', 'normal'),
         'alignment': kw.pop('alignment', 'left'), 'wrap': kw.pop('wrap', 'pretty')}
    s.update(kw)
    return {'type': 'text', 'settings': s}


def eyebrow(label, color=None):
    s = {'text': f'<p>{label}</p>', 'type_preset': 'custom', 'font': 'var(--font-subheading--family)',
         'font_size': '0.875rem', 'line_height': 'tight', 'letter_spacing': 'loose', 'case': 'uppercase',
         'width': 'fit-content'}
    if color:
        s['text_color'] = color
    return {'type': 'text', 'settings': s}


def small(html, color=KIEZEL, size='0.875rem', font='var(--font-body--family)'):
    return {'type': 'text', 'settings': {'text': html, 'type_preset': 'custom', 'font': font, 'font_size': size,
                                         'line_height': 'normal', 'width': '100%', 'text_color': color}}


def button(label, link, style='button'):
    return {'type': 'button', 'settings': {'label': label, 'link': link, 'style_class': style,
                                           'width': 'fit-content', 'width_mobile': 'fit-content'}}


def icon(name, width=28, color=None):
    s = {'icon': ICONS.get(name, name), 'width': width}
    if color:
        s['icon_color'] = color
    return {'type': 'icon', 'settings': s}


def image(src, ratio='adapt', radius=12, **kw):
    s = {'image': f'shopify://shop_images/{src}' if src else '', 'image_ratio': ratio, 'border_radius': radius,
         'width': 'fill', 'height': 'fit'}
    s.update(kw)
    return {'type': 'image', 'settings': s}


def group(pairs, **settings):
    s = {'content_direction': 'column', 'gap': 12, 'width': 'fill', 'height': 'fit',
         'horizontal_alignment_flex_direction_column': 'flex-start', 'vertical_alignment_flex_direction_column': 'center'}
    s.update(settings)
    g = {'type': 'group', 'settings': s}
    g.update(blocks(*pairs))
    return g


def row(pairs, gap=12, **settings):
    return group(pairs, content_direction='row', gap=gap, horizontal_alignment=settings.pop('horizontal_alignment', 'flex-start'),
                 vertical_alignment=settings.pop('vertical_alignment', 'center'), **settings)


def section(type_, name, pairs=(), **settings):
    sec = {'type': type_, 'name': name, 'settings': settings}
    sec.update(blocks(*pairs))
    return sec


def lines(value):
    return [x.strip() for x in re.split(r'\n|<br\s*/?>', value or '') if x.strip()]


def card(pairs, bg=WIT, pad=24, radius=12, **settings):
    """A group with a background, rounded corners and inner padding (Horizon's group block)."""
    s = {'background_color': bg, 'border_radius': radius, 'padding-block-start': pad, 'padding-block-end': pad,
         'padding-inline-start': pad, 'padding-inline-end': pad, 'vertical_alignment_flex_direction_column': 'flex-start'}
    s.update(settings)
    if not bg:
        s.pop('background_color')
    return group(pairs, **s)


def badge_num(n):
    """Step number in an Inkt circle: a text block with a background and a full corner radius."""
    return text(f'<p><strong>{n}</strong></p>', 'custom', font='var(--font-subheading--family)', font_size='0.875rem',
                line_height='tight', width='fit-content', alignment='center', text_color=ZAND, background=True,
                background_color=INKT, corner_radius=14,   # Horizon pads a rounded text background by its radius
                **{'padding-block-start': 7, 'padding-block-end': 7, 'padding-inline-start': 11, 'padding-inline-end': 11})


def checklist(items, gap=10, size='1rem', color=INKT):
    return group([(f'item_{i}', row([('icon', icon('check_box', 20, INKT)),
                                      ('text', small(p_html(plain(t)), color=color, size=size))],
                                     gap=10, vertical_alignment='flex-start', vertical_on_mobile=False))
                  for i, t in enumerate(items, 1)], gap=gap)


def contact_form(label='Versturen'):
    f = {'type': 'contact-form', 'settings': {'width': 'custom', 'custom_width': 100, 'width_mobile': 'custom',
                                              'custom_width_mobile': 100}}
    f.update(blocks(('submit-button', {'type': 'contact-form-submit-button', 'static': True, 'settings': {
        'label': label, 'style_class': 'button', 'width': 'fit-content', 'width_mobile': 'fit-content'}})))
    f['block_order'] = []
    return f


PRIVACY = ('<p>We gebruiken je gegevens alleen om je vraag te beantwoorden. Lees ons '
           '<a href="/policies/privacy-policy">privacybeleid</a>.</p>')


def strip_md(s):
    return re.sub(r'\*([^*]+)\*', r'\1', s or '').strip()


def plain(html):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', html or '')).strip()


def p_html(s):
    s = (s or '').strip()
    return s if s.startswith('<') else f'<p>{s}</p>'


# ---------------------------------------------------------------- our theme's content
class Ours:
    """Settings of our theme's sections/blocks (schema defaults + template values)."""

    def __init__(self):
        self.settings = self._theme_settings()
        self.locale = try_load(os.path.join(OURS, 'locales', 'nl.default.json'), {}) or {}

    def t(self, key, default=''):
        """Our storefront copy (locales/nl.default.json), so labels on the bar's pages read the same."""
        node = self.locale
        for part in key.split('.'):
            node = node.get(part) if isinstance(node, dict) else None
        return node if isinstance(node, str) and node else default

    def _theme_settings(self):
        merged = {}
        for g in try_load(os.path.join(OURS, 'config', 'settings_schema.json'), []) or []:
            for s in g.get('settings', []):
                if 'id' in s and 'default' in s:
                    merged[s['id']] = s['default']
        data = try_load(os.path.join(OURS, 'config', 'settings_data.json'), {}) or {}
        cur = data.get('current')
        if isinstance(cur, str):
            cur = (data.get('presets') or {}).get(cur)
        merged.update({k: v for k, v in (cur or {}).items() if not isinstance(v, dict) or k == 'color_schemes'})
        return merged

    def fill(self, text_value):
        if not isinstance(text_value, str):
            return text_value
        return text_value.replace('[besteltijd]', str(self.settings.get('cutoff_time') or '14:00'))

    def section_settings(self, sec):
        schema = schema_of(os.path.join(OURS, 'sections', f"{sec.get('type')}.liquid"))
        s = {d['id']: d['default'] for d in schema.get('settings', []) if 'id' in d and 'default' in d}
        s.update(sec.get('settings') or {})
        return {k: self.fill(v) for k, v in s.items()}, schema

    def block_list(self, sec, schema):
        defs = {b.get('type'): b for b in schema.get('blocks', []) if isinstance(b, dict)}
        out = []
        for bid in sec.get('block_order') or list((sec.get('blocks') or {}).keys()):
            b = (sec.get('blocks') or {}).get(bid)
            if not b or b.get('disabled'):
                continue
            d = {s['id']: s['default'] for s in (defs.get(b.get('type')) or {}).get('settings', []) if 'id' in s and 'default' in s}
            d.update(b.get('settings') or {})
            out.append((b.get('type'), {k: self.fill(v) for k, v in d.items()}))
        return out

    def template(self, rel):
        data = try_load(os.path.join(OURS, rel)) or {}
        out = []
        for key in data.get('order') or []:
            sec = (data.get('sections') or {}).get(key)
            if not sec or sec.get('disabled'):
                continue
            s, schema = self.section_settings(sec)
            out.append((key, sec.get('type'), s, self.block_list(sec, schema)))
        return out


# ---------------------------------------------------------------- store files ("uploaded" by the merchant)
class Files:
    def __init__(self, images_dir):
        self.dir = images_dir
        self.notes = []

    def has(self, name):
        return bool(name) and os.path.exists(os.path.join(self.dir, name))

    def upload(self, src, name, transform=None):
        """Copy a brand file into the store's files (only when missing or older than the source)."""
        dest = os.path.join(self.dir, name)
        if not os.path.exists(src):
            return None
        if os.path.exists(dest) and os.path.getmtime(dest) >= os.path.getmtime(src):
            return name
        try:
            os.makedirs(self.dir, exist_ok=True)
            if transform:
                transform(src, dest)
            else:
                shutil.copy2(src, dest)
            self.notes.append(f'uploaded {name}')
            return name
        except Exception as e:  # noqa: BLE001
            self.notes.append(f'upload of {name} failed: {e}')
            return None

    def shop_image(self, setting):
        """Our theme's `shopify://shop_images/x` value -> a file the bar can show (merchant uploads the brand
        render when the store does not have it yet), or None."""
        name = re.sub(r'^shopify://shop_images/', '', setting or '')
        if not name:
            return None
        if self.has(name):
            return name
        src = os.path.join(BRAND, 'img', name)
        return self.upload(src, f'merchant-{name}') if os.path.exists(src) else None


def recolor_inverse(src, dest):
    """Inverse logo (brand/logo-inverse.svg): Inkt letters become Zand, the Lampion tent stays."""
    from PIL import Image
    im = Image.open(src).convert('RGBA')
    px = im.load()
    zand = tuple(int(ZAND[i:i + 2], 16) for i in (1, 3, 5))
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a and r < 120 and g < 120 and b < 120:  # Inkt (Lampion is r=230)
                px[x, y] = zand + (a,)
    im.save(dest)


# ---------------------------------------------------------------- builders: global settings
def build_settings(data, files):
    cur = data['current'] if isinstance(data.get('current'), dict) else copy.deepcopy(data['presets'][data['current']])
    logo = files.upload(os.path.join(BRAND, 'img', 'logo-1200.png'), 'merchant-klapklaar-logo.png')
    logo_inv = files.upload(os.path.join(BRAND, 'img', 'logo-1200.png'), 'merchant-klapklaar-logo-inverse.png',
                            transform=recolor_inverse)
    fav = files.upload(os.path.join(BRAND, 'favicon-192.png'), 'merchant-klapklaar-favicon.png')
    cur.update({
        # logo and favicon (1200 x 171 wordmark: 28 px high = 197 px wide, like our 200 px)
        'logo': f'shopify://shop_images/{logo}' if logo else '',
        'logo_inverse': f'shopify://shop_images/{logo_inv}' if logo_inv else '',
        'logo_height': 28,
        'logo_height_mobile': 19,
        'favicon': f'shopify://shop_images/{fav}' if fav else '',
        # colours
        'color_palette': {'background': ZAND, 'foreground': INKT, 'color1': LAMPION, 'color2': LINNEN,
                          'color3': LIJN, 'color4': KIEZEL},
        'page_background_color': P_BG,
        'page_text_color': P_FG,
        # typography: Figtree via the font pickers
        'type_body_font': 'figtree_n4',
        'type_subheading_font': 'figtree_n6',
        'type_heading_font': 'figtree_n8',
        'type_accent_font': 'figtree_n7',
        'type_size_paragraph': '16',
        'type_line_height_paragraph': 'body-normal',
        'type_size_h1': '48', 'type_line_height_h1': 'display-tight', 'type_letter_spacing_h1': 'heading-tight',
        'type_size_h2': '32', 'type_line_height_h2': 'display-tight', 'type_letter_spacing_h2': 'heading-tight',
        'type_size_h3': '24', 'type_line_height_h3': 'display-tight', 'type_letter_spacing_h3': 'heading-tight',
        'type_font_h4': 'heading', 'type_size_h4': '20', 'type_line_height_h4': 'display-normal',
        'type_font_h5': 'subheading', 'type_size_h5': '18', 'type_line_height_h5': 'display-normal',
        'type_font_h6': 'subheading', 'type_size_h6': '16', 'type_line_height_h6': 'display-normal',
        'page_width': 'narrow',
        # motion
        'page_transition_enabled': False,
        'transition_to_main_product': False,
        'card_hover_effect': 'lift',
        # badges: Zon for "Actie", brand badge radius
        'badge_position': 'top-left',
        'badge_corner_radius': 4,
        'badge_sale_background_color': ZON,
        'badge_sale_text_color': INKT,
        'badge_sold_out_background_color': P_LINNEN,
        'badge_sold_out_text_color': P_FG,
        'badge_font_family': 'subheading',
        'badge_text_transform': 'none',
        # buttons: Lampion primary with Inkt label, outlined Inkt secondary, 8 px radius, bold label
        'palette_primary_button_background': P_LAMPION,
        'palette_primary_button_text': P_FG,
        'palette_primary_button_border': P_LAMPION,
        'primary_button_border_width': 0,
        'button_border_radius_primary': 8,
        'type_font_button_primary': 'body',
        'palette_secondary_button_background': '#FFFFFF00',
        'palette_secondary_button_text': P_FG,
        'palette_secondary_button_border': P_FG,
        'secondary_button_border_width': 2,
        'button_border_radius_secondary': 8,
        'type_font_button_secondary': 'body',
        'pills_border_radius': 8,
        # cart: drawer that opens after add-to-cart, note on, one checkout button
        'cart_type': 'drawer',
        'auto_open_cart_drawer': True,
        'show_cart_note': True,
        'show_add_discount_code': True,
        'show_installments': False,
        'show_accelerated_checkout_buttons': False,
        'empty_cart_button_link': 'shopify://collections/partytenten',
        'cart_price_font': 'accent',
        'cart_thumbnail_border_radius': 8,
        # drawers, inputs, popovers on Wit
        'drawer_background_color': WIT,
        'drawer_text_color': P_FG,
        'drawer_border_color': P_LIJN,
        'palette_input_background': WIT,
        'palette_input_text': P_FG,
        'palette_input_border': P_KIEZEL,
        'input_border_width': 1,
        'inputs_border_radius': 8,
        'popover_background_color': WIT,
        'popover_text_color': P_FG,
        'popover_border_radius': 12,
        'popover_border_color': P_LIJN,
        'popover_border_width': 1,
        'icon_stroke': 'default',
        # prices
        'currency_code_enabled_product_pages': False,
        'currency_code_enabled_product_cards': False,
        'currency_code_enabled_cart_items': False,
        'currency_code_enabled_cart_total': False,
        # product cards and search
        'quick_add': True,
        'mobile_quick_add': True,
        'quick_add_background': WIT,
        'quick_add_text': P_FG,
        'show_second_image_on_hover': True,
        'product_card_carousel': False,
        'empty_state_collection': 'easy-up-partytenten',
        'product_corner_radius': 12,
        'card_corner_radius': 12,
        # swatches (round, like our theme) and option buttons (Wit chip, Linnen + Inkt rand when chosen)
        'show_variant_image': False,
        'variant_swatch_width': 32,
        'variant_swatch_height': 32,
        'variant_swatch_radius': 100,
        'variant_swatch_border_style': 'solid',
        'variant_swatch_border_width': 1,
        'variant_swatch_border_opacity': 30,
        'palette_variant_background': WIT,
        'palette_variant_text': P_FG,
        'palette_variant_border': P_KIEZEL,
        'palette_selected_variant_background': P_LINNEN,
        'palette_selected_variant_text': P_FG,
        'palette_selected_variant_border': P_FG,
        'variant_button_border_width': 1,
        'variant_button_radius': 8,
        'variant_button_width': 'default-width-buttons',
    })
    data['current'] = cur
    return data


# ---------------------------------------------------------------- builders: header / footer groups
def build_header(data, ours):
    hg = try_load(os.path.join(OURS, 'sections', 'header-group.json'), {}) or {}
    anns = []
    for key in hg.get('order') or []:
        sec = (hg.get('sections') or {}).get(key) or {}
        if sec.get('type') != 'announcement-bar' or sec.get('disabled'):
            continue
        _, schema = ours.section_settings(sec)
        for btype, s in ours.block_list(sec, schema):
            t = s.get('text')
            if t:
                anns.append((plain(t), s.get('link') or ''))
    if not anns:
        anns = [('Snel in huis in NL & BE', 'shopify://pages/verzenden-en-bezorgen'),
                ('Op werkdagen vóór 14:00 besteld, vandaag verzonden', ''),
                ('Zakelijk bestellen op factuur', 'shopify://pages/zakelijk'),
                ('Eigen logo? Eerst een drukproef', 'shopify://pages/bedrukken')]
    ann_blocks = []
    for i, (t, link) in enumerate(anns, 1):
        ann_blocks.append((f'announcement_{i}', {'type': '_announcement', 'settings': {
            'text': t, 'link': link, 'font': 'var(--font-subheading--family)', 'font_size': '0.875rem',
            'weight': '', 'letter_spacing': 'normal', 'case': 'none', 'text_color': INKT}}))
    sections = {
        'header_announcements': section('header-announcements', 'Aankondigingsbalk', ann_blocks,
                                        speed=5, section_width='page-width', background_color=P_LAMPION,
                                        divider_width=0, **{'padding-block-start': 9, 'padding-block-end': 9}),
        'header_section': {
            'type': 'header',
            'blocks': {
                'header-logo': {'type': '_header-logo', 'static': True, 'settings': {
                    'hide_logo_on_home_page': False, 'padding-block-start': 0, 'padding-block-end': 0}, 'blocks': {}},
                'header-menu': {'type': '_header-menu', 'static': True, 'settings': {
                    'menu': 'main-menu', 'type_font_primary_size': '1rem', 'menu_font_style': 'regular',
                    'type_font_primary_link': 'subheading', 'type_case_primary_link': 'none',
                    'menu_style': 'featured_collections', 'featured_collections_aspect_ratio': '1 / 1',
                    'featured_products_aspect_ratio': '1 / 1', 'image_border_radius': 12,
                    'navigation_bar': False, 'drawer_accordion': True, 'drawer_accordion_expand_first': False,
                    'drawer_dividers': True, 'background_color': P_BG}, 'blocks': {}},
            },
            'settings': {
                'logo_position': 'left', 'menu_position': 'left', 'menu_row': 'bottom',
                'show_search': True, 'search_position': 'right', 'search_row': 'top',
                'show_country': True, 'country_selector_style': False, 'show_language': True,
                'localization_font': 'subheading', 'localization_font_size': '0.875rem',
                'localization_position': 'right', 'localization_row': 'top',
                'section_width': 'page-width', 'section_height': 'standard',
                'enable_sticky_header': 'scroll-up', 'divider_width': 1, 'divider_size': 'full-width',
                'divider_color': P_LIJN, 'border_width': 1, 'bottom_border_color': P_LIJN,
                'actions_display_style': 'icon', 'bubble_style': 'custom',
                'bubble_background_color': P_LAMPION, 'bubble_text_color': P_FG,
                'enable_transparent_header_home': False, 'enable_transparent_header_product': False,
                'enable_transparent_header_collection': False,
            },
        },
    }
    data['sections'] = sections
    data['order'] = ['header_announcements', 'header_section']
    return data


def build_footer(data, ours, fixture):
    fg = try_load(os.path.join(OURS, 'sections', 'footer-group.json'), {}) or {}
    menus, brand, contact, news = [], {}, {}, {}
    for key in fg.get('order') or []:
        sec = (fg.get('sections') or {}).get(key) or {}
        if sec.get('type') != 'footer' or sec.get('disabled'):
            continue
        _, schema = ours.section_settings(sec)
        for btype, bs in ours.block_list(sec, schema):
            if btype == 'menu' and bs.get('menu'):
                menus.append((bs.get('heading') or '', bs['menu']))
            elif btype == 'brand':
                brand = bs
            elif btype == 'contact':
                contact = bs
            elif btype == 'newsletter':
                news = bs
    menu_handles = {m.get('handle') for m in fixture.get('menus', [])}
    menus = [(h, m) for h, m in menus if m in menu_handles] or [
        ('Winkel', 'footer-assortiment'), ('Hulp', 'footer-klantenservice'), ('Over Klapklaar', 'footer-klapklaar')]

    shop = fixture.get('shop', {})
    email = shop.get('email') or ''
    hours = ours.settings.get('openingstijden') or ''
    phone = ours.settings.get('phone') or shop.get('phone') or ''
    contact_lines = []
    if phone:
        contact_lines.append(f'<a href="tel:{re.sub(r"[^0-9+]", "", phone)}">{phone}</a>')
    if email:
        contact_lines.append(f'<a href="mailto:{email}">{email}</a>')
    contact_html = '<p>' + '<br>'.join(contact_lines) + '</p>' if contact_lines else ''
    hours_html = ('<p><strong>Openingstijden</strong><br>' + '<br>'.join(hours.splitlines()) + '</p>') if hours else ''

    def menu_block(heading, handle):
        return {'type': 'menu', 'settings': {'menu': handle, 'heading': heading, 'menu_spacing': 10,
                                             'show_as_accordion': True, 'accordion_icon': 'plus',
                                             'accordion_dividers': True, 'heading_preset': 'h6',
                                             'link_preset': 'paragraph'}}

    brand_col = group([
        ('logo', {'type': 'logo', 'settings': {'inverse': True, 'unit': 'pixel', 'pixel_height': 30,
                                               'custom_mobile_size': True, 'unit_mobile': 'pixel',
                                               'pixel_height_mobile': 24, 'padding-block-end': 8}}),
        ('tagline', text(f"<h3>{plain(brand.get('tagline')) or 'In één klap feestklaar.'}</h3>", 'h5')),
        ('intro', text(p_html(brand.get('text') or 'Partytenten, statafels, rokken en alles eromheen.'), 'rte')),
        ('contact_heading', text(f"<p><strong>{contact.get('heading') or 'Bel of app ons'}</strong></p>", 'rte',
                                 **{'padding-block-start': 8})),
        ('contact', text(contact_html + hours_html, 'rte')),
    ], gap=10)
    menu_cols = [(f'menu_{i}', menu_block(h, m)) for i, (h, m) in enumerate(menus, 1)]
    if len(menu_cols) > 2:   # 4-column footer: brand | menu | menus | newsletter
        menu_cols = [menu_cols[0], ('menus_more', group(menu_cols[1:], gap=32))]
    news_col = group([
        ('heading', text(f"<h3>{news.get('heading') or 'Eerst weten wanneer er actie is?'}</h3>", 'h5')),
        ('text', text(p_html(news.get('text') or 'Eén mail als er iets te vieren valt. Afmelden kan altijd.'), 'rte')),
        ('email', {'type': 'email-signup', 'settings': {
            'width': 'fill', 'border_style': 'all', 'border_radius': 8, 'input_style': 'custom',
            'input_background_color': WIT, 'input_text_color': INKT, 'input_border_color': WIT,
            'style_class': 'button', 'display_type': 'text', 'label': 'Aanmelden', 'integrated_button': False,
            'button_type_preset': 'paragraph'}}),
        ('payment', {'type': 'payment-icons', 'settings': {'horizontal_alignment': 'flex-start', 'gap': 8,
                                                          'padding-block-start': 16}}),
    ], gap=12)
    footer_blocks = [('brand', brand_col)] + menu_cols + [('newsletter', news_col)]

    util_blocks = [('copyright', {'type': 'footer-copyright', 'settings': {'show_powered_by': False, 'font_size': '0.875rem'}}),
                   ('policy_list', {'type': 'footer-policy-list', 'settings': {'font_size': '0.875rem'}})]
    sections = {
        'footer': section('footer', 'Footer', footer_blocks, section_width='page-width', gap=40,
                          background_color=P_FG, **{'padding-block-start': 56, 'padding-block-end': 40}),
        'utilities': section('footer-utilities', 'Voorwaarden en links', util_blocks, section_width='page-width',
                             gap=24, background_color=P_FG, divider_thickness=1, divider_color='#FBF6EC33',
                             **{'padding-block-start': 20, 'padding-block-end': 24}),
    }
    data['sections'] = sections
    data['order'] = ['footer', 'utilities']
    return data


# ---------------------------------------------------------------- builders: home page
def product_card(spec_line=True, swatches=True, gallery_ratio='square'):
    pairs = [('card-gallery', {'type': '_product-card-gallery', 'settings': {'image_ratio': gallery_ratio,
                                                                            'border_radius': 12}}),
             ('title', {'type': 'product-title', 'settings': {
                 'type_preset': 'custom', 'font': 'var(--font-subheading--family)', 'font_size': '1rem',
                 'line_height': 'tight', 'width': '100%', 'padding-block-start': 8}})]
    if spec_line:
        pairs.append(('spec', {'type': 'text', 'settings': {
            'text': '<p>{{ closest.product.metafields.custom.kenmerk_kort }}</p>', 'type_preset': 'custom',
            'font': 'var(--font-body--family)', 'font_size': '0.875rem', 'line_height': 'tight',
            'width': '100%', 'text_color': KIEZEL}}))
    if swatches:
        pairs.append(('swatches', {'type': 'swatches', 'settings': {'product_swatches_alignment': 'flex-start',
                                                                   'product_swatches_padding_top': 2}}))
    pairs.append(('price', {'type': 'price', 'settings': {
        'show_sale_price_first': True, 'show_installments': False, 'show_tax_info': False,
        'type_preset': 'custom', 'font': 'var(--font-accent--family)', 'font_size': '1.125rem',
        'width': '100%', 'padding-block-start': 2}}))
    card = {'type': '_product-card', 'static': True, 'settings': {'product_card_gap': 6, 'border': 'none',
                                                                 'padding-block-end': 8}}
    card.update(blocks(*pairs))
    return card


def home_hero(s, files):
    img = files.shop_image(s.get('image')) or 'scene-hero.webp'
    left = [] if s.get('eyebrow') == '' else [('eyebrow', eyebrow(s.get('eyebrow') or 'Partytenten · Statafels · Met jouw logo'))]
    left += [
        ('heading', text(f"<h1>{strip_md(s.get('heading')) or 'Uitklappen. Neerzetten. Feest.'}</h1>", 'h1', wrap='balance')),
        ('text', text(p_html(s.get('text')), 'custom', font='var(--font-body--family)', font_size='1.125rem',
                      line_height='normal', max_width='narrow')),
        ('buttons', row([('primary', button(s.get('button_1_label') or 'Bekijk partytenten',
                                            s.get('button_1_link') or 'shopify://collections/partytenten')),
                         ('secondary', button(s.get('button_2_label') or 'Naar statafels',
                                              s.get('button_2_link') or 'shopify://collections/statafels',
                                              'button-secondary'))],
                        gap=12, vertical_on_mobile=False, **{'padding-block-start': 8})),
    ]
    if s.get('subline'):
        left.append(('subline', small(s['subline'], color=INKT, size='1rem')))
    return section('section', 'Hero', [
        ('content', group(left, gap=16, width='custom', custom_width=48, width_mobile='fill')),
        ('image', image(img, 'adapt', radius=0, width='custom', custom_width=52, width_mobile='fill')),
    ], content_direction='row', vertical_on_mobile=True, horizontal_alignment='space-between',
        vertical_alignment='center', gap=32, section_width='page-width', background_color=P_LINNEN,
        **{'padding-block-start': 32, 'padding-block-end': 32})


def home_usps(s, items):
    cols = []
    for i, (bt, b) in enumerate(items, 1):
        cols.append((f'usp_{i}', row([
            ('icon', icon(b.get('icon') or 'check_box', 28, INKT)),
            ('text', group([('title', text(f"<p><strong>{plain(b.get('title'))}</strong></p>", 'paragraph')),
                            ('sub', small(p_html(plain(b.get('text')))))], gap=2)),
        ], gap=12, vertical_alignment='flex-start', vertical_on_mobile=False, link=b.get('link') or '')))
    return section('section', 'Voordelen', cols, content_direction='row', vertical_on_mobile=True,
                   horizontal_alignment='space-between', vertical_alignment='flex-start', gap=24,
                   section_width='page-width', background_color=WIT,
                   **{'padding-block-start': 28, 'padding-block-end': 28})


def home_categories(s, items, fixture):
    handles = {c['handle'] for c in fixture.get('collections', [])}
    cols = [b.get('collection') for _, b in items if b.get('collection') in handles]
    if not cols:
        cols = [c['handle'] for c in fixture.get('collections', [])][:4]
    head = row([('heading', text(f"<h2>{s.get('heading') or 'Waar ben je naar op zoek?'}</h2>", 'h2', width='fit-content')),
                ('link', button(s.get('link_label') or 'Alle categorieën', 'shopify://collections', 'button-unstyled'))],
               gap=12, horizontal_alignment='space-between', vertical_alignment='flex-end', vertical_on_mobile=False,
               **{'padding-block-end': 8})
    card = {'type': '_collection-card', 'static': True,
            'settings': {'placement': 'below_image', 'horizontal_alignment': 'flex-start', 'vertical_alignment': 'flex-start',
                         'collection_card_gap': 4, 'border': 'none', 'border_radius': 12}}
    card.update(blocks(
        ('collection-card-image', {'type': '_collection-card-image', 'static': True,
                                   'settings': {'image_ratio': 'square', 'border_radius': 12}}),
        ('title', {'type': 'collection-title', 'settings': {'type_preset': 'h5', 'width': '100%',
                                                            'text_color': P_FG, 'padding-block-start': 10}}),
        ('count', small('<p>{{ closest.collection.products_count }} producten</p>')),
    ))
    sec = section('collection-list', 'Categorieën', [('header', head), ('static-collection-card', card)],
                  collection_list=cols, layout_type='grid', carousel_on_mobile=False, columns=min(4, len(cols)),
                  mobile_columns='2', columns_gap=16, rows_gap=24, section_width='page-width', gap=20,
                  **{'padding-block-start': 56, 'padding-block-end': 24})
    sec['block_order'] = ['header']   # static blocks are not part of block_order
    return sec


def home_products(s, fixture, name):
    handles = {c['handle'] for c in fixture.get('collections', [])}
    col = s.get('collection') if s.get('collection') in handles else 'all'
    head_left = []
    if s.get('eyebrow'):
        head_left.append(('eyebrow', eyebrow(s['eyebrow'], KIEZEL)))
    head_left.append(('heading', text(f"<h2>{s.get('heading') or '{{ closest.collection.title }}'}</h2>", 'h2')))
    if s.get('text'):
        head_left.append(('text', text(p_html(s['text']), 'rte', max_width='narrow')))
    header = {'type': '_product-list-content', 'static': True, 'settings': {
        'content_direction': 'row', 'vertical_on_mobile': False, 'horizontal_alignment': 'space-between',
        'vertical_alignment': 'flex-end', 'align_baseline': False, 'gap': 16, 'width': 'fill'}}
    header.update(blocks(
        ('intro', group(head_left, gap=8, width='fill')),
        ('link', {'type': '_product-list-button', 'settings': {'label': s.get('link_label') or 'Bekijk alles',
                                                                'style_class': 'button-unstyled', 'width': 'fit-content',
                                                                'width_mobile': 'fit-content'}}),
    ))
    sec = section('product-list', name, [('static-header', header), ('static-product-card', product_card())],
                  collection=col, layout_type='grid', carousel_on_mobile=False, max_products=int(s.get('limit') or 4),
                  columns=int(s.get('columns') or 4), mobile_columns='2', columns_gap=16, rows_gap=24,
                  section_width='page-width', horizontal_alignment='flex-start', gap=24,
                  **{'padding-block-start': 48, 'padding-block-end': 48})
    sec['block_order'] = []
    return sec


def home_image_text(s, items, files, fixture, bg=WIT, name='Afbeelding met tekst'):
    img = files.shop_image(s.get('image'))
    if not img:  # same picture a merchant would pick: the first product image of a "met logo" product
        img = next((im['src'] if isinstance(im, dict) else im for p in fixture.get('products', [])
                    if 'logo' in p.get('handle', '') for im in p.get('images', [])[:1]
                    if files.has(im['src'] if isinstance(im, dict) else im)), 'scene-hero.webp')
    content = []
    for i, (bt, b) in enumerate(items, 1):
        if bt == 'eyebrow' and b.get('text'):
            content.append((f'eyebrow_{i}', eyebrow(plain(b['text']), KIEZEL)))
        elif bt == 'heading' and b.get('heading'):
            content.append((f'heading_{i}', text(f"<h2>{strip_md(b['heading'])}</h2>", 'h2', wrap='balance')))
        elif bt == 'text' and b.get('text'):
            content.append((f'text_{i}', text(p_html(b['text']), 'rte', max_width='narrow')))
        elif bt == 'steps':
            steps = [b.get(f'step_{n}') for n in (1, 2, 3, 4) if b.get(f'step_{n}')]
            if steps:
                content.append((f'steps_{i}', text('<ol>' + ''.join(f'<li>{plain(x)}</li>' for x in steps) + '</ol>', 'rte')))
        elif bt == 'checklist' and b.get('items'):
            content.append((f'checklist_{i}', checklist(lines(b['items']), gap=8)))
        elif bt == 'buttons':
            btns = []
            if b.get('label_1'):
                btns.append(('primary', button(b['label_1'], b.get('link_1') or '')))
            if b.get('label_2'):
                btns.append(('secondary', button(b['label_2'], b.get('link_2') or '', 'button-secondary')))
            if btns:
                content.append((f'buttons_{i}', row(btns, gap=12, vertical_on_mobile=False, **{'padding-block-start': 8})))
    if not content:
        return None
    img_block = ('image', image(img, 'square', radius=12, width='custom', custom_width=50, width_mobile='fill'))
    text_block = ('content', group(content, gap=16, width='custom', custom_width=50, width_mobile='fill',
                                   **{'padding-inline-start': 8, 'padding-inline-end': 8}))
    pairs = [img_block, text_block] if s.get('layout', 'image-left') != 'image-right' else [text_block, img_block]
    return section('section', name, pairs, content_direction='row', vertical_on_mobile=True,
                   horizontal_alignment='space-between', vertical_alignment='center', gap=48,
                   section_width='page-width', background_color=bg,
                   **{'padding-block-start': 48, 'padding-block-end': 48})


def home_zakelijk(s, items):
    left = [('eyebrow', eyebrow(s.get('eyebrow') or 'Klapklaar Zakelijk', KIEZEL)),
            ('heading', text(f"<h2>{s.get('heading') or 'Voor horeca, events, verhuur en verenigingen'}</h2>", 'h2', wrap='balance')),
            ('text', text(p_html(s.get('text') or ''), 'rte', max_width='narrow')),
            ('buttons', row([('primary', button(s.get('button_1_label') or 'Offerte aanvragen',
                                                s.get('button_1_link') or 'shopify://pages/offerte')),
                             ('secondary', button(s.get('button_2_label') or 'Meer over zakelijk',
                                                  s.get('button_2_link') or 'shopify://pages/zakelijk',
                                                  'button-secondary'))],
                            gap=12, vertical_on_mobile=False, **{'padding-block-start': 8}))]
    cards = []
    for i, (bt, b) in enumerate(items, 1):
        cards.append((f'benefit_{i}', row([
            ('icon', icon(b.get('icon') or 'check_box', 28, INKT)),
            ('text', group([('title', text(f"<p><strong>{plain(b.get('title'))}</strong></p>", 'paragraph')),
                            ('sub', small(p_html(plain(b.get('text')))))], gap=2)),
        ], gap=16, vertical_alignment='center', vertical_on_mobile=False, background_color=WIT, border_radius=12,
            **{'padding-block-start': 16, 'padding-block-end': 16, 'padding-inline-start': 20, 'padding-inline-end': 20})))
    return section('section', 'Zakelijk', [
        ('content', group(left, gap=16, width='custom', custom_width=50, width_mobile='fill')),
        ('benefits', group(cards, gap=12, width='custom', custom_width=46, width_mobile='fill')),
    ], content_direction='row', vertical_on_mobile=True, horizontal_alignment='space-between', vertical_alignment='center',
        gap=40, section_width='page-width', background_color=P_LINNEN,
        **{'padding-block-start': 56, 'padding-block-end': 56})


def faq_rows(items):
    """Our faq blocks -> Horizon blocks: a group title becomes an eyebrow, its questions one accordion."""
    out, rows_, n = [], [], 0

    def flush():
        nonlocal rows_
        if rows_:
            acc = {'type': 'accordion', 'settings': {'icon': 'plus', 'dividers': True, 'divider_color': P_LIJN,
                                                     'type_preset': 'h6'}}
            acc.update(blocks(*rows_))
            out.append((f'faq_{len(out) + 1}', acc))
            rows_ = []
    for bt, b in items:
        n += 1
        if bt == 'group' and b.get('title'):
            flush()
            out.append((f'group_{n}', eyebrow(b['title'], KIEZEL)))
        elif b.get('question'):
            r = {'type': '_accordion-row', 'settings': {'heading': plain(b['question']), 'open_by_default': False}}
            r.update(blocks(('answer', text(p_html(b.get('answer')), 'rte'))))
            rows_.append((f'row_{n}', r))
    flush()
    for i, (k, blk) in enumerate(out):
        if blk['type'] == 'text' and i:      # space above every group title but the first
            blk['settings']['padding-block-start'] = 24
    return out


def home_faq(s, items, bg=None):
    intro = [('heading', text(f"<h2>{s.get('heading') or 'Veelgestelde vragen'}</h2>", 'h2'))]
    if s.get('text'):
        intro.append(('text', small(p_html(s['text']), size='1rem')))
    questions = group(faq_rows(items), gap=8, width='fill')
    extra = {'background_color': bg} if bg else {}
    if s.get('layout') == 'stacked':
        return section('section', 'Veelgestelde vragen', [('intro', group(intro, gap=8)), ('questions', questions)],
                       content_direction='column', gap=24, section_width='page-width',
                       **{'padding-block-start': 48, 'padding-block-end': 64}, **extra)
    left = group(intro, gap=12, width='custom', custom_width=36, width_mobile='fill')
    return section('section', 'Veelgestelde vragen', [('intro', left), ('accordion', questions)],
                   content_direction='row', vertical_on_mobile=True, horizontal_alignment='space-between',
                   vertical_alignment='flex-start', gap=48, section_width='page-width',
                   **{'padding-block-start': 56, 'padding-block-end': 56}, **extra)


def home_blog(s, fixture):
    blogs = [b['handle'] for b in fixture.get('blogs', [])]
    blog = s.get('blog') if s.get('blog') in blogs else (blogs[0] if blogs else '')
    sec = section('featured-blog-posts', 'Blogposts', [
        ('static-blog-title', {'type': '_featured-blog-posts-title', 'static': True, 'settings': {
            'text': f"<h2>{s.get('heading') or 'Advies & inspiratie'}</h2><p><a href=\"/blogs/{blog}\">{s.get('link_label') or 'Alle artikelen'}</a></p>",
            'type_preset': 'rte', 'width': '100%'}}),
        ('static-blog-post-card', dict(blocks(
            ('image', {'type': '_featured-blog-posts-image', 'static': True, 'settings': {'image_ratio': 'landscape', 'border_radius': 12}}),
            ('title', {'type': '_heading', 'static': True, 'settings': {'text': '<h3>{{ closest.article.title }}</h3>',
                                                                       'type_preset': 'h5', 'show_alignment': False}}),
            ('blog-post-info-text', {'type': '_blog-post-info-text', 'static': True, 'settings': {
                'show_author': False, 'show_date': True, 'padding-block-start': 0, 'show_alignment': False, 'text_color': KIEZEL}}),
            ('blog-post-description', {'type': '_blog-post-description', 'static': True, 'settings': {'padding-block-start': 4}}),
        ), type='_featured-blog-posts-card', static=True, settings={'gap': 8})),
    ], blog=blog, layout_type='grid', carousel_on_mobile=True, post_limit=int(s.get('limit') or 3), columns=3,
        mobile_columns='1', mobile_card_size='60cqw', columns_gap=16, rows_gap=24, section_width='page-width', gap=24,
        **{'padding-block-start': 48, 'padding-block-end': 64})
    sec['block_order'] = []
    return sec


def build_index(data, ours, files, fixture):
    secs, order = {}, []
    content = ours.template('templates/index.json')
    featured_n = 0
    for key, typ, s, items in content:
        sec = None
        if typ == 'hero':
            sec = home_hero(s, files)
        elif typ == 'usp-strip':
            sec = home_usps(s, items)
        elif typ == 'collection-list':
            sec = home_categories(s, items, fixture)
        elif typ == 'featured-collection':
            featured_n += 1
            sec = home_products(s, fixture, f'Uitgelichte collectie {featured_n}')
        elif typ == 'image-with-text':
            sec = home_image_text(s, items, files, fixture)
        elif typ == 'b2b-banner':
            sec = home_zakelijk(s, items)
        elif typ == 'faq':
            sec = home_faq(s, items)
        elif typ == 'blog-posts':
            sec = home_blog(s, fixture)
        elif typ == 'rich-text' and (s.get('heading') or s.get('text')):
            sec = section('section', 'Tekst', [('heading', text(f"<h2>{s.get('heading', '')}</h2>", 'h2')),
                                               ('text', text(p_html(s.get('text')), 'rte'))],
                          **{'padding-block-start': 48, 'padding-block-end': 48})
        if sec:
            sid = re.sub(r'[^a-z0-9_]', '_', f'{typ}_{key}'.lower())
            secs[sid] = sec
            order.append(sid)
    if not order:  # our home page unreadable: keep Horizon's own with the hero image
        return translate(data)
    data['sections'] = secs
    data['order'] = order
    return data


# ---------------------------------------------------------------- builders: pages with their own template
# Our page.<suffix>.json templates are landing pages (zakelijk, offerte, bedrukken, faq, garantie, vergelijking,
# handleidingen, contact). The merchant gives every such page a Horizon template with the same suffix, built from
# the same sections as the home page (section + groups, contact-form, product-list, accordion), with the copy of
# our sections. Forms are Horizon's contact form (name, e-mail, phone, message): a hint above it asks for the extra
# details our forms have fields for.
def page_intro(heading=None, narrow=False, bg=None, width=60, pad_end=16, intro=None):
    pairs = [('title', text(f"<h1>{heading or '{{ closest.page.title }}'}</h1>", 'h1', wrap='balance'))]
    pairs.append(('content', text(intro or '{{ closest.page.content }}', 'rte')))
    col = group(pairs, gap=16, width='custom', custom_width=width, width_mobile='fill')
    extra = {'background_color': bg} if bg else {}
    return section('section', 'Paginakop', [('intro', col)], content_direction='column', gap=16,
                   section_width='page-width',
                   horizontal_alignment_flex_direction_column='center' if narrow else 'flex-start',
                   **{'padding-block-start': 40, 'padding-block-end': pad_end}, **extra)


def heading_block(level, html, preset=None, **kw):
    return text(f'<h{level}>{html}</h{level}>', preset or f'h{level}', wrap='balance', **kw)


def form_card(title, intro, hint, label, width=44):
    pairs = [('heading', heading_block(3, title, 'h4'))]
    if intro:
        pairs.append(('intro', small(p_html(intro), size='1rem')))
    if hint:
        pairs.append(('hint', small(p_html(hint))))
    pairs += [('form', contact_form(label)), ('privacy', small(PRIVACY, size='0.75rem'))]
    return card(pairs, gap=14, pad=28, width='custom', custom_width=width, width_mobile='fill')


def step_cards(steps, row_layout=True, bg=WIT):
    """[(title, text)] -> numbered Wit cards (in a row) or numbered rows (stacked; bg None: plain rows)."""
    out = []
    for i, (title, body) in enumerate(steps, 1):
        inner = []
        if title:
            inner.append(('title', heading_block(3, plain(title), 'h6')))
        if body:
            inner.append(('text', small(p_html(plain(body))) if title else small(p_html(plain(body)), INKT, '1rem')))
        if row_layout:
            out.append((f'step_{i}', card([('num', badge_num(i))] + inner, pad=20, gap=10, height='fill')))
        else:
            # the number sits in a fit-width group: on a phone Horizon stretches a text block that is a direct
            # child of a row
            num = group([('num', badge_num(i))], gap=0, width='fit-content', width_mobile='fit-content')
            out.append((f'step_{i}', card([('num', num), ('body', group(inner, gap=4))], bg=bg, pad=16 if bg else 0,
                                          gap=14, content_direction='row', vertical_on_mobile=False,
                                          horizontal_alignment='flex-start',
                                          vertical_alignment='flex-start' if title else 'center')))
    if row_layout:
        return row(out, gap=16, vertical_alignment='flex-start')
    return group(out, gap=10 if bg else 14)


def zakelijk_sections(s, items, ours):
    quote = ours.settings.get('quote_page') or 'shopify://pages/offerte'
    segs = [x.strip() for x in (s.get('segments') or '').split(',') if x.strip()]
    hero_left = [('eyebrow', eyebrow('Klapklaar Zakelijk', KIEZEL)),
                 ('heading', heading_block(1, s.get('heading') or '{{ closest.page.title }}')),
                 ('intro', text(p_html(s.get('intro')), 'custom', font='var(--font-body--family)', font_size='1.125rem',
                                line_height='normal', max_width='narrow')),
                 ('buttons', row([('primary', button(ours.settings.get('b2b_cta_label') or 'Offerte aanvragen', quote)),
                                  ('secondary', button(s.get('contact_label') or 'Zakelijk account aanvragen',
                                                       'shopify://pages/contact', 'button-secondary'))],
                                 gap=12, vertical_on_mobile=False, **{'padding-block-start': 8}))]
    if segs:
        # chips: a fit-width group per segment, so they wrap at their own width on a phone
        hero_left.append(('segments', row([(f'segment_{i}', card([('text', text(
            f'<p>{x}</p>', 'custom', font='var(--font-subheading--family)', font_size='0.875rem', line_height='tight',
            width='fit-content'))], pad=0, radius=40, gap=0, width='fit-content', width_mobile='fit-content',
            **{'padding-block-start': 7, 'padding-block-end': 7, 'padding-inline-start': 14, 'padding-inline-end': 14}))
            for i, x in enumerate(segs, 1)], gap=8, vertical_on_mobile=False, **{'padding-block-start': 8})))
    staffel = []
    for ln in lines(s.get('staffel')):
        if ':' in ln:
            a, b = ln.split(':', 1)
            staffel.append((a.strip(), b.strip()))

    def trow(i, a, b, head=False):
        fmt = (lambda v: f'<p><strong>{v}</strong></p>')
        return (f'row_{i}', row([('qty', small(fmt(a) if head else p_html(a), color=INKT, size='0.875rem' if head else '1rem')),
                                 ('discount', small(fmt(b), color=INKT, size='0.875rem' if head else '1rem'))],
                                gap=12, horizontal_alignment='space-between', vertical_on_mobile=False,
                                background_color=LINNEN if head else WIT, border_radius=8,
                                **{'padding-block-start': 10, 'padding-block-end': 10,
                                   'padding-inline-start': 14, 'padding-inline-end': 14}))
    table = [trow(0, ours.t('product.staffel_qty', 'Aantal'), ours.t('product.staffel_discount', 'Korting'), True)]
    for i, (a, b) in enumerate(staffel, 1):
        table.append((f'divider_{i}', {'type': '_divider', 'settings': {'thickness': 1, 'divider_color': LIJN}}))
        table.append(trow(i, a, b))
    staffel_card = card([('heading', heading_block(2, s.get('staffel_heading') or 'Staffelkorting', 'h4')),
                         ('text', small(p_html(s.get('staffel_text')))),
                         ('table', group(table, gap=0)),
                         ('note', small(p_html(s.get('staffel_note'))))],
                        gap=12, pad=28, width='custom', custom_width=40, width_mobile='fill')
    hero = section('section', 'Zakelijk', [('content', group(hero_left, gap=16, width='custom', custom_width=54,
                                                                width_mobile='fill')),
                                             ('staffel', staffel_card)],
                   content_direction='row', vertical_on_mobile=True, horizontal_alignment='space-between',
                   vertical_alignment='center', gap=40, section_width='page-width', background_color=P_LINNEN,
                   **{'padding-block-start': 56, 'padding-block-end': 56})

    cards = []
    for i, (bt, b) in enumerate([x for x in items if x[0] == 'benefit'], 1):
        cards.append((f'benefit_{i}', card([
            ('icon', icon(b.get('icon') or 'check_box', 28, INKT)),
            ('title', heading_block(3, plain(b.get('title')), 'h6')),
            ('text', small(p_html(plain(b.get('text')))))], pad=20, gap=10, height='fill')))
    benefits = section('section', 'Wat je krijgt', [
        ('heading', heading_block(2, s.get('benefits_heading') or 'Wat je krijgt')),
        ('cards', row(cards, gap=16, vertical_alignment='flex-start'))],
        content_direction='column', gap=24, section_width='page-width',
        **{'padding-block-start': 48, 'padding-block-end': 48})

    account = section('section', 'Zakelijk account', [
        ('content', group([('heading', heading_block(2, s.get('form_heading') or 'Zakelijk account aanvragen')),
                           ('text', text(p_html(s.get('form_text')), 'rte')),
                           ('page', text('{{ closest.page.content }}', 'rte', **{'padding-block-start': 8}))],
                          gap=16, width='custom', custom_width=52, width_mobile='fill')),
        ('form', form_card(s.get('form_heading') or 'Zakelijk account aanvragen', None,
                           'Zet je bedrijfsnaam, contactpersoon, KvK- en btw-nummer en je branche in je bericht. '
                           'Dan zetten we je account klaar.', ours.t('forms.send', 'Verstuur'), width=42))],
        content_direction='row', vertical_on_mobile=True, horizontal_alignment='space-between',
        vertical_alignment='flex-start', gap=48, section_width='page-width', background_color=P_LINNEN,
        **{'padding-block-start': 56, 'padding-block-end': 56})
    return [('hero', hero), ('benefits', benefits), ('account', account)]


def offerte_sections(s, items, ours):
    steps = [(None, b.get('text')) for bt, b in items if bt == 'step' and b.get('text')]
    aside = card([('heading', heading_block(2, s.get('aside_heading') or 'Zo werkt het', 'h4')),
                  ('steps', step_cards(steps, row_layout=False, bg=None)),
                  ('divider', {'type': '_divider', 'settings': {'thickness': 1, 'divider_color': LIJN,
                                                                'padding-block-start': 4, 'padding-block-end': 4}}),
                  ('points', checklist(lines(s.get('aside_points')), gap=8, size='0.875rem'))],
                 gap=16, pad=24, width='custom', custom_width=36, width_mobile='fill')
    form = form_card(ours.t('quote.lines_title', 'Wat heb je nodig?'), None,
                     'Zet per product het aantal, de maat en de kleur in je bericht, met het afleveradres en de datum '
                     'waarop alles er moet zijn. Heb je al een logo? Plak een link naar het bestand, of mail het na je '
                     'aanvraag. Ben je een bedrijf? Zet je bedrijfsnaam, KvK- en btw-nummer erbij.',
                     ours.t('quote.submit', 'Offerte aanvragen'), width=60)
    intro = page_intro(s.get('heading') or ours.t('quote.title'), bg=P_LINNEN, pad_end=8)
    body = section('section', 'Offerteformulier', [('form', form), ('aside', aside)], content_direction='row',
                   vertical_on_mobile=True, horizontal_alignment='space-between', vertical_alignment='flex-start',
                   gap=32, section_width='page-width', background_color=P_LINNEN,
                   **{'padding-block-start': 24, 'padding-block-end': 64})
    return [('intro', intro), ('quote', body)]


def bedrukken_sections(s, items, ours, files, fixture):
    def pick(setting):
        img = files.shop_image(setting)
        if img:
            return img
        return next((im['src'] if isinstance(im, dict) else im for p in fixture.get('products', [])
                     if 'logo' in p.get('handle', '') for im in p.get('images', [])[:1]
                     if files.has(im['src'] if isinstance(im, dict) else im)), 'scene-hero.webp')
    hero = section('section', 'Bedrukken', [
        ('content', group([
            ('eyebrow', eyebrow(s.get('eyebrow') or 'Met jouw logo', KIEZEL)),
            ('heading', heading_block(1, s.get('heading') or '{{ closest.page.title }}')),
            ('intro', text('{{ closest.page.content }}', 'rte', max_width='narrow')),
            ('buttons', row([('primary', button(s.get('cta_1_label') or 'Ontwerp je tent',
                                                s.get('cta_1_link') or 'shopify://collections/bedrukte-partytenten')),
                             ('secondary', button(s.get('cta_2_label') or 'Ontwerp je statafelrok',
                                                  s.get('cta_2_link') or 'shopify://collections/bedrukte-statafelhoezen',
                                                  'button-secondary'))],
                            gap=12, vertical_on_mobile=False, **{'padding-block-start': 8}))],
            gap=16, width='custom', custom_width=50, width_mobile='fill')),
        ('image', image(pick(s.get('image')), 'square', radius=12, width='custom', custom_width=46, width_mobile='fill'))],
        content_direction='row', vertical_on_mobile=True, horizontal_alignment='space-between', vertical_alignment='center',
        gap=40, section_width='page-width', background_color=P_LINNEN,
        **{'padding-block-start': 48, 'padding-block-end': 48})

    steps = [(b.get('title'), b.get('text')) for bt, b in items if bt == 'step']
    how = section('section', 'Zo werkt het', [('heading', heading_block(2, s.get('steps_heading') or 'Zo werkt het')),
                                              ('steps', step_cards(steps))],
                  content_direction='column', gap=24, section_width='page-width',
                  **{'padding-block-start': 48, 'padding-block-end': 24})

    opts = []
    for i, (bt, b) in enumerate([x for x in items if x[0] == 'option'], 1):
        opts.append((f'option_{i}', card([
            ('image', image(pick(b.get('image')), 'square', radius=8)),
            ('title', heading_block(3, plain(b.get('title')), 'h5', **{'padding-block-start': 6})),
            ('text', small(p_html(plain(b.get('text'))))),
            ('link', button(b.get('link_label') or 'Bekijk', b.get('link') or '', 'button-unstyled'))],
            pad=16, gap=10, height='fill')))
    options = section('section', 'Wat kunnen we bedrukken', [
        ('heading', heading_block(2, s.get('options_heading') or 'Wat kunnen we bedrukken?')),
        ('options', row(opts, gap=16, vertical_alignment='flex-start'))],
        content_direction='column', gap=24, section_width='page-width',
        **{'padding-block-start': 24, 'padding-block-end': 56})

    specs = section('section', 'Logo aanleveren', [
        ('content', group([
            ('heading', heading_block(2, s.get('specs_heading') or 'Zo lever je je logo aan')),
            ('specs', checklist(lines(s.get('specs')))),
            ('note', card([('icon', icon('check_box', 20, INKT)),
                           ('text', small(p_html(ours.t('product.print_note', 'Eerst je akkoord, dan drukken we.')),
                                          color=INKT))],
                          bg=WIT, pad=14, gap=10, content_direction='row', vertical_on_mobile=False,
                          horizontal_alignment='flex-start', **{'padding-block-start': 14}))],
            gap=16, width='custom', custom_width=50, width_mobile='fill')),
        ('form', form_card(s.get('form_heading') or 'Vraag over bedrukken?', s.get('form_text'),
                           'Zet erbij om welk product en hoeveel stuks het gaat. Heb je je logo al? Plak een link '
                           '(WeTransfer, Drive, Dropbox) of mail het na je bericht.',
                           ours.t('forms.send', 'Verstuur'), width=44))],
        content_direction='row', vertical_on_mobile=True, horizontal_alignment='space-between',
        vertical_alignment='flex-start', gap=48, section_width='page-width', background_color=P_LINNEN,
        **{'padding-block-start': 56, 'padding-block-end': 56})
    return [('hero', hero), ('steps', how), ('options', options), ('specs', specs)]


def garantie_sections(s, items, ours, fixture):
    email = (fixture.get('shop') or {}).get('email') or ''
    warranties = [b for bt, b in items if bt == 'warranty']

    def wcard(i, b):
        return (f'warranty_{i}', card([('icon', icon(b.get('icon') or 'shield', 24, INKT)),
                                       ('title', heading_block(3, plain(b.get('title')), 'h6')),
                                       ('text', small(p_html(b.get('text')), color=INKT))],
                                      bg=LINNEN if b.get('style') == 'steen' else WIT, pad=20, gap=10, height='fill'))
    left = []
    if warranties:
        left.append(wcard(1, warranties[0]))
    if len(warranties) > 1:
        left.append(('more', row([wcard(i, b) for i, b in enumerate(warranties[1:], 2)], gap=12,
                                 vertical_alignment='flex-start')))
    steps = [(b.get('title'), b.get('text')) for bt, b in items if bt == 'step']
    if steps:
        left += [('steps_heading', heading_block(2, s.get('steps_heading') or 'Zo handelen we je klacht af', 'h4',
                                                 **{'padding-block-start': 16})),
                 ('steps', step_cards(steps, row_layout=False))]
    contact = [('heading', heading_block(2, ours.t('contact.info_title', 'Direct contact'), 'h5'))]
    if email:
        contact.append(('email', text(f'<p><a href="mailto:{email}">{email}</a></p>', 'rte')))
    if ours.settings.get('response_time'):
        contact.append(('note', small(p_html(ours.settings['response_time']))))
    left.append(('contact', card(contact, bg=LINNEN, pad=24, gap=8)))
    body = section('section', 'Garantie', [
        ('content', group(left, gap=12, width='custom', custom_width=56, width_mobile='fill')),
        ('form', form_card(ours.t('warranty.form_title', 'Meld je klacht'), ours.t('warranty.form_intro'),
                           'Zet je bestelnummer, het product en wat er aan de hand is in je bericht, en of je liever '
                           'herstel, een los onderdeel of vervanging wilt. Foto\'s? Plak een link of mail ze naar '
                           f'{email or "ons"}.', ours.t('warranty.submit', 'Versturen'), width=40))],
        content_direction='row', vertical_on_mobile=True, horizontal_alignment='space-between',
        vertical_alignment='flex-start', gap=40, section_width='page-width',
        **{'padding-block-start': 16, 'padding-block-end': 64})
    return [('intro', page_intro()), ('main', body)]


def contact_sections(s, ours, fixture):
    shop = fixture.get('shop') or {}
    email = shop.get('email') or ''
    info = [('heading', heading_block(2, ours.t('contact.info_title', 'Direct contact'), 'h5'))]
    if email:
        info.append(('email', row([('icon', icon('chat_bubble', 20, INKT)),
                                    ('text', text(f'<p><a href="mailto:{email}">{email}</a></p>', 'rte'))],
                                   gap=10, vertical_on_mobile=False)))
    hours = ours.settings.get('openingstijden')
    if hours:
        info.append(('hours', small('<p><strong>Openingstijden</strong><br>' + '<br>'.join(lines(hours)) + '</p>',
                                    color=INKT)))
    if s.get('faq_link'):
        info.append(('faq', text(f'<p><a href="{s["faq_link"].replace("shopify://pages/", "/pages/")}">'
                                 'Eerst even de veelgestelde vragen bekijken?</a></p>', 'custom',
                                 font='var(--font-body--family)', font_size='0.875rem', text_color=KIEZEL)))
    body = section('section', 'Contact', [
        ('form', form_card(ours.t('contact.title', 'Stel je vraag'), ours.settings.get('response_time'),
                           'Gaat het over een bestelling? Zet je bestelnummer in je bericht.',
                           ours.t('forms.send', 'Verstuur'), width=56)),
        ('info', card(info, bg=LINNEN, pad=28, gap=12, width='custom', custom_width=40, width_mobile='fill'))],
        content_direction='row', vertical_on_mobile=True, horizontal_alignment='space-between',
        vertical_alignment='flex-start', gap=32, section_width='page-width',
        **{'padding-block-start': 16, 'padding-block-end': 48})
    return [('intro', page_intro()), ('main', body)]


def collection_products(fixture, handle):
    col = next((c for c in fixture.get('collections', []) if c.get('handle') == handle), None)
    prods = fixture.get('products', [])
    if not col:
        return []
    if isinstance(col.get('products'), list):
        by = {p['handle']: p for p in prods}
        return [by[h] for h in col['products'] if h in by]
    rules = col.get('rules') or []

    def ok(p, r):
        v = {'type': p.get('product_type'), 'title': p.get('title'), 'vendor': p.get('vendor')}.get(r.get('column'))
        c = r.get('condition') or ''
        if r.get('column') == 'tag':
            return c in (p.get('tags') or [])
        v = v or ''
        return {'equals': v == c, 'contains': c.lower() in v.lower(), 'starts_with': v.startswith(c)}.get(
            r.get('relation'), False)
    test = any if col.get('disjunctive') else all
    return [p for p in prods if rules and test(ok(p, r) for r in rules)]


def metafield(p, key):
    m = next((m for m in p.get('metafields', []) if m.get('key') == key), None)
    if not m:
        return None
    v = m.get('value')
    if isinstance(v, str) and (m.get('type', '').startswith('list.') or m.get('type') == 'json'):
        try:
            return json.loads(v)
        except ValueError:
            return v
    return v


def comparison_sections(s, fixture):
    """Our comparison table reads custom.specificaties (JSON, not a dynamic source). The merchant types the two
    lines' specs into two cards side by side instead, from the same product data."""
    prods = [p for p in collection_products(fixture, s.get('collection') or 'easy-up-partytenten')
             if metafield(p, 'specificaties') and (not s.get('require_group', True) or metafield(p, 'vergelijk_groep'))]
    groups = {}
    for p in prods:
        groups.setdefault(metafield(p, 'vergelijk_groep') or '', []).append(p)
    pick = next((g for g in groups.values() if len(g) >= 2), prods)[:int(s.get('max') or 3)]
    if len(pick) < 2:
        return []
    cards = []
    for i, p in enumerate(pick, 1):
        img = next((im['src'] if isinstance(im, dict) else im for im in p.get('images', [])[:1]), '')
        specs, order = {}, []
        for r in metafield(p, 'specificaties') or []:
            g = r.get('groep') or ''
            if g not in specs:
                specs[g] = []
                order.append(g)
            specs[g].append(f"<li><strong>{r.get('label')}</strong>: {r.get('waarde')}</li>")
        inner = [('image', image(img, 'landscape', radius=8)),
                 ('title', heading_block(3, f"<a href=\"/products/{p['handle']}\">{p['title']}</a>", 'h5')),
                 ('spec', small(p_html(metafield(p, 'kenmerk_kort') or '')))]
        for j, g in enumerate(order, 1):
            inner.append((f'group_{j}', eyebrow(g, KIEZEL)))
            inner[-1][1]['settings']['padding-block-start'] = 8
            inner.append((f'specs_{j}', text('<ul>' + ''.join(specs[g]) + '</ul>', 'custom', font='var(--font-body--family)',
                                             font_size='0.875rem', line_height='normal')))
        inner.append(('button', button('Bekijk product', f"shopify://products/{p['handle']}", 'button-secondary')))
        cards.append((f'product_{i}', card(inner, pad=20, gap=8, height='fill')))
    head = group([('heading', heading_block(2, s.get('heading') or 'Vergelijk de uitvoeringen')),
                  ('text', small(p_html(s.get('text')), size='1rem'))], gap=8)
    return [('comparison', section('section', 'Vergelijking', [('head', head),
                                                               ('cards', row(cards, gap=16, vertical_alignment='flex-start'))],
                                   content_direction='column', gap=24, section_width='page-width',
                                   **{'padding-block-start': 48, 'padding-block-end': 64}))]


def handleidingen_sections(s, fixture):
    """Our manuals hub lists custom.downloads (file references, not a dynamic source). The merchant links the same
    PDFs from Files in one card per product type."""
    by_type, order = {}, []
    for p in fixture.get('products', []):
        files_ = metafield(p, 'downloads') or []
        if not files_:
            continue
        t = p.get('product_type') or 'Overig'
        if t not in by_type:
            by_type[t] = []
            order.append(t)
        for f in files_:
            by_type[t].append(f'<li><a href="/cdn/images/{f}" target="_blank">Productblad {p["title"]}</a> (pdf)</li>')
    secs = []
    cards = []
    for i, t in enumerate(sorted(order, key=lambda x: (-len(by_type[x]), x)), 1):
        n = len(by_type[t])
        cards.append((f'type_{i}', card([
            ('head', group([('title', heading_block(2, t, 'h5')),
                            ('count', small(f'<p>{n} productblad{"en" if n != 1 else ""}</p>'))],
                           gap=4, width='custom', custom_width=28, width_mobile='fill')),
            ('links', text('<ul>' + ''.join(by_type[t]) + '</ul>', 'rte', width='100%'))],
            pad=24, gap=24, content_direction='row', vertical_on_mobile=True, horizontal_alignment='flex-start',
            vertical_alignment='flex-start')))
    if cards:
        secs.append(('manuals', section('section', 'Productbladen', cards, content_direction='column', gap=12,
                                        section_width='page-width', **{'padding-block-start': 16, 'padding-block-end': 32})))
    help_ = card([('heading', heading_block(2, s.get('help_heading') or 'Handleiding kwijt?', 'h4')),
                  ('text', small(p_html(s.get('help_text')), size='1rem', color=INKT)),
                  ('button', button(s.get('help_label') or 'Neem contact op', s.get('help_link') or 'shopify://pages/contact'))],
                 bg=LINNEN, pad=28, gap=12)
    secs.append(('help', section('section', 'Hulp', [('help', help_)], content_direction='column',
                                 section_width='page-width', **{'padding-block-start': 16, 'padding-block-end': 64})))
    return [('intro', page_intro())] + secs


def build_page(rel, ours, files, fixture):
    """Horizon page template for one of our page.<suffix>.json templates, or None when nothing maps."""
    secs, order = {}, []

    def add(pairs):
        for key, sec in pairs:
            sid = re.sub(r'[^a-z0-9_]', '_', key.lower())
            while sid in secs:
                sid += '_2'
            secs[sid] = sec
            order.append(sid)
    for key, typ, s, items in ours.template(rel):
        if typ == 'page-zakelijk':
            add(zakelijk_sections(s, items, ours))
        elif typ == 'page-offerte':
            add(offerte_sections(s, items, ours))
        elif typ == 'page-bedrukken':
            add(bedrukken_sections(s, items, ours, files, fixture))
        elif typ == 'page-garantie':
            add(garantie_sections(s, items, ours, fixture))
        elif typ == 'page-contact':
            add(contact_sections(s, ours, fixture))
        elif typ == 'main-handleidingen':
            add(handleidingen_sections(s, fixture))
        elif typ == 'main-page':
            add([('intro', page_intro(narrow=bool(s.get('narrow')) or 'vergelijking' in rel, pad_end=24))])
        elif typ == 'product-comparison':
            add(comparison_sections(s, fixture))
        elif typ == 'image-with-text':
            sec = home_image_text(s, items, files, fixture, bg=None)
            if sec:
                sec['settings'].pop('background_color', None)
                add([(key, sec)])
        elif typ == 'featured-collection':
            add([(key, home_products(s, fixture, s.get('heading') or 'Producten'))])
        elif typ == 'faq':
            add([(key, home_faq(s, items))])
        elif typ == 'rich-text' and (s.get('heading') or s.get('text')):
            add([(key, section('section', 'Tekst', [('heading', heading_block(2, s.get('heading', ''))),
                                                    ('text', text(p_html(s.get('text')), 'rte'))],
                               section_width='page-width', **{'padding-block-start': 48, 'padding-block-end': 48}))])
    if not order:
        return None
    return {'sections': secs, 'order': order}


# ---------------------------------------------------------------- builders: product / collection
def build_product(data):
    usps = {'type': 'text', 'settings': {
        'text': '{{ closest.product.metafields.custom.usps | metafield_tag }}', 'type_preset': 'rte', 'width': '100%'}}

    def acc_row(heading, html, open_=False, icon_=None):
        r = {'type': '_accordion-row', 'settings': {'heading': heading, 'open_by_default': open_,
                                                    'icon': icon_ or 'none', 'width': 20}}
        r.update(blocks(('text', text(html, 'rte'))))
        return r

    acc = {'type': 'accordion', 'settings': {'icon': 'plus', 'dividers': True, 'divider_color': P_LIJN, 'type_preset': 'h6'}}
    in_box = {'type': '_accordion-row', 'settings': {'heading': 'Wat zit erin', 'open_by_default': False,
                                                     'icon': 'box', 'width': 20}}
    in_box.update(blocks(
        ('included', text('{{ closest.product.metafields.custom.included | metafield_tag }}', 'rte')),
        ('excluded', text('{{ closest.product.metafields.custom.excluded | metafield_tag }}', 'custom',
                          font='var(--font-body--family)', font_size='0.875rem', text_color=KIEZEL))))
    acc.update(blocks(
        ('description', acc_row('Productinformatie', '{{ closest.product.description }}', True)),
        ('in_box', in_box),
        ('delivery', acc_row('Levering en retour',
                             '<p>Op werkdagen vóór 14:00 besteld en uit voorraad: vandaag verzonden. Grote tenten komen per pallet, '
                             'op afspraak.</p><p>Alles over <a href="/pages/verzenden-en-bezorgen">verzenden en bezorgen</a> en '
                             '<a href="/pages/retourneren">retourneren</a>.</p>', icon_='truck')),
        ('zakelijk', acc_row('Zakelijk bestellen',
                             '<p>Bestel je voor je bedrijf, club of school? Je kunt op factuur bestellen en vanaf 10 stuks maken we '
                             'een offerte op maat.</p><p><a href="/pages/offerte">Offerte aanvragen</a> · '
                             '<a href="/pages/zakelijk">Meer over zakelijk</a></p>', icon_='clipboard')),
    ))
    buy = {'type': 'buy-buttons', 'settings': {'stacking': False, 'show_pickup_availability': False, 'gift_card_form': True}}
    buy.update(blocks(('quantity', {'type': 'quantity', 'static': True, 'settings': {'border_radius': 8}}),
                      ('add-to-cart', {'type': 'add-to-cart', 'static': True, 'settings': {'style_class': 'button'}}),
                      # hidden in the editor: one buy button per screen (brand rule), no second "Nu kopen"
                      ('accelerated-checkout', {'type': 'accelerated-checkout', 'static': True, 'disabled': True,
                                                'settings': {}})))
    buy['block_order'] = []
    details = {'type': '_product-details', 'static': True, 'settings': {
        'width': 'fill', 'height': 'fit', 'details_position': 'flex-start', 'gap': 20, 'sticky_details_desktop': True,
        'padding-block-start': 8, 'padding-block-end': 24}}
    details.update(blocks(
        ('header', group([
            ('type', eyebrow('{{ closest.product.type }}', KIEZEL)),
            ('title', text('<h1>{{ closest.product.title }}</h1>', 'h2', wrap='balance')),
            ('spec', small('<p>{{ closest.product.metafields.custom.kenmerk_kort }}</p>', size='1rem')),
            ('price', {'type': 'price', 'settings': {'show_sale_price_first': True, 'show_installments': False,
                                                     'show_tax_info': True, 'type_preset': 'h3', 'width': '100%',
                                                     'padding-block-start': 8}}),
        ], gap=6)),
        ('variant_picker', {'type': 'variant-picker', 'settings': {'variant_style': 'buttons', 'show_swatches': True,
                                                                   'alignment': 'left', 'padding-block-end': 0}}),
        ('inventory', {'type': 'product-inventory', 'settings': {'inventory_threshold': 5, 'show_inventory_quantity': False}}),
        ('buy_buttons', buy),
        ('usps', usps),
        ('accordion', acc),
    ))
    gallery = {'type': '_product-media-gallery', 'static': True, 'settings': {
        'media_presentation': 'carousel', 'media_columns': 'one', 'image_gap': 8, 'large_first_image': False,
        'icons_style': 'arrow', 'slideshow_controls_style': 'thumbnails', 'slideshow_mobile_controls_style': 'counter',
        'thumbnail_position': 'bottom', 'thumbnail_width': 64, 'thumbnail_radius': 8, 'aspect_ratio': '1',
        'constrain_to_viewport': True, 'media_fit': 'cover', 'media_radius': 12, 'extend_media': False, 'zoom': True,
        'hide_variants': False}}
    main = {'type': 'product-information', 'settings': {
        'content_width': 'content-center-aligned', 'desktop_media_position': 'left', 'equal_columns': True,
        'limit_details_width': False, 'gap': 48, 'enable_sticky_add_to_cart': True,
        'padding-block-start': 24, 'padding-block-end': 24}}
    main.update(blocks(('media-gallery', gallery), ('product-details', details)))
    main['block_order'] = []

    def recs(kind, heading, n):
        sec = {'type': 'product-recommendations', 'settings': {
            'product': '{{ closest.product }}', 'recommendation_type': kind, 'layout_type': 'grid',
            'carousel_on_mobile': True, 'max_products': n, 'columns': 4, 'mobile_columns': '2', 'columns_gap': 16,
            'rows_gap': 24, 'section_width': 'page-width', 'gap': 24, 'padding-block-start': 48, 'padding-block-end': 48}}
        sec.update(blocks(('heading', text(f'<h2>{heading}</h2>', 'h3')), ('static-product-card', product_card())))
        sec['block_order'] = ['heading']
        return sec

    data['sections'] = {'main': main,
                        'complementary': recs('complementary', 'Maak het compleet', 4),
                        'related': recs('related', 'Misschien ook interessant', 4)}
    data['order'] = ['main', 'complementary', 'related']
    return data


def build_collection(data):
    header = section('section', 'Collectiekop', [
        ('title', text('<h1>{{ closest.collection.title }}</h1>', 'h1', wrap='balance')),
        ('description', text('{{ closest.collection.description }}', 'rte', max_width='narrow')),
    ], content_direction='column', gap=12, section_width='page-width', **{'padding-block-start': 32, 'padding-block-end': 16})
    main = {'type': 'main-collection', 'settings': {
        'layout_type': 'grid', 'product_card_size': 'medium', 'mobile_product_card_size': 'small',
        'enable_infinite_scroll': True, 'products_per_page': 24, 'product_grid_width': 'centered',
        'full_width_on_mobile': False, 'columns_gap_horizontal': 16, 'columns_gap_vertical': 32,
        'padding-block-start': 0, 'padding-block-end': 48}}
    main.update(blocks(
        ('filters', {'type': 'filters', 'static': True, 'settings': {
            'enable_filtering': True, 'filter_style': 'vertical', 'filter_width': 'centered', 'text_label_case': 'default',
            'show_swatch_label': True, 'show_filter_label': False, 'enable_sorting': True, 'enable_grid_density': True,
            'padding-block-start': 8, 'padding-block-end': 8}}),
        ('product-card', product_card()),
    ))
    main['block_order'] = []
    data['sections'] = {'section': header, 'main': main}
    data['order'] = ['section', 'main']
    return data


def build_search(data):
    """Search results get the collection page's product card (spec line, swatches) and the same mobile margins."""
    data = style_cards(translate(data))
    for sec in (data.get('sections') or {}).values():
        if sec.get('type') == 'search-results':
            sec['settings'].update({'full_width_on_mobile': False, 'columns_gap_horizontal': 16,
                                    'columns_gap_vertical': 32})
            for key, b in list((sec.get('blocks') or {}).items()):
                if b.get('type') == '_product-card':
                    sec['blocks'][key] = product_card()
                elif b.get('type') == 'filters':
                    b['settings']['filter_style'] = 'vertical'
    return data


def style_cards(data):
    """Same product card look everywhere a template has one (search, cart, 404)."""
    def fn(b):
        if b['type'] == '_product-card-gallery':
            b['settings'].update({'image_ratio': 'square', 'border_radius': 12})
        elif b['type'] == 'product-title':
            b['settings'].update({'type_preset': 'custom', 'font': 'var(--font-subheading--family)', 'font_size': '1rem'})
        elif b['type'] == 'price':
            b['settings'].update({'type_preset': 'custom', 'font': 'var(--font-accent--family)', 'font_size': '1.125rem'})
        elif b['type'] == 'filters':
            b['settings'].update({'enable_filtering': True, 'show_swatch_label': True})
        elif b['type'] == '_cart-products':
            b['settings'].update({'image_ratio': 'square', 'border_radius': 8})
        elif b['type'] == '_collection-card-image':
            b['settings'].update({'image_ratio': 'square', 'border_radius': 12})
        elif b['type'] == '_blog-post-image':
            b['settings'].update({'border_radius': 12})
    walk_blocks(data, fn)
    return data


# ---------------------------------------------------------------- locale
def build_locale(horizon):
    path = os.path.join(horizon, 'locales', 'nl.json')
    if not os.path.exists(path):
        return None
    nl = load(path)

    def walk(node, prefix=''):
        for k, v in node.items():
            key = f'{prefix}.{k}' if prefix else k
            if isinstance(v, dict):
                walk(v, key)
            elif isinstance(v, str) and re.search(r'(tax|dut)', k) and prefix == 'content':
                node[k] = tax_copy(v)
            elif isinstance(v, str) and 'checkout' in v and prefix.startswith('content'):
                node[k] = v.replace('bij de checkout', 'bij het afrekenen')
    walk(nl)
    for dotted, value in LOCALE_OVERRIDES.items():
        node = nl
        parts = dotted.split('.')
        for p in parts[:-1]:
            node = node.setdefault(p, {})
        node[parts[-1]] = value
    return nl


# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--horizon', required=True)
    ap.add_argument('--data', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--images', help='images dir of the fixture (default: <data dir>/images)')
    a = ap.parse_args()

    fixture = json.load(open(a.data, encoding='utf-8'))
    images_dir = a.images or os.path.join(os.path.dirname(os.path.abspath(a.data)), 'images')
    files = Files(images_dir)
    ours = Ours()

    for rel in FILES:
        src = os.path.join(a.horizon, rel)
        if not os.path.exists(src):
            continue
        data = load(src)
        if rel == 'config/settings_data.json':
            data = build_settings(data, files)
        elif rel == 'sections/header-group.json':
            data = build_header(data, ours)
        elif rel == 'sections/footer-group.json':
            data = build_footer(data, ours, fixture)
        elif rel == 'templates/index.json':
            data = build_index(data, ours, files, fixture)
        elif rel == 'templates/product.json':
            data = build_product(data)
        elif rel == 'templates/collection.json':
            data = build_collection(data)
        elif rel == 'templates/search.json':
            data = build_search(data)
        else:
            data = style_cards(translate(data))
        if rel == 'templates/cart.json':
            def cart_title(b):
                if b['type'] == '_cart-title':
                    b['settings']['title'] = 'Je winkelwagen'
            walk_blocks(data, cart_title)

        out = os.path.join(a.out, rel)
        os.makedirs(os.path.dirname(out), exist_ok=True)
        with open(out, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    # every page template of ours with a suffix (zakelijk, offerte, ...) gets a Horizon one with the same suffix
    written = list(FILES)
    for name in sorted(os.listdir(os.path.join(OURS, 'templates'))):
        m = re.fullmatch(r'page\.([a-z0-9_-]+)\.json', name)
        if not m:
            continue
        rel = f'templates/{name}'
        data = build_page(rel, ours, files, fixture)
        if data is None:
            continue
        out = os.path.join(a.out, rel)
        os.makedirs(os.path.dirname(out), exist_ok=True)
        with open(out, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        if rel not in written:
            written.append(rel)
    for name in os.listdir(os.path.join(a.out, 'templates')):   # templates of pages our theme no longer has
        rel = f'templates/{name}'
        if name.startswith('page.') and rel not in written:
            os.remove(os.path.join(a.out, rel))

    nl = build_locale(a.horizon)
    if nl is not None:
        out = os.path.join(a.out, 'locales', 'nl.json')
        os.makedirs(os.path.dirname(out), exist_ok=True)
        with open(out, 'w', encoding='utf-8') as f:
            json.dump(nl, f, ensure_ascii=False, indent=2)

    # report English strings that are still left (new Horizon versions add demo copy)
    left = []
    for rel in written:
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
    print(f'merchant overlay written to {a.out}' + (f" ({'; '.join(files.notes)})" if files.notes else ''))
    for l in left:
        print(f'  still English? {l}', file=sys.stderr)


if __name__ == '__main__':
    main()
