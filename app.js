(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const STATUS = { past: "Past", current: "This year", upcoming: "Upcoming" };
  const confById = (id) => CONFERENCES.find((c) => c.id === id);
  const onConferencePage = document.body.dataset.page === "conference";
  const conf = onConferencePage ? confById(new URLSearchParams(location.search).get("c")) : null;
  $("foot").textContent = SITE.title;

  // ---------- BibTeX parsing ----------
  const MARKS = { "`": "\u0300", "'": "\u0301", "^": "\u0302", '"': "\u0308", "~": "\u0303" };
  const clean = (s) => s
    .replace(/\\([`'^"~])\s*\{?\\?(\w)\}?/g, (m, a, l) => l + MARKS[a])
    .replace(/\\([&_%$#])/g, "$1").replace(/--+/g, "\u2013")
    .replace(/[{}]/g, "").replace(/\s+/g, " ").trim().normalize("NFC");

  function readBraced(t, i) {
    let d = 0;
    for (let j = i; j < t.length; j++) {
      if (t[j] === "{") d++;
      else if (t[j] === "}" && --d === 0) return [t.slice(i + 1, j), j + 1];
    }
    return [t.slice(i + 1), t.length];
  }

  function parseBib(text) {
    const out = [], re = /@(\w+)\s*\{/g;
    let m;
    while ((m = re.exec(text))) {
      const type = m[1].toLowerCase();
      const [body, end] = readBraced(text, m.index + m[0].length - 1);
      re.lastIndex = end;
      if (["comment", "string", "preamble"].includes(type)) continue;
      const comma = body.indexOf(",");
      if (comma < 0) continue;
      const f = {};
      let p = comma + 1;
      while (p < body.length) {
        const fm = /[\s,]*([\w-]+)\s*=\s*/g;
        fm.lastIndex = p;
        const mm = fm.exec(body);
        if (!mm || mm.index !== p) break;
        p = fm.lastIndex;
        let val;
        if (body[p] === "{") {
          [val, p] = readBraced(body, p);
        } else if (body[p] === '"') {
          let q = p + 1, d = 0;
          while (q < body.length && !(body[q] === '"' && d === 0)) {
            if (body[q] === "{") d++;
            if (body[q] === "}") d--;
            q++;
          }
          val = body.slice(p + 1, q); p = q + 1;
        } else {
          const e = body.indexOf(",", p), stop = e < 0 ? body.length : e;
          val = body.slice(p, stop).trim(); p = stop;
        }
        f[mm[1].toLowerCase()] = val;
      }
      out.push({ type, key: body.slice(0, comma).trim(), f, raw: text.slice(m.index, end).trim() });
    }
    return out;
  }

  const TYPES = { article: "Article", book: "Book", incollection: "Chapter", inbook: "Chapter",
    inproceedings: "Conference paper", conference: "Conference paper", phdthesis: "Thesis",
    mastersthesis: "Thesis", misc: "Other", online: "Website", techreport: "Report" };

  function people(s) {
    const names = s.split(/\s+and\s+/).map((n) => {
      const k = n.split(",");
      return k.length > 1 ? clean(k.slice(1).join(" ")) + " " + clean(k[0]) : clean(n);
    });
    return names.length > 2 ? names.slice(0, -1).join(", ") + ", and " + names[names.length - 1] : names.join(" and ");
  }

  function toRef(e, confId, edition) {
    const f = e.f, g = (k) => (f[k] ? clean(f[k]) : "");
    const who = f.author ? people(f.author) : f.editor ? people(f.editor) + " (eds.)" : "";
    const link = (v) => v.replace(/[{}\s]/g, "");
    return {
      title: g("title") || e.key, authors: who, year: g("year") || "n.d.",
      type: g("reftype") || TYPES[e.type] || "Other",
      venue: g("journal") || (g("booktitle") ? "In " + g("booktitle") : "") || g("publisher"),
      conference: confId, edition: edition || g("confyear"),
      tags: g("keywords") ? g("keywords").split(/\s*[,;]\s*/) : [],
      url: f.url ? link(f.url) : f.doi ? "https://doi.org/" + link(f.doi) : "",
      note: g("note") || g("annote"), raw: e.raw
    };
  }

  async function loadBib(c) {
    const refs = [], errors = [];
    const jobs = [].concat(c.bib || []).map((file) => ({ file, year: "" }));
    c.editions.forEach((ed) => [].concat(ed.bib || []).forEach((file) => jobs.push({ file, year: ed.year })));
    for (const { file, year } of jobs) {
      try {
        const res = await fetch(file);
        if (!res.ok) throw new Error(res.status);
        refs.push(...parseBib(await res.text()).map((e) => toRef(e, c.id, year)));
      } catch (err) { errors.push(file); }
    }
    return { refs, errors };
  }

  // ---------- Pages ----------
  let base = [], shown = [], warning = "";

  function renderHome() {
    document.title = SITE.title;
    $("site-title").textContent = SITE.title;
    $("site-intro").textContent = SITE.intro;
    $("confs").innerHTML = CONFERENCES.map((c) => {
      const eds = c.editions.slice().sort((a, b) => b.year - a.year), latest = eds[0];
      const n = base.filter((r) => r.conference === c.id).length;
      return `<li class="conf"><h3><a href="conference.html?c=${encodeURIComponent(c.id)}">${esc(c.name)}</a></h3>
        <p>${esc(c.description)}</p>
        <p class="meta">${eds.length} ${eds.length === 1 ? "edition" : "editions"}
        ${latest ? " \u2022 latest: " + esc(latest.year) + " (" + esc(STATUS[latest.status] || latest.status) + ")" : ""}
        \u2022 ${n} ${n === 1 ? "reference" : "references"}</p></li>`;
    }).join("") || '<li class="empty">No conferences yet. Add one in data.js.</li>';
    $("fc").innerHTML = '<option value="">All conferences</option>' +
      CONFERENCES.map((c) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join("");
  }

  function renderConference() {
    if (!conf) {
      document.title = "Conference not found";
      $("site-title").textContent = "Conference not found";
      $("site-intro").textContent = "Check the link, or go back to the full list.";
      $("editions-section").hidden = true; $("library").hidden = true;
      return;
    }
    document.title = conf.name + " | " + SITE.title;
    $("site-title").textContent = conf.name;
    const files = [].concat(conf.bib || []);
    $("site-intro").innerHTML = esc(conf.description) +
      (conf.website ? ` <a href="${esc(conf.website)}">Conference website</a>.` : "") +
      files.map((f) => ` <a href="${esc(f)}" download>Download BibTeX (${esc(f.split("/").pop())})</a>`).join("");
    const eds = conf.editions.slice().sort((a, b) => b.year - a.year);
    let active = (eds.find((e) => e.status === "current") || eds[0] || {}).year;
    function draw() {
      $("tabs").innerHTML = eds.map((e) =>
        `<button class="tab" role="tab" aria-selected="${e.year === active}" data-y="${esc(e.year)}">${esc(e.year)}</button>`).join("");
      $("tabs").querySelectorAll(".tab").forEach((b) => b.addEventListener("click", () => { active = Number(b.dataset.y); draw(); }));
      const e = eds.find((x) => x.year === active);
      if (!e) { $("panel").textContent = "No editions listed yet."; return; }
      const n = base.filter((r) => String(r.edition) === String(e.year)).length;
      $("panel").innerHTML =
        `<h3>${esc(e.year)}: ${esc(e.theme)}<span class="badge">${esc(STATUS[e.status] || e.status)}</span></h3>
         <dl><dt>Dates</dt><dd>${esc(e.dates)}</dd><dt>Location</dt><dd>${esc(e.location)}</dd>
         <dt>References</dt><dd>${n} in the library${[].concat(e.bib || []).map((f) =>
           ` \u2022 <a href="${esc(f)}" download>Download BibTeX</a>`).join("")}</dd>
         ${e.website ? `<dt>Website</dt><dd><a href="${esc(e.website)}">${esc(e.website)}</a></dd>` : ""}</dl>
         ${e.notes ? `<p>${esc(e.notes)}</p>` : ""}`;
    }
    draw();
    $("fe").innerHTML = '<option value="">All years</option>' +
      eds.map((e) => `<option value="${esc(e.year)}">${esc(e.year)}</option>`).join("");
  }

  function renderRefs() {
    const q = $("q").value.trim().toLowerCase();
    const fc = $("fc") ? $("fc").value : "", fe = $("fe") ? $("fe").value : "", ft = $("ft").value;
    shown = base.filter((r) => {
      if (fc && r.conference !== fc) return false;
      if (fe && String(r.edition) !== fe) return false;
      if (ft && r.type !== ft) return false;
      return !q || [r.title, r.authors, r.note, r.venue, (r.tags || []).join(" ")].join(" ").toLowerCase().includes(q);
    }).sort((a, b) => String(a.authors).localeCompare(String(b.authors)));
    $("count").textContent = shown.length + (shown.length === 1 ? " reference" : " references");
    const warn = warning ? `<li class="empty">${warning}</li>` : "";
    if (!shown.length) { $("refs").innerHTML = warn + '<li class="empty">No references match. Try clearing the search or filters.</li>'; return; }
    $("refs").innerHTML = warn + shown.map((r, i) => {
      const c = confById(r.conference);
      const where = [r.venue, c && !onConferencePage ? c.name : "", r.edition].filter(Boolean).map(esc).join(" \u2022 ");
      return `<li class="ref"><h3>${r.url ? `<a href="${esc(r.url)}">${esc(r.title)}</a>` : esc(r.title)}</h3>
        <p>${esc(r.authors)}${r.authors ? " " : ""}(${esc(r.year)})</p>
        <p class="meta">${esc(r.type)}${where ? " \u2022 " + where : ""}</p>
        ${r.note ? `<p class="note">${esc(r.note)}</p>` : ""}
        ${(r.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}
        ${r.raw ? `<p><button class="copy" data-i="${i}">Copy BibTeX</button></p>` : ""}</li>`;
    }).join("");
  }

  $("refs").addEventListener("click", async (ev) => {
    const b = ev.target.closest(".copy");
    if (!b) return;
    try { await navigator.clipboard.writeText(shown[b.dataset.i].raw); b.textContent = "Copied"; }
    catch (e) { b.textContent = "Copy failed"; }
    setTimeout(() => (b.textContent = "Copy BibTeX"), 1800);
  });
  ["q", "fc", "fe", "ft"].forEach((id) => {
    if ($(id)) ["input", "change"].forEach((ev) => $(id).addEventListener(ev, renderRefs));
  });

  // ---------- Start ----------
  (async function init() {
    $("count").textContent = "Loading references\u2026";
    const targets = onConferencePage ? (conf ? [conf] : []) : CONFERENCES;
    const results = await Promise.all(targets.map(loadBib));
    const manual = REFERENCES.filter((r) => !onConferencePage || (conf && r.conference === conf.id));
    base = manual.concat(...results.map((r) => r.refs));
    const failed = [].concat(...results.map((r) => r.errors));
    if (failed.length) warning = "Could not load " + failed.map(esc).join(", ") +
      ". Check the file path in data.js. If you opened this page straight from your computer, publish it to GitHub Pages or run a local web server, because browsers block reading local files.";
    const types = Array.from(new Set(base.map((r) => r.type).filter(Boolean))).sort();
    $("ft").innerHTML = '<option value="">All types</option>' + types.map((t) => `<option>${esc(t)}</option>`).join("");
    onConferencePage ? renderConference() : renderHome();
    renderRefs();
  })();
})();
