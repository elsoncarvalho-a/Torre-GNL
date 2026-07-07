  if (!current.gnlLiters && current.gnlKg && current.density) current.gnlLiters = current.gnlKg / current.density;
  if (!current.litersPerKm && current.gnlLiters && current.distance) current.litersPerKm = current.gnlLiters / current.distance;
  if (!current.dieselEquivalent && current.distance && current.dieselPerformance) current.dieselEquivalent = current.distance / current.dieselPerformance;

  base.fonte = {
    ...base.fonte,
    arquivo: "Google Sheets | 06_Saida_GitHub",
    geradoEm: new Date().toLocaleString("pt-BR"),
    qualidade: "Automática",
    observacao: "Dados carregados automaticamente da planilha publicada em CSV"
  };
  return base;
}

async function loadSheetData() {
  const response = await fetch(`${GOOGLE_SHEETS_CSV_URL}&_=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Falha ao carregar Google Sheets: ${response.status}`);
  const text = await response.text();
  const rows = rowsToObjects(parseCsv(text));
  if (!rows.length || !rows[0].campo_json) throw new Error("CSV sem coluna campo_json");
  return buildDataFromSheet(rows);
}

function renderSource() {
  document.querySelector("#periodRange").textContent = `▣ ${p.range} | fonte: ${dashboardData.fonte.arquivo}`;
  document.querySelector("#periodButtons").innerHTML = `<button type="button" class="active">${p.label}</button>`;
}

function renderKpis() {
  const items = [
    ["Distância analisada", nf1.format(p.distance), "km", "Base operacional"],
    ["Consumo GNL", nf.format(p.gnlKg), "kg", `${nf.format(p.nm3)} Nm³`],
    ["Rendimento GNL", nf.format(p.performance), "km/kg", "Eficiência física"],
    ["Consumo equivalente", nf.format(p.nm3), "Nm³", `${nf.format(p.energyPerformance)} km/Nm³`],
    ["Custo GNL", money(p.costGnl), "/km", `Preço: ${money(p.priceGnl)}/Nm³`],
    ["Custo Diesel", money(p.costDiesel), "/km", `Preço: ${money(p.priceDiesel)}/L`],
    ["Economia vs Diesel", nf1.format(p.economy), "%", p.status],
    ["Economia na base", money(p.economyRoute), "", `${money(p.economyPerKm)}/km`]
  ];
  document.querySelector("#kpiGrid").innerHTML = items.map((i,index) => `<article class="kpi"><span class="kpi-label">${i[0]}</span><span class="kpi-value">${i[1]} <small class="kpi-unit">${i[2]}</small></span><span class="kpi-note">${i[3]}</span><b class="kpi-icon">${icons[index]}</b></article>`).join("");
}

function renderStudy() {
  const items = [
    ["Fator conversão GN/GNL", `${nf.format(p.conversion)} Nm³/kg`],
    ["Preço GNL", `${money(p.priceGnl)}/Nm³`],
    ["Preço Diesel", `${money(p.priceDiesel)}/L`],
    ["Rendimento Diesel", `${nf.format(p.dieselPerformance)} km/L`],
    ["Densidade GNL", `${nf.format(p.density)} kg/L`],
    ["Quilometragem anual", `${nf0.format(p.annualKm)} km`],
    ["Meta mínima economia", `${nf0.format(p.minimumEconomy * 100)}%`]
  ];
  document.querySelector("#studyList").innerHTML = items.map(i => `<div><dt>${i[0]}</dt><span class="dots"></span><dd>${i[1]}</dd></div>`).join("");
}

function renderPerformance() {
  const items = [
    ["Volume normalizado", nf.format(p.nm3), "Nm³"],
    ["Rendimento físico", nf.format(p.performance), "km/kg"],
    ["Rendimento energético", nf.format(p.energyPerformance), "km/Nm³"],
    ["Volume GNL", nf.format(p.gnlLiters), "L"],
    ["Consumo específico", nf.format(p.litersPerKm), "L/km"],
    ["Autonomia estimada", nf.format(p.autonomy), "km"],
    ["Diesel equivalente", nf.format(p.dieselEquivalent), "L"],
    ["Capacidade útil", nf.format(p.tankKg), "kg"]
  ];
  document.querySelector("#performanceGrid").innerHTML = items.map(i => `<div class="mini-card"><span>${i[0]}</span><strong>${i[1]}</strong><em>${i[2]}</em></div>`).join("");
}

function renderEconomy() {
  document.querySelector("#costCards").innerHTML = `<div class="cost-card"><span>CUSTO OPERACIONAL GNL</span><strong>${money(p.costGnl)}/km</strong></div><div class="cost-card"><span>CUSTO OPERACIONAL DIESEL</span><strong>${money(p.costDiesel)}/km</strong></div>`;
  const relativeCost = (p.costGnl / p.costDiesel) * 100;
  const gnlBar = document.querySelector(".bar-row:not(.diesel) .bar-track i");
  gnlBar.style.width = `${relativeCost}%`;
  document.querySelector(".bar-row:not(.diesel) strong").textContent = `${nf0.format(relativeCost)}%`;
  document.querySelector("#savingValue").textContent = `${nf1.format(p.economy)}%`;
}

function renderSensitivityTable() {
  document.querySelector("#comparisonBody").innerHTML = dashboardData.scenarios.map(s => {
    const cls = s.economy >= p.economy ? "up" : s.economy >= p.minimumEconomy * 100 ? "flat" : "down";
    return `<tr><td>${s.name}</td><td>${money(s.priceGnl)}</td><td>${money(s.priceDiesel)}</td><td class="variation ${cls}">${nf1.format(s.economy)}%</td></tr>`;
  }).join("");
}

function renderNarrative() {
  const stress = dashboardData.scenarios.find(s => s.name === "Stress");
  const optimistic = dashboardData.scenarios.find(s => s.name === "Otimista");
  const lists = {
    advanceList: [
      `Economia estimada de ${money(p.economyRoute)} na distância analisada.`,
      `Potencial anual de ${money(p.annualPotential)} para ${nf0.format(p.annualKm)} km.`,
      `Economia permanece em ${nf1.format(stress.economy)}% mesmo no cenário de stress.`
    ],
    statusList: [
      `Qualidade atual da base classificada como ${dashboardData.fonte.qualidade.toLowerCase()}.`,
      `A planilha calcula ${nf.format(p.emissionsGnl)} kg CO₂ do GNL, sem fator Diesel para comparação.`,
      `Cenário otimista alcança ${nf1.format(optimistic.economy)}% de economia; depende do spread de preços.`
    ],
    nextList: dashboardData.actions.slice(0,3).map(a => `${a.priority}. ${a.action} — ${a.owner}.`)
  };
  Object.entries(lists).forEach(([id,items]) => document.querySelector(`#${id}`).innerHTML = items.map(i => `<li>${i}</li>`).join(""));
}

function renderProjections() {
  const items = [
    ["Economia por km", money(p.economyPerKm), "good", "ganho unitário"],
    ["Economia na distância", money(p.economyRoute), "good", "base analisada"],
    ["Potencial anual", money(p.annualPotential), "good", `${nf0.format(p.annualKm)} km/ano`],
    ["Diesel equivalente", `${nf.format(p.dieselEquivalent)} L`, "warn", "mesma distância"],
    ["Emissão GNL", `${nf.format(p.emissionsGnl)} kg`, "bad", "CO₂ sem comparativo Diesel"],
    ["Tanque útil", `${nf.format(p.tankLiters)} L`, "warn", `${nf.format(p.tankKg)} kg`],
    ["Autonomia teórica", `${nf.format(p.theoreticalAutonomy)} km`, "good", "por tanque"],
    ["Meta mínima", `${nf0.format(p.minimumEconomy * 100)}%`, "warn", p.status]
  ];
  document.querySelector("#timeGrid").innerHTML = items.map(i => `<article class="time-card ${i[2]}"><span>${i[0]}</span><strong>${i[1]}</strong><em>${i[3]}</em></article>`).join("");
}

function renderScenarios() {
  document.querySelector("#stopGrid").innerHTML = dashboardData.scenarios.map(s => {
    const status = s.economy >= 45 ? "scenario-good" : s.economy >= 30 ? "scenario-warn" : "scenario-bad";
    return `<article class="stop-card ${status}"><span>${s.name}</span><strong>${nf1.format(s.economy)}%</strong><em>GNL ${money(s.priceGnl)} · Diesel ${money(s.priceDiesel)}</em></article>`;
  }).join("");
}

function render() {
  p = dashboardData.periods[dashboardData.periodoInicial];
  renderSource(); renderKpis(); renderStudy(); renderPerformance(); renderEconomy();
  renderSensitivityTable(); renderNarrative(); renderProjections(); renderScenarios();
  document.title = `Torre Operacional GNL | ${dashboardData.fonte.geradoEm}`;
}

document.querySelector("#printButton").addEventListener("click", () => window.print());

async function init() {
  try {
    dashboardData = await loadSheetData();
  } catch (error) {
    console.warn("Usando dados locais por falha ao carregar Google Sheets.", error);
    dashboardData = window.GNLDados;
    dashboardData.fonte.observacao = "Fallback local: não foi possível carregar o Google Sheets.";
  }
  render();
}

init();
