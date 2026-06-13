let applications = [];
let sortKey = "dateApplied";
let sortAsc = false;

async function loadTracker() {
  const response = await fetch("tracker.json");
  if (!response.ok) throw new Error("Could not load tracker.json");
  return response.json();
}

function uniqueValues(rows, key) {
  return [...new Set(rows.map(r => r[key]).filter(Boolean))].sort();
}

function populateFilter(id, values) {
  const el = document.getElementById(id);
  values.forEach(value => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    el.appendChild(option);
  });
}

function statusClass(status) {
  const clean = (status || "Unknown").split(" ")[0].replace(/[^a-zA-Z]/g, "");
  return `status-${clean || "Unknown"}`;
}

function renderTable() {
  const search = document.getElementById("searchBox").value.toLowerCase();
  const status = document.getElementById("statusFilter").value;
  const category = document.getElementById("categoryFilter").value;

  let rows = applications.filter(app => {
    const haystack = [
      app.company,
      app.position,
      app.statusGroup,
      app.status,
      app.category,
      app.location,
      app.workType,
      app.notes
    ].join(" ").toLowerCase();

    return (!search || haystack.includes(search)) &&
      (!status || app.statusGroup === status) &&
      (!category || app.category === category);
  });

  rows.sort((a, b) => {
    const av = a[sortKey] || "";
    const bv = b[sortKey] || "";
    return sortAsc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  });

  const tbody = document.querySelector("#applicationTable tbody");
  tbody.innerHTML = rows.map(app => `
    <tr>
      <td>${app.dateApplied || ""}</td>
      <td>${app.company || ""}</td>
      <td>${app.position || ""}</td>
      <td class="${statusClass(app.statusGroup)}">${app.statusGroup || app.status || ""}</td>
      <td>${app.category || ""}</td>
      <td>${app.location || ""}</td>
      <td>${app.workType || ""}</td>
      <td>${app.lastActivity || ""}</td>
    </tr>
  `).join("");
}

loadTracker().then(data => {
  applications = data.applications || [];
  populateFilter("statusFilter", uniqueValues(applications, "statusGroup"));
  populateFilter("categoryFilter", uniqueValues(applications, "category"));

  document.getElementById("searchBox").addEventListener("input", renderTable);
  document.getElementById("statusFilter").addEventListener("change", renderTable);
  document.getElementById("categoryFilter").addEventListener("change", renderTable);

  document.querySelectorAll("#applicationTable th").forEach((th, index) => {
    const keys = ["dateApplied", "company", "position", "statusGroup", "category", "location", "workType", "lastActivity"];
    th.addEventListener("click", () => {
      if (sortKey === keys[index]) {
        sortAsc = !sortAsc;
      } else {
        sortKey = keys[index];
        sortAsc = true;
      }
      renderTable();
    });
  });

  renderTable();
});
