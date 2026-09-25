# ACTS Design System & Anti-AI Frontend Protocol
**Standard:** 2026 Sovereign Mobile-First & Enterprise Command Standard  
**Frameworks Integrated:** `Nutlope/hallmark` (Together AI Anti-Slop System), `shanraisshan/claude-code-best-practice`, Apple Human Interface Guidelines, Linear Design Standards  
**Forbidden:** Generic AI Slop (Banned 4-card grids, raw Tailwind clown colors, unmotivated floating badges, cluttered forms, fake invented metrics)

---

## 1. Hallmark Quality-Check Gates (`Nutlope/hallmark` Standards)

Hallmark enforces strict deterministic design constraints to eliminate statistical AI mediocrity:

### A. The Anti-Pattern Checklist (Mandatory Slop-Test)
1. **The Invented Metric Gate:** ❌ NEVER display hallucinated marketing numbers (e.g. "50,000+ happy teams"). Only real campus operational data (Active tickets, cluster count, verified resolutions).
2. **The Feature Card Ban:** ❌ NEVER generate the repetitive "3 or 4 identical boxes with an icon and two lines of text". Every section must use distinct, intentional macrostructures.
3. **The Gradient Ban:** ❌ NO generic purple-to-blue or rainbow gradients. Use tailored monochromatic depth with subtle OKLCH/HSL tinting.
4. **The Native Chrome Gate:** ❌ NO fake CSS-drawn browser or OS window frames. The app is a native desktop & mobile experience.
5. **The Tone Anchor:** ❌ Reject "clean and modern" as vague slop. ACTS Tone: **Technical Utilitarian & Tactical Luxury** (Think *Citizen App meets Linear & Apple Maps*).
6. **The Contrast Gate:** ❌ NO low-contrast gray text on tinted cards. All text must strictly adhere to WCAG AAA contrast ratios.
7. **The Thumb-Zone Gate:** ❌ On mobile, no critical action may reside in the unreachable top 30% of the screen.

---

## 2. Claude Code Engineering Best Practices (`shanraisshan/claude-code-best-practice`)

1. **Pre-Implementation Plan Mode:** Always state the plan in 2–4 concise bullets before executing multi-file changes.
2. **Test-Driven Verification:** Compile and run (`flutter analyze`, `flutter build`) before declaring any task done — never eyeball syntax.
3. **Context & Token Discipline:** Keep codebase modular; single-responsibility components; never bloat context with monolithic files.
4. **Atomic & Reversible Steps:** Every architectural change must preserve existing working functionality and have zero broken imports.
5. **Zero Placeholders:** 100% complete production-grade code with offline fallbacks so presentations never crash.

---

## 3. Curated 2026 Color System (Non-Generic)

### Surface & Canvas
| Token | Light Mode | Dark Mode | Psychological Role |
|---|---|---|---|
| `canvasBase` | `#F6F7F9` (Warm Ceramic) | `#0B0F17` (Deep Obsidian) | Full screen backdrop, high comfort |
| `surfaceCard` | `#FFFFFF` (Pure White) | `#141A26` (Midnight Glass) | Main elevated cards |
| `surfaceElevated` | `#F0F2F5` (Soft Titanium) | `#1D2433` (Slate Elevation) | Pills, chips, active tabs |
| `hairlineBorder` | `#E5E7EB` (Subtle 1px) | `#232B3B` (Crisp 1px) | Precise structural dividers |

### Typography Hierarchy
| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| `textDisplay` | `#0A0D14` (Near Black, 900) | `#F8FAFC` (Pure Titanium) | Primary headings, titles |
| `textBody` | `#1F2937` (Rich Charcoal, 600) | `#CBD5E1` (Silver Slate) | Readable content, notes |
| `textMuted` | `#64748B` (Neutral Slate, 500) | `#8A94A6` (Atmospheric Muted) | Labels, timestamps, hints |

### Signature Accents & Operational Signals (Muted Luxury)
| Token | Hex Value | Psychological Role |
|---|---|---|
| `brandSapphire` | `#1D4ED8` / `#2563EB` | Focused interaction, primary action buttons |
| `signalVermilion` | `#DC2626` | High-voltage / Critical safety hazard (with 8% ambient aura) |
| `signalAmber` | `#B45309` (Warm Ochre) | Needs action / Queued triage (never eye-searing yellow) |
| `signalCobalt` | `#0284C7` (Sky Slate) | Active in-progress crew dispatch |
| `signalEmerald` | `#059669` (Deep Lustre) | Verified resolved issue with photo proof |

---

## 4. Two Completely Separate Portals: Architectural Blueprint

```
                              ACTS ARCHITECTURE
                                      │
         ┌────────────────────────────┴────────────────────────────┐
         ▼                                                         ▼
 CITIZEN PORTAL (Mobile First)                             ADMIN PORTAL (Desktop First)
 ─────────────────────────────                             ────────────────────────────
 • Living Campus GIS Canvas                                • High-Density Telemetry Matrix
 • Draggable Silky Bottom Sheet                            • Dual-Pane GIS & Cluster Radar
 • 1-Tap Shutter + Auto GPS Tag                            • Live Crew Dispatch Board (SLA)
 • "+1 Confirm" Duplicate Deduplication                    • Human Override Priority Slider
 • Personal Timeline with Photo Proof                      • Department Direct Connect
```

### Portal 1: Citizen Mobile-First Experience (Consumer Grade)
- **Living Campus Canvas:** Background is an interactive, beautiful spatial canvas of ABESEC Ghaziabad.
- **Floating 1-Tap Shutter Action Bar:** Docked at the bottom thumb zone for instantaneous camera capture with auto-detected GPS coordinates.
- **Draggable Bottom Sheet:** Silky gesture sheet that pulls up to display nearby campus defects with distance indicators ("20m away • Gate 1 Boulevard").
- **1-Tap "+1 Confirm":** If another student already reported a pothole or exposed wire, 1 tap adds a confirmation vote, multiplying the crowd-cluster weight without requiring the user to fill duplicate forms.
- **Resolution Proof Cards:** Before/After photo comparison with verification seals.

### Portal 2: Admin Operations Command Center (Enterprise Grade)
- **High-Density Split Pane:** Real-time spatial radar on one pane, live incident dispatch queue on the other.
- **Multi-Crew Dispatch Board:** Drag-and-drop or 1-click dispatch to Road Maintenance, Electrical Safety, or Plumbing squads.
- **SLA Urgency Countdown:** Dynamic urgency calculation based on crowd reports and time elapsed.
- **Human-in-the-Loop Override:** Fine-tune AI triage severity with reason logs.
