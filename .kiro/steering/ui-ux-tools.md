---
inclusion: manual
name: ui-ux-tools
description: UI/UX audit, design intelligence, and premium component tools installed in this workspace
---

# UI/UX Tools Available in Project Aura

Seven professional design-intelligence tools are installed in `.kiro/skills/`. Use them as follows:

---

## 1. UI UX Pro Max Skill
**Repo:** `.kiro/skills/ui-ux-pro-max/`
**Source:** https://github.com/nextlevelbuilder/ui-ux-pro-max-skill

The #1 design intelligence skill. Before building or redesigning any page, run the design system generator first:

```bash
python3 .kiro/skills/ui-ux-pro-max/scripts/search.py "palliative healthcare ghana" --design-system -p "Project Aura"
```

Other searches:
```bash
# Find a color palette
python3 .kiro/skills/ui-ux-pro-max/scripts/search.py "healthcare teal dark" --domain color

# Find a UI style
python3 .kiro/skills/ui-ux-pro-max/scripts/search.py "premium dashboard cards" --domain style

# Find typography
python3 .kiro/skills/ui-ux-pro-max/scripts/search.py "modern sans serif professional" --domain typography

# UX guidelines for a feature
python3 .kiro/skills/ui-ux-pro-max/scripts/search.py "forms accessibility" --domain ux

# Chart types for dashboard
python3 .kiro/skills/ui-ux-pro-max/scripts/search.py "clinical metrics dashboard" --domain chart
```

**What it contains:**
- 67 UI styles (Glassmorphism, Neumorphism, Aurora, AI-Native, Minimalist, etc.)
- 161 color palettes (Healthcare, SaaS, Fintech, etc.)
- 57 font pairings with Tailwind configs
- 25 chart type recommendations
- 161 reasoning rules and anti-patterns
- 34 landing page conversion patterns
- 99 UX guidelines

---

## 2. Dembrandt — Design Token Extractor
**Repo:** `.kiro/skills/dembrandt/`
**Source:** https://github.com/dembrandt/dembrandt

Extracts any live website's complete design system into tokens in seconds using headless Chromium.

```bash
# Install (one time)
npm install -g dembrandt

# Extract Aura's own design tokens and audit WCAG contrast
dembrandt http://localhost:5173 --wcag --html --output .kiro/aura-design-audit.html

# Extract tokens from a reference site (e.g. Zocdoc for services page inspiration)
dembrandt https://www.zocdoc.com --dtcg --output .kiro/zocdoc-tokens.json

# Generate Tailwind v4 theme from extracted tokens
dembrandt http://localhost:5173 --tailwind --output .kiro/aura-tailwind-theme.css

# Compare current vs baseline (drift detection)
dembrandt http://localhost:5173 --compare .kiro/baseline.json

# Extract with dark mode
dembrandt http://localhost:5173 --dark-mode
```

**Key flags:**
| Flag | What it does |
|------|-------------|
| `--wcag` | WCAG contrast audit on every color pair |
| `--html` | Self-contained HTML visual report |
| `--dtcg` | W3C Design Tokens format |
| `--tailwind` | Tailwind v4 @theme CSS |
| `--shadcn` | shadcn/ui theme slots |
| `--compare` | Drift detection vs baseline |
| `--crawl N` | Extract N pages automatically |

---

## 3. Dembrandt Skills — 40 UX Agent Skills
**Repo:** `.kiro/skills/dembrandt-skills/`
**Source:** https://github.com/dembrandt/dembrandt-skills

40 structured UX skills for AI agents. The orchestrator runs a full 6-stage pipeline:
`brand foundation → tokens → layout → components → polish → a11y gate`

Key skills available:
- `orchestrator` — end-to-end design review
- `extract-design-pipeline` — pull tokens from any URL
- `generate-ui-from-brand` — build UI matching extracted tokens
- `wcag-accessibility` — WCAG compliance gate
- `visual-emphasis-and-hierarchy` — fix visual weight problems
- `button-states` — audit interactive states
- +39 more

To use: reference `.kiro/skills/dembrandt-skills/skills/` in your prompts.

---

## 4. OpenDesign
**Repo:** `.kiro/skills/open-design/`
**Source:** https://github.com/nexu-io/open-design

Local-first open-source design workspace. 259+ composable skills, 142+ brand-grade design systems already extracted (Stripe, OpenAI, Vercel, Apple, etc.).

Pre-extracted design systems in `.kiro/skills/open-design/design-systems/`:
```
openai/DESIGN.md
stripe/DESIGN.md
vercel/DESIGN.md
linear/DESIGN.md
... and 138 more
```

Use these as reference: tell Kiro to "follow the design language in `.kiro/skills/open-design/design-systems/stripe/DESIGN.md`" when building a component.

---

## 5. UI/UX Audit & Fix Prompt
**Repo:** `.kiro/skills/ui-ux-audit-fix/`
**Source:** https://github.com/MorinelloA/ui-ux-audit-and-fix-prompt

Reviews every screen at phone/tablet/desktop, light/dark, normal/large text. Fixes:
- Field and control sizing
- Touch target compliance
- Design kit drift
- Layout breakpoints
- Component grouping

Prompt Kiro: "Run a UI/UX audit on the Services page using the prompt in `.kiro/skills/ui-ux-audit-fix/`"

---

## 6. UX/UI Skills (Linear/Stripe/Vercel tier)
**Repo:** `.kiro/skills/ux-ui-skills/`
**Source:** https://github.com/taylorwinfield/ux-ui-skills

10 skills that produce Linear / Notion / Vercel / Stripe-tier UI:
- `bootstrap` — scaffolds design tokens and component vocabulary
- `state-design` — empty, loading, error, success states
- `hierarchy` — visual weight and information architecture
- `interaction-craft` — hover, focus, active states
- `copy-precision` — button labels, error messages, microcopy
- `audit` — systematic interface review

---

## 7. UI UX Design Pro Skill
**Repo:** `.kiro/skills/ui-ux-design-pro/`
**Source:** https://github.com/saifyxpro/ui-ux-design-pro-skill

Senior-level design intelligence with:
- 107 UI styles
- 127 color palettes
- 107 font pairings
- 150+ reasoning rules
- 18 platform templates
- 1,875+ data rows

Powered by Orama search engine (fast). Alternative/complement to ui-ux-pro-max.

---

## How to use all of these together on Aura

**Workflow for redesigning a page:**
1. Run `dembrandt http://localhost:5173/services --wcag` — get the current audit
2. Run ui-ux-pro-max search for healthcare styles
3. Pick a reference site from open-design design systems
4. Ask Kiro to redesign following the generated design brief
5. Run dembrandt audit again to verify improvement

**Workflow for a new component:**
1. Search ui-ux-pro-max: `python3 .kiro/skills/ui-ux-pro-max/scripts/search.py "provider card healthcare" --domain style`
2. Reference ux-ui-skills/bootstrap for token structure
3. Build with Kiro

**Reference sites already extracted in open-design:**
Tell Kiro: *"Build this to match `.kiro/skills/open-design/design-systems/stripe/DESIGN.md`"*
