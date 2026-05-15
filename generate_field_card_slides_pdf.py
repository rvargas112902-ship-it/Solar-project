from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, letter
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfgen import canvas


PAGE_SIZE = landscape(letter)
WIDTH, HEIGHT = PAGE_SIZE


def wrap_lines(text, font_name, font_size, max_width):
    words = text.split()
    if not words:
        return []

    lines = []
    current = words[0]
    for word in words[1:]:
        trial = f"{current} {word}"
        if pdfmetrics.stringWidth(trial, font_name, font_size) <= max_width:
            current = trial
        else:
            lines.append(current)
            current = word
    lines.append(current)
    return lines


def draw_background(c, color):
    c.setFillColor(color)
    c.rect(0, 0, WIDTH, HEIGHT, fill=1, stroke=0)

    # Accent bands for a modern slide look.
    c.setFillColor(colors.HexColor("#0EA5E9"))
    c.rect(0, HEIGHT - 18, WIDTH, 18, fill=1, stroke=0)
    c.setFillColor(colors.HexColor("#22C55E"))
    c.rect(0, 0, WIDTH, 10, fill=1, stroke=0)


def draw_title(c, title, subtitle=None):
    x = 42
    y = HEIGHT - 70

    c.setFillColor(colors.HexColor("#F8FAFC"))
    c.setFont("Helvetica-Bold", 30)
    c.drawString(x, y, title)

    if subtitle:
        c.setFillColor(colors.HexColor("#CBD5E1"))
        c.setFont("Helvetica", 14)
        c.drawString(x, y - 28, subtitle)


def draw_footer(c, page_number):
    c.setFillColor(colors.HexColor("#94A3B8"))
    c.setFont("Helvetica", 10)
    c.drawRightString(WIDTH - 28, 18, f"Solar Setter Field Deck  |  Slide {page_number}")


def draw_bullets(c, bullets, start_y=HEIGHT - 150):
    x_bullet = 54
    max_width = WIDTH - 96
    y = start_y

    for bullet in bullets:
        wrapped = wrap_lines(bullet, "Helvetica", 18, max_width - 24)
        if y < 80:
            break
        c.setFillColor(colors.HexColor("#22D3EE"))
        c.setFont("Helvetica-Bold", 22)
        c.drawString(x_bullet, y, "•")

        c.setFillColor(colors.HexColor("#E2E8F0"))
        c.setFont("Helvetica", 18)
        c.drawString(x_bullet + 22, y, wrapped[0])
        y -= 30

        for line in wrapped[1:]:
            c.setFillColor(colors.HexColor("#CBD5E1"))
            c.setFont("Helvetica", 17)
            c.drawString(x_bullet + 22, y, line)
            y -= 24

        y -= 10


def draw_callout(c, heading, body_lines):
    box_x = 48
    box_y = 82
    box_w = WIDTH - 96
    box_h = 170

    c.setFillColor(colors.HexColor("#0F172A"))
    c.roundRect(box_x, box_y, box_w, box_h, 14, fill=1, stroke=0)

    c.setStrokeColor(colors.HexColor("#38BDF8"))
    c.setLineWidth(2)
    c.roundRect(box_x, box_y, box_w, box_h, 14, fill=0, stroke=1)

    c.setFillColor(colors.HexColor("#7DD3FC"))
    c.setFont("Helvetica-Bold", 16)
    c.drawString(box_x + 20, box_y + box_h - 34, heading)

    y = box_y + box_h - 62
    max_w = box_w - 40
    for body in body_lines:
        wrapped = wrap_lines(body, "Helvetica", 14, max_w)
        for line in wrapped:
            c.setFillColor(colors.HexColor("#E2E8F0"))
            c.setFont("Helvetica", 14)
            c.drawString(box_x + 20, y, line)
            y -= 20
        y -= 6


def slide(c, page_number, title, subtitle, bullets, callout_heading=None, callout_lines=None):
    draw_background(c, colors.HexColor("#020617"))
    draw_title(c, title, subtitle)
    draw_bullets(c, bullets)
    if callout_heading and callout_lines:
        draw_callout(c, callout_heading, callout_lines)
    draw_footer(c, page_number)
    c.showPage()


def build_pdf(output_path):
    c = canvas.Canvas(output_path, pagesize=PAGE_SIZE)

    slide(
        c,
        1,
        "Solar Appointment Setter",
        "High-Performance Field Card Deck",
        [
            "Your job: start quality conversations and set qualified appointments that show.",
            "Stay process-driven: script, qualify, close, confirm, follow up.",
            "Use this deck daily before and during field work.",
        ],
        "Reset Standard",
        ['"Fresh door, fresh start. Smile, posture, pace. Ask one good question and go for the appointment."'],
    )

    slide(
        c,
        2,
        "Doorstep Script Framework",
        "Short, clear, and assumptive",
        [
            "Opener: \"Hey, I'm [Name] with [Company] - I'll be quick.\"",
            "Context: helping local homeowners review utility costs and solar eligibility.",
            "Qualifier: \"Are you the homeowner?\"",
            "Close with two options: \"Would [Time 1] or [Time 2] work better?\"",
        ],
        "Execution Rules",
        [
            "Keep script to 20-30 seconds.",
            "Ask questions early.",
            "Never ask open-ended scheduling questions.",
        ],
    )

    slide(
        c,
        3,
        "Body Language + Tonality",
        "Non-verbal control drives trust",
        [
            "Stand 4-6 feet from the door, shoulders open, hands visible.",
            "Start warm, then shift to confident and curious tone.",
            "Use pauses after key questions. Slow down on important lines.",
            "Smile on approach; calm beats hype every time.",
        ],
    )

    slide(
        c,
        4,
        "Lead Qualification: S.O.L.A.R.",
        "Book quality appointments, not just activity",
        [
            "S - Homeowner status confirmed.",
            "O - Ownership timeline: ideally 2+ years.",
            "L - Electric bill usage is meaningful.",
            "A - All decision-makers can attend.",
            "R - Roof/property likely fit (or alternatives).",
        ],
        "Fast Qualifier",
        ['"So I do not waste your time, you own the home and both decision-makers can be there, right?"'],
    )

    slide(
        c,
        5,
        "Objection Handling: LACE",
        "Listen -> Acknowledge -> Clarify -> Engage + Re-ask",
        [
            "\"Not interested\": normalize, clarify reason, then re-ask with two times.",
            "\"I am busy\": compress to 10-15 minutes and offer later slot.",
            "\"Need spouse\": align and lock one joint decision time.",
            "\"Leave info\": position meeting as data-first, then schedule.",
        ],
        "Rule",
        ["Keep rebuttals under 20 seconds.", "Do not debate. Redirect to quick appointment ask."],
    )

    slide(
        c,
        6,
        "Appointment Lock-In System",
        "High show-rate scheduling sequence",
        [
            "Confirm exact time, address, and best phone number.",
            "Confirm all decision-makers will attend.",
            "Set expectation: this is a 10-15 minute review.",
            "Send confirmation text immediately at the door.",
        ],
        "Lock-In Line",
        [
            "\"Perfect, you are set for [Day/Time] at [Address] with [Other Decision-Maker].\"",
            "\"This is a quick 10-15 minute review. Best number for confirmation?\"",
        ],
    )

    slide(
        c,
        7,
        "Follow-Up Cadence",
        "Most reps skip this and lose shows",
        [
            "Immediately after set: send confirmation text.",
            "Morning of appointment: send reminder.",
            "30-60 minutes before: final confirmation.",
            "No-show: reschedule in 10 minutes, then follow up next day.",
        ],
        "No-Show Text",
        ['"We missed you today - no problem. Want to rebook a quick 15-minute review for [Option 1] or [Option 2]?"'],
    )

    slide(
        c,
        8,
        "Rejection Recovery Protocol",
        "Bounce back in under 20 seconds",
        [
            "Step 1: Exhale and physically reset posture.",
            "Step 2: Quick lesson - opener, qualifier, or ask?",
            "Step 3: Next door immediately with zero emotional carryover.",
            "You are not judged by one door. You are judged by consistency.",
        ],
    )

    slide(
        c,
        9,
        "Daily Performance Standards",
        "Non-negotiable operating metrics",
        [
            "80-120 doors knocked.",
            "20-35 homeowner conversations.",
            "8-15 full pitches.",
            "2-5 qualified appointments set.",
            "30 minutes of roleplay + evening follow-up block.",
        ],
        "Core KPI Chain",
        ["Knocks -> Conversations -> Pitches -> Sets -> Shows", "Improve the weakest conversion step first."],
    )

    slide(
        c,
        10,
        "Field Commandments",
        "Simple standards that separate top setters",
        [
            "Do not skip script reps before the field.",
            "Do not leave without asking for the appointment.",
            "Do not leave appointments unconfirmed.",
            "Track your scorecard daily and review weekly.",
            "Discipline is your edge.",
        ],
        "Final Standard",
        ["You are paid for disciplined execution, not random effort."],
    )

    c.save()


if __name__ == "__main__":
    build_pdf("APPOINTMENT_SETTER_FIELD_CARD_SLIDES.pdf")
