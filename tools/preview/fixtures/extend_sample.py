#!/usr/bin/env python3
"""Adds Klapklaar contract data to tools/preview/fixtures/sample.json (idempotent, additive).

The base sample (make_sample.py) stays intact so Horizon/Dawn keep rendering the same store. This script
upserts, by handle:
  - products that follow catalog/CONTRACT.md (options Maat/Kleur, metafields kenmerk_kort, usps, specificaties,
    staffelkorting, addons, past_op, levertijd, verzending, bedrukbaar, drukopties, faq, garantie …) with the
    3D renders from brand/img, renders/samples and $SCRATCH/renders-extra as images;
  - contract collections (+ intro / kenmerken / seo_tekst metafields; sub-collection chips come from main-menu);
  - main-menu with three levels, footer-* menus;
  - pages with template suffixes (zakelijk, offerte, bedrukken, faq, contact) and the service pages;
  - blog 'advies' with original how-to articles.
No ratings, reviews or customer counts anywhere (brief §6).

Usage: python3 tools/preview/fixtures/extend_sample.py   (run make_sample.py first when regenerating)
"""
import json
import os
import shutil
import zlib

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
IMG_DIR = os.path.join(HERE, "images")
SCRATCH = os.environ.get("SCRATCH", "/tmp/claude-0/-home-user-Larsaikema/d03b1b71-234c-55f6-a22b-89a9ff74abc4/scratchpad")
SOURCES = [os.path.join(REPO, "brand", "img"), os.path.join(REPO, "renders", "samples"), os.path.join(SCRATCH, "renders-extra")]
MAX_PX = 1400

IMAGES = [
    "scene-hero.webp", "scene-hero-crop.webp",
    "tent-3x3-klaproos-hero.webp", "tent-3x3-klaproos-front.webp", "tent-3x6-klaproos-hero.webp",
    "tent-3x3-rood-hero.webp", "tent-3x3-rood-logo-hero.webp", "tent-3x3-rood-logo-front.webp",
    "tent-3x3-wit-hero.webp", "tent-3x3-wit-front.webp", "tent-3x3-wit-detail.webp", "tent-3x3-zwart-hero.webp",
    "tent-3x6-zwart-zijwanden-hero.webp", "tent-3x6-zwart-zijwanden-detail.webp",
    "tent-3x3-rood-professional-gewichten-hero.webp", "tent-3x3-wit-professional-hero.webp", "tent-4x4-zwart-professional-hero.webp",
    "statafel-80-kaal-hero.webp", "statafel-80-ingeklapt.webp",
    "statafel-80-stretch-zwart-hero.webp", "statafel-80-stretch-rood-hero.webp", "statafel-80-stretch-wit-hero.webp",
    "statafel-80-stretch-antraciet-hero.webp", "statafel-80-stretch-koningsblauw-hero.webp",
    "statafel-80-strik-wit-hero.webp", "statafel-80-strik-zwart-hero.webp", "statafelrok-stretch-zwart-print-hero.webp",
]


def copy_images():
    # The fixture images are a stable snapshot: an existing file is kept (brand/img is re-rendered per brand version,
    # FORCE_IMAGES=1 refreshes them deliberately).
    force = os.environ.get("FORCE_IMAGES") == "1"
    for name in IMAGES:
        dst = os.path.join(IMG_DIR, name)
        if os.path.exists(dst) and not force:
            continue
        cands = [os.path.join(d, name) for d in SOURCES if os.path.exists(os.path.join(d, name))]
        if not cands:
            if not os.path.exists(dst):
                print("missing image", name)
            continue
        # prefer the largest source
        src = max(cands, key=lambda p: Image.open(p).size[0])
        im = Image.open(src)
        if im.size[0] > MAX_PX:
            h = round(im.size[1] * MAX_PX / im.size[0])
            im.convert("RGB").resize((MAX_PX, h), Image.LANCZOS).save(dst, "WEBP", quality=86, method=6)
        elif os.path.abspath(src) != os.path.abspath(dst):
            shutil.copyfile(src, dst)


def mf(key, typ, value, ns="custom"):
    if not isinstance(value, str):
        value = json.dumps(value, ensure_ascii=False)
    return {"namespace": ns, "key": key, "type": typ, "value": value}


def rich(*blocks):
    children = []
    for kind, text in blocks:
        if kind == "h2":
            children.append({"type": "heading", "level": 2, "children": [{"type": "text", "value": text}]})
        elif kind == "h3":
            children.append({"type": "heading", "level": 3, "children": [{"type": "text", "value": text}]})
        else:
            children.append({"type": "paragraph", "children": [{"type": "text", "value": text}]})
    return {"type": "root", "children": children}


def variants(sku, options, price_fn, stock_fn, image_fn, compare_fn=None, weight=None, policy_fn=None):
    """options: list of value lists (in option order). Returns variant dicts for the cartesian product."""
    out = []

    def rec(prefix):
        if len(prefix) == len(options):
            vals = list(prefix)
            code = "-".join(v.replace(" ", "").replace(",", "").replace("Ø", "").replace("+", "")[:6].upper() for v in vals)
            v = {
                "sku": f"{sku}-{code}",
                "price": price_fn(vals),
                "compare_at_price": compare_fn(vals) if compare_fn else None,
                "inventory_quantity": stock_fn(vals),
                "inventory_management": "shopify",
                "inventory_policy": policy_fn(vals) if policy_fn else "deny",
                "weight": weight or 1.0,
                "weight_unit": "kg",
                "requires_shipping": True,
                "taxable": True,
                "image": image_fn(vals),
            }
            for i, val in enumerate(vals):
                v[f"option{i + 1}"] = val
            out.append(v)
            return
        for val in options[len(prefix)]:
            rec(prefix + [val])

    rec([])
    return out


def opt(name, values):
    return {"name": name, "values": [{"name": v} for v in values]}


TENT_FAQ = [
    {"vraag": "Kan ik de tent alleen opzetten?", "antwoord": "Het kan, maar met twee man staat hij het snelst en het veiligst: ieder aan een kant, frame uittrekken, dak erover, poten op hoogte."},
    {"vraag": "Hoe zet ik de tent vast?", "antwoord": "Zet elke poot vast met een haring of een voetgewicht. Op verharde grond gebruik je gewichten van minimaal 10 kg per poot. Bij harde wind haal je het dak eraf."},
    {"vraag": "Passen de zijwanden van andere merken?", "antwoord": "Onze zijwanden zijn gemaakt voor dit frame. Andere merken hebben vaak andere maten en bevestigingen; vraag het ons even als je twijfelt."},
]

TENT_SPECS = [
    {"groep": "Frame", "label": "Materiaal", "waarde": "Staal, gepoedercoat"},
    {"groep": "Frame", "label": "Buisprofiel poten", "waarde": "40 mm hexagon"},
    {"groep": "Frame", "label": "Hoogtestanden", "waarde": "5"},
    {"groep": "Frame", "label": "Doorloophoogte", "waarde": "195–215 cm"},
    {"groep": "Dak", "label": "Materiaal", "waarde": "Polyester 320 g/m², PVC-gecoat"},
    {"groep": "Dak", "label": "Naden", "waarde": "Getaped"},
    {"groep": "Dak", "label": "Luifel", "waarde": "Rondom, 20 cm"},
    {"groep": "Gewicht en verpakking", "label": "Gewicht 3 × 3 m", "waarde": "28 kg"},
    {"groep": "Gewicht en verpakking", "label": "Verpakt in", "waarde": "Draagtas met wielen"},
]

PRO_SPECS = [
    {"groep": "Frame", "label": "Materiaal", "waarde": "Aluminium, geanodiseerd"},
    {"groep": "Frame", "label": "Buisprofiel poten", "waarde": "50 mm hexagon"},
    {"groep": "Frame", "label": "Hoogtestanden", "waarde": "5"},
    {"groep": "Dak", "label": "Materiaal", "waarde": "PVC 520 g/m²"},
    {"groep": "Dak", "label": "Brandvertragend", "waarde": "Ja, volgens opgave leverancier (certificaat op aanvraag)"},
    {"groep": "Gewicht en verpakking", "label": "Gewicht 3 × 3 m", "waarde": "38 kg"},
    {"groep": "Gewicht en verpakking", "label": "Verzending", "waarde": "Per pallet, op afspraak"},
]

ROK_SPECS = [
    {"groep": "Stof", "label": "Materiaal", "waarde": "90% polyester, 10% elastaan"},
    {"groep": "Stof", "label": "Gewicht", "waarde": "190 g/m²"},
    {"groep": "Pasvorm", "label": "Tafelblad", "waarde": "Ø 80–85 cm"},
    {"groep": "Pasvorm", "label": "Tafelhoogte", "waarde": "105–115 cm"},
    {"groep": "Pasvorm", "label": "Topcover", "waarde": "Ja, sluit over het blad"},
    {"groep": "Onderhoud", "label": "Wassen", "waarde": "40 °C, niet in de droger"},
]

ROK_FAQ = [
    {"vraag": "Past deze rok op mijn statafel?", "antwoord": "Hij past op statafels met een blad van Ø 80 tot 85 cm en een hoogte van 105 tot 115 cm. Meet het blad van rand tot rand."},
    {"vraag": "Moet ik de rok strijken?", "antwoord": "Nee. Stretch trekt strak over de tafel, dus kreukels verdwijnen vanzelf."},
]


def products():
    P = []
    prem_price = {"3 x 3 m": 31900, "3 x 4,5 m": 39900, "3 x 6 m": 45900}
    prem_img = {
        ("Klaproos", "3 x 3 m"): "tent-3x3-klaproos-hero.webp", ("Klaproos", "3 x 4,5 m"): "tent-3x3-klaproos-hero.webp",
        ("Klaproos", "3 x 6 m"): "tent-3x6-klaproos-hero.webp", ("Wit", "3 x 3 m"): "tent-3x3-wit-hero.webp",
        ("Wit", "3 x 4,5 m"): "tent-3x3-wit-hero.webp", ("Wit", "3 x 6 m"): "tent-3x3-wit-hero.webp",
        ("Zwart", "3 x 3 m"): "tent-3x3-zwart-hero.webp", ("Zwart", "3 x 4,5 m"): "tent-3x3-zwart-hero.webp",
        ("Zwart", "3 x 6 m"): "tent-3x6-zwart-zijwanden-hero.webp",
    }
    prem_stock = {("Klaproos", "3 x 3 m"): 14, ("Wit", "3 x 3 m"): 22, ("Zwart", "3 x 3 m"): 3, ("Klaproos", "3 x 4,5 m"): 0,
                  ("Zwart", "3 x 6 m"): 0}
    P.append({
        "handle": "partytent-easy-up-premium",
        "title": "Easy-up partytent Premium",
        "vendor": "Klapklaar",
        "product_type": "Partytent",
        "tags": ["easy-up", "partytent", "premium", "badge:actie", "gebruik:tuinfeest", "gebruik:markt"],
        "created_at": "2026-09-01T10:00:00+02:00", "published_at": "2026-09-01T10:00:00+02:00",
        "body_html": "<p>De Premium is de easy-up voor wie hem vaak gebruikt: tuinfeest, markt, sportdag. Het stalen frame met 40 mm hexagonpoten klapt in één beweging uit, het dak van 320 g/m² polyester gaat er in een paar minuten overheen.</p><p>Kies je maat en kleur. Zijwanden, gewichten en een regengoot bestel je los erbij, zodat je alleen koopt wat je nodig hebt.</p><h3>Zo staat hij stevig</h3><p>Zet elke poot vast met een haring of een voetgewicht. Op tegels of asfalt gebruik je gewichten van minimaal 10 kg per poot.</p>",
        "options": [
            {"name": "Kleur", "values": [{"name": "Klaproos"}, {"name": "Wit"}, {"name": "Zwart"}]},
            opt("Maat", ["3 x 3 m", "3 x 4,5 m", "3 x 6 m"]),
        ],
        "variants": variants(
            "KK-EUP", [["Klaproos", "Wit", "Zwart"], ["3 x 3 m", "3 x 4,5 m", "3 x 6 m"]],
            price_fn=lambda v: prem_price[v[1]],
            compare_fn=lambda v: 34900 if v[1] == "3 x 3 m" else None,
            stock_fn=lambda v: prem_stock.get((v[0], v[1]), 8),
            policy_fn=lambda v: "continue" if (v[0], v[1]) == ("Klaproos", "3 x 4,5 m") else "deny",
            image_fn=lambda v: prem_img[(v[0], v[1])], weight=28,
        ),
        "images": [
            {"src": "tent-3x3-klaproos-hero.webp", "alt": "Easy-up partytent Premium 3 × 3 m Klaproos, schuin vooraanzicht"},
            {"src": "tent-3x3-klaproos-front.webp", "alt": "Easy-up partytent Premium 3 × 3 m Klaproos, vooraanzicht"},
            {"src": "tent-3x6-klaproos-hero.webp", "alt": "Easy-up partytent Premium 3 × 6 m Klaproos, schuin vooraanzicht"},
            {"src": "tent-3x3-wit-hero.webp", "alt": "Easy-up partytent Premium 3 × 3 m Wit, schuin vooraanzicht"},
            {"src": "tent-3x3-wit-front.webp", "alt": "Easy-up partytent Premium 3 × 3 m Wit, vooraanzicht"},
            {"src": "tent-3x3-wit-detail.webp", "alt": "Hoekstuk en schaarframe van de easy-up Premium, detail"},
            {"src": "tent-3x3-zwart-hero.webp", "alt": "Easy-up partytent Premium 3 × 3 m Zwart, schuin vooraanzicht"},
            {"src": "tent-3x6-zwart-zijwanden-hero.webp", "alt": "Easy-up partytent Premium 3 × 6 m Zwart met zijwanden (los verkrijgbaar)"},
        ],
        "metafields": [
            mf("kenmerk_kort", "single_line_text_field", "40 mm staal · 320 g/m² dakdoek · 5 standen"),
            mf("usps", "list.single_line_text_field", ["Staat in een paar minuten, met twee man", "Dakdoek 320 g/m² polyester, PVC-gecoat", "Draagtas met wielen, haringen en scheerlijnen erbij", "Zijwanden los te bestellen"]),
            mf("specificaties", "json", TENT_SPECS),
            mf("staffelkorting", "json", [{"vanaf": 5, "korting": 5}, {"vanaf": 10, "korting": 8}]),
            mf("addons", "list.product_reference", ["gewichten-set-4x10kg", "zijwand-3m"]),
            mf("verzending", "single_line_text_field", "pakket"),
            mf("bedrukbaar", "boolean", "false"),
            mf("faq", "json", TENT_FAQ),
            mf("vergelijk_groep", "single_line_text_field", "easy-up"),
            mf("gewicht_kg", "number_decimal", "28.0"),
            mf("verpakt", "single_line_text_field", "155 × 32 × 32 cm"),
            mf("garantie", "single_line_text_field", "2 jaar op het frame"),
            mf("included", "list.single_line_text_field", ["Stalen frame met dak", "Draagtas met wielen", "4 haringen en 4 scheerlijnen"]),
            mf("excluded", "list.single_line_text_field", ["Zijwanden (los te bestellen)", "Voetgewichten (los te bestellen)"]),
            mf("downloads", "list.file_reference", ["handleiding-easy-up-premium.pdf", "productblad-easy-up-premium.pdf"]),
            mf("maatgids", "page_reference", "maatadvies-partytenten"),
        ],
    })

    pro_price = {"3 x 3 m": 54900, "3 x 6 m": 79900, "4 x 4 m": 74900}
    pro_img = {"Rood": "tent-3x3-rood-professional-gewichten-hero.webp", "Wit": "tent-3x3-wit-professional-hero.webp", "Zwart": "tent-4x4-zwart-professional-hero.webp"}
    P.append({
        "handle": "partytent-easy-up-professional",
        "title": "Easy-up partytent Professional",
        "vendor": "Klapklaar",
        "product_type": "Partytent",
        "tags": ["easy-up", "partytent", "professional", "zakelijk", "pallet", "gebruik:evenement", "gebruik:markt", "gebruik:horeca"],
        "created_at": "2026-08-20T10:00:00+02:00", "published_at": "2026-08-20T10:00:00+02:00",
        "body_html": "<p>De Professional is gemaakt voor wekelijks gebruik: markten, evenementen, verhuur. Aluminium frame met 50 mm hexagonpoten, dak van 520 g/m² PVC. Lichter dan staal en hij roest niet.</p><p>Grote maten gaan per pallet en leveren we op afspraak.</p>",
        "options": [opt("Kleur", ["Rood", "Wit", "Zwart"]), opt("Maat", ["3 x 3 m", "3 x 6 m", "4 x 4 m"])],
        "variants": variants(
            "KK-EUPRO", [["Rood", "Wit", "Zwart"], ["3 x 3 m", "3 x 6 m", "4 x 4 m"]],
            price_fn=lambda v: pro_price[v[1]], stock_fn=lambda v: 6, image_fn=lambda v: pro_img[v[0]], weight=38,
        ),
        "images": [
            {"src": "tent-3x3-rood-professional-gewichten-hero.webp", "alt": "Easy-up partytent Professional 3 × 3 m Rood met voetgewichten, schuin vooraanzicht"},
            {"src": "tent-3x3-wit-professional-hero.webp", "alt": "Easy-up partytent Professional 3 × 3 m Wit, schuin vooraanzicht"},
            {"src": "tent-4x4-zwart-professional-hero.webp", "alt": "Easy-up partytent Professional 4 × 4 m Zwart, schuin vooraanzicht"},
        ],
        "metafields": [
            mf("kenmerk_kort", "single_line_text_field", "50 mm aluminium · 520 g/m² PVC · brandvertragend"),
            mf("usps", "list.single_line_text_field", ["Aluminium frame: licht en roestvrij", "PVC-dak van 520 g/m²", "Gemaakt voor wekelijks gebruik"]),
            mf("specificaties", "json", PRO_SPECS),
            mf("staffelkorting", "json", [{"vanaf": 10, "korting": 5}, {"vanaf": 25, "korting": 10}]),
            mf("addons", "list.product_reference", ["gewichten-set-4x10kg"]),
            mf("verzending", "single_line_text_field", "pallet"),
            mf("faq", "json", TENT_FAQ[1:]),
            mf("vergelijk_groep", "single_line_text_field", "easy-up"),
            mf("garantie", "single_line_text_field", "2 jaar op het frame"),
            mf("included", "list.single_line_text_field", ["Aluminium frame met PVC-dak", "Draagtas met wielen", "4 haringen en 4 scheerlijnen"]),
            mf("excluded", "list.single_line_text_field", ["Zijwanden (los te bestellen)", "Voetgewichten (los te bestellen)"]),
            mf("downloads", "list.file_reference", ["productblad-easy-up-professional.pdf"]),
            mf("maatgids", "page_reference", "maatadvies-partytenten"),
        ],
    })

    logo_img = {"Klaproos": "tent-3x3-klaproos-logo-hero.webp", "Wit": "tent-3x3-wit-hero.webp", "Zwart": "tent-3x3-zwart-hero.webp"}
    logo_price = {"Logo op de luifel": 64900, "Logo op luifel en dak": 89900, "Zonder logo": 31900}
    P.append({
        "handle": "partytent-met-logo",
        "title": "Easy-up partytent 3 × 3 m met jouw logo",
        "vendor": "Klapklaar",
        "product_type": "Bedrukte partytent",
        "tags": ["easy-up", "partytent", "bedrukbaar", "zakelijk", "badge:nieuw", "gebruik:evenement"],
        "created_at": "2026-10-01T10:00:00+02:00", "published_at": "2026-10-01T10:00:00+02:00",
        "body_html": "<p>Jouw naam op de luifel, of je logo op het dak. Je uploadt je logo, wij maken een drukproef en pas na jouw akkoord gaat hij in productie.</p><p>Frame en dak zijn gelijk aan de easy-up Premium 3 × 3 m. Wil je er een paar zonder logo bij, in dezelfde kleur? Kies dan ‘Zonder logo’: die versturen we gewoon uit voorraad.</p>",
        "options": [opt("Kleur", ["Klaproos", "Wit", "Zwart"]), opt("Bedrukking", ["Logo op de luifel", "Logo op luifel en dak", "Zonder logo"])],
        "variants": variants(
            "KK-EUPLOGO", [["Klaproos", "Wit", "Zwart"], ["Logo op de luifel", "Logo op luifel en dak", "Zonder logo"]],
            price_fn=lambda v: logo_price[v[1]], stock_fn=lambda v: 9 if v[1] == "Zonder logo" else 0,
            policy_fn=lambda v: "deny" if v[1] == "Zonder logo" else "continue",
            image_fn=lambda v: logo_img[v[0]] if v[1] == "Zonder logo" or v[0] != "Klaproos" else "tent-3x3-klaproos-logo-hero.webp", weight=28,
        ),
        "images": [
            {"src": "tent-3x3-klaproos-logo-hero.webp", "alt": "Easy-up partytent 3 × 3 m Klaproos met voorbeeldopdruk Klapklaar op de luifel"},
            {"src": "tent-3x3-klaproos-hero.webp", "alt": "Easy-up partytent 3 × 3 m Klaproos zonder opdruk, schuin vooraanzicht"},
        ],
        "metafields": [
            mf("kenmerk_kort", "single_line_text_field", "Jouw logo op de luifel · drukproef vooraf"),
            mf("usps", "list.single_line_text_field", ["Eerst een drukproef, dan pas drukken", "Logo op de luifel of op het dak", "Frame gelijk aan de Premium 3 × 3 m"]),
            mf("specificaties", "json", TENT_SPECS[:6]),
            mf("staffelkorting", "json", [{"vanaf": 3, "korting": 5}, {"vanaf": 10, "korting": 10}]),
            mf("bedrukbaar", "boolean", "true"),
            mf("drukopties", "json", {"optie": "Bedrukking", "zonder": ["Zonder logo"], "posities": ["Luifel voorkant", "Luifel rondom", "Dak"], "aanlevering": "PDF, AI, EPS, SVG of PNG van minimaal 2000 px breed", "levertijd": "10–15 werkdagen na akkoord drukproef", "min_aantal": 1}),
            mf("addons", "list.product_reference", ["gewichten-set-4x10kg"]),
            mf("included", "list.single_line_text_field", ["Stalen frame met dak in jouw kleur", "Opdruk volgens de drukproef die jij goedkeurt", "Draagtas met wielen, 4 haringen en 4 scheerlijnen"]),
            mf("excluded", "list.single_line_text_field", ["Zijwanden", "Voetgewichten"]),
            mf("downloads", "list.file_reference", ["drukbestand-luifel-easy-up-3x3.pdf", "handleiding-easy-up-premium.pdf"]),
            mf("maatgids", "page_reference", "maatadvies-partytenten"),
        ],
    })

    P.append({
        "handle": "statafel-inklapbaar-80",
        "title": "Statafel inklapbaar Ø 80 cm",
        "vendor": "Klapklaar",
        "product_type": "Statafel",
        "tags": ["statafel", "zakelijk", "gebruik:horeca", "gebruik:evenement", "gebruik:tuinfeest"],
        "created_at": "2026-09-10T10:00:00+02:00", "published_at": "2026-09-10T10:00:00+02:00",
        "body_html": "<p>Een statafel die plat klapt en in elke auto past. Blad van Ø 80 cm berken, stevig zwart frame, 110 cm hoog. Met een stretch rok erover staat hij er netjes bij.</p>",
        "variants": [{"sku": "KK-STA80", "price": 4995, "inventory_quantity": 120, "inventory_management": "shopify", "inventory_policy": "deny", "weight": 9.5, "weight_unit": "kg", "image": "statafel-80-kaal-hero.webp"}],
        "images": [
            {"src": "statafel-80-kaal-hero.webp", "alt": "Statafel Ø 80 cm met berken blad en zwart frame, schuin vooraanzicht"},
            {"src": "statafel-80-ingeklapt.webp", "alt": "Statafel Ø 80 cm ingeklapt"},
        ],
        "metafields": [
            mf("kenmerk_kort", "single_line_text_field", "Ø 80 cm · 110 cm hoog · klapt plat"),
            mf("usps", "list.single_line_text_field", ["Klapt plat, past in elke auto", "Berken blad, zwart gepoedercoat frame", "Past onder elke Ø 80–85 cm statafelrok"]),
            mf("specificaties", "json", [
                {"groep": "Afmetingen", "label": "Blad", "waarde": "Ø 80 cm"},
                {"groep": "Afmetingen", "label": "Hoogte", "waarde": "110 cm"},
                {"groep": "Afmetingen", "label": "Ingeklapt", "waarde": "80 × 110 × 9 cm"},
                {"groep": "Materiaal", "label": "Blad", "waarde": "Berken multiplex, gelakt"},
                {"groep": "Materiaal", "label": "Frame", "waarde": "Staal, zwart gepoedercoat"},
                {"groep": "Gewicht", "label": "Gewicht", "waarde": "9,5 kg"},
            ]),
            mf("staffelkorting", "json", [{"vanaf": 10, "korting": 5}, {"vanaf": 25, "korting": 10}, {"vanaf": 50, "korting": 15}]),
            mf("addons", "list.product_reference", ["statafelrok-stretch-o80", "statafelhoes-met-strik-80"]),
            mf("faq", "json", [{"vraag": "Hoeveel statafels heb ik nodig?", "antwoord": "Reken op één statafel per 6 tot 8 staande gasten. Bij een borrel waar mensen veel rondlopen kun je met minder toe."}]),
            mf("gewicht_kg", "number_decimal", "9.5"),
            mf("included", "list.single_line_text_field", ["Statafel met berken blad Ø 80 cm", "Ingeklapt geleverd, direct te gebruiken"]),
            mf("excluded", "list.single_line_text_field", ["Statafelrok of hoes (los te bestellen)"]),
            mf("downloads", "list.file_reference", ["handleiding-statafel-inklapbaar.pdf"]),
        ],
    })

    rok_colors = ["Zwart", "Wit", "Antraciet", "Koningsblauw", "Rood"]
    rok_img = {c: f"statafel-80-stretch-{c.lower()}-hero.webp" for c in rok_colors}
    P.append({
        "handle": "statafelrok-stretch-o80",
        "title": "Statafelrok stretch Ø 80 cm",
        "vendor": "Klapklaar",
        "product_type": "Statafelrok",
        "tags": ["statafelrok", "stretch", "zakelijk", "gebruik:horeca", "gebruik:evenement"],
        "created_at": "2026-09-12T10:00:00+02:00", "published_at": "2026-09-12T10:00:00+02:00",
        "body_html": "<p>Strak om de tafel, zonder strijken. Deze stretch rok trek je over een statafel van Ø 80–85 cm; de topcover sluit over het blad, de voet valt in vier banen naar de grond.</p><p>Wasbaar op 40 °C. Bestel je er tien of meer, dan krijg je staffelkorting.</p>",
        "options": [opt("Kleur", rok_colors)],
        "variants": variants("KK-ROK80", [rok_colors], price_fn=lambda v: 2495, stock_fn=lambda v: {"Rood": 4}.get(v[0], 60), image_fn=lambda v: rok_img[v[0]], weight=0.6),
        "images": [{"src": rok_img[c], "alt": f"Statafelrok stretch Ø 80 cm {c}, schuin vooraanzicht"} for c in rok_colors],
        "metafields": [
            mf("kenmerk_kort", "single_line_text_field", "Voor Ø 80–85 cm · 190 g/m² stretch · wasbaar"),
            mf("usps", "list.single_line_text_field", ["Strak zonder strijken", "Topcover sluit over het blad", "Wasbaar op 40 °C"]),
            mf("specificaties", "json", ROK_SPECS),
            mf("staffelkorting", "json", [{"vanaf": 10, "korting": 5}, {"vanaf": 25, "korting": 10}, {"vanaf": 50, "korting": 15}]),
            mf("past_op", "list.product_reference", ["statafel-inklapbaar-80"]),
            mf("addons", "list.product_reference", ["statafel-inklapbaar-80"]),
            mf("faq", "json", ROK_FAQ),
            mf("included", "list.single_line_text_field", ["Stretch rok met topcover"]),
            mf("excluded", "list.single_line_text_field", ["Statafel (los te bestellen)"]),
            mf("maatgids", "page_reference", "maatadvies-statafelrokken"),
        ],
    })

    strik_colors = ["Wit", "Zwart"]
    P.append({
        "handle": "statafelhoes-met-strik-80",
        "title": "Statafelhoes met strik Ø 80 cm",
        "vendor": "Klapklaar",
        "product_type": "Statafelhoes",
        "tags": ["statafelrok", "statafelhoes", "strik", "badge:actie", "gebruik:tuinfeest", "gebruik:evenement"],
        "created_at": "2026-09-14T10:00:00+02:00", "published_at": "2026-09-14T10:00:00+02:00",
        "body_html": "<p>Een hoes die tot de grond valt, met een strik op taillehoogte. Netjes voor bruiloft, receptie of jubileum.</p>",
        "options": [opt("Kleur", strik_colors)],
        "variants": variants("KK-STRIK80", [strik_colors], price_fn=lambda v: 2995, compare_fn=lambda v: 3495 if v[0] == "Wit" else None, stock_fn=lambda v: 40, image_fn=lambda v: f"statafel-80-strik-{v[0].lower()}-hero.webp", weight=0.7),
        "images": [{"src": f"statafel-80-strik-{c.lower()}-hero.webp", "alt": f"Statafelhoes met strik Ø 80 cm {c}, schuin vooraanzicht"} for c in strik_colors],
        "metafields": [
            mf("kenmerk_kort", "single_line_text_field", "Voor Ø 80–85 cm · strik in dezelfde kleur"),
            mf("usps", "list.single_line_text_field", ["Valt tot de grond", "Strik op taillehoogte", "Wasbaar op 40 °C"]),
            mf("specificaties", "json", ROK_SPECS[:2] + ROK_SPECS[2:4]),
            mf("staffelkorting", "json", [{"vanaf": 10, "korting": 5}, {"vanaf": 25, "korting": 10}]),
            mf("faq", "json", ROK_FAQ[:1]),
        ],
    })

    P.append({
        "handle": "statafelrok-met-logo",
        "title": "Statafelrok stretch met jouw logo",
        "vendor": "Klapklaar",
        "product_type": "Bedrukte statafelrok",
        "tags": ["statafelrok", "bedrukbaar", "zakelijk", "gebruik:evenement", "gebruik:horeca"],
        "created_at": "2026-10-05T10:00:00+02:00", "published_at": "2026-10-05T10:00:00+02:00",
        "body_html": "<p>Je logo op het voorpaneel van een stretch statafelrok. Upload je logo, je krijgt eerst een drukproef. Pas na je akkoord gaan we drukken.</p>",
        "options": [opt("Kleur", ["Zwart", "Wit"]), opt("Opdruk", ["1 kant", "2 kanten"])],
        "variants": variants("KK-ROKLOGO", [["Zwart", "Wit"], ["1 kant", "2 kanten"]], price_fn=lambda v: 3995 if v[1] == "1 kant" else 4995, stock_fn=lambda v: 0, policy_fn=lambda v: "continue", image_fn=lambda v: "statafelrok-stretch-zwart-print-hero.webp", weight=0.6),
        "images": [{"src": "statafelrok-stretch-zwart-print-hero.webp", "alt": "Statafelrok stretch Zwart met voorbeeldopdruk van het Klapklaar-beeldmerk op het voorpaneel"}],
        "metafields": [
            mf("kenmerk_kort", "single_line_text_field", "Logo op het voorpaneel · drukproef vooraf"),
            mf("usps", "list.single_line_text_field", ["Eerst een drukproef, dan pas drukken", "Vanaf 10 stuks staffelprijs", "Voor statafels van Ø 80–85 cm"]),
            mf("specificaties", "json", ROK_SPECS),
            mf("staffelkorting", "json", [{"vanaf": 10, "korting": 10}, {"vanaf": 25, "korting": 15}, {"vanaf": 50, "korting": 20}]),
            mf("levertijd", "single_line_text_field", "Levertijd 10–15 werkdagen na akkoord drukproef"),
            mf("bedrukbaar", "boolean", "true"),
            mf("drukopties", "json", {"posities": ["Voorkant", "Voor- en achterkant", "Topcover"], "aanlevering": "PDF, AI, EPS, SVG of PNG van minimaal 2000 px breed", "levertijd": "10–15 werkdagen na akkoord drukproef", "min_aantal": 1}),
            mf("past_op", "list.product_reference", ["statafel-inklapbaar-80"]),
            mf("faq", "json", ROK_FAQ),
        ],
    })
    P.extend(extra_products())
    return P


SPLIT_SIZES = [("3x3", "3 x 3 m", 27900, 34), ("3x4-5", "3 x 4,5 m", 35900, 0), ("3x6", "3 x 6 m", 41900, 6)]


def split_line_products():
    """A line split into one product per size, linked with custom.andere_maten (catalog/CONTRACT.md), with the same
    handles as the real catalog: exercises the size switch (product.size-switch) and the card CTA 'Kies je kleur'."""
    out = []
    handles = [f"easy-up-partytent-premium-{k}" for k, *_ in SPLIT_SIZES]
    img = {"Rood": "tent-3x3-rood-hero.webp", "Wit": "tent-3x3-wit-hero.webp", "Zwart": "tent-3x3-zwart-hero.webp"}
    for (key, size, price, stock), handle in zip(SPLIT_SIZES, handles):
        siblings = [h for h in handles if h != handle]
        out.append({
            "handle": handle,
            "title": f"Easy-up partytent Premium {size}",
            "vendor": "Klapklaar", "product_type": "Easy-up partytent",
            "tags": ["easy-up", "partytent", "premium", "gebruik:tuinfeest"],
            "created_at": "2026-09-20T10:00:00+02:00", "published_at": "2026-09-20T10:00:00+02:00",
            "body_html": f"<p>De Premium in {size.replace(' x ', ' × ')}: stalen frame met 40 mm hexagonpoten en een dak van 320 g/m² polyester. Andere maten kies je bovenaan bij Maat.</p>",
            "options": [opt("Maat", [size]), opt("Kleur", ["Rood", "Wit", "Zwart"])],
            "variants": [
                {"sku": f"KK-EUP-{key.upper()}-{c[:3].upper()}", "option1": size, "option2": c, "price": price,
                 "inventory_quantity": (stock if c == "Rood" else 9), "inventory_management": "shopify", "inventory_policy": "deny",
                 "weight": 28, "weight_unit": "kg", "image": img[c]}
                for c in ["Rood", "Wit", "Zwart"]
            ],
            "images": [{"src": img[c], "alt": f"Easy-up partytent Premium {size.replace(' x ', ' × ')} {c.lower()}, schuin vooraanzicht"} for c in ["Rood", "Wit", "Zwart"]],
            "metafields": [
                mf("kenmerk_kort", "single_line_text_field", "40 mm staal · 320 g/m² dakdoek"),
                mf("andere_maten", "list.product_reference", siblings),
                mf("maatgids", "page_reference", "maatadvies-partytenten"),
                mf("staffelkorting", "json", [{"vanaf": 5, "korting": 5}, {"vanaf": 10, "korting": 8}]),
                mf("vergelijk_groep", "single_line_text_field", "easy-up"),
                mf("verzending", "single_line_text_field", "pakket"),
            ],
        })
    return out


COMPARISON_ARTICLE = ("easy-up-premium-of-professional", "Easy-up Premium of Professional: wat is het verschil?", "tent-3x3-wit-professional-hero.webp", ["partytent", "vergelijken"],
    "<p>Antwoord eerst: kies de Premium voor af en toe een feest, de Professional als hij elke week opgaat of zakelijk gebruikt wordt.</p><h2>Frame</h2><p>De Premium heeft een stalen frame met 40 mm poten. De Professional heeft 50 mm aluminium: lichter om te dragen en sterker in de hoeken.</p><h2>Dak</h2><p>Premium: 320 g/m² polyester, PVC-gecoat. Professional: 520 g/m² PVC, ook leverbaar als heavy duty.</p><h2>Wat ze delen</h2><p>Dezelfde maten, zijwanden, gewichten en tassen passen op beide lijnen.</p>")


def vid(handle, opts):
    """Variant id exactly as the preview store derives it (tools/preview/lib/store.rb + util.rb stable_id)."""
    seed = f"variant:{handle}:{'/'.join(opts or ['Default Title'])}"
    return 40_000_000_000_000 + (zlib.crc32(seed.encode("utf-8")) % 900_000_000_000)


def gid_variant(handle, opts):
    return f"gid://shopify/ProductVariant/{vid(handle, opts)}"


def extra_products():
    """Round 2: bundle components, the actiepakket bundle, a made-to-measure stretch tent and a discontinued tent."""
    P = []
    # Ø 70 versions of the statafel and the stretch rok (bundle components with a table-size choice)
    P.append({
        "handle": "statafel-inklapbaar-70",
        "title": "Statafel inklapbaar Ø 70 cm",
        "vendor": "Klapklaar",
        "product_type": "Statafel",
        "tags": ["statafel", "zakelijk", "gebruik:horeca", "gebruik:evenement"],
        "created_at": "2026-09-10T09:00:00+02:00", "published_at": "2026-09-10T09:00:00+02:00",
        "body_html": "<p>De compacte versie: blad van Ø 70 cm, 110 cm hoog, klapt plat. Handig in een volle zaal of op een smal terras.</p>",
        "variants": [{"sku": "KK-STA70", "price": 4495, "inventory_quantity": 80, "inventory_management": "shopify", "inventory_policy": "deny", "weight": 8.5, "weight_unit": "kg", "image": "statafel-80-kaal-hero.webp"}],
        "images": [{"src": "statafel-80-kaal-hero.webp", "alt": "Statafel inklapbaar met berken blad en zwart frame, schuin vooraanzicht"}],
        "metafields": [
            mf("kenmerk_kort", "single_line_text_field", "Ø 70 cm · 110 cm hoog · klapt plat"),
            mf("specificaties", "json", [
                {"groep": "Afmetingen", "label": "Blad", "waarde": "Ø 70 cm"},
                {"groep": "Afmetingen", "label": "Hoogte", "waarde": "110 cm"},
                {"groep": "Materiaal", "label": "Blad", "waarde": "Berken multiplex, gelakt"},
                {"groep": "Materiaal", "label": "Frame", "waarde": "Staal, zwart gepoedercoat"},
            ]),
            mf("staffelkorting", "json", [{"vanaf": 10, "korting": 5}, {"vanaf": 25, "korting": 10}]),
            mf("included", "list.single_line_text_field", ["Statafel met berken blad Ø 70 cm"]),
            mf("excluded", "list.single_line_text_field", ["Statafelrok of hoes (los te bestellen)"]),
        ],
    })
    rok70 = ["Zwart", "Wit", "Antraciet"]
    P.append({
        "handle": "statafelrok-stretch-o70",
        "title": "Statafelrok stretch Ø 70 cm",
        "vendor": "Klapklaar",
        "product_type": "Statafelrok",
        "tags": ["statafelrok", "stretch", "zakelijk", "gebruik:horeca"],
        "created_at": "2026-09-12T09:00:00+02:00", "published_at": "2026-09-12T09:00:00+02:00",
        "body_html": "<p>Dezelfde stretch rok als de Ø 80, maar dan voor statafels van Ø 65–75 cm. Topcover sluit over het blad.</p>",
        "options": [opt("Kleur", rok70)],
        "variants": variants("KK-ROK70", [rok70], price_fn=lambda v: 2295, stock_fn=lambda v: 40, image_fn=lambda v: f"statafel-80-stretch-{v[0].lower()}-hero.webp", weight=0.55),
        "images": [{"src": f"statafel-80-stretch-{c.lower()}-hero.webp", "alt": f"Statafelrok stretch {c}, schuin vooraanzicht"} for c in rok70],
        "metafields": [
            mf("kenmerk_kort", "single_line_text_field", "Voor Ø 65–75 cm · 190 g/m² stretch · wasbaar"),
            mf("specificaties", "json", [dict(r, waarde="Ø 65–75 cm") if r["label"] == "Tafelblad" else r for r in ROK_SPECS]),
            mf("included", "list.single_line_text_field", ["Stretch rok met topcover"]),
            mf("maatgids", "page_reference", "maatadvies-statafelrokken"),
        ],
    })

    # Actiepakket: a bundle product. Components per bundle variant (variant metafields), so the table size and the
    # rok colour pick the exact component variants and the savings line is computed from real component prices.
    sizes = ["Ø 70 cm", "Ø 80 cm"]
    colors = ["Zwart", "Wit", "Antraciet"]
    bundle_price = {"Ø 70 cm": 24500, "Ø 80 cm": 26900}
    bvars = []
    for size in sizes:
        for color in colors:
            table = ("statafel-inklapbaar-70", []) if size == "Ø 70 cm" else ("statafel-inklapbaar-80", [])
            rok = ("statafelrok-stretch-o70", [color]) if size == "Ø 70 cm" else ("statafelrok-stretch-o80", [color])
            bvars.append({
                "sku": f"KK-PAK44-{size[2:4]}-{color[:3].upper()}",
                "option1": size, "option2": color,
                "price": bundle_price[size], "compare_at_price": None,
                "inventory_quantity": 12, "inventory_management": "shopify", "inventory_policy": "deny",
                "weight": 40, "weight_unit": "kg",
                "image": f"statafel-80-stretch-{color.lower()}-hero.webp",
                "metafields": [
                    mf("componenten", "list.variant_reference", [gid_variant(*table), gid_variant(*rok)]),
                    mf("component_aantallen", "list.number_integer", [4, 4]),
                ],
            })
    P.append({
        "handle": "actiepakket-4-statafels-4-rokken",
        "title": "Actiepakket: 4 statafels + 4 stretch rokken",
        "vendor": "Klapklaar",
        "product_type": "Actiepakket",
        "tags": ["set", "statafel", "statafelrok", "zakelijk", "gebruik:evenement", "gebruik:horeca"],
        "created_at": "2026-07-01T10:00:00+02:00", "published_at": "2026-07-01T10:00:00+02:00",
        "body_html": "<p>Vier inklapbare statafels en vier stretch rokken in één keer. Kies de tafelmaat en de kleur van de rokken; de rokken passen precies op de tafels uit het pakket.</p><p>Wat je bespaart, zie je meteen naast de prijs: dat is het verschil met de losse prijzen van dezelfde producten.</p>",
        "options": [opt("Tafelmaat", sizes), opt("Kleur rokken", colors)],
        "variants": bvars,
        "images": [{"src": f"statafel-80-stretch-{c.lower()}-hero.webp", "alt": f"Statafel met stretch rok {c} uit het actiepakket, schuin vooraanzicht"} for c in colors]
                  + [{"src": "statafel-80-ingeklapt.webp", "alt": "Statafel uit het actiepakket, ingeklapt"}],
        "metafields": [
            mf("kenmerk_kort", "single_line_text_field", "4 statafels Ø 70 of 80 cm · 4 stretch rokken"),
            mf("usps", "list.single_line_text_field", ["Rokken passen precies op de tafels uit het pakket", "Eén bestelling, één levering", "Losse onderdelen later bij te bestellen"]),
            mf("verzending", "single_line_text_field", "pallet"),
            mf("included", "list.single_line_text_field", ["4 inklapbare statafels in de gekozen maat", "4 stretch rokken met topcover in de gekozen kleur"]),
            mf("maatgids", "page_reference", "maatadvies-statafelrokken"),
        ],
    })

    # Made to measure: price per m² (variant price), size via line-item properties, quantity = m².
    st_colors = ["Wit", "Zandkleur", "Zwart"]
    st_poles = ["Zonder palen", "Met palenset"]
    st_price = {"Zonder palen": 2750, "Met palenset": 3650}
    P.append({
        "handle": "stretchtent-op-maat",
        "title": "Stretchtent op maat",
        "vendor": "Klapklaar",
        "product_type": "Stretchtent",
        "tags": ["stretchtent", "maatwerk", "zakelijk", "gebruik:evenement", "gebruik:horeca"],
        "created_at": "2026-10-08T10:00:00+02:00", "published_at": "2026-10-08T10:00:00+02:00",
        "body_html": "<p>Een stretchtent in precies de maat van jouw terras, tuin of festivalplek. Je vult lengte en breedte in, kiest kleur, palen en afspanning, en ziet direct de prijs.</p><p>Het doek is waterafstotend en brandvertragend behandeld volgens opgave van de leverancier. We maken hem pas als jouw bestelling binnen is.</p>",
        "options": [opt("Kleur", st_colors), opt("Palen", st_poles)],
        "variants": variants("KK-STRMAAT", [st_colors, st_poles], price_fn=lambda v: st_price[v[1]], stock_fn=lambda v: 0,
                             policy_fn=lambda v: "continue", image_fn=lambda v: "stretchtent-10x15.png", weight=1),
        "images": [{"src": "stretchtent-10x15.png", "alt": "Stretchtent in zandkleur, opgespannen met palen"}],
        "metafields": [
            mf("kenmerk_kort", "single_line_text_field", "Op maat van 5 × 4 tot 25 × 20 m · prijs per m²"),
            mf("usps", "list.single_line_text_field", ["Prijs direct berekend op jouw maat", "Waterafstotend doek", "Palenset en afspanning naar keuze"]),
            mf("configurator", "json", {
                "type": "oppervlakte", "eenheid": "m²",
                "velden": [
                    {"id": "lengte", "label": "Lengte", "min": 5, "max": 25, "stap": 0.5, "standaard": 10, "eenheid": "m"},
                    {"id": "breedte", "label": "Breedte", "min": 4, "max": 20, "stap": 0.5, "standaard": 7.5, "eenheid": "m"},
                ],
                "keuzes": [{"label": "Afspanning", "opties": ["Spanbanden met ratel", "Touwset met haringen"]}],
                "min_afname": 20, "tolerantie": "± 2 cm per meter", "maatwerk": True,
            }),
            mf("levertijd", "single_line_text_field", "Op maat gemaakt: levertijd 3–4 weken"),
            mf("verzending", "single_line_text_field", "pakket"),
            mf("included", "list.single_line_text_field", ["Stretchdoek op jouw maat met versterkte ophangpunten", "Afspanning naar keuze", "Opbergtas"]),
            mf("excluded", "list.single_line_text_field", ["Palen (kies ‘Met palenset’)", "Grondanker voor verharde grond"]),
            mf("specificaties", "json", [
                {"groep": "Doek", "label": "Materiaal", "waarde": "Polyester stretch, PU-gecoat"},
                {"groep": "Doek", "label": "Waterafstotend", "waarde": "Ja"},
                {"groep": "Maatwerk", "label": "Maattolerantie", "waarde": "± 2 cm per meter"},
                {"groep": "Maatwerk", "label": "Retour", "waarde": "Niet mogelijk (maatwerk)"},
            ]),
        ],
    })

    # Discontinued: page stays for search engines, no add to cart, alternatives shown.
    P.append({
        "handle": "partytent-easy-up-basic-3x3",
        "title": "Easy-up partytent Basic 3 × 3 m",
        "vendor": "Klapklaar",
        "product_type": "Partytent",
        "tags": ["easy-up", "partytent"],
        "created_at": "2026-03-01T10:00:00+02:00", "published_at": "2026-03-01T10:00:00+02:00",
        "body_html": "<p>De Basic was onze instap-easy-up met een stalen frame van 30 mm. We verkopen hem niet meer. Kijk voor dezelfde maat naar de Premium of de Professional.</p>",
        "variants": [{"sku": "KK-EUB33", "price": 19900, "inventory_quantity": 0, "inventory_management": "shopify", "inventory_policy": "deny", "weight": 22, "weight_unit": "kg", "image": "tent-3x3-wit-front.webp"}],
        "images": [{"src": "tent-3x3-wit-front.webp", "alt": "Easy-up partytent 3 × 3 m Wit, vooraanzicht"}],
        "metafields": [
            mf("kenmerk_kort", "single_line_text_field", "30 mm staal · 220 g/m² dakdoek"),
            mf("availability_status", "single_line_text_field", "permanent-uitverkocht"),
            mf("alternatieven", "list.product_reference", ["partytent-easy-up-premium", "partytent-easy-up-professional"]),
        ],
    })
    return P


def collections():
    C = []

    def col(handle, title, prods=None, rules=None, image=None, intro=None, kenmerken=None, seo=None, sort="manual"):
        c = {"handle": handle, "title": title, "sort_order": sort, "metafields": []}
        if prods is not None:
            c["products"] = prods
        if rules is not None:
            c["rules"] = rules
        if image:
            c["image"] = {"src": image, "alt": title}
        if intro:
            c["metafields"].append(mf("intro", "multi_line_text_field", intro))
        if kenmerken:
            c["metafields"].append(mf("kenmerken", "list.single_line_text_field", kenmerken))
        if seo:
            c["metafields"].append(mf("seo_tekst", "rich_text_field", seo))
        return c

    C.append(col("easy-up-partytenten", "Easy-up partytenten",
                 prods=["partytent-easy-up-premium", "partytent-easy-up-professional", "partytent-met-logo", "easy-up-partytent-premium", "easy-up-partytent-professional-3x6", "partytent-easy-up-basic-3x3"],
                 image="tent-3x3-klaproos-hero.webp",
                 intro="Uitklappen, dak erover, klaar. Easy-up tenten van 3 × 3 tot 4 × 8 m, met een stalen of aluminium frame.",
                 kenmerken=["Staat in een paar minuten", "Staal of aluminium", "Zijwanden los erbij"],
                 seo=rich(("h2", "Welke easy-up partytent past bij jou?"), ("p", "Gebruik je hem een paar keer per jaar in de tuin, dan is de Premium met stalen frame genoeg. Sta je elke week op de markt of verhuur je tenten, kies dan de Professional: aluminium, lichter en roestvrij."), ("h3", "Maat kiezen"), ("p", "Een 3 × 3 m tent biedt ruimte aan ongeveer 8 staande gasten of 2 marktkramen. Met 3 × 6 m heb je plek voor een buffet en een paar statafels."))))
    C.append(col("easy-up-premium", "Easy-up Premium", prods=["partytent-easy-up-premium", "easy-up-partytent-premium"], image="tent-3x3-wit-hero.webp",
                 intro="Stalen frame met 40 mm poten en een dak van 320 g/m². Voor tuin, feest en markt."))
    C.append(col("easy-up-professional", "Easy-up Professional", prods=["partytent-easy-up-professional", "easy-up-partytent-professional-3x6"], image="tent-3x3-rood-professional-gewichten-hero.webp",
                 intro="Aluminium frame met 50 mm poten en een PVC-dak van 520 g/m². Voor wekelijks gebruik en verhuur."))
    C.append(col("bedrukte-partytenten", "Bedrukte partytenten", prods=["partytent-met-logo", "bedrukte-partytent-3x3"], image="tent-3x3-klaproos-logo-hero.webp",
                 intro="Jouw logo op de luifel of het dak. Eerst een drukproef, dan drukken we.", kenmerken=["Drukproef vooraf", "Vanaf 1 stuk", "Staffelprijs vanaf 3 stuks"]))
    C.append(col("stretchtenten", "Stretchtenten", prods=["stretchtent-op-maat", "stretchtent-10x15"], intro="Een vrije vorm die opvalt. Voor tuinfeesten, festivals en terrassen."))
    C.append(col("statafelhoezen-met-strik", "Statafelhoezen met strik", prods=["statafelhoes-met-strik-80", "statafelrok-met-strik"], image="statafel-80-strik-wit-hero.webp",
                 intro="Een hoes tot op de grond met een strik op taillehoogte. Voor bruiloft, receptie en jubileum."))
    C.append(col("bedrukte-statafelhoezen", "Bedrukte statafelrokken", prods=["statafelrok-met-logo"], image="statafelrok-stretch-zwart-print-hero.webp",
                 intro="Je logo op een stretch statafelrok. Eerst een drukproef, vanaf 10 stuks staffelprijs.", kenmerken=["Drukproef vooraf", "Staffelprijs vanaf 10 stuks"]))
    C.append(col("zakelijk", "Zakelijk", rules=[{"column": "tag", "relation": "equals", "condition": "zakelijk"}], image="tent-3x3-rood-professional-gewichten-hero.webp",
                 intro="Producten voor horeca, evenementen en verhuur. Prijzen ook excl. btw, staffels vanaf 10 stuks."))
    C.append(col("actiepakketten", "Actiepakketten", prods=["actiepakket-4-statafels-4-rokken"], intro="Statafels en rokken in één keer, voordeliger dan los."))
    return C


EXISTING_COLLECTION_EXTRAS = {
    "partytenten": {
        "image": {"src": "tent-3x3-klaproos-hero.webp", "alt": "Partytenten"},
        "metafields": [
            mf("intro", "multi_line_text_field", "Easy-up, stretch of met jouw logo. Kies je maat, wij zorgen dat hij klaarstaat."),
            mf("kenmerken", "list.single_line_text_field", ["3 × 3 tot 4 × 8 m", "Staal of aluminium", "Zijwanden en gewichten los erbij"]),
            mf("seo_tekst", "rich_text_field", rich(("h2", "Een partytent kopen: waar let je op?"), ("p", "Kijk eerst naar het frame: staal is zwaarder en goedkoper, aluminium is licht en roest niet. Daarna het dak: hoe hoger het gewicht in g/m², hoe steviger het doek."), ("h3", "Vastzetten"), ("p", "Elke tent heeft gewichten of haringen nodig. Reken op minimaal 10 kg per poot op verharde grond."))),
        ],
    },
    "statafels": {
        "add_products": ["statafel-inklapbaar-80", "statafel-inklapbaar-70"],
        "image": {"src": "statafel-80-kaal-hero.webp", "alt": "Statafels"},
        "metafields": [
            mf("intro", "multi_line_text_field", "Statafels die plat klappen, met rokken en hoezen in elke kleur."),
            mf("kenmerken", "list.single_line_text_field", ["Klapt plat", "Ø 80 cm", "Staffelprijs vanaf 10 stuks"]),
        ],
    },
    "statafelrokken": {
        "add_products": ["statafelrok-stretch-o70"],
        "image": {"src": "statafel-80-stretch-zwart-hero.webp", "alt": "Statafelrokken"},
        "metafields": [
            mf("intro", "multi_line_text_field", "Stretch of met strik, voor statafels van Ø 70 tot 85 cm. Strak zonder strijken."),
            mf("kenmerken", "list.single_line_text_field", ["Voor Ø 70–85 cm", "Wasbaar op 40 °C", "Staffelprijs vanaf 10 stuks"]),
        ],
    },
    "accessoires": {
        "metafields": [mf("intro", "multi_line_text_field", "Zijwanden, gewichten, verlichting en alles wat je tent compleet maakt.")],
    },
}


PAST_OP = {
    "gewichten-set-4x10kg": ["partytent-easy-up-premium", "partytent-easy-up-professional", "partytent-met-logo", "easy-up-partytent-premium", "easy-up-partytent-professional-3x6", "partytent-easy-up-basic-3x3"],
    "zijwand-3m": ["partytent-easy-up-premium", "partytent-easy-up-professional", "easy-up-partytent-premium", "easy-up-partytent-professional-3x6"],
    "statafelhoes-met-strik-80": ["statafel-inklapbaar-80"],
}


def link(title, typ=None, handle=None, url=None, items=None):
    d = {"title": title}
    if typ:
        d["type"] = typ
    if handle:
        d["handle"] = handle
    if url:
        d["url"] = url
    if items:
        d["items"] = items
    return d


def menus():
    main = {"handle": "main-menu", "title": "Hoofdmenu", "items": [
        link("Partytenten", "collection", "partytenten", items=[
            link("Easy-up partytenten", "collection", "easy-up-partytenten", items=[
                link("Easy-up Premium", "collection", "easy-up-premium"),
                link("Easy-up Professional", "collection", "easy-up-professional"),
                link("Premium partytent", "product", "partytent-easy-up-premium"),
            ]),
            link("Stretchtenten", "collection", "stretchtenten", items=[link("Stretchtent op maat", "product", "stretchtent-op-maat"), link("Stretchtent 10 × 15 m", "product", "stretchtent-10x15")]),
            link("Met jouw logo", "collection", "bedrukte-partytenten", items=[
                link("Bedrukte partytent 3 × 3 m", "product", "partytent-met-logo"),
                link("Zo werkt bedrukken", "page", "bedrukken"),
            ]),
            link("Onderdelen & accessoires", "collection", "accessoires", items=[
                link("Zijwanden", "product", "zijwand-3m"),
                link("Gewichten", "product", "gewichten-set-4x10kg"),
                link("Verlichting", "product", "led-prikkabel-10m"),
            ]),
        ]),
        link("Statafels", "collection", "statafels", items=[
            link("Statafels", "collection", "statafels", items=[
                link("Statafel inklapbaar Ø 80 cm", "product", "statafel-inklapbaar-80"),
                link("Statafel Ø 70–85 cm", "product", "statafel-o80"),
            ]),
            link("Statafelrokken", "collection", "statafelrokken", items=[
                link("Stretch Ø 80 cm", "product", "statafelrok-stretch-o80"),
                link("Met strik", "collection", "statafelhoezen-met-strik"),
                link("Maatadvies", "page", "maatadvies-statafelrokken"),
            ]),
            link("Met jouw logo", "collection", "bedrukte-statafelhoezen", items=[link("Statafelrok met logo", "product", "statafelrok-met-logo")]),
            link("Actiepakketten", "collection", "actiepakketten", items=[link("4 statafels + 4 rokken", "product", "actiepakket-4-statafels-4-rokken")]),
        ]),
        link("Rokken & hoezen", "collection", "statafelrokken", items=[
            link("Stretch rokken", "product", "statafelrok-stretch-o80"),
            link("Hoezen met strik", "collection", "statafelhoezen-met-strik"),
            link("Met jouw logo", "collection", "bedrukte-statafelhoezen"),
        ]),
        link("Accessoires", "collection", "accessoires"),
        link("Aanbiedingen", "collection", "aanbiedingen"),
        link("Zakelijk", "page", "zakelijk"),
        link("Advies", "blog", "advies"),
    ]}
    return [
        main,
        {"handle": "footer-assortiment", "title": "Winkel", "items": [
            link("Partytenten", "collection", "partytenten"), link("Easy-up partytenten", "collection", "easy-up-partytenten"),
            link("Statafels", "collection", "statafels"), link("Statafelrokken", "collection", "statafelrokken"),
            link("Met jouw logo", "collection", "bedrukte-partytenten"), link("Accessoires", "collection", "accessoires"),
            link("Aanbiedingen", "collection", "aanbiedingen")]},
        {"handle": "footer-klantenservice", "title": "Hulp", "items": [
            link("Contact", "page", "contact"), link("Veelgestelde vragen", "page", "veelgestelde-vragen"),
            link("Verzenden en bezorgen", "page", "verzenden-en-bezorgen"), link("Retourneren", "page", "retourneren"),
            link("Garantie en klachten", "page", "garantie"), link("Handleidingen", "page", "handleidingen"), link("Betaalmethoden", "page", "betaalmethoden"),
            link("Maatadvies statafelrokken", "page", "maatadvies-statafelrokken")]},
        {"handle": "footer-klapklaar", "title": "Over Klapklaar", "items": [
            link("Over ons", "page", "over-ons"), link("Zakelijk bestellen", "page", "zakelijk"), link("Offerte aanvragen", "page", "offerte"),
            link("Bedrukken", "page", "bedrukken"), link("Advies & inspiratie", "blog", "advies")]},
        {"handle": "footer-juridisch", "title": "Juridisch", "items": [
            link("Algemene voorwaarden", "policy", "terms-of-service"), link("Privacy", "policy", "privacy-policy"), link("Cookies", "page", "cookies")]},
    ]


def pages():
    return [
        {"handle": "offerte", "title": "Offerte aanvragen", "template_suffix": "offerte",
         "body_html": "<p>Grote aantallen, eigen bedrukking of levering op locatie? Vul in wat je nodig hebt. Je krijgt een offerte op maat, met prijzen excl. btw.</p>"},
        {"handle": "bedrukken", "title": "Bedrukken met jouw logo", "template_suffix": "bedrukken",
         "body_html": "<p>Je logo op een partytent of statafelrok. Je uploadt je logo, wij maken een drukproef en pas na jouw akkoord gaan we drukken. De levertijd gaat in na je akkoord.</p>"},
        {"handle": "veelgestelde-vragen", "title": "Veelgestelde vragen", "template_suffix": "faq",
         "body_html": "<p>Staat je vraag er niet bij? Bel, app of mail ons.</p>"},
        {"handle": "verzenden-en-bezorgen", "title": "Verzenden en bezorgen",
         "body_html": "<p>Pakketten verzenden we op werkdagen. Grote tenten en pakketten gaan per pallet; die leveren we op afspraak.</p><h2>Wanneer heb ik het?</h2><p>Op elke productpagina zie je de verwachte leverdatum. Die rekent met onze besteltijd en verzenddagen.</p><h2>Verzendkosten</h2><p>De verzendkosten zie je bij het afrekenen, voordat je betaalt.</p>"},
        {"handle": "garantie", "title": "Garantie en klachten", "template_suffix": "garantie",
         "body_html": "<p>Gaat er iets mis met je product? Meld het hieronder met je bestelnummer, dan zoeken we samen een oplossing.</p>"},
        {"handle": "handleidingen", "title": "Handleidingen", "template_suffix": "handleidingen",
         "body_html": "<p>Opzetinstructies, productbladen en drukbestanden per product, als PDF. Zoek op productnaam of kies een categorie.</p>"},
        {"handle": "maatadvies-partytenten", "title": "Welke maat partytent heb je nodig?",
         "body_html": "<p>Reken voor staande gasten op ongeveer 1 m² per persoon, voor zittende gasten aan tafels op 1,5 tot 2 m².</p><table><thead><tr><th>Maat</th><th>Staand</th><th>Zittend</th></tr></thead><tbody><tr><td>3 × 3 m</td><td>8–9 gasten</td><td>4–6 gasten</td></tr><tr><td>3 × 4,5 m</td><td>12–14 gasten</td><td>6–9 gasten</td></tr><tr><td>3 × 6 m</td><td>16–18 gasten</td><td>9–12 gasten</td></tr><tr><td>4 × 4 m</td><td>14–16 gasten</td><td>8–10 gasten</td></tr></tbody></table><p>Zet je er statafels of een buffet onder? Trek dan per statafel ongeveer 1 m² af.</p>"},
        {"handle": "betaalmethoden", "title": "Betaalmethoden",
         "body_html": "<p>Je betaalt veilig bij het afrekenen. Welke methoden je ziet, hangt af van je land.</p>"},
        {"handle": "maatadvies-statafelrokken", "title": "Maatadvies statafelrokken",
         "body_html": "<p>Meet het blad van je statafel van rand tot rand, en de hoogte van de vloer tot de bovenkant van het blad.</p><table><thead><tr><th>Blad</th><th>Hoogte</th><th>Kies</th></tr></thead><tbody><tr><td>Ø 70–75 cm</td><td>105–115 cm</td><td>Rok Ø 70</td></tr><tr><td>Ø 80–85 cm</td><td>105–115 cm</td><td>Rok Ø 80</td></tr></tbody></table>"},
        {"handle": "cookies", "title": "Cookies", "body_html": "<p>We gebruiken alleen cookies die nodig zijn voor de winkel, tenzij je toestemming geeft voor meer.</p>"},
    ]


ARTICLES = [
    ("easy-up-partytent-opzetten", "Zo zet je een easy-up partytent op", "tent-3x3-wit-hero.webp", ["opzetten", "partytent"],
     "<p>Met twee man staat een easy-up in een paar minuten. Zo doe je het zonder gedoe.</p><h2>1. Frame uittrekken</h2><p>Zet het ingeklapte frame rechtop. Pak ieder een kant vast en loop rustig achteruit tot het schaarframe bijna open is.</p><h2>2. Dak erover</h2><p>Leg het dak over het half open frame en maak de klittenbanden aan de hoeken vast. Dat gaat makkelijker nu het frame nog laag staat.</p><h2>3. Op hoogte zetten</h2><p>Duw de hoeken omhoog tot de schuifjes vastklikken. Zet daarna de poten één voor één op de goede hoogte.</p><h2>4. Vastzetten</h2><p>Zet elke poot vast met een haring of een voetgewicht. Pas als hij vaststaat, hang je zijwanden en versiering op.</p>"),
    ("welke-statafelrok-past", "Welke statafelrok past op jouw statafel?", "statafel-80-stretch-zwart-hero.webp", ["statafels", "maatadvies"],
     "<p>Een rok die niet past, valt scheef of trekt de tafel uit balans. Meet daarom eerst twee dingen.</p><h2>Meet het blad</h2><p>Meet van rand tot rand, door het midden. De meeste statafels zijn Ø 70, 80 of 85 cm.</p><h2>Meet de hoogte</h2><p>Van de vloer tot de bovenkant van het blad. Stretch rokken zijn gemaakt voor 105 tot 115 cm.</p><h2>Stretch of strik?</h2><p>Stretch zit strak en hoeft niet gestreken. Een hoes met strik valt losser tot de grond en past bij bruiloften en recepties.</p>"),
    ("hoeveel-statafels-per-gast", "Hoeveel statafels heb je nodig per gast?", "statafel-80-kaal-hero.webp", ["statafels", "planning"],
     "<p>Antwoord eerst: reken op één statafel per 6 tot 8 staande gasten.</p><h2>Borrel of receptie</h2><p>Mensen lopen rond en zetten even hun glas neer. Eén tafel per 8 gasten is dan genoeg.</p><h2>Walking dinner</h2><p>Gasten eten aan de tafel. Reken dan op één tafel per 4 tot 6 gasten.</p>"),
    ("partytent-onderhouden-en-opbergen", "Partytent onderhouden en opbergen", "tent-3x3-wit-detail.webp", ["onderhoud", "partytent"],
     "<p>Een tent die droog en schoon wordt opgeborgen, gaat jaren mee.</p><h2>Altijd droog inpakken</h2><p>Pak het dak nooit nat in. Is het toch nat, laat het thuis dan uitgespreid drogen.</p><h2>Schoonmaken</h2><p>Lauw water en een zachte borstel. Geen hogedrukspuit: die beschadigt de coating.</p>"),
    ("partytent-verankeren-bij-wind", "Je partytent goed vastzetten", "tent-3x3-rood-professional-gewichten-hero.webp", ["veiligheid", "partytent"],
     "<p>Een tent zonder gewichten of haringen hoort niet buiten te staan. Zo zet je hem goed vast.</p><h2>Op gras</h2><p>Gebruik haringen door de voetplaten en span de scheerlijnen schuin naar buiten.</p><h2>Op tegels of asfalt</h2><p>Gebruik voetgewichten van minimaal 10 kg per poot. Bij een 3 × 6 m tent zet je er ook gewichten op de middelste poten.</p><h2>Bij harde wind</h2><p>Haal het dak eraf. Een dak vangt wind als een zeil.</p>"),
    ("logo-aanleveren-voor-bedrukking", "Bedrukken: zo lever je je logo aan", "tent-3x3-rood-logo-hero.webp", ["bedrukken", "zakelijk"],
     "<p>Hoe beter je bestand, hoe scherper de opdruk. Dit werkt het best.</p><h2>Vectorbestand</h2><p>Een PDF, AI, EPS of SVG is ideaal: die kun je eindeloos vergroten.</p><h2>Geen vector?</h2><p>Stuur een PNG van minimaal 2000 px breed. Wij maken hem drukklaar en je ziet het resultaat eerst in de drukproef.</p><h2>Kleuren</h2><p>Geef je Pantone- of HEX-kleuren door als je die hebt. Dan matchen we je huisstijl zo goed mogelijk.</p>"),
]


ARTICLE_PRODUCTS = {
    "easy-up-partytent-opzetten": ["partytent-easy-up-premium", "partytent-easy-up-professional", "gewichten-set-4x10kg"],
    "welke-statafelrok-past": ["statafelrok-stretch-o80", "statafelrok-stretch-o70", "statafelhoes-met-strik-80", "statafel-inklapbaar-80"],
    "hoeveel-statafels-per-gast": ["statafel-inklapbaar-80", "actiepakket-4-statafels-4-rokken", "statafelrok-stretch-o80"],
    "partytent-onderhouden-en-opbergen": ["partytent-easy-up-premium", "zijwand-3m"],
    "partytent-verankeren-bij-wind": ["gewichten-set-4x10kg", "partytent-easy-up-professional"],
    "logo-aanleveren-voor-bedrukking": ["partytent-met-logo", "statafelrok-met-logo"],
    "easy-up-premium-of-professional": ["partytent-easy-up-premium", "partytent-easy-up-professional"],
}
ARTICLE_IMAGE_ALT = {
    "easy-up-partytent-opzetten": "Easy-up partytent 3 × 3 m Wit, schuin vooraanzicht",
    "welke-statafelrok-past": "Statafel met zwarte stretch rok, schuin vooraanzicht",
    "hoeveel-statafels-per-gast": "Statafel Ø 80 cm met berken blad",
    "partytent-onderhouden-en-opbergen": "Hoekstuk en schaarframe van een easy-up, detail",
    "partytent-verankeren-bij-wind": "Rode easy-up Professional met voetgewichten op elke poot",
    "logo-aanleveren-voor-bedrukking": "Rode easy-up met voorbeeldopdruk Klapklaar op de luifel",
    "easy-up-premium-of-professional": "Easy-up Professional 3 × 3 m wit, schuin vooraanzicht",
}


def blog():
    arts = []
    for i, (handle, title, img, tags, body) in enumerate(ARTICLES + [COMPARISON_ARTICLE]):
        a = {
            "handle": handle, "title": title, "author": "Team Klapklaar", "body_html": body,
            "summary_html": body.split("</p>")[0] + "</p>",
            "image": {"src": img, "alt": ARTICLE_IMAGE_ALT.get(handle, title)}, "tags": tags,
            "published_at": f"2026-10-{15 - i * 2:02d}T09:00:00+02:00",
        }
        if handle in ARTICLE_PRODUCTS:
            a["metafields"] = [mf("producten", "list.product_reference", ARTICLE_PRODUCTS[handle])]
        arts.append(a)
    return {"handle": "advies", "title": "Advies & inspiratie", "comments": "disabled", "articles": arts}


def upsert(lst, item, key="handle"):
    for i, x in enumerate(lst):
        if x.get(key) == item[key]:
            lst[i] = item
            return
    lst.append(item)


PDFS = {
    "handleiding-easy-up-premium.pdf": ("Opzetinstructie", "Easy-up partytent Premium", ["Frame rechtop zetten en met twee man uittrekken.", "Dak over het half open frame leggen, klittenband vastmaken.", "Hoeken omhoog duwen tot de schuifjes klikken.", "Poten op hoogte zetten en elke poot vastzetten."]),
    "productblad-easy-up-premium.pdf": ("Productblad", "Easy-up partytent Premium", ["Frame: staal, 40 mm hexagon, 5 standen.", "Dak: polyester 320 g/m², PVC-gecoat.", "Maten: 3 × 3, 3 × 4,5 en 3 × 6 m."]),
    "productblad-easy-up-professional.pdf": ("Productblad", "Easy-up partytent Professional", ["Frame: aluminium, 50 mm hexagon.", "Dak: PVC 520 g/m².", "Maten: 3 × 3, 3 × 6 en 4 × 4 m."]),
    "drukbestand-luifel-easy-up-3x3.pdf": ("Drukbestand", "Luifel easy-up 3 × 3 m", ["Luifelhoogte en veilige zone staan op het sjabloon.", "Lever vectoren aan (PDF, AI, EPS of SVG).", "Je krijgt altijd eerst een drukproef."]),
    "handleiding-statafel-inklapbaar.pdf": ("Opzetinstructie", "Statafel inklapbaar", ["Blad omhoog klappen tot het vergrendelt.", "Poten uitklappen en controleren of hij recht staat.", "Inklappen: vergrendeling indrukken, blad omlaag."]),
}


def make_pdfs():
    """Small placeholder PDFs (clearly marked as preview samples) for the downloads / handleidingen features."""
    from PIL import ImageDraw, ImageFont
    font_dir = os.path.join(SCRATCH, "vendor", "gfonts", "ofl", "figtree")
    ttf = None
    if os.path.isdir(font_dir):
        cands = [f for f in os.listdir(font_dir) if f.endswith(".ttf")]
        ttf = os.path.join(font_dir, sorted(cands)[0]) if cands else None

    def font(size):
        try:
            return ImageFont.truetype(ttf, size) if ttf else ImageFont.load_default()
        except OSError:
            return ImageFont.load_default()

    for name, (kind, title, lines) in PDFS.items():
        dst = os.path.join(IMG_DIR, name)
        if os.path.exists(dst):
            continue
        im = Image.new("RGB", (1240, 1754), "#FFFFFF")
        dr = ImageDraw.Draw(im)
        dr.rectangle([0, 0, 1240, 120], fill="#154F3E")
        dr.text((80, 40), "Klapklaar", fill="#FBF6EC", font=font(44))
        dr.text((80, 200), kind, fill="#5D625C", font=font(34))
        dr.text((80, 250), title, fill="#1D2420", font=font(56))
        y = 380
        for i, line in enumerate(lines, 1):
            dr.text((80, y), f"{i}. {line}", fill="#1D2420", font=font(32))
            y += 70
        dr.text((80, 1640), "Voorbeeldbestand voor de preview van de webshop.", fill="#5D625C", font=font(26))
        im.save(dst, "PDF", resolution=150)


def main():
    copy_images()
    make_pdfs()
    path = os.path.join(HERE, "sample.json")
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    for p in products() + split_line_products():
        upsert(data["products"], p)
    for c in collections():
        upsert(data["collections"], c)
    for c in data["collections"]:
        extra = EXISTING_COLLECTION_EXTRAS.get(c["handle"])
        if not extra:
            continue
        if "image" in extra:
            c["image"] = extra["image"]
        for h in extra.get("add_products", []):
            if "products" in c and h not in c["products"]:
                c["products"].append(h)
        have = {(m["namespace"], m["key"]) for m in c.get("metafields") or []}
        c["metafields"] = [m for m in (c.get("metafields") or []) if (m["namespace"], m["key"]) not in {(x["namespace"], x["key"]) for x in extra["metafields"]}] + extra["metafields"]
        del have
    # availability_status example on a base product: sold out now, 'Binnenkort leverbaar' instead of a plain sold-out
    for prod in data["products"]:
        if prod["handle"] == "led-prikkabel-10m":
            mfs = [m for m in (prod.get("metafields") or []) if m.get("key") != "availability_status"]
            mfs.append(mf("availability_status", "single_line_text_field", "binnenkort"))
            prod["metafields"] = mfs
    # compatibility (custom.past_op) on accessories: 'Vergeet niet' in the cart suggests what fits the cart
    for prod in data["products"]:
        fits = PAST_OP.get(prod["handle"])
        if fits:
            prod["metafields"] = [m for m in (prod.get("metafields") or []) if m.get("key") != "past_op"] + [mf("past_op", "list.product_reference", fits)]
    # custom.subcollections is not in catalog/CONTRACT.md: drop it from older fixture runs
    for c in data["collections"]:
        if c.get("metafields"):
            c["metafields"] = [m for m in c["metafields"] if m.get("key") != "subcollections"]
    # split line in the easy-up collections (appended, so the existing grid order stays)
    for c in data["collections"]:
        if c["handle"] in ("easy-up-premium", "easy-up-partytenten") and "products" in c:
            for h in [f"easy-up-partytent-premium-{k}" for k, *_ in SPLIT_SIZES]:
                if h not in c["products"]:
                    c["products"].append(h)
    # brand v6 4.2: a product colour is named after the cloth (Rood), never after the brand colour (Klaproos)
    # the old Klaproos renders (v5/v6 brand red) give way to the stock-red renders (brand v7 8.1: never the brand colour as cloth)
    ren_img = {"tent-3x3-klaproos-logo-hero.webp": "tent-3x3-rood-logo-hero.webp", "tent-3x3-klaproos-logo-front.webp": "tent-3x3-rood-logo-front.webp",
               "tent-3x3-klaproos-hero.webp": "tent-3x3-rood-hero.webp", "tent-3x3-klaproos-front.webp": "tent-3x3-rood-hero.webp",
               "tent-3x6-klaproos-hero.webp": "tent-3x3-rood-hero.webp"}
    for prod in data["products"]:
        for o in prod.get("options") or []:
            for v in o["values"]:
                if v.get("name") == "Klaproos":
                    v["name"] = "Rood"
        for v in prod.get("variants") or []:
            for k in ("option1", "option2", "option3"):
                if v.get(k) == "Klaproos":
                    v[k] = "Rood"
            if v.get("image") in ren_img:
                v["image"] = ren_img[v["image"]]
        seen = set()
        imgs = []
        for im in prod.get("images") or []:
            im["src"] = ren_img.get(im["src"], im["src"])
            if im.get("alt"):
                im["alt"] = im["alt"].replace("Klaproos", "rood")
            if im["src"] not in seen:
                seen.add(im["src"])
                imgs.append(im)
        if prod.get("images"):
            prod["images"] = imgs
        for m in prod.get("metafields") or []:
            if isinstance(m.get("value"), str) and "Klaproos" in m["value"]:
                m["value"] = m["value"].replace("Klaproos", "Rood")
    for c in data["collections"]:
        if c.get("image") and c["image"].get("src") in ren_img:
            c["image"]["src"] = ren_img[c["image"]["src"]]
    for m in menus():
        upsert(data["menus"], m)
    for pg in pages():
        upsert(data["pages"], pg)
    for pg in data["pages"]:
        if pg["handle"] == "zakelijk":
            pg["template_suffix"] = "zakelijk"
    upsert(data["blogs"], blog())
    comp = data.setdefault("complementary", {})
    comp["partytent-easy-up-premium"] = ["gewichten-set-4x10kg", "zijwand-3m", "led-prikkabel-10m"]
    comp["statafel-inklapbaar-80"] = ["statafelrok-stretch-o80", "statafelhoes-met-strik-80"]
    comp["statafelrok-stretch-o80"] = ["statafel-inklapbaar-80", "statafelhoes-met-strik-80"]
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("extended", path, "products:", len(data["products"]), "collections:", len(data["collections"]), "pages:", len(data["pages"]))


if __name__ == "__main__":
    main()
