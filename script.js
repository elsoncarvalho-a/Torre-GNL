const dashboardData = window.GNLDados;
const nf = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nf1 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nf0 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const money = value => `R$ ${nf.format(value)}`;
const p = dashboardData.periods[dashboardData.periodoInicial];

const icons = ["⌁", "◉", "◌", "◇", "$", "$", "◒", "↗"];

function renderSource() {
  document.querySelector("#periodRange").textContent = `▣ ${p.range}`;
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
  renderSource(); renderKpis(); renderStudy(); renderPerformance(); renderEconomy();
  renderSensitivityTable(); renderNarrative(); renderProjections(); renderScenarios();
  document.title = `Torre Operacional GNL | ${dashboardData.fonte.geradoEm}`;
}

document.querySelector("#printButton").addEventListener("click", () => window.print());
render();
