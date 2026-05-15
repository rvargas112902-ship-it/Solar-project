#!/usr/bin/env python3
"""Generate the redesigned solar appointment setter field deck PDF."""

from __future__ import annotations

import math
import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import landscape, letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "deliverables"
ASSET_DIR = OUT_DIR / "assets"
OUT_PDF = OUT_DIR / "solar_appointment_setter_field_card_deck_redesigned.pdf"
ARTIFACT_ASSET_DIR = Path("/opt/cursor/artifacts/assets")

GENERATED_IMAGES = {
    "cover": "solar_field_deck_cover.png",
    "door": "solar_doorstep_conversation.png",
    "roof": "solar_roof_qualification.png",
    "dashboard": "solar_appointment_dashboard.png",
}


def rgb(hex_color: str) -> tuple[int, int, int]:
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i : i + 2], 16) for i in (0, 2, 4))


def gradient_image(width: int, height: int, top: str, bottom: str) -> Image.Image:
    top_rgb = rgb(top)
    bottom_rgb = rgb(bottom)
    img = Image.new("RGB", (width, height), top_rgb)
    draw = ImageDraw.Draw(img)
    for y in range(height):
        t = y / max(height - 1, 1)
        line = tuple(int(top_rgb[i] * (1 - t) + bottom_rgb[i] * t) for i in range(3))
        draw.line([(0, y), (width, y)], fill=line)
    return img


def glow(draw: ImageDraw.ImageDraw, cx: int, cy: int, r: int, color: tuple[int, int, int]):
    for i in range(6, 0, -1):
        alpha_color = tuple(min(255, int(v + (255 - v) * (1 - i / 8))) for v in color)
        draw.ellipse((cx - r * i // 3, cy - r * i // 3, cx + r * i // 3, cy + r * i // 3), fill=alpha_color)
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=color)


def panel(draw: ImageDraw.ImageDraw, xy, fill="#123F73", outline="#18B9AE"):
    x1, y1, x2, y2 = xy
    draw.rounded_rectangle(xy, radius=12, fill=rgb(fill), outline=rgb(outline), width=4)
    for i in range(1, 4):
        x = x1 + (x2 - x1) * i / 4
        draw.line((x, y1 + 8, x, y2 - 8), fill=rgb("#7FD9E7"), width=2)
    for i in range(1, 3):
        y = y1 + (y2 - y1) * i / 3
        draw.line((x1 + 8, y, x2 - 8, y), fill=rgb("#7FD9E7"), width=2)


def house(draw: ImageDraw.ImageDraw, x: int, y: int, scale: float = 1.0):
    w, h = int(330 * scale), int(210 * scale)
    draw.rounded_rectangle((x, y + h * 0.38, x + w, y + h), radius=int(18 * scale), fill=rgb("#DDECF4"))
    roof = [(x - 18 * scale, y + h * 0.42), (x + w * 0.5, y), (x + w + 18 * scale, y + h * 0.42)]
    draw.polygon(roof, fill=rgb("#071B33"))
    for i in range(3):
        px = x + int((80 + i * 62) * scale)
        panel(draw, (px, y + int(58 * scale), px + int(54 * scale), y + int(102 * scale)))
    draw.rounded_rectangle((x + w * 0.14, y + h * 0.55, x + w * 0.30, y + h * 0.98), radius=int(8 * scale), fill=rgb("#18B9AE"))
    draw.rounded_rectangle((x + w * 0.50, y + h * 0.58, x + w * 0.70, y + h * 0.76), radius=int(7 * scale), fill=rgb("#FFFFFF"))


def person(draw: ImageDraw.ImageDraw, x: int, y: int, scale: float = 1.0, shirt="#18B9AE"):
    r = int(25 * scale)
    draw.ellipse((x - r, y - r, x + r, y + r), fill=rgb("#F5B68A"))
    draw.rounded_rectangle((x - 34 * scale, y + r - 2, x + 34 * scale, y + 116 * scale), radius=int(24 * scale), fill=rgb(shirt))
    draw.line((x - 25 * scale, y + 116 * scale, x - 45 * scale, y + 178 * scale), fill=rgb("#0B2747"), width=int(10 * scale))
    draw.line((x + 25 * scale, y + 116 * scale, x + 45 * scale, y + 178 * scale), fill=rgb("#0B2747"), width=int(10 * scale))
    draw.line((x - 30 * scale, y + 58 * scale, x - 76 * scale, y + 94 * scale), fill=rgb("#F5B68A"), width=int(10 * scale))
    draw.line((x + 30 * scale, y + 58 * scale, x + 76 * scale, y + 78 * scale), fill=rgb("#F5B68A"), width=int(10 * scale))


def create_cover_art(path: Path):
    img = gradient_image(1400, 1000, "#0B2747", "#071B33")
    draw = ImageDraw.Draw(img)
    glow(draw, 1110, 190, 72, rgb("#FFB000"))
    for i in range(9):
        x = 120 + i * 145
        house(draw, x, 520 + (i % 2) * 24, 0.55)
    for i in range(10):
        draw.line((0, 820 + i * 18, 1400, 650 + i * 18), fill=rgb("#123F73"), width=5)
    person(draw, 310, 402, 1.45, "#18B9AE")
    draw.rounded_rectangle((380, 470, 515, 650), radius=22, fill=rgb("#EEF8FF"), outline=rgb("#FFB000"), width=5)
    panel(draw, (850, 420, 1190, 590))
    draw.rounded_rectangle((720, 90, 1280, 820), radius=54, outline=rgb("#18B9AE"), width=8)
    img.filter(ImageFilter.SHARPEN).save(path)


def create_door_art(path: Path):
    img = gradient_image(1400, 1000, "#EEF8FF", "#D8ECF8")
    draw = ImageDraw.Draw(img)
    house(draw, 760, 210, 1.25)
    draw.rounded_rectangle((1040, 500, 1180, 810), radius=16, fill=rgb("#0B2747"))
    person(draw, 420, 420, 1.35, "#18B9AE")
    person(draw, 760, 455, 1.12, "#FFB000")
    draw.rounded_rectangle((474, 552, 610, 710), radius=20, fill=rgb("#071B33"), outline=rgb("#18B9AE"), width=5)
    for i in range(4):
        draw.rounded_rectangle((164 + i * 44, 180 + i * 18, 460 + i * 44, 250 + i * 18), radius=28, fill=rgb("#FFFFFF"), outline=rgb("#C7DFEB"), width=4)
    for x in [132, 1230]:
        draw.ellipse((x - 70, 690, x + 70, 850), fill=rgb("#8ACF91"))
        draw.rectangle((x - 16, 790, x + 16, 900), fill=rgb("#7A533A"))
    img.save(path)


def create_roof_art(path: Path):
    img = gradient_image(1400, 1000, "#F6FBFF", "#D8ECF8")
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle((150, 160, 905, 760), radius=34, fill=rgb("#FFFFFF"), outline=rgb("#CFE5F2"), width=5)
    roof = [(245, 540), (520, 250), (795, 540), (660, 705), (380, 705)]
    draw.polygon(roof, fill=rgb("#071B33"))
    for row in range(3):
        for col in range(4):
            panel(draw, (390 + col * 75, 438 + row * 58, 455 + col * 75, 486 + row * 58))
    for r in [130, 210, 290]:
        draw.arc((690 - r, 70 - r, 690 + r, 70 + r), 12, 168, fill=rgb("#FFB000"), width=8)
    glow(draw, 1025, 190, 62, rgb("#FFB000"))
    draw.ellipse((735, 520, 1110, 900), fill=rgb("#71B06D"))
    draw.rectangle((914, 685, 962, 930), fill=rgb("#76533A"))
    draw.rounded_rectangle((965, 430, 1240, 625), radius=28, fill=rgb("#FFFFFF"), outline=rgb("#18B9AE"), width=5)
    for i in range(5):
        draw.rounded_rectangle((1005, 470 + i * 26, 1198, 486 + i * 26), radius=6, fill=rgb("#D8ECF8"))
    for i in range(3):
        draw.ellipse((1180 + i * 20, 650 + i * 62, 1230 + i * 20, 700 + i * 62), fill=rgb("#18B9AE"))
    img.save(path)


def create_dashboard_art(path: Path):
    img = gradient_image(1400, 1000, "#071B33", "#0B2747")
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle((145, 120, 535, 890), radius=52, fill=rgb("#EEF8FF"), outline=rgb("#18B9AE"), width=8)
    draw.rounded_rectangle((190, 200, 490, 805), radius=28, fill=rgb("#FFFFFF"))
    for i in range(6):
        x = 220 + (i % 3) * 85
        y = 330 + (i // 3) * 84
        draw.rounded_rectangle((x, y, x + 64, y + 54), radius=12, fill=rgb("#D8ECF8") if i != 4 else rgb("#FFB000"))
    draw.rounded_rectangle((610, 170, 1240, 350), radius=34, fill=rgb("#123F73"), outline=rgb("#18B9AE"), width=5)
    draw.rounded_rectangle((610, 410, 1240, 590), radius=34, fill=rgb("#123F73"), outline=rgb("#FFB000"), width=5)
    draw.rounded_rectangle((610, 650, 1240, 830), radius=34, fill=rgb("#123F73"), outline=rgb("#18B9AE"), width=5)
    for y in [220, 460, 700]:
        draw.ellipse((668, y, 748, y + 80), fill=rgb("#18B9AE"))
        draw.rounded_rectangle((790, y + 6, 1155, y + 26), radius=10, fill=rgb("#D8ECF8"))
        draw.rounded_rectangle((790, y + 48, 1040, y + 64), radius=8, fill=rgb("#5F7285"))
    draw.arc((1110, 38, 1370, 298), 195, 325, fill=rgb("#FFB000"), width=12)
    img.save(path)

PAGE_W, PAGE_H = landscape(letter)

NAVY = colors.HexColor("#071B33")
NAVY_2 = colors.HexColor("#0B2747")
BLUE = colors.HexColor("#123F73")
TEAL = colors.HexColor("#18B9AE")
TEAL_DARK = colors.HexColor("#0D807E")
ORANGE = colors.HexColor("#FFB000")
GOLD = colors.HexColor("#FFD166")
RED = colors.HexColor("#FF6B5C")
WHITE = colors.HexColor("#FFFFFF")
ICE = colors.HexColor("#EEF8FF")
MIST = colors.HexColor("#D8ECF8")
SLATE = colors.HexColor("#5F7285")
INK = colors.HexColor("#13283C")
CARD = colors.HexColor("#F8FCFF")
GRID = colors.HexColor("#DDE9F2")


def prepare_assets() -> dict[str, Path | None]:
    OUT_DIR.mkdir(exist_ok=True)
    ASSET_DIR.mkdir(exist_ok=True)
    local_generators = {
        "cover": create_cover_art,
        "door": create_door_art,
        "roof": create_roof_art,
        "dashboard": create_dashboard_art,
    }
    assets: dict[str, Path | None] = {}
    for key, filename in GENERATED_IMAGES.items():
        dest = ASSET_DIR / filename
        src = ARTIFACT_ASSET_DIR / filename
        if src.exists():
            shutil.copy2(src, dest)
        elif not dest.exists():
            local_generators[key](dest)
        assets[key] = dest if dest.exists() else None
    return assets


def style(
    name: str,
    size: float,
    leading: float,
    color=INK,
    font: str = "Helvetica",
    align: int = TA_LEFT,
    space_after: float = 0,
) -> ParagraphStyle:
    return ParagraphStyle(
        name,
        fontName=font,
        fontSize=size,
        leading=leading,
        textColor=color,
        alignment=align,
        spaceAfter=space_after,
    )


H1 = style("H1", 34, 38, WHITE, "Helvetica-Bold")
H2 = style("H2", 24, 28, NAVY, "Helvetica-Bold")
H2_LIGHT = style("H2Light", 25, 29, WHITE, "Helvetica-Bold")
H3 = style("H3", 13, 16, NAVY, "Helvetica-Bold")
BODY = style("Body", 10, 13, INK)
BODY_WHITE = style("BodyWhite", 10.5, 14, WHITE)
SMALL = style("Small", 8.2, 10.2, SLATE)
SMALL_WHITE = style("SmallWhite", 8.5, 10.5, ICE)
QUOTE = style("Quote", 15, 19, WHITE, "Helvetica-Bold")
CENTER = style("Center", 10, 13, INK, align=TA_CENTER)


def hex_alpha(hex_color: str, alpha: float):
    c = colors.HexColor(hex_color)
    c.alpha = alpha
    return c


def paragraph(c: canvas.Canvas, text: str, x: float, y_top: float, width: float, para_style: ParagraphStyle):
    p = Paragraph(text, para_style)
    _, h = p.wrap(width, 1000)
    p.drawOn(c, x, y_top - h)
    return y_top - h


def pill(c: canvas.Canvas, x: float, y: float, w: float, h: float, text: str, fill, stroke=None, txt=WHITE):
    c.saveState()
    c.setFillColor(fill)
    c.setStrokeColor(stroke or fill)
    c.roundRect(x, y, w, h, h / 2, stroke=1 if stroke else 0, fill=1)
    c.setFillColor(txt)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawCentredString(x + w / 2, y + h / 2 - 3, text.upper())
    c.restoreState()


def card(c: canvas.Canvas, x: float, y: float, w: float, h: float, fill=CARD, stroke=GRID, radius=16, shadow=True):
    c.saveState()
    if shadow:
        c.setFillColor(hex_alpha("#000000", 0.10))
        c.roundRect(x + 4, y - 4, w, h, radius, stroke=0, fill=1)
    c.setFillColor(fill)
    c.setStrokeColor(stroke)
    c.setLineWidth(1)
    c.roundRect(x, y, w, h, radius, stroke=1, fill=1)
    c.restoreState()


def draw_image(c: canvas.Canvas, path: Path | None, x: float, y: float, w: float, h: float):
    card(c, x, y, w, h, fill=WHITE, stroke=colors.HexColor("#CFE5F2"), radius=18, shadow=True)
    if path and path.exists():
        c.drawImage(str(path), x + 7, y + 7, w - 14, h - 14, preserveAspectRatio=True, anchor="c", mask="auto")
    else:
        draw_solar_home(c, x + 18, y + 15, w - 36, h - 30)


def background(c: canvas.Canvas, page_num: int, dark=False):
    c.saveState()
    c.setFillColor(NAVY if dark else ICE)
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    if dark:
        c.setFillColor(NAVY_2)
        c.circle(PAGE_W * 0.18, PAGE_H * 0.82, 150, stroke=0, fill=1)
        c.setFillColor(BLUE)
        c.circle(PAGE_W * 0.92, PAGE_H * 0.18, 220, stroke=0, fill=1)
        c.setFillColor(hex_alpha("#18B9AE", 0.18))
        c.circle(PAGE_W * 0.64, PAGE_H * 0.75, 90, stroke=0, fill=1)
    else:
        c.setFillColor(colors.HexColor("#DBF4F4"))
        c.circle(PAGE_W + 60, PAGE_H - 10, 220, stroke=0, fill=1)
        c.setFillColor(colors.HexColor("#FFF1C7"))
        c.circle(-30, -20, 165, stroke=0, fill=1)
        c.setStrokeColor(colors.HexColor("#DCEBF4"))
        c.setLineWidth(0.5)
        for i in range(0, 15):
            x = i * 64
            c.line(x, 0, x + 210, PAGE_H)
    c.restoreState()


def footer(c: canvas.Canvas, page_num: int, title: str, dark=False):
    c.saveState()
    c.setStrokeColor(hex_alpha("#FFFFFF" if dark else "#0B2747", 0.18))
    c.setLineWidth(1)
    c.line(38, 30, PAGE_W - 38, 30)
    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(ICE if dark else SLATE)
    c.drawString(40, 16, "SOLAR SETTER FIELD DECK")
    c.drawCentredString(PAGE_W / 2, 16, title.upper())
    c.drawRightString(PAGE_W - 40, 16, f"{page_num:02d} / 10")
    c.restoreState()


def title_block(c: canvas.Canvas, eyebrow: str, title: str, subtitle: str, page_num: int, dark=False):
    pill(c, 44, PAGE_H - 70, 128, 20, eyebrow, TEAL if dark else NAVY, txt=WHITE)
    paragraph(c, title, 44, PAGE_H - 88, 520, H2_LIGHT if dark else H2)
    paragraph(c, subtitle, 45, PAGE_H - 122, 480, BODY_WHITE if dark else BODY)
    footer(c, page_num, title, dark=dark)


def bullet_list(
    c: canvas.Canvas,
    items: list[str],
    x: float,
    y_top: float,
    width: float,
    para_style: ParagraphStyle = BODY,
    bullet_color=TEAL,
    gap: float = 9,
):
    y = y_top
    for item in items:
        p = Paragraph(item, para_style)
        _, h = p.wrap(width - 18, 1000)
        c.saveState()
        c.setFillColor(bullet_color)
        c.circle(x + 5, y - 5, 3, stroke=0, fill=1)
        c.restoreState()
        p.drawOn(c, x + 16, y - h)
        y -= h + gap
    return y


def draw_sun(c, x, y, r, fill=ORANGE):
    c.saveState()
    c.setStrokeColor(fill)
    c.setFillColor(fill)
    c.circle(x, y, r, stroke=0, fill=1)
    c.setLineWidth(2)
    for a in range(0, 360, 30):
        rad = math.radians(a)
        c.line(x + math.cos(rad) * (r + 5), y + math.sin(rad) * (r + 5), x + math.cos(rad) * (r + 16), y + math.sin(rad) * (r + 16))
    c.restoreState()


def draw_solar_panel(c, x, y, w, h, angle=0):
    c.saveState()
    c.translate(x + w / 2, y + h / 2)
    c.rotate(angle)
    c.setFillColor(BLUE)
    c.setStrokeColor(TEAL)
    c.roundRect(-w / 2, -h / 2, w, h, 6, stroke=1, fill=1)
    c.setStrokeColor(colors.HexColor("#7FD9E7"))
    c.setLineWidth(0.8)
    for i in range(1, 4):
        c.line(-w / 2 + i * w / 4, -h / 2 + 4, -w / 2 + i * w / 4, h / 2 - 4)
    for j in range(1, 3):
        c.line(-w / 2 + 4, -h / 2 + j * h / 3, w / 2 - 4, -h / 2 + j * h / 3)
    c.restoreState()


def draw_solar_home(c, x, y, w, h):
    c.saveState()
    base_y = y + h * 0.18
    c.setFillColor(colors.HexColor("#CFE3EE"))
    c.roundRect(x + w * 0.16, base_y, w * 0.58, h * 0.32, 8, stroke=0, fill=1)
    c.setFillColor(NAVY)
    roof = [
        (x + w * 0.10, base_y + h * 0.31),
        (x + w * 0.46, base_y + h * 0.58),
        (x + w * 0.82, base_y + h * 0.31),
    ]
    p = c.beginPath()
    p.moveTo(*roof[0])
    p.lineTo(*roof[1])
    p.lineTo(*roof[2])
    p.close()
    c.drawPath(p, stroke=0, fill=1)
    for i in range(3):
        draw_solar_panel(c, x + w * (0.29 + i * 0.13), base_y + h * 0.36, w * 0.10, h * 0.08, angle=-6)
    c.setFillColor(TEAL)
    c.roundRect(x + w * 0.28, base_y + h * 0.05, w * 0.09, h * 0.16, 3, stroke=0, fill=1)
    c.setFillColor(WHITE)
    c.roundRect(x + w * 0.47, base_y + h * 0.16, w * 0.12, h * 0.10, 3, stroke=0, fill=1)
    draw_sun(c, x + w * 0.82, y + h * 0.78, min(w, h) * 0.08)
    c.setStrokeColor(GOLD)
    c.setLineWidth(1.4)
    for i in range(3):
        c.arc(x + w * (0.25 + i * 0.08), y + h * (0.50 + i * 0.02), x + w * (0.90 + i * 0.05), y + h * (1.04 + i * 0.03), 196, 324)
    c.restoreState()


def icon_calendar(c, x, y, s, fill=TEAL):
    c.saveState()
    c.setFillColor(WHITE)
    c.setStrokeColor(fill)
    c.setLineWidth(2)
    c.roundRect(x, y, s, s, 7, stroke=1, fill=1)
    c.setFillColor(fill)
    c.roundRect(x, y + s * 0.70, s, s * 0.30, 7, stroke=0, fill=1)
    c.setFillColor(ORANGE)
    c.circle(x + s * 0.70, y + s * 0.36, s * 0.12, stroke=0, fill=1)
    c.restoreState()


def icon_phone(c, x, y, s, fill=TEAL):
    c.saveState()
    c.setStrokeColor(fill)
    c.setLineWidth(4)
    c.roundRect(x + s * 0.22, y, s * 0.56, s, 10, stroke=1, fill=0)
    c.setFillColor(fill)
    c.circle(x + s * 0.50, y + s * 0.08, s * 0.035, stroke=0, fill=1)
    c.setFillColor(ORANGE)
    c.roundRect(x + s * 0.34, y + s * 0.55, s * 0.32, s * 0.20, 5, stroke=0, fill=1)
    c.restoreState()


def icon_funnel(c, x, y, s, fill=TEAL):
    c.saveState()
    p = c.beginPath()
    p.moveTo(x, y + s)
    p.lineTo(x + s, y + s)
    p.lineTo(x + s * 0.62, y + s * 0.47)
    p.lineTo(x + s * 0.62, y)
    p.lineTo(x + s * 0.38, y + s * 0.12)
    p.lineTo(x + s * 0.38, y + s * 0.47)
    p.close()
    c.setFillColor(fill)
    c.drawPath(p, stroke=0, fill=1)
    c.setFillColor(ORANGE)
    c.circle(x + s * 0.50, y + s * 0.72, s * 0.10, stroke=0, fill=1)
    c.restoreState()


def metric_card(c, x, y, w, h, number, label, accent=TEAL):
    card(c, x, y, w, h, fill=WHITE, stroke=colors.HexColor("#D7E8F2"), radius=14, shadow=True)
    c.setFillColor(accent)
    c.setFont("Helvetica-Bold", 22)
    c.drawString(x + 16, y + h - 34, number)
    paragraph(c, label, x + 16, y + h - 46, w - 30, SMALL)


def page_cover(c, assets):
    background(c, 1, dark=True)
    if assets["cover"] and assets["cover"].exists():
        c.drawImage(str(assets["cover"]), PAGE_W * 0.48, 66, 350, 350, preserveAspectRatio=True, anchor="c", mask="auto")
    else:
        draw_solar_home(c, PAGE_W * 0.48, 116, 320, 250)
    c.setFillColor(hex_alpha("#071B33", 0.86))
    c.roundRect(38, 54, 430, 502, 26, stroke=0, fill=1)
    pill(c, 62, 514, 190, 22, "high-performance field deck", TEAL)
    paragraph(c, "Solar Appointment Setter", 62, 475, 360, H1)
    paragraph(c, "A visual field manual for starting quality conversations, qualifying real homeowners, locking appointments, and creating show-ready handoffs.", 64, 366, 345, BODY_WHITE)
    c.setStrokeColor(ORANGE)
    c.setLineWidth(4)
    c.line(64, 338, 172, 338)
    bullet_list(
        c,
        [
            "<b>Start trust fast:</b> clear opener, calm posture, one good question.",
            "<b>Qualify hard:</b> homeowner, bill size, decision-makers, roof fit.",
            "<b>Lock the show:</b> exact time, phone, confirmation text, reminders.",
        ],
        64,
        306,
        340,
        BODY_WHITE,
        bullet_color=ORANGE,
        gap=10,
    )
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(64, 82, "RESET STANDARD")
    paragraph(c, '"Fresh door, fresh start. Smile, posture, pace. Ask one good question and go for the appointment."', 64, 66, 354, SMALL_WHITE)
    footer(c, 1, "Field Reset", dark=True)


def page_script(c, assets):
    background(c, 2)
    title_block(c, "slide 02", "Doorstep Script Framework", "Short, specific, assumptive. Your first 30 seconds should lower resistance and earn one next question.", 2)
    draw_image(c, assets["door"], 472, 132, 274, 314)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(488, 109, "Voice rule: warm opener, confident close, no rambling.")
    stages = [
        ("1", "Pattern interrupt", "\"Hey, I'm [Name] with [Company] - I'll be quick.\""),
        ("2", "Local reason", "We are helping homeowners nearby review electric costs and solar eligibility."),
        ("3", "Qualifier", '"Are you the homeowner here?" then ask about bill range or usage.'),
        ("4", "Two-option close", '"Would tomorrow at 6:15 or Saturday at 10:30 work better?"'),
    ]
    y = 382
    for num, title, body in stages:
        card(c, 52, y - 62, 365, 54, fill=WHITE, radius=14)
        c.setFillColor(TEAL if num != "4" else ORANGE)
        c.circle(78, y - 35, 16, stroke=0, fill=1)
        c.setFillColor(WHITE if num != "4" else NAVY)
        c.setFont("Helvetica-Bold", 13)
        c.drawCentredString(78, y - 40, num)
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(104, y - 27, title)
        paragraph(c, body, 104, y - 36, 288, SMALL)
        y -= 70
    card(c, 52, 66, 365, 76, fill=NAVY, stroke=NAVY, radius=16, shadow=False)
    paragraph(c, "<b>Execution rules:</b> keep it to 20-30 seconds, ask questions early, never ask open-ended scheduling questions, and leave every qualified door with a clear next step.", 72, 118, 325, BODY_WHITE)


def page_body_language(c):
    background(c, 3)
    title_block(c, "slide 03", "Body Language + Tonality", "Non-verbal control drives trust before the homeowner processes your words.", 3)
    card(c, 46, 94, 700, 360, fill=WHITE, radius=22)
    draw_solar_home(c, 66, 246, 250, 170)
    c.setStrokeColor(TEAL)
    c.setLineWidth(2)
    c.line(285, 279, 454, 279)
    c.setFillColor(TEAL)
    c.circle(454, 279, 5, stroke=0, fill=1)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(326, 292, "4-6 feet from door")
    c.setFont("Helvetica", 9)
    c.setFillColor(SLATE)
    c.drawString(326, 263, "Respect space. Face at a slight angle. Keep hands visible.")
    columns = [
        ("Approach", ["Smile before the knock.", "Shoulders open, not squared up.", "Tablet low; eyes up."]),
        ("Delivery", ["Start warm, then shift confident.", "Use pauses after key questions.", "Slow down on money, time, and decision-maker lines."]),
        ("Trust signals", ["Ask before assuming.", "Mirror calm homeowners; steady excited ones.", "Exit cleanly if they are not qualified."]),
    ]
    x = 340
    for title, items in columns:
        card(c, x, 116, 120, 116, fill=colors.HexColor("#F3FAFF"), radius=14, shadow=False)
        c.setFillColor(ORANGE)
        c.setFont("Helvetica-Bold", 10.5)
        c.drawString(x + 14, 204, title)
        bullet_list(c, items, x + 13, 188, 94, SMALL, TEAL, gap=5)
        x += 132
    card(c, 66, 112, 242, 92, fill=NAVY, stroke=NAVY, radius=16, shadow=False)
    paragraph(c, "<b>Field cue:</b> Calm beats hype. The homeowner should feel like you are organized, local, and easy to say yes to for a short review.", 86, 174, 202, BODY_WHITE)


def page_qualification(c, assets):
    background(c, 4)
    title_block(c, "slide 04", "Lead Qualification: S.O.L.A.R.", "Book quality appointments, not just activity. A setter protects the closer's calendar.", 4)
    draw_image(c, assets["roof"], 486, 114, 260, 326)
    letters = [
        ("S", "Status", "Homeowner confirmed. Renters cannot approve rooftop installation."),
        ("O", "Ownership", "Ideally settled in with intent to stay; ask how long they have owned the home."),
        ("L", "Load", "Bill or usage is meaningful. Ask for average monthly cost or recent kWh."),
        ("A", "Attendance", "All decision-makers can attend the consultation."),
        ("R", "Roof / property", "South, east, or west roof exposure, limited shade, usable roof condition, or ground-mount alternative."),
    ]
    y = 399
    for letter, title, body in letters:
        c.setFillColor(ORANGE if letter in ["L", "A"] else TEAL)
        c.circle(74, y - 12, 18, stroke=0, fill=1)
        c.setFillColor(NAVY if letter in ["L", "A"] else WHITE)
        c.setFont("Helvetica-Bold", 16)
        c.drawCentredString(74, y - 18, letter)
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(104, y, title)
        paragraph(c, body, 104, y - 10, 325, SMALL)
        y -= 58
    card(c, 52, 62, 397, 74, fill=NAVY, stroke=NAVY, radius=16, shadow=False)
    paragraph(c, '<b>Fast qualifier:</b> "So I do not waste your time, you own the home, your electric bill is usually over $100, and both decision-makers can be there, right?"', 72, 112, 355, BODY_WHITE)


def page_solar_101(c):
    background(c, 5)
    title_block(c, "slide 05", "Solar 101 for Setters", "You are not the closer, but you must understand what makes a homeowner worth a consultation.", 5)
    tiles = [
        ("Utility bill", "Usage and rate determine whether solar has enough financial surface area. Ask for average monthly cost or recent kWh."),
        ("Roof + shade", "Solar works best with strong sun exposure. Heavy tree shade, old roofs, or complex rooflines need expert review."),
        ("Incentives", "Federal, state, utility, and local programs can change economics. Do not quote incentives; tee up a specialist review."),
        ("Net metering", "Excess production policies vary by utility. Set expectation that the consultant will review local rules."),
        ("Decision process", "The homeowner usually compares savings, financing, roof impact, warranty, and installer credibility."),
        ("Your lane", "Create curiosity, qualify accurately, collect the right details, and make the appointment easy to keep."),
    ]
    x_positions = [50, 280, 510]
    y_positions = [304, 140]
    i = 0
    for y in y_positions:
        for x in x_positions:
            title, body = tiles[i]
            card(c, x, y, 202, 136, fill=WHITE, radius=18)
            draw_sun(c, x + 30, y + 96, 10, ORANGE if i % 2 == 0 else TEAL)
            c.setFillColor(NAVY)
            c.setFont("Helvetica-Bold", 12)
            c.drawString(x + 54, y + 101, title)
            paragraph(c, body, x + 22, y + 78, 158, SMALL)
            i += 1
    card(c, 58, 454, 676, 52, fill=NAVY, stroke=NAVY, radius=16, shadow=False)
    paragraph(c, "A strong appointment is built on useful homeowner facts: address, utility, average bill, roof concerns, current provider, and decision-maker availability.", 80, 488, 630, BODY_WHITE)


def page_objections(c):
    background(c, 6)
    title_block(c, "slide 06", "Objection Handling: LACE", "Listen -> Acknowledge -> Clarify -> Engage + re-ask. Keep rebuttals under 20 seconds.", 6)
    steps = [
        ("Listen", "Let the first objection finish. Interruptions create resistance."),
        ("Acknowledge", '"Totally fair" or "Makes sense" lowers defensiveness.'),
        ("Clarify", "Find the real concern: time, trust, spouse, money, or timing."),
        ("Engage + re-ask", "Return to a small next step with two specific appointment options."),
    ]
    x = 54
    for idx, (title, body) in enumerate(steps):
        card(c, x, 344, 162, 96, fill=WHITE, radius=16)
        c.setFillColor([TEAL, ORANGE, BLUE, RED][idx])
        c.circle(x + 24, 414, 15, stroke=0, fill=1)
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 10)
        c.drawCentredString(x + 24, 410, str(idx + 1))
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(x + 48, 415, title)
        paragraph(c, body, x + 18, 390, 126, SMALL)
        x += 176
    objections = [
        ("Not interested", "Normalize: \"Most people weren't looking into it.\" Clarify: \"Is it the panels, cost, or timing?\" Re-ask with two times."),
        ("I'm busy", "Compress: \"No problem, this is exactly why we schedule the short review. Later today at 6:15 or tomorrow at 10:30?\""),
        ("Need spouse", "Align: \"Perfect, that is who should be there.\" Lock a joint time instead of leaving it open."),
        ("Leave info", "Position: \"The info only matters after we know your bill and roof qualify. Let us do the quick review first.\""),
    ]
    y = 270
    for title, body in objections:
        card(c, 70, y - 42, 652, 48, fill=colors.HexColor("#F8FCFF"), radius=12, shadow=False)
        c.setFillColor(TEAL)
        c.setFont("Helvetica-Bold", 10.5)
        c.drawString(90, y - 9, title)
        paragraph(c, body, 190, y - 7, 505, SMALL)
        y -= 58
    card(c, 70, 58, 652, 44, fill=NAVY, stroke=NAVY, radius=14, shadow=False)
    paragraph(c, "<b>Rule:</b> Do not debate solar. Redirect to the quick appointment ask and protect your emotional tempo.", 94, 86, 604, BODY_WHITE)


def page_lock_in(c, assets):
    background(c, 7)
    title_block(c, "slide 07", "Appointment Lock-In System", "High show-rate scheduling is a sequence: exact details, expectation, confirmation, reminder.", 7)
    draw_image(c, assets["dashboard"], 442, 110, 304, 328)
    checklist = [
        "Confirm exact day, time, address, and best phone number.",
        "Confirm every decision-maker by name.",
        "Set expectation: 10-15 minute review of bill, roof, incentives, and options.",
        "Ask them to have a recent utility bill ready or send a photo.",
        "Send the confirmation text while still at the door.",
        "Log clean CRM notes: objection, bill range, roof notes, spouse/partner name.",
    ]
    card(c, 52, 108, 342, 330, fill=WHITE, radius=20)
    icon_calendar(c, 78, 366, 46)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(138, 398, "Lock-in checklist")
    bullet_list(c, checklist, 78, 342, 282, SMALL, ORANGE, gap=9)
    card(c, 52, 54, 694, 42, fill=NAVY, stroke=NAVY, radius=14, shadow=False)
    paragraph(c, '<b>Lock-in line:</b> "Perfect, you are set for [Day/Time] at [Address] with [Other Decision-Maker]. This is a quick review. Best number for confirmation?"', 76, 82, 648, BODY_WHITE)


def page_follow_up(c):
    background(c, 8)
    title_block(c, "slide 08", "Follow-Up Cadence", "Most reps lose shows after the set. Confirmation discipline keeps the calendar alive.", 8)
    icon_phone(c, 62, 338, 72)
    cadence = [
        ("At the door", "Send confirmation text immediately. Ask them to reply yes so the appointment feels real."),
        ("Morning of", "Reminder text with time, consultant name, and utility bill prompt."),
        ("30-60 min before", "Final confirmation. If they are shaky, resell the value and confirm decision-makers."),
        ("No-show", "Reschedule in 10 minutes while the context is warm; follow up again next day."),
    ]
    x0 = 178
    y = 400
    for idx, (title, body) in enumerate(cadence):
        c.setStrokeColor(TEAL)
        c.setLineWidth(3)
        if idx < len(cadence) - 1:
            c.line(x0 + 16, y - 20, x0 + 16, y - 82)
        c.setFillColor(ORANGE if idx == 0 else TEAL)
        c.circle(x0 + 16, y - 8, 15, stroke=0, fill=1)
        c.setFillColor(NAVY if idx == 0 else WHITE)
        c.setFont("Helvetica-Bold", 9)
        c.drawCentredString(x0 + 16, y - 12, str(idx + 1))
        card(c, x0 + 44, y - 50, 494, 52, fill=WHITE, radius=13, shadow=False)
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(x0 + 62, y - 17, title)
        paragraph(c, body, x0 + 62, y - 28, 452, SMALL)
        y -= 82
    card(c, 62, 72, 274, 92, fill=NAVY, stroke=NAVY, radius=16, shadow=False)
    paragraph(c, '<b>No-show text:</b> "We missed you today - no problem. Want to rebook a quick 15-minute review for [Option 1] or [Option 2]?"', 84, 134, 230, BODY_WHITE)
    card(c, 362, 72, 368, 92, fill=WHITE, radius=16)
    paragraph(c, "<b>CRM note standard:</b> write the homeowner's motivation, bill range, gate code/parking note, decision-maker status, and the exact confirmation response.", 386, 134, 318, BODY)


def page_rejection(c):
    background(c, 9)
    title_block(c, "slide 09", "Rejection Recovery Protocol", "Bounce back in under 20 seconds. The next door deserves a clean version of you.", 9)
    icon_funnel(c, 586, 322, 94)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 13)
    c.drawCentredString(633, 300, "Effort becomes data")
    steps = [
        ("Exhale + reset", "Drop shoulders, unclench jaw, step away from the door."),
        ("Name the lesson", "Was the issue opener, qualifier, tonality, timing, or appointment ask?"),
        ("Next door now", "No emotional carryover. Consistency beats the last outcome."),
    ]
    x = 64
    for idx, (title, body) in enumerate(steps):
        card(c, x, 246, 190, 146, fill=WHITE, radius=20)
        c.setFillColor([TEAL, ORANGE, RED][idx])
        c.circle(x + 38, 352, 24, stroke=0, fill=1)
        c.setFillColor(WHITE if idx != 1 else NAVY)
        c.setFont("Helvetica-Bold", 18)
        c.drawCentredString(x + 38, 345, str(idx + 1))
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 13)
        c.drawString(x + 70, 356, title)
        paragraph(c, body, x + 25, 314, 140, BODY)
        x += 205
    card(c, 72, 100, 648, 88, fill=NAVY, stroke=NAVY, radius=18, shadow=False)
    paragraph(c, "<b>Mindset standard:</b> You are not judged by one door. You are judged by the quality of your next 100 approaches, the honesty of your tracking, and your willingness to improve the weakest conversion step first.", 100, 158, 590, BODY_WHITE)


def page_standards(c):
    background(c, 10, dark=True)
    title_block(c, "slide 10", "Daily Performance Standards", "Non-negotiable operating metrics and field commandments for top setters.", 10, dark=True)
    metrics = [
        ("80-120", "doors knocked"),
        ("20-35", "homeowner conversations"),
        ("8-15", "full pitches"),
        ("2-5", "qualified appointments set"),
    ]
    x = 52
    for idx, (num, label) in enumerate(metrics):
        metric_card(c, x, 350, 160, 82, num, label, ORANGE if idx == 3 else TEAL)
        x += 176
    c.setFillColor(ICE)
    c.setFont("Helvetica-Bold", 15)
    c.drawString(64, 300, "Core KPI Chain")
    chain = ["Knocks", "Conversations", "Pitches", "Sets", "Shows"]
    x = 64
    for i, label in enumerate(chain):
        pill(c, x, 256, 112, 28, label, TEAL if i < 4 else ORANGE, txt=NAVY if i == 4 else WHITE)
        if i < len(chain) - 1:
            c.setStrokeColor(WHITE)
            c.setLineWidth(2)
            c.line(x + 114, 270, x + 140, 270)
            c.setFillColor(WHITE)
            p = c.beginPath()
            p.moveTo(x + 140, 270)
            p.lineTo(x + 132, 275)
            p.lineTo(x + 132, 265)
            p.close()
            c.drawPath(p, stroke=0, fill=1)
        x += 138
    commandments = [
        "Do script reps before the field.",
        "Do not leave a qualified door without asking for the appointment.",
        "Do not leave appointments unconfirmed.",
        "Track scorecard daily and review weekly.",
        "Protect attitude, pace, and follow-up discipline.",
    ]
    card(c, 66, 80, 300, 128, fill=hex_alpha("#FFFFFF", 0.08), stroke=hex_alpha("#FFFFFF", 0.18), radius=18, shadow=False)
    bullet_list(c, commandments, 90, 178, 245, SMALL_WHITE, ORANGE, gap=6)
    card(c, 398, 80, 322, 128, fill=ORANGE, stroke=ORANGE, radius=18, shadow=True)
    paragraph(c, "<b>Final standard:</b><br/>You are paid for disciplined execution, not random effort. Improve the weakest conversion step first, then repeat the process tomorrow.", 426, 166, 266, style("Final", 13, 17, NAVY, "Helvetica-Bold"))
    c.setFont("Helvetica", 7)
    c.setFillColor(hex_alpha("#FFFFFF", 0.75))
    c.drawString(64, 52, "Research synthesis used: U.S. Department of Energy homeowner solar guidance, Energy Saver residential solar benefits, MassCEC homeowner checklist, and residential solar appointment-setting best practices.")
    footer(c, 10, "Field Commandments", dark=True)


def generate_pdf():
    assets = prepare_assets()
    c = canvas.Canvas(str(OUT_PDF), pagesize=landscape(letter))
    c.setTitle("Solar Appointment Setter - High-Performance Field Card Deck")
    c.setAuthor("Cursor Cloud Agent")
    c.setSubject("Redesigned solar appointment setter field training deck")
    pages = [
        lambda: page_cover(c, assets),
        lambda: page_script(c, assets),
        lambda: page_body_language(c),
        lambda: page_qualification(c, assets),
        lambda: page_solar_101(c),
        lambda: page_objections(c),
        lambda: page_lock_in(c, assets),
        lambda: page_follow_up(c),
        lambda: page_rejection(c),
        lambda: page_standards(c),
    ]
    for idx, page in enumerate(pages):
        page()
        if idx != len(pages) - 1:
            c.showPage()
    c.save()
    print(f"Wrote {OUT_PDF}")


if __name__ == "__main__":
    generate_pdf()
