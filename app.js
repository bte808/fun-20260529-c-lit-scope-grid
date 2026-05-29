import {
  DEFAULT_NOTES,
  buildAnalysis,
  sourceLabel,
  toCsv,
  toMarkdown
} from "./src/litScope.js?v=20260529-next-pass";

const STORAGE_KEY = "lit-scope-grid:draft:v1";

const els = {
  notes: document.querySelector("#notes"),
  analyze: document.querySelector("#analyze"),
  loadSample: document.querySelector("#load-sample"),
  clear: document.querySelector("#clear"),
  copyMd: document.querySelector("#copy-md"),
  downloadMd: document.querySelector("#download-md"),
  downloadCsv: document.querySelector("#download-csv"),
  themeFilter: document.querySelector("#theme-filter"),
  status: document.querySelector("#status"),
  stats: document.querySelector("#stats"),
  nextAction: document.querySelector("#next-action"),
  matrixBody: document.querySelector("#matrix-body"),
  themes: document.querySelector("#themes"),
  gaps: document.querySelector("#gaps"),
  markdown: document.querySelector("#markdown-preview"),
  emptyState: document.querySelector("#empty-state")
};

let latestAnalysis = null;

function init() {
  els.notes.value = localStorage.getItem(STORAGE_KEY) || DEFAULT_NOTES;
  els.analyze.addEventListener("click", render);
  els.notes.addEventListener("input", () => {
    localStorage.setItem(STORAGE_KEY, els.notes.value);
    render();
  });
  els.themeFilter.addEventListener("change", render);
  els.loadSample.addEventListener("click", () => {
    els.notes.value = DEFAULT_NOTES;
    localStorage.setItem(STORAGE_KEY, els.notes.value);
    render("Synthetic sample loaded.");
  });
  els.clear.addEventListener("click", () => {
    els.notes.value = "";
    localStorage.setItem(STORAGE_KEY, "");
    render("Draft cleared.");
    els.notes.focus();
  });
  els.copyMd.addEventListener("click", copyMarkdown);
  els.downloadMd.addEventListener("click", () => downloadFile("lit-scope-grid.md", latestMarkdown(), "text/markdown"));
  els.downloadCsv.addEventListener("click", () => downloadFile("lit-scope-grid.csv", toCsv(latestAnalysis.sources), "text/csv"));
  render();
}

function render(message = "") {
  const notice = typeof message === "string" ? message : "";
  latestAnalysis = buildAnalysis(els.notes.value);
  localStorage.setItem(STORAGE_KEY, els.notes.value);
  renderStats();
  renderNextAction();
  renderThemeFilter();
  renderMatrix();
  renderThemes();
  renderGaps();
  els.markdown.textContent = latestMarkdown();
  els.emptyState.hidden = latestAnalysis.sourceCount > 0;
  const ready = latestAnalysis.sourceCount > 0;
  els.copyMd.disabled = !ready;
  els.downloadMd.disabled = !ready;
  els.downloadCsv.disabled = !ready;
  setStatus(notice || `${latestAnalysis.sourceCount} source note(s) parsed.`);
}

function renderNextAction() {
  els.nextAction.textContent = latestAnalysis.nextAction;
}

function renderStats() {
  els.stats.innerHTML = "";
  const stats = [
    ["Sources", latestAnalysis.sourceCount],
    ["Themes", latestAnalysis.themeCount],
    ["Completeness", `${latestAnalysis.completion}%`],
    ["Top method", latestAnalysis.topMethod ? latestAnalysis.topMethod.label : "None"]
  ];

  for (const [label, value] of stats) {
    const item = document.createElement("div");
    item.className = "stat";
    item.innerHTML = `<span>${label}</span><strong>${escapeHtml(value)}</strong>`;
    els.stats.append(item);
  }
}

function renderThemeFilter() {
  const selected = els.themeFilter.value;
  const options = [`<option value="">All themes</option>`].concat(
    latestAnalysis.themeMap.map((theme) => `<option value="${escapeAttr(theme.theme)}">${escapeHtml(theme.theme)}</option>`)
  );
  els.themeFilter.innerHTML = options.join("");
  if (latestAnalysis.themeMap.some((theme) => theme.theme === selected)) {
    els.themeFilter.value = selected;
  }
}

function renderMatrix() {
  const filter = els.themeFilter.value;
  const rows = latestAnalysis.sources.filter((source) => !filter || source.themes.includes(filter));
  els.matrixBody.innerHTML = "";

  for (const source of rows) {
    const tr = document.createElement("tr");
    if (source.missingFields.length) tr.classList.add("needs-work");
    tr.innerHTML = `
      <td><span class="id">${source.id}</span></td>
      <td><strong>${escapeHtml(sourceLabel(source))}</strong><small>${escapeHtml(source.relevance || source.aim || "No reuse note yet")}</small></td>
      <td>${escapeHtml(source.methodCategory)}<small>${escapeHtml(source.method || "Missing method")}</small></td>
      <td>${renderChips(source.themes)}</td>
      <td>${escapeHtml(source.finding || "Missing finding")}</td>
      <td>${escapeHtml(source.limitation || "Missing limitation")}</td>
      <td>${escapeHtml(source.evidence || "Missing evidence")}</td>
    `;
    els.matrixBody.append(tr);
  }

  if (!rows.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="7" class="blank">No source notes match this theme.</td>`;
    els.matrixBody.append(tr);
  }
}

function renderThemes() {
  els.themes.innerHTML = "";
  const max = Math.max(1, ...latestAnalysis.themeMap.map((theme) => theme.count));
  for (const theme of latestAnalysis.themeMap) {
    const item = document.createElement("li");
    item.innerHTML = `
      <div class="theme-row">
        <strong>${escapeHtml(theme.theme)}</strong>
        <span>${theme.count} source(s)</span>
      </div>
      <div class="bar" aria-hidden="true"><span style="width:${(theme.count / max) * 100}%"></span></div>
      <small>${escapeHtml(theme.methodCategories.join(", "))}</small>
    `;
    els.themes.append(item);
  }

  if (!latestAnalysis.themeMap.length) {
    els.themes.innerHTML = `<li class="blank">No themes parsed yet.</li>`;
  }
}

function renderGaps() {
  els.gaps.innerHTML = "";
  for (const prompt of latestAnalysis.gapPrompts) {
    const item = document.createElement("li");
    item.textContent = prompt;
    els.gaps.append(item);
  }
}

function latestMarkdown() {
  return toMarkdown(latestAnalysis || buildAnalysis(""), {
    title: "Lit Scope Grid",
    date: new Date().toISOString().slice(0, 10)
  });
}

async function copyMarkdown() {
  const text = latestMarkdown();
  try {
    await navigator.clipboard.writeText(text);
    setStatus("Markdown copied.");
  } catch {
    const range = document.createRange();
    range.selectNodeContents(els.markdown);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    setStatus("Copy blocked. Markdown preview selected.");
  }
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setStatus(`${filename} downloaded.`);
}

function renderChips(values) {
  if (!values.length) return `<span class="missing">Missing themes</span>`;
  return values.map((value) => `<span class="chip">${escapeHtml(value)}</span>`).join("");
}

function setStatus(message) {
  els.status.textContent = message;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

init();
