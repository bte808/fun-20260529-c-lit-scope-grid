# Lit Scope Grid

Lit Scope Grid is a local-first literature review matrix builder. Paste structured notes from papers, reports, course readings, or thesis sources, then get a source matrix, theme coverage, gap prompts, and Markdown/CSV exports.

It is built for early literature review work where the hard part is seeing what each source actually supports before writing synthesis prose.

## What it can do

- Parse source notes with fields such as `title`, `authors`, `year`, `method`, `themes`, `finding`, `limitation`, `evidence`, and `relevance`.
- Build a comparison matrix across source, method, themes, finding, limitation, and evidence pointer.
- Summarize theme coverage and method mix.
- Recommend the next review pass, such as adding sources, filling missing fields, or checking a thin theme.
- Flag missing columns and thin themes as synthesis prompts.
- Export Markdown for notes and CSV for spreadsheets, with formula-like CSV cells guarded before spreadsheet import.
- Run entirely in the browser without accounts, keys, or network calls.

## Good learning and research scenarios

- Planning a seminar literature review before drafting paragraphs.
- Comparing several papers that use different methods.
- Checking whether a theme has enough source support.
- Preparing adviser meeting notes from rough paper-reading logs.
- Turning course reading notes into a structured revision table.

## Why it is useful

Traditional literature matrix templates are helpful, but filling them manually often hides missing evidence pointers, limitations, or thin themes. Lit Scope Grid keeps the workflow small: paste notes, inspect the matrix, fill the weak columns, then export.

## Why it is interesting

The tool treats a literature review as a scope map instead of a writing task. That makes the next action concrete: add a source, verify a page marker, find a contrasting method, or remove an under-supported theme.

## Academic caution

Lit Scope Grid does not search databases, create citations, invent papers, or judge whether a finding is true. It only reorganizes notes provided by the user. Always verify source details, page markers, claims, and interpretations against the original paper, textbook, dataset, or instructor material.

The built-in default notes are synthetic examples. They are not real citations or evidence.

## Inspiration sources

Public pages checked on 2026-05-29 inspired the bounded idea of a lightweight literature review matrix. The implementation, sample content, UI, and wording here are original.

- The Review Protocol: Literature Review Matrix - https://thereviewprotocol.com/blog/literature-review-matrix-organize-sources/
- CiteDash: Literature Review Matrix Template - https://citedash.ai/blog/literature-review-matrix-template
- Deakin Study Support: Literature review notetaking matrix - https://www.deakin.edu.au/__data/assets/pdf_file/0010/2525266/Literature-review-notetaking-matrix_Deakin-Study-Support.pdf

## How to run

Open `index.html` directly, or serve the folder locally:

```bash
python3 -m http.server 5191 --bind localhost
```

Then open:

```text
http://localhost:5191/
```

## Core usage

Use one block per source. Separate sources with `---`.

```text
title: Example source title
authors: Name or group
year: 2026
method: survey, n=120
themes: note taking, feedback, exam review
finding: Main finding in your own words.
limitation: Boundary or caveat from the source.
evidence: page, figure, table, quote marker, or notebook pointer.
relevance: Why this source matters for your review question.
```

Then use:

1. `Analyze` to refresh the matrix.
2. `Theme` to filter rows.
3. `Copy MD`, `Download MD`, or `Download CSV` to export.

## Implemented features

- Dependency-free static HTML/CSS/JS app.
- Deterministic parser and analysis functions in `src/litScope.js`.
- Default synthetic sample that demonstrates the full flow immediately.
- Matrix completeness meter.
- Next-pass recommendation for the most useful immediate cleanup or synthesis step.
- Theme coverage bars.
- Gap prompts for thin themes, method imbalance, and missing fields.
- Clipboard copy with selection fallback.
- Markdown and CSV downloads with spreadsheet-formula guards.
- Responsive desktop and mobile layout.

## Validation

```bash
npm test
npm run check
python3 -m http.server 5191 --bind localhost
curl -I http://localhost:5191/index.html
```

The app should load without a blank screen, parse the default sample, render the matrix, support theme filtering, and export Markdown/CSV without requiring a private environment.
