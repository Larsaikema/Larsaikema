#!/usr/bin/env python3
"""Adds Klapklaar contract data to tools/preview/fixtures/sample.json (idempotent, additive).

The base sample (make_sample.py) stays intact so Horizon/Dawn keep rendering the same store. This script
upserts, by handle:
  - products that follow catalog/CONTRACT.md (options Maat/Kleur, metafields kenmerk_kort, usps, specificaties,
    staffelkorting, addons, past_op, levertijd, verzending, bedrukbaar, drukopties, faq, garantie …) with the
    3D renders from brand/img, renders/samples and $SCRATCH/renders-extra as images;
  - contract collections (+ intro / kenmerken / seo_tekst / subcollections metafields);
  - main-menu with three levels, footer-* menus;
  - pages with template suffixes (zakelijk, offerte, bedrukken, faq, contact) and the service pages;
  - blog 'advies' with original how-to articles.
No ratings, reviews or customer counts anywhere (brief §6).

Usage: python3 tools/preview/fixtures/extend_sample.py   (run make_sample.py first when regenerating)
"""
import json
import os
import shutil

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
IMG_DIR = os.path.join(HERE, "images")
SCRATCH = os.environ.get("SCRATCH", "/tmp/claude-0/-home-user-Larsaikema/d03b1b71-234c-55f6-a22b-89a9ff74abc4/scratchpad")
SOURCES = [os.path.join(REPO, "brand", "img"), os.path.join(REPO, "renders", "samples"), os.path.join(SCRATCH, "renders-extra")]
MAX_PX = 1400

IMAGES = [
    "scene-hero.webp", "scene-hero-crop.webp",
    "tent-3x3-klaproos-hero.webp", "tent-3x3-klaproos-logo-hero.webp", "tent-3x3-klaproos-front.webp", "tent-3x6-klaproos-hero.webp",
    "tent-3x3-wit-hero.webp", "tent-3x3-wit-front.webp", "tent-3x3-wit-detail.webp", "tent-3x3-zwart-hero.webp",
    "tent-3x6-zwart-zijwanden-hero.webp", "tent-3x6-zwart-zijwanden-detail.webp",
    "tent-3x3-rood-professional-gewichten-hero.webp", "tent-3x3-wit-professional-hero.webp", "tent-4x4-zwart-professional-hero.webp",
    "statafel-80-kaal-hero.webp", "statafel-80-ingeklapt.webp",
    "statafel-80-stretch-zwart-hero.webp", "statafel-80-stretch-rood-hero.webp", "statafel-80-stretch-wit-hero.webp",
    "statafel-80-stretch-antraciet-hero.webp", "statafel-80-stretch-koningsblauw-hero.webp",
    "statafel-80-strik-wit-hero.webp", "statafel-80-strik-zwart-hero.webp", "statafelrok-stretch-zwart-print-hero.webp",
]


def copy_images():
    for name in IMAGES:
        dst = os.path.join(IMG_DIR, name)
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
    {"groep": "In de doos", "label": "Meegeleverd", "waarde": "Frame, dak, draagtas, 4 haringen, 4 scheerlijnen"},
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
        ],
    })

    P.append({
        "handle": "partytent-met-logo",
        "title": "Bedrukte easy-up partytent 3 × 3 m",
        "vendor": "Klapklaar",
        "product_type": "Bedrukte partytent",
        "tags": ["easy-up", "partytent", "bedrukbaar", "zakelijk", "badge:nieuw", "gebruik:evenement"],
        "created_at": "2026-10-01T10:00:00+02:00", "published_at": "2026-10-01T10:00:00+02:00",
        "body_html": "<p>Jouw naam op de luifel, of je logo op het dak. Je uploadt je logo, wij maken een drukproef en pas na jouw akkoord gaat hij in productie.</p><p>Frame en dak zijn gelijk aan de easy-up Premium 3 × 3 m.</p>",
        "options": [opt("Kleur", ["Klaproos", "Wit", "Zwart"]), opt("Bedrukking", ["Luifel rondom", "Luifel + dak"])],
        "variants": variants(
            "KK-EUPLOGO", [["Klaproos", "Wit", "Zwart"], ["Luifel rondom", "Luifel + dak"]],
            price_fn=lambda v: 64900 if v[1] == "Luifel rondom" else 89900, stock_fn=lambda v: 0,
            policy_fn=lambda v: "continue", image_fn=lambda v: "tent-3x3-klaproos-logo-hero.webp", weight=28,
        ),
        "images": [{"src": "tent-3x3-klaproos-logo-hero.webp", "alt": "Easy-up partytent 3 × 3 m Klaproos met voorbeeldopdruk Klapklaar op de luifel"}],
        "metafields": [
            mf("kenmerk_kort", "single_line_text_field", "Jouw logo op de luifel · drukproef vooraf"),
            mf("usps", "list.single_line_text_field", ["Eerst een drukproef, dan pas drukken", "Logo op de luifel of op het dak", "Frame gelijk aan de Premium 3 × 3 m"]),
            mf("specificaties", "json", TENT_SPECS[:6]),
            mf("staffelkorting", "json", [{"vanaf": 3, "korting": 5}, {"vanaf": 10, "korting": 10}]),
            mf("levertijd", "single_line_text_field", "Levertijd 10–15 werkdagen na akkoord drukproef"),
            mf("bedrukbaar", "boolean", "true"),
            mf("drukopties", "json", {"posities": ["Luifel voorkant", "Luifel rondom", "Dak"], "aanlevering": "PDF, AI, EPS, SVG of PNG van minimaal 2000 px breed", "levertijd": "10–15 werkdagen na akkoord drukproef", "min_aantal": 1}),
            mf("addons", "list.product_reference", ["gewichten-set-4x10kg"]),
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
    return P


def collections():
    C = []

    def col(handle, title, prods=None, rules=None, image=None, intro=None, kenmerken=None, seo=None, subs=None, sort="manual"):
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
        if subs:
            c["metafields"].append(mf("subcollections", "list.collection_reference", subs))
        return c

    C.append(col("easy-up-partytenten", "Easy-up partytenten",
                 prods=["partytent-easy-up-premium", "partytent-easy-up-professional", "partytent-met-logo", "easy-up-partytent-premium", "easy-up-partytent-professional-3x6"],
                 image="tent-3x3-klaproos-hero.webp",
                 intro="Uitklappen, dak erover, klaar. Easy-up tenten van 3 × 3 tot 4 × 8 m, met een stalen of aluminium frame.",
                 kenmerken=["Staat in een paar minuten", "Staal of aluminium", "Zijwanden los erbij"],
                 seo=rich(("h2", "Welke easy-up partytent past bij jou?"), ("p", "Gebruik je hem een paar keer per jaar in de tuin, dan is de Premium met stalen frame genoeg. Sta je elke week op de markt of verhuur je tenten, kies dan de Professional: aluminium, lichter en roestvrij."), ("h3", "Maat kiezen"), ("p", "Een 3 × 3 m tent biedt ruimte aan ongeveer 8 staande gasten of 2 marktkramen. Met 3 × 6 m heb je plek voor een buffet en een paar statafels.")),
                 subs=["easy-up-premium", "easy-up-professional", "bedrukte-partytenten"]))
    C.append(col("easy-up-premium", "Easy-up Premium", prods=["partytent-easy-up-premium", "easy-up-partytent-premium"], image="tent-3x3-wit-hero.webp",
                 intro="Stalen frame met 40 mm poten en een dak van 320 g/m². Voor tuin, feest en markt."))
    C.append(col("easy-up-professional", "Easy-up Professional", prods=["partytent-easy-up-professional", "easy-up-partytent-professional-3x6"], image="tent-3x3-rood-professional-gewichten-hero.webp",
                 intro="Aluminium frame met 50 mm poten en een PVC-dak van 520 g/m². Voor wekelijks gebruik en verhuur."))
    C.append(col("bedrukte-partytenten", "Bedrukte partytenten", prods=["partytent-met-logo", "bedrukte-partytent-3x3"], image="tent-3x3-klaproos-logo-hero.webp",
                 intro="Jouw logo op de luifel of het dak. Eerst een drukproef, dan drukken we.", kenmerken=["Drukproef vooraf", "Vanaf 1 stuk", "Staffelprijs vanaf 3 stuks"]))
    C.append(col("stretchtenten", "Stretchtenten", prods=["stretchtent-10x15"], intro="Een vrije vorm die opvalt. Voor tuinfeesten, festivals en terrassen."))
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
            mf("subcollections", "list.collection_reference", ["easy-up-partytenten", "stretchtenten", "bedrukte-partytenten", "accessoires"]),
        ],
    },
    "statafels": {
        "add_products": ["statafel-inklapbaar-80"],
        "image": {"src": "statafel-80-kaal-hero.webp", "alt": "Statafels"},
        "metafields": [
            mf("intro", "multi_line_text_field", "Statafels die plat klappen, met rokken en hoezen in elke kleur."),
            mf("kenmerken", "list.single_line_text_field", ["Klapt plat", "Ø 80 cm", "Staffelprijs vanaf 10 stuks"]),
            mf("subcollections", "list.collection_reference", ["statafelrokken", "statafelhoezen-met-strik", "bedrukte-statafelhoezen", "actiepakketten"]),
        ],
    },
    "statafelrokken": {
        "image": {"src": "statafel-80-stretch-zwart-hero.webp", "alt": "Statafelrokken"},
        "metafields": [
            mf("intro", "multi_line_text_field", "Stretch of met strik, voor statafels van Ø 70 tot 85 cm. Strak zonder strijken."),
            mf("kenmerken", "list.single_line_text_field", ["Voor Ø 70–85 cm", "Wasbaar op 40 °C", "Staffelprijs vanaf 10 stuks"]),
            mf("subcollections", "list.collection_reference", ["statafelhoezen-met-strik", "bedrukte-statafelhoezen"]),
        ],
    },
    "accessoires": {
        "metafields": [mf("intro", "multi_line_text_field", "Zijwanden, gewichten, verlichting en alles wat je tent compleet maakt.")],
    },
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
            link("Stretchtenten", "collection", "stretchtenten", items=[link("Stretchtent 10 × 15 m", "product", "stretchtent-10x15")]),
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
            link("Garantie", "page", "garantie"), link("Betaalmethoden", "page", "betaalmethoden"),
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
        {"handle": "garantie", "title": "Garantie",
         "body_html": "<p>Gaat er iets mis met je product? Mail ons een foto en je bestelnummer, dan zoeken we samen een oplossing.</p>"},
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
    ("logo-aanleveren-voor-bedrukking", "Bedrukken: zo lever je je logo aan", "tent-3x3-klaproos-logo-hero.webp", ["bedrukken", "zakelijk"],
     "<p>Hoe beter je bestand, hoe scherper de opdruk. Dit werkt het best.</p><h2>Vectorbestand</h2><p>Een PDF, AI, EPS of SVG is ideaal: die kun je eindeloos vergroten.</p><h2>Geen vector?</h2><p>Stuur een PNG van minimaal 2000 px breed. Wij maken hem drukklaar en je ziet het resultaat eerst in de drukproef.</p><h2>Kleuren</h2><p>Geef je Pantone- of HEX-kleuren door als je die hebt. Dan matchen we je huisstijl zo goed mogelijk.</p>"),
]


def blog():
    arts = []
    for i, (handle, title, img, tags, body) in enumerate(ARTICLES):
        arts.append({
            "handle": handle, "title": title, "author": "Team Klapklaar", "body_html": body,
            "summary_html": body.split("</p>")[0] + "</p>",
            "image": {"src": img, "alt": title}, "tags": tags,
            "published_at": f"2026-10-{15 - i * 2:02d}T09:00:00+02:00",
        })
    return {"handle": "advies", "title": "Advies & inspiratie", "comments": "disabled", "articles": arts}


def upsert(lst, item, key="handle"):
    for i, x in enumerate(lst):
        if x.get(key) == item[key]:
            lst[i] = item
            return
    lst.append(item)


def main():
    copy_images()
    path = os.path.join(HERE, "sample.json")
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    for p in products():
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
