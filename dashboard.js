async function loadTracker() {
  const response = await fetch("analytics-summary.json");
  if (!response.ok) throw new Error("Could not load analytics-summary.json");
  return response.json();
}

function pct(value, max) {
  if (!max) return 0;
  return Math.max(2, Math.round((value / max) * 100));
}

function renderBars(targetId, rows, limit = 10) {
  const el = document.getElementById(targetId);
  if (!el) return;
  const data = rows.slice(0, limit);
  const max = Math.max(...data.map(d => d.count), 1);

  el.innerHTML = data.map(d => `
    <div class="bar-row" title="${d.label}: ${d.count}">
      <div class="bar-label">${d.label}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${pct(d.count, max)}%"></div></div>
      <div class="bar-value">${d.count}</div>
    </div>
  `).join("");
}

function renderKpis(summary) {
  const cards = [
    ["Applications", summary.applications],
    ["Active", summary.active],
    ["Responses", summary.responses],
    ["Interviews", summary.interviews],
    ["Rejections", summary.rejections],
    ["Pending", summary.pending]
  ];

  document.getElementById("kpiGrid").innerHTML = cards.map(([label, value]) => `
    <div class="kpi">
      <div class="label">${label}</div>
      <div class="value">${value}</div>
    </div>
  `).join("");
}

function renderAscii(data) {
  const s = data.summary;
  document.getElementById("asciiSummary").textContent =
`========================================
 JOB HUNT COMMAND CENTER
========================================
Applications : ${String(s.applications).padStart(3, " ")}
Active        : ${String(s.active).padStart(3, " ")}
Responses     : ${String(s.responses).padStart(3, " ")}
Interviews    : ${String(s.interviews).padStart(3, " ")}
Rejections    : ${String(s.rejections).padStart(3, " ")}
Last Update   : ${data.meta.generatedOn}
========================================`;
}

loadTracker()
  .then(data => {
    renderAscii(data);
    renderKpis(data.summary);
    renderBars("monthlyChart", data.charts.monthly, 12);
    renderBars("statusChart", data.charts.status, 8);
    renderBars("categoryChart", data.charts.category, 10);
    renderBars("locationChart", data.charts.location, 10);
    renderBars("workTypeChart", data.charts.workType || [], 10);
    renderBars("funnelChart", data.charts.funnel, 4);
  })
  .catch(error => {
    document.body.innerHTML = `<pre style="color:#ff6b6b;padding:24px;">Dashboard failed to load: ${error.message}</pre>`;
  });
