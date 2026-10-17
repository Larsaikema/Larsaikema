#!/usr/bin/env python3
"""Generates tools/preview/fixtures/sample.json + clearly-labelled placeholder images.

The images are flat illustrations stamped "VOORBEELD / placeholder render" so nobody mistakes
them for product photography. The JSON follows tools/preview/FIXTURE_SCHEMA.md.

Usage: python3 tools/preview/fixtures/make_sample.py   (also runs extend_sample.py)
"""
import json
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
IMG_DIR = os.path.join(HERE, "images")
FONT = os.environ.get(
    "PREVIEW_FONT",
    "/tmp/claude-0/-home-user-Larsaikema/d03b1b71-234c-55f6-a22b-89a9ff74abc4/scratchpad/vendor/gfonts/ofl/inter/Inter[opsz,wght].ttf",
)
os.makedirs(IMG_DIR, exist_ok=True)


def font(size, weight=600):
    try:
        f = ImageFont.truetype(FONT, size)
        try:
            f.set_variation_by_axes([14, weight])
        except Exception:
            pass
        return f
    except Exception:
        return ImageFont.load_default()


def shade(hex_color, factor):
    hex_color = hex_color.lstrip("#")
    r, g, b = (int(hex_color[i : i + 2], 16) for i in (0, 2, 4))
    if factor < 1:
        r, g, b = (int(c * factor) for c in (r, g, b))
    else:
        r, g, b = (int(c + (255 - c) * (factor - 1)) for c in (r, g, b))
    return (max(0, min(255, r)), max(0, min(255, g)), max(0, min(255, b)))


def canvas(w=1200, h=1200, bg="#F2F1EE"):
    img = Image.new("RGB", (w, h), bg)
    d = ImageDraw.Draw(img)
    # floor
    d.rectangle([0, int(h * 0.78), w, h], fill=shade(bg, 0.93))
    return img, d


def stamp(img, d, label):
    w, h = img.size
    d.rounded_rectangle([40, 40, 470, 112], radius=18, fill=(255, 255, 255), outline=(30, 30, 30), width=3)
    d.text((64, 52), "VOORBEELD", font=font(30, 800), fill=(20, 20, 20))
    d.text((64, 84), "placeholder render", font=font(20, 500), fill=(90, 90, 90))
    tw = d.textlength(label, font=font(40, 700))
    d.text(((w - tw) / 2, h - 110), label, font=font(40, 700), fill=(40, 40, 40))


def tent(name, color, label, width_factor=1.0, walls=False):
    img, d = canvas()
    w, h = img.size
    cx = w / 2
    half = 330 * width_factor
    top = 300
    eave = 470
    ground = int(h * 0.80)
    roof = [(cx - half - 40, eave), (cx - half * 0.15, top), (cx + half * 0.15, top), (cx + half + 40, eave)]
    d.polygon(roof, fill=color, outline=shade(color, 0.6))
    d.rectangle([cx - half - 40, eave, cx + half + 40, eave + 46], fill=shade(color, 0.85))
    # valance scallops
    step = (2 * half + 80) / 10
    for i in range(10):
        x0 = cx - half - 40 + i * step
        d.pieslice([x0, eave + 20, x0 + step, eave + 70], 0, 180, fill=shade(color, 0.85))
    legc = (90, 90, 95)
    for x in (cx - half, cx + half):
        d.rectangle([x - 10, eave + 46, x + 10, ground], fill=legc)
        d.rectangle([x - 34, ground - 6, x + 34, ground + 8], fill=(60, 60, 60))
    if walls:
        d.rectangle([cx - half + 10, eave + 60, cx + half - 10, ground], fill=shade(color, 0.95), outline=shade(color, 0.7))
        for i in range(3):
            x0 = cx - half + 60 + i * (2 * half - 120) / 3
            d.rounded_rectangle([x0, eave + 130, x0 + 120, eave + 260], radius=8, fill=(205, 222, 235))
    stamp(img, d, label)
    img.save(os.path.join(IMG_DIR, name), optimize=True)


def stretchtent(name, color, label):
    img, d = canvas(bg="#E9EEF2")
    w, h = img.size
    ground = int(h * 0.80)
    d.polygon([(110, ground), (330, 380), (600, 300), (870, 380), (1090, ground), (850, 560), (600, 600), (350, 560)], fill=color, outline=shade(color, 0.7))
    for x, y in ((330, 380), (600, 300), (870, 380)):
        d.rectangle([x - 6, y, x + 6, ground], fill=(150, 120, 80))
    stamp(img, d, label)
    img.save(os.path.join(IMG_DIR, name), optimize=True)


def statafel(name, label, skirt=None, bow=False, top_d=1.0):
    img, d = canvas()
    w, h = img.size
    cx = w / 2
    ground = int(h * 0.80)
    rx = 250 * top_d
    top_y = 330
    if skirt:
        d.polygon([(cx - rx, top_y + 20), (cx + rx, top_y + 20), (cx + 140, ground - 40), (cx - 140, ground - 40)], fill=skirt)
        d.polygon([(cx - 140, ground - 40), (cx + 140, ground - 40), (cx + 230, ground), (cx - 230, ground)], fill=shade(skirt, 0.9))
        d.ellipse([cx - rx, top_y - 30, cx + rx, top_y + 50], fill=shade(skirt, 1.12), outline=shade(skirt, 0.7))
        if bow:
            d.rectangle([cx - 150, ground - 260, cx + 150, ground - 225], fill=shade(skirt, 0.65))
            d.polygon([(cx, ground - 242), (cx - 70, ground - 290), (cx - 70, ground - 195)], fill=shade(skirt, 0.55))
            d.polygon([(cx, ground - 242), (cx + 70, ground - 290), (cx + 70, ground - 195)], fill=shade(skirt, 0.55))
    else:
        d.ellipse([cx - rx, top_y - 30, cx + rx, top_y + 50], fill=(196, 160, 112), outline=(140, 110, 70), width=3)
        d.rectangle([cx - 14, top_y + 40, cx + 14, ground - 30], fill=(80, 80, 85))
        d.polygon([(cx - 14, ground - 30), (cx + 14, ground - 30), (cx + 200, ground), (cx - 200, ground)], fill=(70, 70, 75))
    stamp(img, d, label)
    img.save(os.path.join(IMG_DIR, name), optimize=True)


def simple_object(name, label, kind):
    img, d = canvas(bg="#EFEDE8")
    w, h = img.size
    cx = w / 2
    ground = int(h * 0.80)
    if kind == "weights":
        for i, x in enumerate((cx - 330, cx - 110, cx + 110, cx + 330)):
            d.rounded_rectangle([x - 90, ground - 170, x + 90, ground], radius=24, fill=(52, 58, 64))
            d.ellipse([x - 40, ground - 210, x + 40, ground - 150], outline=(30, 30, 30), width=10)
            d.text((x - 40, ground - 110), "10kg", font=font(34, 700), fill=(230, 230, 230))
    elif kind == "lights":
        d.line([(80, 360), (300, 470), (600, 420), (900, 480), (1120, 380)], fill=(40, 40, 40), width=6)
        for x, y in ((180, 410), (300, 470), (450, 445), (600, 420), (750, 450), (900, 480), (1030, 420)):
            d.line([(x, y), (x, y + 40)], fill=(40, 40, 40), width=4)
            d.ellipse([x - 30, y + 40, x + 30, y + 110], fill=(255, 214, 102), outline=(200, 150, 40), width=3)
    elif kind == "package":
        for i, x in enumerate((cx - 330, cx - 110, cx + 110, cx + 330)):
            d.ellipse([x - 95, 420, x + 95, 460], fill=(30, 30, 30))
            d.polygon([(x - 95, 440), (x + 95, 440), (x + 60, ground), (x - 60, ground)], fill=(30, 30, 30))
        d.rounded_rectangle([cx - 210, 200, cx + 210, 300], radius=50, fill=(214, 64, 58))
        d.text((cx - 150, 222), "4 + 4 deal", font=font(48, 800), fill=(255, 255, 255))
    elif kind == "cloth":
        d.rectangle([cx - 380, 360, cx + 380, 420], fill=(250, 250, 250), outline=(180, 180, 180))
        d.polygon([(cx - 380, 420), (cx + 380, 420), (cx + 420, 640), (cx - 420, 640)], fill=(244, 244, 244), outline=(190, 190, 190))
        for x in (cx - 300, cx + 300):
            d.rectangle([x - 12, 640, x + 12, ground], fill=(110, 90, 70))
    elif kind == "print":
        tent_color = (36, 99, 235)
        d.polygon([(220, 470), (500, 300), (700, 300), (980, 470)], fill=tent_color)
        d.rectangle([220, 470, 980, 530], fill=(255, 255, 255))
        d.text((420, 478), "JOUW LOGO", font=font(44, 800), fill=tent_color)
        for x in (260, 940):
            d.rectangle([x - 10, 530, x + 10, ground], fill=(90, 90, 95))
    stamp(img, d, label)
    img.save(os.path.join(IMG_DIR, name), optimize=True)


def banner(name, label, color, w=2400, h=1200):
    img = Image.new("RGB", (w, h), color)
    d = ImageDraw.Draw(img)
    for i in range(6):
        d.ellipse([w * 0.55 + i * 60, -200 + i * 90, w * 1.1 + i * 60, h * 0.7 + i * 90], outline=shade(color, 1.15), width=8)
    d.rounded_rectangle([60, 60, 600, 150], radius=22, fill=(255, 255, 255))
    d.text((90, 78), "VOORBEELD · placeholder", font=font(40, 800), fill=(20, 20, 20))
    d.text((90, h - 220), label, font=font(96, 800), fill=(255, 255, 255))
    img.save(os.path.join(IMG_DIR, name), optimize=True)


def logo(name):
    img = Image.new("RGBA", (600, 160), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 20, 120, 140], radius=26, fill=(23, 23, 23, 255))
    d.polygon([(22, 100), (60, 46), (98, 100)], fill=(255, 255, 255, 255))
    d.text((140, 38), "Voorbeeld", font=font(72, 800), fill=(23, 23, 23, 255))
    img.save(os.path.join(IMG_DIR, name), optimize=True)


TENT_COLORS = [("Wit", "#F7F7F5"), ("Zwart", "#1E1E1E"), ("Rood", "#C8302C"), ("Blauw", "#1F4FA3")]
ROK_COLORS = [
    ("Wit", "#FAFAFA"), ("Zwart", "#151515"), ("Antraciet", "#3B3F45"), ("Rood", "#C0262D"),
    ("Koningsblauw", "#2350C2"), ("Navy", "#1B2A4A"), ("Champagne", "#E8D9B5"), ("Fuchsia", "#D1287A"),
]


def slug(s):
    return s.lower().replace(" ", "-").replace("ø", "o")


def main():
    # ---------- images ----------
    for cname, hexc in TENT_COLORS:
        tent(f"easy-up-premium-{slug(cname)}.png", hexc, f"Easy-up partytent · {cname}")
    tent("easy-up-professional-3x6.png", "#F7F7F5", "Easy-up Professional 3x6", width_factor=1.25)
    tent("zijwand-raam.png", "#F7F7F5", "Zijwand met ramen", walls=True)
    stretchtent("stretchtent-10x15.png", "#D9C7A7", "Stretchtent 10x15")
    statafel("statafel-o80.png", "Statafel Ø80")
    for cname, hexc in ROK_COLORS:
        statafel(f"statafelrok-stretch-{slug(cname)}.png", f"Statafelrok stretch · {cname}", skirt=hexc)
    statafel("statafelrok-strik-wit.png", "Statafelrok met strik · Wit", skirt="#FAFAFA", bow=True)
    statafel("statafelrok-strik-zwart.png", "Statafelrok met strik · Zwart", skirt="#151515", bow=True)
    simple_object("gewichten-set.png", "Gewichtenset 4 x 10 kg", "weights")
    simple_object("prikkabel-led.png", "LED-prikkabel 10 m", "lights")
    simple_object("actiepakket-4-statafels.png", "Actiepakket 4 statafels + 4 rokken", "package")
    simple_object("tafelkleed-rond.png", "Tafelkleed biertafel", "cloth")
    simple_object("bedrukte-partytent.png", "Bedrukte partytent", "print")
    banner("banner-partytenten.png", "Partytenten", "#1F4FA3")
    banner("banner-statafels.png", "Statafels & rokken", "#2E3A2F")
    banner("banner-accessoires.png", "Accessoires", "#8A5A2B")
    banner("blog-opbouwen.png", "Partytent opbouwen", "#35506B", 1600, 1000)
    banner("blog-statafel-kiezen.png", "Statafel kiezen", "#5B3B5E", 1600, 1000)
    banner("blog-onderhoud.png", "Onderhoud & opslag", "#3E5F44", 1600, 1000)
    logo("logo-voorbeeldwinkel.png")

    # ---------- products ----------
    products = []

    tent_variants = []
    sizes = [("3x3", 24900, 29900, 18.0), ("3x4,5", 32900, 37900, 24.0), ("3x6", 39900, 44900, 29.0)]
    for si, (size, price, cap, weight) in enumerate(sizes):
        for ci, (cname, _) in enumerate(TENT_COLORS):
            inv = 0 if (size == "3x6" and cname == "Blauw") else 8 + si * 3 + ci
            tent_variants.append({
                "sku": f"EUP-{size.replace(',', '')}-{cname[:3].upper()}",
                "option1": size, "option2": cname,
                "price": price, "compare_at_price": cap,
                "inventory_quantity": inv, "inventory_management": "shopify", "inventory_policy": "deny",
                "weight": weight, "weight_unit": "kg", "requires_shipping": True, "taxable": True,
                "image": f"easy-up-premium-{slug(cname)}.png",
            })
    products.append({
        "handle": "easy-up-partytent-premium",
        "title": "Easy-up partytent Premium",
        "body_html": "<p>Een stevige easy-up partytent die je in twee minuten met twee personen opzet. Aluminium frame van 40 mm, waterdicht dak van 300 g/m² polyester en een handige draagtas met wielen.</p><ul><li>Opzettijd: ca. 2 minuten</li><li>Frame: zeskant aluminium 40 mm</li><li>Dak: 300 g/m² PVC-gecoat polyester, waterdicht</li><li>Inclusief draagtas, haringen en scheerlijnen</li></ul>",
        "vendor": "Voorbeeldwinkel", "product_type": "Partytent",
        "tags": ["easy-up", "partytent", "premium", "waterdicht"],
        "created_at": "2026-03-02T10:00:00+01:00", "published_at": "2026-03-02T10:00:00+01:00",
        "seo": {"title": "Easy-up partytent Premium kopen", "description": "Professionele easy-up partytent in 3x3, 3x4,5 en 3x6 meter."},
        "options": [
            {"name": "Maat", "values": [{"name": s[0]} for s in sizes]},
            {"name": "Kleur", "values": [{"name": c, "swatch": {"color": h}} for c, h in TENT_COLORS]},
        ],
        "variants": tent_variants,
        "images": [{"src": f"easy-up-premium-{slug(c)}.png", "alt": f"Easy-up partytent Premium in {c.lower()}"} for c, _ in TENT_COLORS],
        "metafields": [
            {"namespace": "custom", "key": "materiaal", "type": "single_line_text_field", "value": "Aluminium frame, polyester dak"},
            {"namespace": "custom", "key": "opzettijd_minuten", "type": "number_integer", "value": "2"},
            {"namespace": "custom", "key": "waterdicht", "type": "boolean", "value": "true"},
            {"namespace": "custom", "key": "usps", "type": "list.single_line_text_field", "value": "[\"In 2 minuten opgezet\",\"Waterdicht dak\",\"Inclusief draagtas met wielen\"]"},
            {"namespace": "custom", "key": "handleiding", "type": "url", "value": "https://example.com/handleiding-easy-up.pdf"},
        ],
    })

    products.append({
        "handle": "easy-up-partytent-professional-3x6",
        "title": "Easy-up partytent Professional 3x6",
        "body_html": "<p>De Professional is gebouwd voor intensief gebruik: dikker frame, versterkte hoekverbindingen en een brandvertragend dak.</p>",
        "vendor": "Voorbeeldwinkel", "product_type": "Partytent",
        "tags": ["easy-up", "partytent", "professional", "brandvertragend"],
        "created_at": "2026-04-10T10:00:00+02:00", "published_at": "2026-04-10T10:00:00+02:00",
        "options": [{"name": "Kleur", "values": [{"name": "Wit", "swatch": {"color": "#F7F7F5"}}, {"name": "Zwart", "swatch": {"color": "#1E1E1E"}}]}],
        "variants": [
            {"sku": "EUPRO-36-WIT", "option1": "Wit", "price": 59900, "compare_at_price": 69900, "inventory_quantity": 5, "inventory_management": "shopify", "inventory_policy": "deny", "weight": 42, "weight_unit": "kg"},
            {"sku": "EUPRO-36-ZWA", "option1": "Zwart", "price": 59900, "compare_at_price": 69900, "inventory_quantity": 2, "inventory_management": "shopify", "inventory_policy": "deny", "weight": 42, "weight_unit": "kg"},
        ],
        "images": [{"src": "easy-up-professional-3x6.png", "alt": "Easy-up partytent Professional 3x6 meter"}],
        "metafields": [{"namespace": "custom", "key": "materiaal", "type": "single_line_text_field", "value": "Aluminium 50 mm, brandvertragend dak"}],
    })

    products.append({
        "handle": "stretchtent-10x15",
        "title": "Stretchtent 10 x 15 meter",
        "body_html": "<p>Een vrij vormbare stretchtent voor tuinfeesten, bruiloften en evenementen tot ca. 150 personen.</p>",
        "vendor": "Voorbeeldwinkel", "product_type": "Stretchtent",
        "tags": ["stretchtent", "evenement"],
        "created_at": "2026-02-01T10:00:00+01:00", "published_at": "2026-02-01T10:00:00+01:00",
        "options": [{"name": "Title", "values": [{"name": "Default Title"}]}],
        "variants": [{"sku": "STR-1015", "option1": "Default Title", "price": 249900, "inventory_quantity": 1, "inventory_management": "shopify", "inventory_policy": "continue", "weight": 95, "weight_unit": "kg"}],
        "images": [{"src": "stretchtent-10x15.png", "alt": "Stretchtent van 10 bij 15 meter in zandkleur"}],
    })

    products.append({
        "handle": "statafel-o80",
        "title": "Statafel Ø80 inklapbaar",
        "body_html": "<p>Inklapbare statafel met stevig blad van 18 mm multiplex en een stabiele kruisvoet. Hoogte 110 cm.</p>",
        "vendor": "Voorbeeldwinkel", "product_type": "Statafel",
        "tags": ["statafel", "inklapbaar", "horeca"],
        "created_at": "2026-01-15T10:00:00+01:00", "published_at": "2026-01-15T10:00:00+01:00",
        "options": [{"name": "Diameter", "values": [{"name": "Ø70"}, {"name": "Ø80"}, {"name": "Ø85"}]}],
        "variants": [
            {"sku": "STA-70", "option1": "Ø70", "price": 5995, "inventory_quantity": 40, "inventory_management": "shopify", "inventory_policy": "deny", "weight": 11, "weight_unit": "kg"},
            {"sku": "STA-80", "option1": "Ø80", "price": 6495, "inventory_quantity": 60, "inventory_management": "shopify", "inventory_policy": "deny", "weight": 12, "weight_unit": "kg"},
            {"sku": "STA-85", "option1": "Ø85", "price": 6995, "inventory_quantity": 0, "inventory_management": "shopify", "inventory_policy": "deny", "weight": 13, "weight_unit": "kg"},
        ],
        "images": [{"src": "statafel-o80.png", "alt": "Inklapbare statafel met rond blad"}],
        "metafields": [
            {"namespace": "custom", "key": "materiaal", "type": "single_line_text_field", "value": "Multiplex blad, stalen kruisvoet"},
            {"namespace": "custom", "key": "hoogte_cm", "type": "number_integer", "value": "110"},
        ],
    })

    products.append({
        "handle": "statafelrok-stretch",
        "title": "Statafelrok stretch",
        "body_html": "<p>Strak passende stretch statafelrok van kreukvrij Lycra. Past op statafels van Ø70 tot Ø85 cm en is wasbaar op 40 °C.</p>",
        "vendor": "Voorbeeldwinkel", "product_type": "Statafelrok",
        "tags": ["statafelrok", "stretch", "wasbaar"],
        "created_at": "2026-01-20T10:00:00+01:00", "published_at": "2026-01-20T10:00:00+01:00",
        "options": [{"name": "Kleur", "values": [{"name": c, "swatch": {"color": h}} for c, h in ROK_COLORS]}],
        "variants": [
            {"sku": f"ROK-STR-{c[:3].upper()}", "option1": c, "price": 1995, "compare_at_price": 2495 if c in ("Rood", "Fuchsia") else None,
             "inventory_quantity": 0 if c == "Champagne" else 25, "inventory_management": "shopify", "inventory_policy": "deny",
             "weight": 0.6, "weight_unit": "kg", "image": f"statafelrok-stretch-{slug(c)}.png"}
            for c, _ in ROK_COLORS
        ],
        "images": [{"src": f"statafelrok-stretch-{slug(c)}.png", "alt": f"Stretch statafelrok in {c.lower()}"} for c, _ in ROK_COLORS],
        "metafields": [{"namespace": "custom", "key": "materiaal", "type": "single_line_text_field", "value": "Lycra (polyester/elastaan)"}],
    })

    products.append({
        "handle": "statafelrok-met-strik",
        "title": "Statafelrok met strik",
        "body_html": "<p>Feestelijke statafelrok met satijnen strik. Kies je kleur en geef je feest direct een nette uitstraling.</p>",
        "vendor": "Voorbeeldwinkel", "product_type": "Statafelrok",
        "tags": ["statafelrok", "strik"],
        "created_at": "2026-05-05T10:00:00+02:00", "published_at": "2026-05-05T10:00:00+02:00",
        "options": [{"name": "Kleur", "values": [{"name": "Wit", "swatch": {"color": "#FAFAFA"}}, {"name": "Zwart", "swatch": {"color": "#151515"}}]}],
        "variants": [
            {"sku": "ROK-STRIK-WIT", "option1": "Wit", "price": 2495, "inventory_quantity": 12, "inventory_management": "shopify", "inventory_policy": "deny", "weight": 0.7, "weight_unit": "kg", "image": "statafelrok-strik-wit.png"},
            {"sku": "ROK-STRIK-ZWA", "option1": "Zwart", "price": 2495, "inventory_quantity": 9, "inventory_management": "shopify", "inventory_policy": "deny", "weight": 0.7, "weight_unit": "kg", "image": "statafelrok-strik-zwart.png"},
        ],
        "images": [{"src": "statafelrok-strik-wit.png", "alt": "Witte statafelrok met strik"}, {"src": "statafelrok-strik-zwart.png", "alt": "Zwarte statafelrok met strik"}],
    })

    products.append({
        "handle": "zijwand-3m",
        "title": "Zijwand 3 meter",
        "body_html": "<p>Zijwand voor easy-up partytenten van 3 meter breed. Met klittenband en ritssluiting snel te bevestigen.</p>",
        "vendor": "Voorbeeldwinkel", "product_type": "Onderdeel",
        "tags": ["zijwand", "onderdelen", "accessoire"],
        "created_at": "2026-03-12T10:00:00+01:00", "published_at": "2026-03-12T10:00:00+01:00",
        "options": [
            {"name": "Type", "values": [{"name": "Dicht"}, {"name": "Met ramen"}, {"name": "Met deur"}]},
            {"name": "Kleur", "values": [{"name": "Wit", "swatch": {"color": "#F7F7F5"}}, {"name": "Zwart", "swatch": {"color": "#1E1E1E"}}]},
        ],
        "variants": [
            {"sku": f"ZW-3-{t[:3].upper()}-{c[:3].upper()}", "option1": t, "option2": c, "price": p, "inventory_quantity": 20,
             "inventory_management": "shopify", "inventory_policy": "deny", "weight": 2.5, "weight_unit": "kg"}
            for t, p in (("Dicht", 3995), ("Met ramen", 4995), ("Met deur", 5495)) for c in ("Wit", "Zwart")
            if not (t == "Met deur" and c == "Zwart")
        ],
        "images": [{"src": "zijwand-raam.png", "alt": "Partytent met zijwanden met ramen"}],
    })

    products.append({
        "handle": "gewichten-set-4x10kg",
        "title": "Gewichtenset 4 x 10 kg",
        "body_html": "<p>Vier tegelgewichten van 10 kg met handgreep, zodat je partytent ook bij wind stevig blijft staan.</p>",
        "vendor": "Voorbeeldwinkel", "product_type": "Accessoire",
        "tags": ["gewichten", "accessoire", "veiligheid"],
        "created_at": "2026-02-20T10:00:00+01:00", "published_at": "2026-02-20T10:00:00+01:00",
        "options": [{"name": "Title", "values": [{"name": "Default Title"}]}],
        "variants": [{"sku": "GEW-4X10", "option1": "Default Title", "price": 7995, "inventory_quantity": 30, "inventory_management": "shopify", "inventory_policy": "deny", "weight": 40, "weight_unit": "kg"}],
        "images": [{"src": "gewichten-set.png", "alt": "Vier tegelgewichten van 10 kilo"}],
    })

    products.append({
        "handle": "led-prikkabel-10m",
        "title": "LED-prikkabel 10 meter",
        "body_html": "<p>Sfeervolle prikkabel met 20 warmwitte LED-lampen, geschikt voor buitengebruik (IP44).</p>",
        "vendor": "Voorbeeldwinkel", "product_type": "Verlichting",
        "tags": ["verlichting", "accessoire", "sfeer"],
        "created_at": "2026-06-01T10:00:00+02:00", "published_at": "2026-06-01T10:00:00+02:00",
        "options": [{"name": "Title", "values": [{"name": "Default Title"}]}],
        "variants": [{"sku": "LED-10", "option1": "Default Title", "price": 3495, "inventory_quantity": 0, "inventory_management": "shopify", "inventory_policy": "deny", "weight": 1.4, "weight_unit": "kg"}],
        "images": [{"src": "prikkabel-led.png", "alt": "LED-prikkabel met warmwitte lampen"}],
    })

    products.append({
        "handle": "actiepakket-4-statafels-4-rokken",
        "title": "Actiepakket: 4 statafels + 4 stretch rokken",
        "body_html": "<p>Vier inklapbare statafels Ø80 met vier stretch rokken in één kleur naar keuze. Ideaal voor recepties en borrels.</p>",
        "vendor": "Voorbeeldwinkel", "product_type": "Actiepakket",
        "tags": ["actie", "statafel", "statafelrok", "pakket"],
        "created_at": "2026-07-01T10:00:00+02:00", "published_at": "2026-07-01T10:00:00+02:00",
        "options": [{"name": "Kleur rokken", "values": [{"name": "Zwart", "swatch": {"color": "#151515"}}, {"name": "Wit", "swatch": {"color": "#FAFAFA"}}]}],
        "variants": [
            {"sku": "PAK-44-ZWA", "option1": "Zwart", "price": 27995, "compare_at_price": 33960, "inventory_quantity": 10, "inventory_management": "shopify", "inventory_policy": "deny", "weight": 50, "weight_unit": "kg"},
            {"sku": "PAK-44-WIT", "option1": "Wit", "price": 27995, "compare_at_price": 33960, "inventory_quantity": 10, "inventory_management": "shopify", "inventory_policy": "deny", "weight": 50, "weight_unit": "kg"},
        ],
        "images": [{"src": "actiepakket-4-statafels.png", "alt": "Vier statafels met zwarte rokken"}],
    })

    products.append({
        "handle": "tafelkleed-biertafel",
        "title": "Tafelkleed voor biertafel",
        "body_html": "<p>Wit tafelkleed op maat van een standaard biertafel (220 x 50 cm). Vlekbestendig en wasbaar.</p>",
        "vendor": "Voorbeeldwinkel", "product_type": "Tafelkleed",
        "tags": ["tafelkleed", "accessoire"],
        "created_at": "2026-05-15T10:00:00+02:00", "published_at": "2026-05-15T10:00:00+02:00",
        "options": [{"name": "Title", "values": [{"name": "Default Title"}]}],
        "variants": [{"sku": "KLEED-BT", "option1": "Default Title", "price": 1495, "inventory_quantity": 50, "inventory_management": "shopify", "inventory_policy": "deny", "weight": 0.5, "weight_unit": "kg"}],
        "images": [{"src": "tafelkleed-rond.png", "alt": "Wit tafelkleed op een biertafel"}],
    })

    products.append({
        "handle": "bedrukte-partytent-3x3",
        "title": "Bedrukte partytent 3x3 met eigen logo",
        "body_html": "<p>Laat je partytent bedrukken met je eigen logo of ontwerp. Upload je bestand bij het bestellen; je ontvangt binnen 2 werkdagen een digitale drukproef.</p>",
        "vendor": "Voorbeeldwinkel", "product_type": "Bedrukte partytent",
        "template_suffix": None,
        "tags": ["bedrukt", "partytent", "maatwerk", "zakelijk"],
        "created_at": "2026-08-01T10:00:00+02:00", "published_at": "2026-08-01T10:00:00+02:00",
        "options": [{"name": "Bedrukking", "values": [{"name": "Valance (rondom)"}, {"name": "Dak + valance"}]}],
        "variants": [
            {"sku": "PRINT-33-VAL", "option1": "Valance (rondom)", "price": 54900, "inventory_management": None, "inventory_policy": "deny", "weight": 20, "weight_unit": "kg"},
            {"sku": "PRINT-33-DAK", "option1": "Dak + valance", "price": 79900, "inventory_management": None, "inventory_policy": "deny", "weight": 20, "weight_unit": "kg"},
        ],
        "images": [{"src": "bedrukte-partytent.png", "alt": "Partytent met eigen logo op de valance"}],
    })

    collections = [
        {"handle": "partytenten", "title": "Partytenten", "body_html": "<p>Easy-up partytenten en stretchtenten voor elk feest en evenement.</p>",
         "image": {"src": "banner-partytenten.png", "alt": "Partytenten"}, "sort_order": "best-selling",
         "rules": [{"column": "type", "relation": "contains", "condition": "tent"}], "disjunctive": False},
        {"handle": "statafels", "title": "Statafels", "body_html": "<p>Inklapbare statafels in verschillende diameters.</p>",
         "image": {"src": "banner-statafels.png", "alt": "Statafels"}, "sort_order": "manual",
         "products": ["statafel-o80", "actiepakket-4-statafels-4-rokken"]},
        {"handle": "statafelrokken", "title": "Statafelrokken", "body_html": "<p>Stretch statafelrokken en rokken met strik in veel kleuren.</p>",
         "image": {"src": "statafelrok-stretch-koningsblauw.png", "alt": "Blauwe statafelrok"}, "sort_order": "price-asc",
         "rules": [{"column": "tag", "relation": "equals", "condition": "statafelrok"}]},
        {"handle": "accessoires", "title": "Accessoires", "body_html": "<p>Zijwanden, gewichten, verlichting en meer.</p>",
         "image": {"src": "banner-accessoires.png", "alt": "Accessoires"}, "sort_order": "alpha-asc",
         "rules": [{"column": "tag", "relation": "equals", "condition": "accessoire"}, {"column": "tag", "relation": "equals", "condition": "onderdelen"}], "disjunctive": True},
        {"handle": "aanbiedingen", "title": "Aanbiedingen", "body_html": "<p>Tijdelijk scherp geprijsd.</p>", "sort_order": "price-desc",
         "rules": [{"column": "variant_compare_at_price", "relation": "greater_than", "condition": "0"}]},
    ]

    filters = [
        {"source": "availability", "label": "Beschikbaarheid"},
        {"source": "price", "label": "Prijs"},
        {"source": "option", "name": "Kleur", "label": "Kleur"},
        {"source": "option", "name": "Maat", "label": "Maat"},
        {"source": "product_type", "label": "Producttype"},
        {"source": "metafield", "owner": "product", "namespace": "custom", "key": "materiaal", "label": "Materiaal"},
    ]

    menus = [
        {"handle": "main-menu", "title": "Hoofdmenu", "items": [
            {"title": "Partytenten", "type": "collection", "handle": "partytenten", "items": [
                {"title": "Easy-up partytenten", "url": "/collections/partytenten", "items": [
                    {"title": "Premium", "type": "product", "handle": "easy-up-partytent-premium"},
                    {"title": "Professional", "type": "product", "handle": "easy-up-partytent-professional-3x6"},
                    {"title": "Bedrukt met logo", "type": "product", "handle": "bedrukte-partytent-3x3"},
                ]},
                {"title": "Stretchtenten", "type": "product", "handle": "stretchtent-10x15"},
                {"title": "Zijwanden & onderdelen", "type": "collection", "handle": "accessoires"},
            ]},
            {"title": "Statafels", "type": "collection", "handle": "statafels", "items": [
                {"title": "Statafels", "type": "collection", "handle": "statafels"},
                {"title": "Statafelrokken", "type": "collection", "handle": "statafelrokken", "items": [
                    {"title": "Stretch", "type": "product", "handle": "statafelrok-stretch"},
                    {"title": "Met strik", "type": "product", "handle": "statafelrok-met-strik"},
                ]},
                {"title": "Actiepakketten", "type": "product", "handle": "actiepakket-4-statafels-4-rokken"},
            ]},
            {"title": "Accessoires", "type": "collection", "handle": "accessoires"},
            {"title": "Aanbiedingen", "type": "collection", "handle": "aanbiedingen"},
            {"title": "Zakelijk", "type": "page", "handle": "zakelijk"},
            {"title": "Blog", "type": "blog", "handle": "nieuws"},
        ]},
        {"handle": "footer", "title": "Footer", "items": [
            {"title": "Over ons", "type": "page", "handle": "over-ons"},
            {"title": "Contact", "type": "page", "handle": "contact"},
            {"title": "Veelgestelde vragen", "type": "page", "handle": "faq"},
            {"title": "Verzending", "type": "page", "handle": "verzending"},
            {"title": "Retourneren", "type": "page", "handle": "retourneren"},
            {"title": "Zoeken", "type": "search", "url": "/search"},
            {"title": "Privacybeleid", "type": "policy", "handle": "privacy-policy"},
            {"title": "Algemene voorwaarden", "type": "policy", "handle": "terms-of-service"},
        ]},
        {"handle": "customer-account-main-menu", "title": "Klantaccount", "items": [
            {"title": "Bestellingen", "url": "/account"},
            {"title": "Winkel", "url": "/"},
        ]},
    ]

    pages = [
        {"handle": "over-ons", "title": "Over ons", "body_html": "<p>Voorbeeldwinkel is een fictieve winkel die alleen bestaat om dit thema lokaal te testen. Alle teksten zijn voorbeeldteksten.</p><p>We verkopen partytenten, statafels en alles wat je nodig hebt voor een geslaagd feest.</p>"},
        {"handle": "contact", "title": "Contact", "template_suffix": "contact", "body_html": "<p>Vragen over je bestelling of een offerte? Stuur ons een bericht, we reageren op werkdagen binnen één dag.</p>"},
        {"handle": "zakelijk", "title": "Zakelijk bestellen", "body_html": "<p>Voor horeca, eventbureaus, verhuurbedrijven, verenigingen en scholen bieden we staffelkorting en bestellen op factuur.</p><ul><li>Staffelkorting vanaf 10 stuks</li><li>Bestellen op rekening</li><li>Bedrukking met eigen logo</li></ul>"},
        {"handle": "faq", "title": "Veelgestelde vragen", "body_html": "<h3>Hoe snel wordt mijn bestelling geleverd?</h3><p>Op voorraad betekent meestal binnen 1-2 werkdagen in huis.</p><h3>Kan ik retourneren?</h3><p>Ja, binnen 30 dagen na ontvangst.</p><h3>Is een easy-up partytent waterdicht?</h3><p>Het dak wel; naden kunnen bij langdurige regen licht doorlaten.</p>"},
        {"handle": "verzending", "title": "Verzending", "body_html": "<p>We verzenden binnen Nederland en België. Grote producten gaan per pallet of koerier.</p>"},
        {"handle": "retourneren", "title": "Retourneren", "body_html": "<p>Niet tevreden? Meld je retour binnen 30 dagen aan via het contactformulier.</p>"},
    ]

    blogs = [{"handle": "nieuws", "title": "Tips & nieuws", "comments": "moderate", "articles": [
        {"handle": "partytent-opbouwen-in-5-stappen", "title": "Partytent opbouwen in 5 stappen", "author": "Team Voorbeeldwinkel",
         "published_at": "2026-09-20T09:00:00+02:00", "tags": ["partytent", "handleiding"],
         "image": {"src": "blog-opbouwen.png", "alt": "Partytent wordt opgebouwd"},
         "summary_html": "<p>Met deze vijf stappen staat je easy-up partytent in een paar minuten veilig overeind.</p>",
         "body_html": "<p>Een easy-up partytent opzetten is eenvoudig als je het in de goede volgorde doet.</p><ol><li>Leg alles klaar</li><li>Schuif het frame half uit</li><li>Leg het dak over het frame</li><li>Klik de poten op hoogte</li><li>Zet de tent vast met gewichten of haringen</li></ol>"},
        {"handle": "welke-statafel-past-bij-jouw-feest", "title": "Welke statafel past bij jouw feest?", "author": "Team Voorbeeldwinkel",
         "published_at": "2026-08-12T09:00:00+02:00", "tags": ["statafel", "advies"],
         "image": {"src": "blog-statafel-kiezen.png", "alt": "Statafels met rokken"},
         "summary_html": "<p>Ø70, Ø80 of Ø85? We zetten de verschillen op een rij.</p>",
         "body_html": "<p>De diameter bepaalt hoeveel gasten comfortabel rond een statafel staan.</p>"},
        {"handle": "partytent-onderhouden-en-opbergen", "title": "Zo onderhoud en berg je je partytent op", "author": "Team Voorbeeldwinkel",
         "published_at": "2026-07-02T09:00:00+02:00", "tags": ["onderhoud"],
         "image": {"src": "blog-onderhoud.png", "alt": "Opgevouwen partytent in draagtas"},
         "summary_html": "<p>Een paar simpele gewoontes zorgen dat je tent jaren meegaat.</p>",
         "body_html": "<p>Berg je tent altijd droog op en controleer na elk gebruik de verbindingen.</p>"},
    ]}]

    policies = {
        "privacy_policy": {"title": "Privacybeleid", "body_html": "<p>Voorbeeldtekst privacybeleid. Vervang deze tekst door je eigen beleid.</p>"},
        "refund_policy": {"title": "Retourbeleid", "body_html": "<p>Voorbeeldtekst retourbeleid: 30 dagen bedenktijd.</p>"},
        "shipping_policy": {"title": "Verzendbeleid", "body_html": "<p>Voorbeeldtekst verzendbeleid.</p>"},
        "terms_of_service": {"title": "Algemene voorwaarden", "body_html": "<p>Voorbeeldtekst algemene voorwaarden.</p>"},
        "contact_information": {"title": "Contactgegevens", "body_html": "<p>Voorbeeldwinkel · Voorbeeldstraat 1 · 1234 AB Voorbeeldstad · KvK 00000000</p>"},
    }

    data = {
        "schema_version": 1,
        "shop": {
            "name": "Voorbeeldwinkel",
            "email": "info@voorbeeldwinkel.test",
            "phone": "+31 20 000 0000",
            "domain": "voorbeeldwinkel.test",
            "description": "Fictieve testwinkel met partytenten, statafels en accessoires.",
            "currency": "EUR",
            "money_format": "€{{amount_with_comma_separator}}",
            "money_with_currency_format": "€{{amount_with_comma_separator}} EUR",
            "primary_locale": "nl",
            "published_locales": [{"iso_code": "nl", "name": "Nederlands", "endonym_name": "Nederlands", "primary": True},
                                  {"iso_code": "en", "name": "Engels", "endonym_name": "English"}],
            "country": "NL",
            "countries": [{"iso_code": "NL", "name": "Nederland", "currency": "EUR"},
                          {"iso_code": "BE", "name": "België", "currency": "EUR"},
                          {"iso_code": "DE", "name": "Duitsland", "currency": "EUR"}],
            "address": {"address1": "Voorbeeldstraat 1", "city": "Voorbeeldstad", "zip": "1234 AB", "country": "Nederland", "country_code": "NL"},
            "taxes_included": True,
            "customer_accounts_enabled": True,
            "password_message": "We openen binnenkort. Laat je e-mailadres achter.",
            "payment_types": ["ideal", "bancontact", "klarna", "paypal", "visa", "master", "maestro", "apple_pay", "google_pay", "shopify_pay"],
            "brand": {"logo": "logo-voorbeeldwinkel.png", "slogan": "Alles voor je feest", "short_description": "Partytenten, statafels en accessoires."},
            "metafields": [],
        },
        "products": products,
        "collections": collections,
        "filters": filters,
        "best_sellers": ["easy-up-partytent-premium", "statafelrok-stretch", "statafel-o80", "gewichten-set-4x10kg"],
        "menus": menus,
        "pages": pages,
        "blogs": blogs,
        "policies": policies,
    }
    with open(os.path.join(HERE, "sample.json"), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("wrote", os.path.join(HERE, "sample.json"), "and", len(os.listdir(IMG_DIR)), "images")


if __name__ == "__main__":
    main()
    # Klapklaar contract data (products with metafields, 3-level menu, page templates, blog 'advies')
    import extend_sample

    extend_sample.main()
