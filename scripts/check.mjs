import assert from "node:assert/strict";
import {
  DEFAULT_NOTES,
  buildAnalysis,
  classifyMethod,
  parseNotes,
  toCsv,
  toMarkdown
} from "../src/litScope.js";

const sampleSources = parseNotes(DEFAULT_NOTES);
assert.equal(sampleSources.length, 4, "default sample should parse four source notes");
assert.equal(sampleSources[0].title, "Sample note A - retrieval checks in a chemistry review");
assert.equal(sampleSources[0].relevance.includes("---"), false, "separator should not be captured as content");
assert.equal(sampleSources[0].themes.includes("retrieval practice"), true);
assert.equal(sampleSources[1].methodCategory, "Qualitative");

const sampleAnalysis = buildAnalysis(sampleSources);
assert.equal(sampleAnalysis.sourceCount, 4);
assert.equal(sampleAnalysis.themeMap.some((entry) => entry.theme === "paper reading" && entry.count === 2), true);
assert.equal(sampleAnalysis.completion, 100);
assert.equal(sampleAnalysis.gapPrompts.length > 0, true);
assert.match(sampleAnalysis.nextAction, /confirming or contrasting source/);

assert.equal(classifyMethod("randomized classroom trial"), "Experiment");
assert.equal(classifyMethod("survey questionnaire with Likert scale"), "Survey");
assert.equal(classifyMethod("corpus log regression"), "Data analysis");

const compact = parseNotes(`paper: One
method: survey
themes: reading
finding: ok
limitation: small
evidence: p. 2
paper: Two
method: interview
themes: reading, notes
finding: better
limitation: narrow
evidence: p. 9`);
assert.equal(compact.length, 2, "a new paper field should start a new block");

const missing = buildAnalysis(`title: Rough note
themes: writing
finding: draft only`);
assert.equal(missing.missingByField.method, 1);
assert.equal(missing.missingByField.limitation, 1);
assert.equal(missing.missingByField.evidence, 1);
assert.match(missing.nextAction, /Add 2 more source note/);

const fieldGap = buildAnalysis(`title: One
method: survey
themes: review
finding: ok
limitation: narrow
evidence: p. 1
---
title: Two
method: interview
themes: review
finding: ok
limitation: narrow
evidence: p. 2
---
title: Three
themes: review
finding: ok
limitation: narrow
evidence: p. 3`);
assert.match(fieldGap.nextAction, /Fill method for 1 source note/);

const markdown = toMarkdown(sampleAnalysis, { title: "Check", date: "2026-05-29" });
assert.match(markdown, /Academic caution/);
assert.match(markdown, /## Next Pass/);
assert.match(markdown, /\| ID \| Source \| Method/);

const csv = toCsv(sampleSources);
assert.match(csv, /^id,title,authors,year/m);
assert.match(csv, /"classroom quiz intervention, n=96"/);

const guardedCsv = toCsv(parseNotes(`title: =IMPORTXML("https://example.test","//a")
authors: @handle
year: 2026
method: +survey
themes: export safety
finding: -formula-like note
limitation: safe export boundary
evidence: =A1`));
assert.match(guardedCsv, /"'=IMPORTXML/);
assert.match(guardedCsv, /'@handle/);
assert.match(guardedCsv, /'\+survey/);
assert.match(guardedCsv, /'-formula-like note/);
assert.match(guardedCsv, /'=A1/);

console.log("All lit scope checks passed.");
