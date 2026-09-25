import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)

def create_pdf(output_path):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()

    # Custom Palette
    c_primary = colors.HexColor("#1E3A8A")     # Deep Navy
    c_accent = colors.HexColor("#2563EB")      # Vibrant Blue
    c_orange = colors.HexColor("#D97706")      # Amber/Orange
    c_dark = colors.HexColor("#0F172A")        # Slate 900
    c_sub = colors.HexColor("#475569")         # Slate 600
    c_light = colors.HexColor("#F8FAFC")       # Slate 50
    c_border = colors.HexColor("#E2E8F0")      # Slate 200

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=c_primary,
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=c_sub,
        spaceAfter=12
    )

    h1_style = ParagraphStyle(
        'H1',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=c_accent,
        spaceBefore=12,
        spaceAfter=6
    )

    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=c_dark,
        spaceBefore=8,
        spaceAfter=4
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=c_dark,
        spaceAfter=5
    )

    bullet_style = ParagraphStyle(
        'Bullet',
        parent=body_style,
        leftIndent=14,
        bulletIndent=4,
        spaceAfter=3
    )

    table_header_style = ParagraphStyle(
        'TH',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white
    )

    table_body_style = ParagraphStyle(
        'TB',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=c_dark
    )

    story = []

    # Title & Metadata Header
    story.append(Paragraph("ACTS &mdash; Autonomous Civic Triage System", title_style))
    story.append(Paragraph("Comprehensive Project Implementation Report & Architecture Summary", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_accent, spaceAfter=10))

    meta_text = "<b>Target:</b> ABES Engineering College (ABESEC) &nbsp;|&nbsp; <b>Platforms:</b> Windows Desktop (EXE) + Android (APK) + Web Admin + 3D Twin &nbsp;|&nbsp; <b>Status:</b> Production Ready"
    story.append(Paragraph(meta_text, body_style))
    story.append(Spacer(1, 8))

    # 1. System Architecture Overview
    story.append(Paragraph("1. System Architecture Overview", h1_style))
    story.append(Paragraph(
        "ACTS is an end-to-end, AI-powered autonomous civic triage and facility management ecosystem designed for institutional campuses. "
        "It synchronizes native client frontends (Flutter Windows & Android), a Three.js 3D Digital Twin, a React Web Admin dashboard, "
        "and an autonomous AI triage pipeline backed by Django REST Framework and SQLite/PostgreSQL.",
        body_style
    ))

    arch_data = [
        [Paragraph("<b>Component</b>", table_header_style), Paragraph("<b>Tech Stack</b>", table_header_style), Paragraph("<b>Key Responsibilities</b>", table_header_style)],
        [Paragraph("<b>Desktop App</b>", table_body_style), Paragraph("Flutter 3.x (Windows Release)", table_body_style), Paragraph("Citizen reporting, voice dictation, 3D digital twin viewport, offline resilience", table_body_style)],
        [Paragraph("<b>Mobile App</b>", table_body_style), Paragraph("Flutter (Android Release APK)", table_body_style), Paragraph("On-campus reporting, camera photo intake, Wi-Fi LAN auto-sync", table_body_style)],
        [Paragraph("<b>3D Digital Twin</b>", table_body_style), Paragraph("Three.js + Vite (:5173)", table_body_style), Paragraph("First-person walk, momentum physics, wall collision, live heat beacons", table_body_style)],
        [Paragraph("<b>Admin Portal</b>", table_body_style), Paragraph("React + Tailwind (:5174)", table_body_style), Paragraph("Campus infrastructure health index (CIHI), ticket assignment, live triage", table_body_style)],
        [Paragraph("<b>Backend API</b>", table_body_style), Paragraph("Django REST Framework (:8000)", table_body_style), Paragraph("Crowd urgency formula, spatial deduplication, maintenance squad routing", table_body_style)],
    ]
    t_arch = Table(arch_data, colWidths=[90, 140, 302])
    t_arch.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_accent),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_light]),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_arch)
    story.append(Spacer(1, 10))

    # 2. Key Modules & Feature Implementation Summary
    story.append(Paragraph("2. Key Modules & Feature Implementations", h1_style))

    story.append(Paragraph("A. Autonomous Voice AI Dictation & Instant Intake", h2_style))
    story.append(Paragraph("&bull; <b>Interactive Voice Sheet (<code>_VoiceDictationModal</code>)</b>: Real-time animated audio waveform visualizer (24 fluctuating frequency bars) and active recording stopwatch timer (<code>00:05 LIVE</code>).", bullet_style))
    story.append(Paragraph("&bull; <b>6 One-Tap Incident Presets (Hinglish/English)</b>: High-priority campus complaint templates (Electrical wire spark S5, Water pipe burst S5, Road pothole S3, Dark street light S3, Garbage overflow S2, Broken door lock S2).", bullet_style))
    story.append(Paragraph("&bull; <b>Direct Suffix Mic & Auto-Scroll</b>: Microphone button embedded directly inside the notes input field; selecting voice immediately auto-scrolls down to Section 3 for instant AI triage feedback.", bullet_style))

    story.append(Paragraph("B. Autonomous AI Triage & Interactive Clarification Questions", h2_style))
    story.append(Paragraph("&bull; <b>Multi-Tiered AI Pipeline</b>: Multimodal vision (Gemini 1.5 Flash), ultra-fast NLP (Groq LLaMA-3.3-70B), and deterministic edge heuristic fallback (100% offline).", bullet_style))
    story.append(Paragraph("&bull; <b>Autonomous Severity & Squad Dispatch</b>: Calculates S1 to S5 severity ratings and automatically selects the exact response team (e.g. <i>Emergency Electrical Squad 1</i>, <i>Hydro & Plumbing Rapid Squad</i>) with targeted SLAs.", bullet_style))
    story.append(Paragraph("&bull; <b>Interactive Clarifying Gap Questions</b>: Generates 3-4 dynamic questions filling hazard and accessibility gaps. Features interactive <b><code>[Yes]</code> (Green)</b>, <b><code>[No]</code> (Red)</b>, and <b><code>[Unsure]</code> (Amber)</b> chips automatically bundled into ticket submission.", bullet_style))

    story.append(Paragraph("C. 3D Campus Digital Twin (First-Person & Orbit Modes)", h2_style))
    story.append(Paragraph("&bull; <b>Natural Mouse Look</b>: Standard FPS camera orientation (Mouse Up tilts camera up, Mouse Down tilts camera down).", bullet_style))
    story.append(Paragraph("&bull; <b>Movement Physics</b>: Real-time velocity damping (friction factor 0.84), axis-separated wall sliding collision, and walking head-bobbing physics (<code>4.8 + sin(walkBob) * 0.14</code>).", bullet_style))
    story.append(Paragraph("&bull; <b>Screen-Space HUD</b>: Dynamic glowing crosshair (<code>+</code>), keyboard/mouse helper bar, and decluttered campus building labels with active ticket heat beacons.", bullet_style))

    story.append(Paragraph("D. Spatial Deduplication & Crowd-Weighted Urgency", h2_style))
    story.append(Paragraph("&bull; <b>Anti-Duplicate Fusion</b>: Matches incoming reports against active block tickets, presenting an instant <i>Upvote Existing (+1 Urgency Boost)</i> option to prevent ticket spam while escalating crowd priority.", bullet_style))
    story.append(Paragraph("&bull; <b>1-Click Demo Profiles & 2FA</b>: Instant switcher for Student 1 (Arjun), Student 2 (Priya), Student 3 (Rahul), and Admin (Dr. Amit Singhal) with Step-2 Institutional ID verification.", bullet_style))

    story.append(Spacer(1, 10))

    # 3. Production Deliverables & Files
    story.append(Paragraph("3. Production Deliverables & Files", h1_style))
    deliv_data = [
        [Paragraph("<b>Artifact</b>", table_header_style), Paragraph("<b>Location / Path</b>", table_header_style), Paragraph("<b>Details</b>", table_header_style)],
        [Paragraph("<b>Windows Desktop EXE</b>", table_body_style), Paragraph("<code>mobile/build/windows/.../acts_mobile.exe</code>", table_body_style), Paragraph("Compiled native Windows Release executable", table_body_style)],
        [Paragraph("<b>Silent Desktop Shortcut</b>", table_body_style), Paragraph("<code>C:/Users/devan/Desktop/ACTS.lnk</code>", table_body_style), Paragraph("1-Click silent launcher; starts backend in parallel; <b>zero terminal windows</b>", table_body_style)],
        [Paragraph("<b>Native C# Launcher</b>", table_body_style), Paragraph("<code>ACTS_Launcher.exe</code> (/target:winexe)", table_body_style), Paragraph("Eliminates WScript memory error; instant app popup; parallel background services", table_body_style)],
        [Paragraph("<b>Android Release APK</b>", table_body_style), Paragraph("<code>C:/Users/devan/Desktop/ACTS_Mobile.apk</code>", table_body_style), Paragraph("63.2 MB standalone APK with LAN IP auto-sync & official logo", table_body_style)],
        [Paragraph("<b>3D Twin Production Build</b>", table_body_style), Paragraph("<code>3d/dist/</code>", table_body_style), Paragraph("Compiled Three.js web app bundle (Vite)", table_body_style)],
    ]
    t_deliv = Table(deliv_data, colWidths=[110, 180, 242])
    t_deliv.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_primary),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_light]),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_deliv)

    story.append(Spacer(1, 10))

    # 4. Service & Port Configuration
    story.append(Paragraph("4. Service & Port Configuration", h1_style))
    port_text = (
        "&bull; <b>Django Backend:</b> <code>http://localhost:8000</code> (LAN: <code>http://172.16.10.21:8000</code>)<br/>"
        "&bull; <b>3D Campus Digital Twin:</b> <code>http://localhost:5173</code><br/>"
        "&bull; <b>Web Admin Portal:</b> <code>http://localhost:5174</code><br/>"
        "&bull; <b>Mobile / Desktop Base URL:</b> Configured dynamically in <code>api_constants.dart</code>"
    )
    story.append(Paragraph(port_text, body_style))

    story.append(Spacer(1, 10))

    # 5. Presentation Demo Walkthrough Guide
    story.append(Paragraph("5. Step-by-Step Presentation Walkthrough Script", h1_style))
    steps = [
        "<b>1. Launch App:</b> Double-click <code>ACTS.lnk</code> on Desktop. App opens instantly while background services spin up in parallel with zero terminal windows.",
        "<b>2. Login:</b> Click <i>1-Click Demo Accounts</i> &rarr; Choose <i>Student 1 (Arjun Sharma)</i> &rarr; Confirm Student ID &rarr; Enter Citizen Portal.",
        "<b>3. Voice AI Reporting:</b> Navigate to <i>Report Infrastructure Defect</i> &rarr; Tap the mic button &rarr; Show animated audio soundwave visualizer &rarr; Tap <i>Corridor Electrical Spark</i> preset card.",
        "<b>4. Autonomous Triage & Questions:</b> Screen automatically scrolls to Section 3 showing <b>S5 Critical Severity</b> and <i>Emergency Electrical Squad 1</i>. Answer clarifying gap questions by clicking <b>[Yes]</b>, <b>[No]</b>, or <b>[Unsure]</b> chips.",
        "<b>5. Submit Defect:</b> Select building location &rarr; Tap <i>Submit Complaint</i> &rarr; Observe immediate green confirmation toast.",
        "<b>6. 3D Digital Twin:</b> Open <i>Campus 3D Twin</i> &rarr; Switch to <i>First-Person View</i> &rarr; Walk using <b>WASD + Shift</b>, look around naturally with mouse, demonstrate head bobbing, crosshair, and wall sliding.",
        "<b>7. Admin Dashboard:</b> Open <code>http://localhost:5174</code> to show incoming ticket ingestion and campus health index updates."
    ]
    for s in steps:
        story.append(Paragraph(f"&bull; {s}", bullet_style))

    doc.build(story)
    print(f"Successfully generated PDF at {output_path}")

if __name__ == '__main__':
    dest = r"C:\Users\devan\Downloads\ACTS_Project_Summary_Report.pdf"
    create_pdf(dest)
