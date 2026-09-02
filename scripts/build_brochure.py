#!/usr/bin/env python3
"""
Régénère la brochure A4 : l'affiche originale + un bandeau bas avec le QR code
vers le site et le nom du comité.

    python3 scripts/build_brochure.py

Entrées  : design/affiche-originale.pdf
Sortie   : public/brochure/brochure-a4.pdf  (+ design/brochure-a4-apercu.png)

Ce script existe parce que la première brochure avait été fabriquée à la main :
il a fallu la désosser pour retrouver sa géométrie. Deux défauts corrigés au
passage et à ne pas réintroduire :

  - l'affiche était comprimée verticalement à 86 % pour rentrer dans l'A4.
    Elle est désormais mise à l'échelle proportionnellement, avec des marges
    latérales de la couleur du papier de l'affiche (donc invisibles).
  - le QR code était rééchantillonné (500 -> 337 px), ce qui ramollit ses
    modules à l'impression. Il est maintenant généré à la taille exacte, et le
    script vérifie qu'il se décode depuis le PDF final avant d'écrire.

Dépendances : pymupdf, pillow, qrcode. opencv-python-headless est optionnel
mais recommandé : sans lui, la vérification du QR est sautée (avec un
avertissement) au lieu d'échouer.
"""

import sys
from pathlib import Path

import fitz  # pymupdf
import numpy as np
import qrcode
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
POSTER_PDF = ROOT / "design" / "affiche-originale.pdf"
OUT_PDF = ROOT / "public" / "brochure" / "brochure-a4.pdf"
OUT_PNG = ROOT / "design" / "brochure-a4-apercu.png"
FONT_DIR = Path("/tmp/fonts")

URL = "https://alimentation-a-la-source-production.up.railway.app"

DPI = 300
A4_W, A4_H = 2480, 3508  # A4 à 300 dpi
BAND_H = 486  # ~4,1 cm : de quoi loger 6 lignes de texte et la carte QR

GREEN_DARK = (26, 77, 46)
GREEN = (76, 140, 74)
BAND_BG = (223, 238, 215)
TEXT = (60, 66, 58)
GREY = (108, 116, 106)

TITLE = "Découvrez nos marchands locaux !"
BODY = [
    "Scannez le QR code pour la carte interactive",
    "des marchands, fermes et marchés autour de l'Hôpital Bonnet.",
]

# Le statut du site, en bas de la brochure.
#
# La brochure circule seule, imprimée, détachée du site : c'est justement le
# support où une signature institutionnelle absente de toute validation serait
# le plus difficile à rattraper. Elle annonce donc ce qu'elle est.
#
# Doit rester aligné sur lib/prototype.ts. Le jour où le comité valide, basculer
# PROTOTYPE à False ici ET dans lib/prototype.ts, puis régénérer la brochure.
PROTOTYPE = True

# Coupures volontaires : aucune de ces mentions ne doit être scindée n'importe où.
COMMITTEE_PROTOTYPE = [
    ("Prototype pour CSE Bonnet", "semibold"),
    ("Maquette de proposition — ce document n'émane pas", "regular"),
    ("du CHI Fréjus Saint-Raphaël et n'engage pas l'établissement.", "regular"),
]
COMMITTEE_VALIDE = [
    ("Une initiative du comité Développement Durable –", "semibold"),
    ("Responsabilité Sociétale et Environnementale", "semibold"),
    ("CHI Fréjus Saint-Raphaël, site Hôpital Bonnet", "regular"),
]
COMMITTEE = COMMITTEE_PROTOTYPE if PROTOTYPE else COMMITTEE_VALIDE


def load_fonts() -> tuple[str, str, str]:
    """Caveat (titre) et Inter (texte), téléchargés depuis Google Fonts.

    Les .ttf sont attendus dans /tmp/fonts. Pour les récupérer :

        mkdir -p /tmp/fonts && curl -s \\
          "https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Inter:wght@400;600;700" \\
          | grep -oE 'https://fonts\\.gstatic\\.com/[^)]+' | sort -u \\
          | while read u; do curl -s -o "/tmp/fonts/$(basename $u)" "$u"; done
    """
    caveat = sorted(FONT_DIR.glob("Wnzn*.ttf"))
    inters = sorted(FONT_DIR.glob("UcCO*.ttf"))
    if not caveat or len(inters) < 2:
        sys.exit(
            f"Polices absentes de {FONT_DIR}. Voir la docstring de load_fonts() "
            "pour la commande de téléchargement."
        )

    def ink(path: Path, size: int = 80) -> int:
        """Compte les pixels encrés : classe les graisses sans se fier au nom."""
        f = ImageFont.truetype(str(path), size)
        im = Image.new("L", (400, 120), 255)
        ImageDraw.Draw(im).text((5, 10), "Hng", font=f, fill=0)
        return sum(1 for p in im.getdata() if p < 128)

    by_weight = [p for _, p in sorted((ink(p), p) for p in inters)]
    return str(caveat[-1]), str(by_weight[0]), str(by_weight[1])


def make_qr(target_px: int) -> Image.Image:
    """QR à taille pixel-exacte : box_size entier, donc aucun rééchantillonnage."""
    probe = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, border=2)
    probe.add_data(URL)
    probe.make(fit=True)
    modules = probe.modules_count + 2 * probe.border

    box = max(1, round(target_px / modules))
    qr = qrcode.QRCode(
        error_correction=qrcode.constants.ERROR_CORRECT_M, border=2, box_size=box
    )
    qr.add_data(URL)
    qr.make(fit=True)
    return qr.make_image(fill_color="black", back_color="white").convert("RGB")


def verify_qr(pdf_path: Path) -> None:
    """Relit le QR depuis le PDF produit, à 300 et 150 dpi (scan d'impression)."""
    try:
        import cv2
    except ImportError:
        print("  ! opencv absent : vérification du QR sautée "
              "(pip3 install opencv-python-headless)")
        return

    doc = fitz.open(pdf_path)
    for dpi in (300, 150):
        pix = doc[0].get_pixmap(dpi=dpi)
        arr = np.frombuffer(pix.samples, dtype=np.uint8).reshape(
            pix.height, pix.width, pix.n
        )
        value, _, _ = cv2.QRCodeDetector().detectAndDecode(
            cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)
        )
        if value.rstrip("/") != URL.rstrip("/"):
            sys.exit(f"QR illisible ou incorrect à {dpi} dpi : {value!r}")
        print(f"  QR relu à {dpi} dpi : OK")


def main() -> None:
    if not POSTER_PDF.exists():
        sys.exit(f"Affiche introuvable : {POSTER_PDF}")
    caveat_bold, inter_regular, inter_semibold = load_fonts()

    page = fitz.open(POSTER_PDF)[0].get_pixmap(dpi=DPI)
    poster = Image.frombytes("RGB", (page.width, page.height), page.samples)
    paper = tuple(int(c) for c in np.asarray(poster)[5, 5])

    # Mise à l'échelle proportionnelle dans la zone au-dessus du bandeau.
    avail_h = A4_H - BAND_H
    scale = min(A4_W / poster.width, avail_h / poster.height)
    scaled = poster.resize(
        (round(poster.width * scale), round(poster.height * scale)), Image.LANCZOS
    )

    canvas = Image.new("RGB", (A4_W, A4_H), paper)
    canvas.paste(
        scaled,
        ((A4_W - scaled.width) // 2, (avail_h - scaled.height) // 2),
    )
    draw = ImageDraw.Draw(canvas)

    band_y = A4_H - BAND_H
    draw.rectangle([0, band_y, A4_W, A4_H], fill=BAND_BG)
    draw.rectangle([0, band_y, A4_W, band_y + 7], fill=(196, 220, 188))

    # Carte QR, calée à droite du bandeau.
    qr = make_qr(333)
    pad = int(DPI * 0.055)
    f_scan = ImageFont.truetype(inter_semibold, int(DPI * 0.098))
    scan_h = f_scan.getbbox("SCANNEZ-MOI")[3]
    card_x1 = A4_W - int(DPI * 0.40)
    card_x0 = card_x1 - (qr.width + pad * 2)
    card_h = qr.height + pad * 2 + scan_h + int(DPI * 0.04)
    card_y0 = band_y + (BAND_H - card_h) // 2

    draw.rounded_rectangle(
        [card_x0, card_y0, card_x1, card_y0 + card_h],
        radius=int(DPI * 0.05), fill="white", outline=GREEN, width=6,
    )
    label_w = draw.textlength("SCANNEZ-MOI", font=f_scan)
    draw.text(
        ((card_x0 + card_x1) / 2 - label_w / 2, card_y0 + pad * 0.5),
        "SCANNEZ-MOI", font=f_scan, fill=GREEN_DARK,
    )
    canvas.paste(
        qr,
        ((card_x0 + card_x1) // 2 - qr.width // 2,
         card_y0 + pad + scan_h + int(DPI * 0.03)),
    )

    # Bloc texte, à gauche du QR.
    x = int(DPI * 0.40)
    max_w = card_x0 - x - int(DPI * 0.22)
    y = band_y + int(BAND_H * 0.10)

    draw.text((x, y), TITLE,
              font=ImageFont.truetype(caveat_bold, int(DPI * 0.27)), fill=GREEN_DARK)
    y += int(DPI * 0.27) + int(DPI * 0.045)

    f_body = ImageFont.truetype(inter_regular, int(DPI * 0.108))
    for line in BODY:
        draw.text((x, y), line, font=f_body, fill=TEXT)
        y += int(DPI * 0.108 * 1.40)

    y += int(DPI * 0.030)
    fonts = {
        "semibold": ImageFont.truetype(inter_semibold, int(DPI * 0.096)),
        "regular": ImageFont.truetype(inter_regular, int(DPI * 0.096)),
    }
    for line, weight in COMMITTEE:
        font = fonts[weight]
        width = draw.textlength(line, font=font)
        if width > max_w:
            sys.exit(f"Ligne trop large pour le bandeau ({width:.0f} > {max_w}) : {line}")
        draw.text((x, y), line, font=font, fill=GREEN_DARK)
        y += int(DPI * 0.096 * 1.36)

    y += int(DPI * 0.024)
    f_url = ImageFont.truetype(inter_regular, int(DPI * 0.088))
    draw.text((x, y), URL.replace("https://", ""), font=f_url, fill=GREY)
    if y + int(DPI * 0.088 * 1.4) >= A4_H:
        sys.exit("Le texte déborde du bandeau : augmenter BAND_H.")

    OUT_PDF.parent.mkdir(parents=True, exist_ok=True)
    OUT_PNG.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(OUT_PNG)
    canvas.save(OUT_PDF, "PDF", resolution=float(DPI))

    doc = fitz.open(OUT_PDF)
    rect = doc[0].rect
    print(f"Écrit {OUT_PDF.relative_to(ROOT)}")
    print(f"  page : {rect.width:.1f} x {rect.height:.1f} pt "
          f"(ratio {rect.height / rect.width:.4f}, A4 = 1.4142)")
    verify_qr(OUT_PDF)


if __name__ == "__main__":
    main()
