#!/usr/bin/env python3
"""Generate an elite-standard slideshow from the appointment setter handbook."""

from __future__ import annotations

import argparse
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_AUTO_SHAPE_TYPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Inches, Pt


@dataclass
class Section:
    level: int
    title: str
    lines: list[str] = field(default_factory=list)


PALETTE = {
    "bg": RGBColor(8, 15, 30),
    "bg_alt": RGBColor(12, 23, 44),
    "panel": RGBColor(19, 33, 58),
    "line": RGBColor(45, 74, 120),
    "accent": RGBColor(230, 184, 92),
    "text": RGBColor(242, 247, 255),
    "muted": RGBColor(164, 180, 210),
}


def clean_inline_markdown(text: str) -> str:
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    text = text.replace("**", "").replace("__", "").replace("`", "")
    return text.strip()


def parse_markdown(markdown_text: str) -> tuple[str, list[Section]]:
    title = "Appointment Setter Handbook"
    sections: list[Section] = []
    current: Section | None = None

    for raw_line in markdown_text.splitlines():
        heading_match = re.match(r"^(#{1,6})\s+(.*)$", raw_line)
        if heading_match:
            if current is not None:
                sections.append(current)
            level = len(heading_match.group(1))
            heading_text = clean_inline_markdown(heading_match.group(2))
            if level == 1:
                title = heading_text
                current = None
            else:
                current = Section(level=level, title=heading_text)
            continue

        if current is not None:
            current.lines.append(raw_line.rstrip())

    if current is not None:
        sections.append(current)

    return title, sections


def normalize_lines(lines: Iterable[str]) -> list[str]:
    normalized: list[str] = []
    for raw in lines:
        stripped = raw.strip()
        if stripped == "---":
            continue
        if not stripped:
            normalized.append("")
            continue
        normalized.append(clean_inline_markdown(stripped))

    while normalized and normalized[0] == "":
        normalized.pop(0)
    while normalized and normalized[-1] == "":
        normalized.pop()
    return normalized


def chunk_lines(lines: list[str], max_lines: int = 12, max_chars: int = 850) -> list[list[str]]:
    if not lines:
        return []

    chunks: list[list[str]] = []
    current: list[str] = []
    line_total = 0
    char_total = 0

    for line in lines:
        next_line_total = line_total + 1
        next_char_total = char_total + len(line)
        overflow = current and (next_line_total > max_lines or next_char_total > max_chars)

        if overflow:
            chunks.append(current)
            current = []
            line_total = 0
            char_total = 0

        current.append(line)
        line_total += 1
        char_total += len(line)

    if current:
        chunks.append(current)
    return chunks


def apply_background(slide, slide_width, slide_height) -> None:
    bg = slide.shapes.add_shape(
        MSO_AUTO_SHAPE_TYPE.RECTANGLE, 0, 0, slide_width, slide_height
    )
    bg.fill.solid()
    bg.fill.fore_color.rgb = PALETTE["bg"]
    bg.line.fill.background()

    overlay = slide.shapes.add_shape(
        MSO_AUTO_SHAPE_TYPE.RECTANGLE, 0, 0, slide_width, Inches(0.22)
    )
    overlay.fill.solid()
    overlay.fill.fore_color.rgb = PALETTE["accent"]
    overlay.line.fill.background()

    rail = slide.shapes.add_shape(
        MSO_AUTO_SHAPE_TYPE.RECTANGLE, Inches(0.4), Inches(0.7), Inches(0.08), Inches(5.8)
    )
    rail.fill.solid()
    rail.fill.fore_color.rgb = PALETTE["line"]
    rail.line.fill.background()


def add_footer(slide, slide_number: int) -> None:
    footer = slide.shapes.add_textbox(Inches(0.6), Inches(6.8), Inches(12.1), Inches(0.35))
    tf = footer.text_frame
    tf.clear()
    p = tf.paragraphs[0]
    p.text = f"Elite Appointment Setter Pitch Booklet  |  Slide {slide_number}"
    p.font.name = "Aptos"
    p.font.size = Pt(10)
    p.font.color.rgb = PALETTE["muted"]
    p.alignment = PP_ALIGN.RIGHT


def add_title_slide(prs: Presentation, deck_title: str, subtitle: str) -> None:
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    apply_background(slide, prs.slide_width, prs.slide_height)

    brand = slide.shapes.add_textbox(Inches(0.65), Inches(0.45), Inches(10.5), Inches(0.45))
    brand_tf = brand.text_frame
    brand_tf.clear()
    bp = brand_tf.paragraphs[0]
    bp.text = "ELITE FIELD EXECUTION TRAINING"
    bp.font.name = "Aptos Display"
    bp.font.bold = True
    bp.font.size = Pt(16)
    bp.font.color.rgb = PALETTE["accent"]

    title_box = slide.shapes.add_textbox(Inches(0.9), Inches(1.4), Inches(10.8), Inches(2.3))
    tf = title_box.text_frame
    tf.clear()
    tf.vertical_anchor = MSO_ANCHOR.TOP
    p = tf.paragraphs[0]
    p.text = deck_title
    p.font.name = "Aptos Display"
    p.font.bold = True
    p.font.size = Pt(46)
    p.font.color.rgb = PALETTE["text"]

    subtitle_box = slide.shapes.add_textbox(Inches(0.95), Inches(4.0), Inches(10.2), Inches(1.2))
    stf = subtitle_box.text_frame
    stf.clear()
    sp = stf.paragraphs[0]
    sp.text = subtitle
    sp.font.name = "Aptos"
    sp.font.size = Pt(21)
    sp.font.color.rgb = PALETTE["muted"]

    add_footer(slide, 1)


def add_divider_slide(prs: Presentation, heading: str, slide_number: int) -> None:
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    apply_background(slide, prs.slide_width, prs.slide_height)

    panel = slide.shapes.add_shape(
        MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE, Inches(0.95), Inches(1.55), Inches(11.15), Inches(3.7)
    )
    panel.fill.solid()
    panel.fill.fore_color.rgb = PALETTE["panel"]
    panel.line.color.rgb = PALETTE["line"]
    panel.line.width = Pt(1.6)

    label = slide.shapes.add_textbox(Inches(1.35), Inches(2.1), Inches(9.8), Inches(2.8))
    tf = label.text_frame
    tf.clear()
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE

    p = tf.paragraphs[0]
    p.text = "SECTION"
    p.font.name = "Aptos"
    p.font.bold = True
    p.font.size = Pt(15)
    p.font.color.rgb = PALETTE["accent"]
    p.alignment = PP_ALIGN.LEFT

    p2 = tf.add_paragraph()
    p2.text = heading
    p2.font.name = "Aptos Display"
    p2.font.bold = True
    p2.font.size = Pt(40)
    p2.font.color.rgb = PALETTE["text"]
    p2.alignment = PP_ALIGN.LEFT

    add_footer(slide, slide_number)


def add_content_slide(
    prs: Presentation,
    heading: str,
    content_chunk: list[str],
    slide_number: int,
    level: int,
) -> None:
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    apply_background(slide, prs.slide_width, prs.slide_height)

    heading_box = slide.shapes.add_textbox(Inches(0.9), Inches(0.55), Inches(11.0), Inches(1.1))
    htf = heading_box.text_frame
    htf.clear()
    htf.vertical_anchor = MSO_ANCHOR.TOP
    hp = htf.paragraphs[0]
    hp.text = heading
    hp.font.name = "Aptos Display"
    hp.font.bold = True
    hp.font.size = Pt(30 if level <= 2 else 26)
    hp.font.color.rgb = PALETTE["text"]

    body_panel = slide.shapes.add_shape(
        MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE, Inches(0.85), Inches(1.55), Inches(11.2), Inches(4.9)
    )
    body_panel.fill.solid()
    body_panel.fill.fore_color.rgb = PALETTE["panel"]
    body_panel.line.color.rgb = PALETTE["line"]
    body_panel.line.width = Pt(1.25)

    body = slide.shapes.add_textbox(Inches(1.2), Inches(1.9), Inches(10.45), Inches(4.2))
    btf = body.text_frame
    btf.clear()
    btf.word_wrap = True
    btf.vertical_anchor = MSO_ANCHOR.TOP

    for index, line in enumerate(content_chunk):
        paragraph = btf.paragraphs[0] if index == 0 else btf.add_paragraph()
        paragraph.space_after = Pt(7)

        if not line:
            paragraph.text = ""
            continue

        bullet_match = re.match(r"^[-*]\s+(.*)$", line)
        if bullet_match:
            text = f"• {bullet_match.group(1)}"
        else:
            text = line

        paragraph.text = text
        paragraph.font.name = "Aptos"
        paragraph.font.size = Pt(18 if level <= 2 else 16)
        paragraph.font.color.rgb = PALETTE["text"]
        paragraph.alignment = PP_ALIGN.LEFT

    add_footer(slide, slide_number)


def build_deck(markdown_path: Path, output_path: Path) -> int:
    markdown = markdown_path.read_text(encoding="utf-8")
    deck_title, sections = parse_markdown(markdown)

    subtitle = (
        "Door-to-Door Savings and Net Metering Pitch Execution Guide"
    )
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    slide_number = 1
    add_title_slide(prs, deck_title, subtitle)

    for section in sections:
        if section.level == 2 and re.match(r"^\d+\)", section.title):
            slide_number += 1
            add_divider_slide(prs, section.title, slide_number)

        normalized_lines = normalize_lines(section.lines)
        chunks = chunk_lines(normalized_lines)

        if not chunks:
            slide_number += 1
            add_content_slide(
                prs,
                section.title,
                ["(Section heading)"],
                slide_number,
                section.level,
            )
            continue

        for part_index, chunk in enumerate(chunks, start=1):
            title = section.title
            if len(chunks) > 1:
                title = f"{section.title} ({part_index}/{len(chunks)})"
            slide_number += 1
            add_content_slide(prs, title, chunk, slide_number, section.level)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    prs.save(output_path)
    return slide_number


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate a polished PPTX deck from handbook markdown."
    )
    parser.add_argument(
        "--input",
        default="APPOINTMENT_SETTER_HANDBOOK.md",
        help="Path to source markdown file.",
    )
    parser.add_argument(
        "--output",
        default="deliverables/APPOINTMENT_SETTER_HANDBOOK_ELITE_DECK.pptx",
        help="Path for generated PPTX output.",
    )
    args = parser.parse_args()

    slide_count = build_deck(Path(args.input), Path(args.output))
    print(f"Created {args.output} with {slide_count} slides.")


if __name__ == "__main__":
    main()
