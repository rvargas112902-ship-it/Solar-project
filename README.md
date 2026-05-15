# Sales Pitch Grader

A browser-based app for transcribing sales pitches and grading them against the qualifications,
expectations, and coaching standards you define.

## What it does

- Captures live speech-to-text with the browser Web Speech API when supported.
- Allows transcript paste/editing for recorded calls or external transcription tools.
- Provides an editable weighted rubric for your sales playbook expectations.
- Scores each pitch by matching the transcript against the rubric keywords and phrases.
- Produces coaching recommendations, pitch metrics, and a category-by-category breakdown.

## Getting started

```bash
npm install
npm run dev
```

Open the local Vite URL shown in the terminal. For live microphone transcription, use a browser
that supports the Web Speech API, such as Chrome. If the browser does not support it, paste a
transcript into the text area and the grading workflow still works.

## Useful scripts

```bash
npm run dev      # start the local dev server
npm run build    # type-check and build production assets
npm test         # run grading logic tests
```
