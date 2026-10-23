(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const STATUS = { past: "Past", current: "This year", upcoming: "Upcoming" };
  const confById = (id) => CONFERENCES.find((c) => c.id === id);
  const onConferencePage = document.body.dataset.page === "conference";
  const conf = onConferencePage ? confById(new URLSearchParams(location.search).get("c")) : null;

  $("foot").textContent = SITE.title;

  // ---------- Home page: list of conferences ----------
  function renderHome() {
    document.title = SITE.title;
    $("site-title").textContent = SITE.title;
    $("site-intro").textContent = SITE.intro;
    $("confs").innerHTML = CONFERENCES.map((c) => {
      const eds = c.editions.slice().sort((a, b) => b.year - a.year);
      const latest = eds[0];
      const n = REFERENCES.filter((r) => r.conference === c.id).length;
      return `<li class="conf"><h3><a href="conference.html?c=${encodeURIComponent(c.id)}">${esc(c.name)}</a></h3>
        <p>${esc(c.description)}</p>
        <p class="meta">${eds.length} ${eds.length === 1 ? "edition" : "editions"}
        ${latest ? " \u2022 latest: " + esc(latest.year) + " (" + esc(STATUS[latest.status] || latest.status) + ")" : ""}
        \u2022 ${n} ${n === 1 ? "reference" : "references"}</p></li>`;
    }).join("") || '<li class="empty">No conferences yet. Add one in data.js.</li>';
  }

  // ---------- Conference page: editions ----------
  function renderConference() {
    if (!conf) {
      document.title = "Conference not found";
      $("site-title").textContent = "Conference not found";
      $("site-intro").textContent = "Check the link, or go back to the full list.";
      $("editions-section").hidden = true;
      $("library").hidden = true;
      return;
    }
    document.title = conf.name + " | " + SITE.title;
    $("site-title").textContent = conf.name;
    $("site-intro").innerHTML = esc(conf.description) +
      (conf.website ? ` <a href="${esc(conf.website)}">Conference website</a>` : "");
    const eds = conf.editions.slice().sort((a, b) => b.year - a.year);
    let active = (eds.find((e) => e.status === "current") || eds[0] || {}).year;

    function draw() {
      $("tabs").innerHTML = eds.map((e) =>
        `<button class="tab" role="tab" aria-selected="${e.year === active}" data-y="${esc(e.year)}">${esc(e.year)}</button>`).join("");
      $("tabs").querySelectorAll(".tab").forEach((b) => b.addEventListener("click", () => {
        active = Number(b.dataset.y); draw();
      }));
      const e = eds.find((x) => x.year === active);
      if (!e) { $("panel").textContent = "No editions listed yet."; return; }
      const n = REFERENCES.filter((r) => r.conference === conf.id && String(r.edition) === String(e.year)).length;
      $("panel").innerHTML =
        `<h3>${esc(e.year)}: ${esc(e.theme)}<span class="badge">${esc(STATUS[e.status] || e.status)}</span></h3>
         <dl><dt>Dates</dt><dd>${esc(e.dates)}</dd>
         <dt>Location</dt><dd>${esc(e.location)}</dd>
         <dt>References</dt><dd>${n} in the library</dd>
         ${e.website ? `<dt>Website</dt><dd><a href="${esc(e.website)}">${esc(e.website)}</a></dd>` : ""}</dl>
         ${e.notes ? `<p>${esc(e.notes)}</p>` : ""}`;
    }
    draw();
    $("fe").innerHTML = '<option value="">All years</option>' +
      eds.map((e) => `<option value="${esc(e.year)}">${esc(e.year)}</option>`).join("");
  }

  // ---------- Library (both pages) ----------
  const base = onConferencePage ? (conf ? REFERENCES.filter((r) => r.conference === conf.id) : []) : REFERENCES;
  if (!onConferencePage) {
    $("fc").innerHTML = '<option value="">All conferences</option>' +
      CONFERENCES.map((c) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join("");
  }
  const types = Array.from(new Set(base.map((r) => r.type).filter(Boolean))).sort();
  $("ft").innerHTML = '<option value="">All types</option>' + types.map((t) => `<option>${esc(t)}</option>`).join("");

  function renderRefs() {
    const q = $("q").value.trim().toLowerCase();
    const fc = $("fc") ? $("fc").value : "", fe = $("fe") ? $("fe").value : "", ft = $("ft").value;
    const list = base.filter((r) => {
      if (fc && r.conference !== fc) return false;
      if (fe && String(r.edition) !== fe) return false;
      if (ft && r.type !== ft) return false;
      if (!q) return true;
      return [r.title, r.authors, r.note, (r.tags || []).join(" ")].join(" ").toLowerCase().includes(q);
    }).sort((a, b) => String(a.authors).localeCompare(String(b.authors)));

    $("count").textContent = list.length + (list.length === 1 ? " reference" : " references");
    if (!list.length) {
      $("refs").innerHTML = '<li class="empty">No references match. Try clearing the search or filters.</li>';
      return;
    }
    $("refs").innerHTML = list.map((r) => {
      const c = confById(r.conference);
      const where = (c && !onConferencePage ? esc(c.name) + " " : "") + (r.edition ? esc(r.edition) : "");
      const title = r.url ? `<a href="${esc(r.url)}">${esc(r.title)}</a>` : esc(r.title);
      return `<li class="ref"><h3>${title}</h3>
        <p>${esc(r.authors)} (${esc(r.year)})</p>
        <p class="meta">${esc(r.type)}${where ? " \u2022 " + where : ""}</p>
        ${r.note ? `<p class="note">${esc(r.note)}</p>` : ""}
        ${(r.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</li>`;
    }).join("");
  }
  ["q", "fc", "fe", "ft"].forEach((id) => {
    if ($(id)) ["input", "change"].forEach((ev) => $(id).addEventListener(ev, renderRefs));
  });

  onConferencePage ? renderConference() : renderHome();
  renderRefs();
})();
