export const DEFAULT_NOTES = `title: Sample note A - retrieval checks in a chemistry review
authors: Synthetic Classroom Team
year: 2024
method: classroom quiz intervention, n=96
themes: retrieval practice, feedback timing, exam review
finding: weekly low-stakes checks helped the sample class notice weak concepts before the final review.
limitation: one course section; instructor-written checks; short follow-up window.
evidence: synthetic table note, p. 7
relevance: useful when deciding whether short recall checks belong in a lab-review plan.
---
title: Sample note B - annotated readings in a methods seminar
authors: Synthetic Reading Group
year: 2023
method: qualitative interview study, n=18
themes: annotation habits, paper reading, feedback timing
finding: students kept richer method notes when prompts asked for evidence, limits, and reuse context.
limitation: self-reported workflow; small seminar sample.
evidence: synthetic interview memo, section 3
relevance: helps design a reading template that makes method comparison easier.
---
title: Sample note C - visual concept maps before exam practice
authors: Synthetic Learning Lab
year: 2022
method: mixed methods classroom comparison, n=64
themes: concept mapping, exam review, transfer questions
finding: maps exposed missing prerequisite links before students attempted transfer problems.
limitation: short unit; map scoring rubric was course-specific.
evidence: synthetic rubric summary, figure 2
relevance: supports adding a concept-link column to revision notes.
---
title: Sample note D - literature matrix use in a thesis group
authors: Synthetic Thesis Studio
year: 2025
method: reading log audit, n=12 projects
themes: literature matrix, paper reading, research gap
finding: source grids made repeated methods, thin themes, and missing limitations easier to discuss.
limitation: advisory group context; no outcome comparison.
evidence: synthetic audit memo, appendix A
relevance: directly motivates a local matrix builder for early literature review work.`;

const FIELD_ALIASES = new Map([
  ["title", "title"],
  ["paper", "title"],
  ["source", "title"],
  ["study", "title"],
  ["citation", "title"],
  ["author", "authors"],
  ["authors", "authors"],
  ["year", "year"],
  ["date", "year"],
  ["aim", "aim"],
  ["question", "aim"],
  ["research question", "aim"],
  ["method", "method"],
  ["methods", "method"],
  ["methodology", "method"],
  ["sample", "sample"],
  ["data", "sample"],
  ["setting", "sample"],
  ["theme", "themes"],
  ["themes", "themes"],
  ["tag", "themes"],
  ["tags", "themes"],
  ["finding", "finding"],
  ["findings", "finding"],
  ["result", "finding"],
  ["results", "finding"],
  ["claim", "finding"],
  ["limitation", "limitation"],
  ["limitations", "limitation"],
  ["weakness", "limitation"],
  ["limits", "limitation"],
  ["evidence", "evidence"],
  ["page", "evidence"],
  ["pages", "evidence"],
  ["quote", "evidence"],
  ["evidence page", "evidence"],
  ["relevance", "relevance"],
  ["use", "relevance"],
  ["reuse", "relevance"],
  ["notes", "notes"],
  ["note", "notes"]
]);

const CORE_FIELDS = ["method", "themes", "finding", "limitation", "evidence"];

export function splitBlocks(input) {
  const lines = String(input || "").replace(/\r/g, "").split("\n");
  const blocks = [];
  let current = [];

  const push = () => {
    const text = current.join("\n").trim();
    if (text) blocks.push(text);
    current = [];
  };

  for (const line of lines) {
    if (/^\s*-{3,}\s*$/.test(line)) {
      push();
      continue;
    }

    const startsSource = /^\s*(title|paper|source|study)\s*:/i.test(line) || /^\s*#\s+\S+/.test(line);
    const alreadyHasSource = current.some((entry) => /^\s*(title|paper|source|study)\s*:/i.test(entry) || /^\s*#\s+\S+/.test(entry));
    if (startsSource && alreadyHasSource) {
      push();
    }

    current.push(line);
  }

  push();
  return blocks;
}

export function parseNotes(input) {
  return splitBlocks(input).map(parseBlock).map(normalizeSource).filter(Boolean);
}

function parseBlock(block, index) {
  const record = {
    title: "",
    authors: "",
    year: "",
    aim: "",
    method: "",
    sample: "",
    themes: "",
    finding: "",
    limitation: "",
    evidence: "",
    relevance: "",
    notes: "",
    raw: block,
    index
  };
  let activeKey = "";

  for (const rawLine of block.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;

    const heading = line.match(/^#\s+(.+)$/);
    if (heading) {
      record.title = appendValue(record.title, heading[1]);
      activeKey = "title";
      continue;
    }

    const match = line.match(/^([A-Za-z][A-Za-z0-9 _/-]{1,36})\s*:\s*(.*)$/);
    if (match) {
      const key = canonicalKey(match[1]);
      const value = match[2].trim();
      if (Object.hasOwn(record, key)) {
        record[key] = appendValue(record[key], value);
        activeKey = key;
      } else {
        record.notes = appendValue(record.notes, `${match[1].trim()}: ${value}`);
        activeKey = "notes";
      }
      continue;
    }

    if (activeKey && Object.hasOwn(record, activeKey)) {
      record[activeKey] = appendValue(record[activeKey], line.replace(/^[-*]\s+/, ""));
    } else {
      record.notes = appendValue(record.notes, line.replace(/^[-*]\s+/, ""));
      activeKey = "notes";
    }
  }

  return record;
}

function canonicalKey(rawKey) {
  const key = rawKey.toLowerCase().replace(/[_/-]+/g, " ").replace(/\s+/g, " ").trim();
  return FIELD_ALIASES.get(key) || "notes";
}

function appendValue(previous, next) {
  const value = String(next || "").trim();
  if (!value) return previous || "";
  return previous ? `${previous}; ${value}` : value;
}

function normalizeSource(record, index) {
  const title = cleanText(record.title) || `Untitled source ${index + 1}`;
  const year = extractYear(record.year || record.title || record.notes);
  const themes = unique(splitItems(record.themes).map(cleanTheme).filter(Boolean));
  const method = cleanText(record.method);
  const source = {
    id: `S${index + 1}`,
    title,
    authors: cleanText(record.authors),
    year,
    aim: cleanText(record.aim),
    method,
    methodCategory: classifyMethod(method),
    sample: cleanText(record.sample),
    themes,
    finding: cleanText(record.finding),
    limitation: cleanText(record.limitation),
    evidence: cleanText(record.evidence),
    relevance: cleanText(record.relevance),
    notes: cleanText(record.notes),
    raw: record.raw
  };
  source.missingFields = missingFields(source);
  return source;
}

export function classifyMethod(method) {
  const text = String(method || "").toLowerCase();
  if (!text) return "Not recorded";
  if (/meta|systematic review|scoping review|review\b/.test(text)) return "Review";
  if (/mixed|multi-method/.test(text)) return "Mixed methods";
  if (/interview|focus group|ethnograph|case study|qualitative|thematic/.test(text)) return "Qualitative";
  if (/experiment|rct|random|intervention|trial|pretest|posttest|control/.test(text)) return "Experiment";
  if (/survey|questionnaire|scale|likert/.test(text)) return "Survey";
  if (/corpus|dataset|log|audit|regression|model|quantitative|statistic/.test(text)) return "Data analysis";
  return "Other method";
}

export function buildAnalysis(inputOrSources) {
  const sources = Array.isArray(inputOrSources) ? inputOrSources : parseNotes(inputOrSources);
  const themeMap = buildThemeMap(sources);
  const methodCounts = countBy(sources.map((source) => source.methodCategory));
  const missingByField = {};
  for (const field of CORE_FIELDS) missingByField[field] = 0;

  for (const source of sources) {
    for (const field of source.missingFields) {
      missingByField[field] = (missingByField[field] || 0) + 1;
    }
  }

  const completion = completionScore(sources);
  const topMethod = topEntry(methodCounts);
  const gapPrompts = buildGapPrompts(sources, themeMap, topMethod, missingByField);
  const nextAction = buildNextAction(sources, themeMap, topMethod, missingByField);

  return {
    sources,
    sourceCount: sources.length,
    themeCount: themeMap.length,
    themeMap,
    methodCounts,
    topMethod,
    missingByField,
    completion,
    nextAction,
    gapPrompts
  };
}

function buildThemeMap(sources) {
  const map = new Map();
  for (const source of sources) {
    for (const theme of source.themes) {
      if (!map.has(theme)) {
        map.set(theme, {
          theme,
          count: 0,
          sourceIds: [],
          methodCategories: new Set(),
          years: []
        });
      }
      const entry = map.get(theme);
      entry.count += 1;
      entry.sourceIds.push(source.id);
      entry.methodCategories.add(source.methodCategory);
      if (source.year) entry.years.push(source.year);
    }
  }

  return Array.from(map.values())
    .map((entry) => ({
      ...entry,
      methodCategories: Array.from(entry.methodCategories).sort(),
      years: entry.years.sort()
    }))
    .sort((a, b) => b.count - a.count || a.theme.localeCompare(b.theme));
}

function missingFields(source) {
  const missing = [];
  if (!source.method) missing.push("method");
  if (!source.themes.length) missing.push("themes");
  if (!source.finding) missing.push("finding");
  if (!source.limitation) missing.push("limitation");
  if (!source.evidence) missing.push("evidence");
  return missing;
}

function completionScore(sources) {
  if (!sources.length) return 0;
  const total = sources.length * CORE_FIELDS.length;
  const missing = sources.reduce((sum, source) => sum + source.missingFields.length, 0);
  return Math.round(((total - missing) / total) * 100);
}

function buildGapPrompts(sources, themeMap, topMethod, missingByField) {
  if (!sources.length) {
    return ["Add at least one source note with title, method, themes, finding, limitation, and evidence fields."];
  }

  const prompts = [];
  if (sources.length < 3) {
    prompts.push("Add more source notes before treating this as a synthesis matrix.");
  }

  for (const entry of themeMap.filter((theme) => theme.count === 1).slice(0, 4)) {
    prompts.push(`Theme "${entry.theme}" appears in one note; find a confirming or contrasting source before making it central.`);
  }

  if (topMethod && sources.length >= 3 && topMethod.count / sources.length >= 0.6) {
    prompts.push(`Most notes use "${topMethod.label}"; look for another design so method limits are easier to see.`);
  }

  for (const field of CORE_FIELDS) {
    if (missingByField[field] > 0) {
      prompts.push(`${missingByField[field]} source note(s) are missing ${field}; fill that column before exporting final review notes.`);
    }
  }

  if (!prompts.length) {
    prompts.push("Matrix looks complete enough for a first synthesis pass; now compare disagreements, not just repeated findings.");
  }

  return unique(prompts).slice(0, 8);
}

function buildNextAction(sources, themeMap, topMethod, missingByField) {
  if (!sources.length) {
    return "Load the sample or paste one source note with method, themes, finding, limitation, and evidence.";
  }

  if (sources.length < 3) {
    const remaining = 3 - sources.length;
    return `Add ${remaining} more source note(s) before treating this as a synthesis matrix.`;
  }

  const largestGap = Object.entries(missingByField)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
  if (largestGap) {
    const [field, count] = largestGap;
    return `Fill ${field} for ${count} source note(s); that column has the biggest extraction gap.`;
  }

  const thinTheme = themeMap.find((theme) => theme.count === 1);
  if (thinTheme) {
    return `Add one confirming or contrasting source for "${thinTheme.theme}" before using it as a synthesis theme.`;
  }

  if (topMethod && sources.length >= 3 && topMethod.count / sources.length >= 0.6) {
    return `Add a source with a different method than "${topMethod.label}" to test whether the pattern holds across designs.`;
  }

  return "Matrix is ready for a first synthesis pass; compare disagreements and reusable evidence pointers next.";
}

function countBy(values) {
  const counts = {};
  for (const value of values) {
    const label = value || "Not recorded";
    counts[label] = (counts[label] || 0) + 1;
  }
  return counts;
}

function topEntry(counts) {
  return Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))[0] || null;
}

function splitItems(value) {
  return String(value || "")
    .split(/[,;|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function cleanTheme(value) {
  return cleanText(value).toLowerCase();
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function unique(values) {
  return Array.from(new Set(values));
}

function extractYear(value) {
  const match = String(value || "").match(/\b(19|20)\d{2}\b/);
  return match ? match[0] : "";
}

export function toMarkdown(analysis, options = {}) {
  const title = options.title || "Literature scope grid";
  const date = options.date || new Date().toISOString().slice(0, 10);
  const lines = [
    `# ${title}`,
    "",
    `Generated: ${date}`,
    "",
    "Academic caution: this file only reorganizes notes you provided. Verify every source, page marker, and interpretation against the original material.",
    "",
    `Sources: ${analysis.sourceCount}`,
    `Themes: ${analysis.themeCount}`,
    `Extraction completeness: ${analysis.completion}%`,
    "",
    "## Source Matrix",
    "",
    "| ID | Source | Method | Themes | Finding | Limitation | Evidence |",
    "| --- | --- | --- | --- | --- | --- | --- |"
  ];

  for (const source of analysis.sources) {
    lines.push([
      source.id,
      sourceLabel(source),
      source.method || "Missing",
      source.themes.join(", ") || "Missing",
      source.finding || "Missing",
      source.limitation || "Missing",
      source.evidence || "Missing"
    ].map(markdownCell).join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  }

  lines.push("", "## Theme Coverage", "");
  for (const theme of analysis.themeMap) {
    lines.push(`- ${theme.theme}: ${theme.count} source(s), ${theme.methodCategories.join(", ")}`);
  }

  lines.push("", "## Next Pass", "", `- ${analysis.nextAction}`);

  lines.push("", "## Gap Prompts", "");
  for (const prompt of analysis.gapPrompts) {
    lines.push(`- ${prompt}`);
  }

  return lines.join("\n");
}

export function toCsv(sources) {
  const rows = [
    ["id", "title", "authors", "year", "method_category", "method", "themes", "finding", "limitation", "evidence", "relevance"]
  ];
  for (const source of sources) {
    rows.push([
      source.id,
      source.title,
      source.authors,
      source.year,
      source.methodCategory,
      source.method,
      source.themes.join("; "),
      source.finding,
      source.limitation,
      source.evidence,
      source.relevance
    ]);
  }
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

export function sourceLabel(source) {
  const bits = [source.title];
  if (source.authors) bits.push(source.authors);
  if (source.year) bits.push(source.year);
  return bits.join(" - ");
}

function markdownCell(value) {
  return String(value || "").replace(/\|/g, "\\|").replace(/\n/g, " ").trim();
}

function csvCell(value) {
  const text = guardSpreadsheetFormula(String(value || ""));
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function guardSpreadsheetFormula(text) {
  return /^[\t ]*[=+\-@]/.test(text) ? `'${text}` : text;
}
