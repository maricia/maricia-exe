async function loadTracker() {
  const response = await fetch("analytics-summary.json?v=4");
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

  const data = (rows || []).slice(0, limit);
  if (!data.length) {
    el.innerHTML = `<p class="empty-state">No public-safe data available yet.</p>`;
    return;
  }

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
  const responseRate = summary.responseRate ?? (
    summary.applications ? ((summary.responses / summary.applications) * 100).toFixed(1) : 0
  );

  const interviewRate = summary.interviewRate ?? (
    summary.applications ? ((summary.interviews / summary.applications) * 100).toFixed(1) : 0
  );

  const cards = [
    ["Applications", summary.applications],
    ["Active", summary.active],
    ["Responses", summary.responses],
    ["Interviews", summary.interviews],
    ["Response Rate", `${responseRate}%`],
    ["Interview Rate", `${interviewRate}%`]
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
  const responseRate = s.responseRate ?? (s.applications ? ((s.responses / s.applications) * 100).toFixed(1) : 0);
  const interviewRate = s.interviewRate ?? (s.applications ? ((s.interviews / s.applications) * 100).toFixed(1) : 0);

  document.getElementById("asciiSummary").textContent =
`========================================
 JOB HUNT COMMAND CENTER
========================================
Applications  : ${String(s.applications).padStart(3, " ")}
Active         : ${String(s.active).padStart(3, " ")}
Responses      : ${String(s.responses).padStart(3, " ")}
Interviews     : ${String(s.interviews).padStart(3, " ")}
Response Rate  : ${responseRate}%
Interview Rate : ${interviewRate}%
Last Update    : ${data.meta.generatedOn || "Unknown"}
========================================`;
}

function renderCurrentQuest(quest) {
  const el = document.getElementById("currentQuest");
  if (!el) return;

  const activeSkills = (quest?.activeSkills || []).map(item => `<li>${item}</li>`).join("");

  el.innerHTML = `
    <div class="quest-grid">
      <div>
        <div class="quest-label">Primary Quest</div>
        <div class="quest-value">${quest?.primaryQuest || "Find next data role"}</div>
      </div>
      <div>
        <div class="quest-label">Current Region</div>
        <div class="quest-value">${quest?.currentRegion || "Remote / West Texas"}</div>
      </div>
      <div>
        <div class="quest-label">Quest Status</div>
        <div class="quest-value">${quest?.questStatus || "Searching"}</div>
      </div>
      <div>
        <div class="quest-label">Active Skills</div>
        <ul class="quest-list">${activeSkills}</ul>
      </div>
    </div>
  `;
}

function renderQuestLog(items) {
  const el = document.getElementById("questLog");
  if (!el) return;

  el.innerHTML = (items || []).map(item => `
    <div class="quest-log-item">
      <span class="quest-date">[${item.date}]</span>
      <span>${item.event}</span>
    </div>
  `).join("");
}

function renderFooter(data) {
  const el = document.getElementById("systemFooter");
  if (!el) return;
  el.textContent = `SYSTEM STATUS: ONLINE // LAST DATA SYNC: ${data.meta.generatedOn || "Unknown"} // PUBLIC DATASET MODE: ENABLED`;
}

loadTracker()
  .then(data => {
    renderAscii(data);
    renderKpis(data.summary);
    renderCurrentQuest(data.currentQuest);
    renderQuestLog(data.questLog);
    renderFooter(data);

    renderBars("monthlyChart", data.charts.monthly || [], 12);
    renderBars("statusChart", data.charts.status || [], 8);
    renderBars("categoryChart", data.charts.category || [], 10);
    renderBars("locationChart", data.charts.location || [], 10);
    renderBars("workTypeChart", data.charts.workType || [], 10);
    renderBars("techStackChart", data.charts.techStack || [], 10);
    renderBars("funnelChart", data.charts.funnel || [], 4);
  })
  .catch(error => {
    document.body.innerHTML = `<pre style="color:#ff6b6b;padding:24px;">Dashboard failed to load: ${error.message}</pre>`;
  });
