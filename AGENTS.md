# AGENTS.md

## Cursor Cloud specific instructions

### Repository structure

The `main` branch contains only a README. All application code lives on feature branches:

- **`origin/cursor/sales-pitch-grader-c80e`** — React/TypeScript (Vite) web app for grading sales pitches. This is the primary application.
- **`origin/cursor/redesign-solar-field-deck-0966`** — Python scripts (`reportlab`, `pillow`) to generate PDF field card decks.
- **`origin/cursor/appointment-setter-handbook-*`** — Markdown documentation for solar appointment setter training.

### Sales Pitch Grader (React/TypeScript)

- **Package manager:** npm (lockfile: `package-lock.json`)
- **Dev server:** `npm run dev` → Vite on `http://localhost:5173/`
- **Tests:** `npm test` → Vitest
- **Type-check:** `npx tsc -b`
- **Build:** `npm run build`
- No ESLint config is present; type-checking via `tsc` is the primary lint mechanism.
- No backend or database; the app is a fully client-side SPA.

### Python PDF generation scripts

- Python dependencies: `pip install reportlab pillow`
- Scripts live on the `redesign-solar-field-deck-0966` and `appointment-setter-handbook-bb36` branches.
- These are standalone offline scripts, not long-running services.

### Notes

- The Vite dev server auto-reloads on file changes; no restart needed for frontend edits.
- There are no environment variables, secrets, or external services required.
