const GOOGLE_SHEETS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSZVFrMhHyHomcj_9lNVaX6LCH-jMhAtubakhXnVG-gbRGvT--XPaKtwIO04fVAAA/pub?gid=1776941332&single=true&output=csv";
const DEFAULT_DATA = {
  periodoInicial: "base",
  fonte: {
    arquivo: "Google Sheets | 06_Saida_GitHub",
    geradoEm: "",
    qualidade: "Automática",
    observacao: "Dados carregados automaticamente da planilha publicada em CSV"
  },
  periods: {
    base: {
      label: "Base da planilha",
      range: "Aguardando dados do Google Sheets",
      distance: 0,
      gnlKg: 0,
      conversion: 1.39,
      priceGnl: 2.71,
      priceDiesel: 6.74,
      dieselPerformance: 2.6,
      density: 0.38,
      tankLiters: 711.45,
      tankKg: 270.35,
      theoreticalAutonomy: 0,
      co2FactorGnl: 2.75,
      annualKm: 100000,
      minimumEconomy: 0.25,
      nm3: 0,
      performance: 0,
      energyPerformance: 0,
      gnlLiters: 0,
      litersPerKm: 0,
      autonomy: 0,
      costGnl: 0,
      costDiesel: 0,
      economyPerKm: 0,
      economy: 0,
      economyRoute: 0,
      annualPotential: 0,
      dieselEquivalent: 0,
      emissionsGnl: 0,
      status: "Aguardando dados"
    }
  },
  scenarios: [],
  actions: [
    { priority: "1", action: "Atualizar base publicada no Google Sheets", owner: "Torre Operacional", result: "Dashboard atualizado automaticamente" },
    { priority: "2", action: "Validar premissas e metas mensalmente", owner: "Controladoria", result: "Indicadores rastreáveis" },
    { priority: "3", action: "Conferir publicação CSV da aba 06_Saida_GitHub", owner: "Gestão", result: "Fonte de dados ativa" }
  ]
};
let dashboardData = window.GNLDados || DEFAULT_DATA;
const nf = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nf1 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nf0 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const money = value => `R$ ${nf.format(value)}`;
let selectedPeriodKey = "junho2026";
let p = dashboardData.periods[dashboardData.periodoInicial] || Object.values(dashboardData.periods)[0];

const icons = ["⌁", "◉", "◌", "◇", "$", "$", "◒", "↗"];
const PREVIOUS_MONTH = {
  label: "Maio/2026",
  distance: 14290.3,
  gnlKg: 5005.34,
  nm3: 6957.42,
  performance: 2.86,
  costGnl: 1.32,
  economy: 49
};

function buildScenariosForPeriod(period) {
  const dieselCost = period.costDiesel || 0;
  const gnlCost = period.costGnl || 0;
  const priceGnl = period.priceGnl || 0;
  const priceDiesel = period.priceDiesel || 0;
  const economyFromCosts = (newGnlCost, newDieselCost) => newDieselCost ? ((newDieselCost - newGnlCost) / newDieselCost) * 100 : 0;
  return [
    { name: "Base", priceGnl, priceDiesel, costGnl: gnlCost, economy: period.economy || economyFromCosts(gnlCost, dieselCost) },
    { name: "GNL +10%", priceGnl: priceGnl * 1.1, priceDiesel, costGnl: gnlCost * 1.1, economy: economyFromCosts(gnlCost * 1.1, dieselCost) },
    { name: "Diesel -10%", priceGnl, priceDiesel: priceDiesel * 0.9, costGnl: gnlCost, economy: economyFromCosts(gnlCost, dieselCost * 0.9) },
    { name: "Stress", priceGnl: priceGnl * 1.1, priceDiesel: priceDiesel * 0.9, costGnl: gnlCost * 1.1, economy: economyFromCosts(gnlCost * 1.1, dieselCost * 0.9) },
    { name: "Otimista", priceGnl: priceGnl * 0.9, priceDiesel: priceDiesel * 1.1, costGnl: gnlCost * 0.9, economy: economyFromCosts(gnlCost * 0.9, dieselCost * 1.1) }
  ];
}

function buildMayPeriod(basePeriod) {
  const may = {
    ...basePeriod,
    label: "Fechamento Maio",
    range: "01 de maio de 2026 a 31 de maio de 2026",
    distance: 14290.3,
    gnlKg: 5005.34,
    nm3: 6957.42,
    performance: 2.86,
    energyPerformance: 2.05,
    gnlLiters: 13171.95,
    litersPerKm: 0.92,
    autonomy: 908.06,
    theoreticalAutonomy: 908.06,
    costGnl: 1.32,
    costDiesel: 2.59,
    economy: 49,
    economyRoute: 14290.3 * (2.59 - 1.32),
    economyPerKm: 2.59 - 1.32,
    dieselEquivalent: 14290.3 / (basePeriod.dieselPerformance || 2.6),
    status: "Acima da meta",
    qtdViagens: 51
  };
  may.annualPotential = may.economyPerKm * (may.annualKm || 100000);
  may.emissionsGnl = may.gnlKg * (may.co2FactorGnl || 2.75);
  return may;
}

function configureMonthlyPeriods(base, current) {
  const june = {
    ...current,
    label: "Fechamento Junho",
    range: "01 de junho de 2026 a 30 de junho de 2026"
  };
  const may = buildMayPeriod(june);
  base.periods = {
    maio2026: may,
    junho2026: june
  };
  base.periodoInicial = selectedPeriodKey && base.periods[selectedPeriodKey] ? selectedPeriodKey : "junho2026";
  base.scenariosByPeriod = {
    maio2026: buildScenariosForPeriod(may),
    junho2026: buildScenariosForPeriod(june)
  };
  return base;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && quoted && next === '"') {
      value += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(value);
      if (row.some(cell => cell.trim() !== "")) rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }
  row.push(value);
  if (row.some(cell => cell.trim() !== "")) rows.push(row);
  return rows;
}

function normalizeHeader(value) {
  return String(value || "").trim().toLowerCase();
}

function parseNumber(value) {
  if (typeof value === "number") return value;
  const raw = String(value ?? "").trim();
  if (!raw) return 0;
  const cleaned = raw
    .replace(/R\$/gi, "")
    .replace(/kg CO2|km\/Nm3|km\/kg|R\$\/ano|R\$\/km|Nm3|kg|km|qtd|%|texto/gi, "")
    .trim();
  if (cleaned.includes(",") && cleaned.includes(".")) {
    return Number(cleaned.replace(/\./g, "").replace(",", ".")) || 0;
  }
  if (cleaned.includes(",")) {
    return Number(cleaned.replace(",", ".")) || 0;
  }
  return Number(cleaned) || 0;
}

function rowsToObjects(rows) {
  if (!rows.length) return [];
  const headerIndex = rows.findIndex(row => row.map(normalizeHeader).includes("campo_json"));
  if (headerIndex < 0) return [];
  const headers = rows[headerIndex].map(normalizeHeader);
  return rows.slice(headerIndex + 1).map(row => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])));
}

function cloneData(data) {
  return JSON.parse(JSON.stringify(data));
}

function buildDataFromSheet(rows) {
  const byField = Object.fromEntries(rows.map(row => [String(row.campo_json || "").trim(), row]));
  const getNumber = field => parseNumber(byField[field]?.valor);
  const getText = field => String(byField[field]?.valor || "").trim();
  const base = cloneData(window.GNLDados || DEFAULT_DATA);
  const current = base.periods[base.periodoInicial];

  current.label = byField.distancia_percorrida_km?.periodo || current.label;
  current.range = `${byField.distancia_percorrida_km?.data_inicio || ""} a ${byField.distancia_percorrida_km?.data_fim || ""}`.trim();
  current.distance = getNumber("distancia_percorrida_km") || current.distance;
  current.gnlKg = getNumber("consumo_gnl_kg") || current.gnlKg;
  current.nm3 = getNumber("consumo_gn_nm3") || current.nm3;
  current.performance = getNumber("rendimento_gnl_km_kg") || current.performance;
  current.energyPerformance = getNumber("rendimento_energetico_km_nm3") || current.energyPerformance;
  current.costGnl = getNumber("custo_gnl_rs_km") || current.costGnl;
  current.costDiesel = getNumber("custo_diesel_rs_km") || current.costDiesel;
  current.economyPerKm = getNumber("economia_rs_km") || current.economyPerKm;
  current.economyRoute = getNumber("economia_periodo_rs") || current.economyRoute;
  current.annualPotential = getNumber("potencial_anual_rs") || current.annualPotential;
  current.emissionsGnl = getNumber("emissao_gnl_kg_co2") || current.emissionsGnl;
  current.qtdViagens = getNumber("qtd_viagens") || current.qtdViagens;
  current.qtdCte = getNumber("qtd_cte") || current.qtdCte;
  current.valorTotalCte = getNumber("valor_total_cte_rs") || current.valorTotalCte;
  current.agendamentosSemCte = getNumber("agendamentos_sem_cte") || current.agendamentosSemCte;
  current.status = getText("status_economia") || current.status;

  const economy = getNumber("economia_percentual");
  if (economy) current.economy = economy <= 1 ? economy * 100 : economy;
  if (!current.gnlLiters && current.gnlKg && current.density) current.gnlLiters = current.gnlKg / current.density;
  if (!current.litersPerKm && current.gnlLiters && current.distance) current.litersPerKm = current.gnlLiters / current.distance;
  if (!current.dieselEquivalent && current.distance && current.dieselPerformance) current.dieselEquivalent = current.distance / current.dieselPerformance;
  if (current.gnlKg && current.density) current.gnlLiters = current.gnlLiters || current.gnlKg / current.density;
  if (current.gnlLiters && current.distance) current.litersPerKm = current.litersPerKm || current.gnlLiters / current.distance;
  if (current.tankLiters && current.density) current.tankKg = current.tankKg || current.tankLiters * current.density;
  if (current.tankKg && current.performance) current.theoreticalAutonomy = current.theoreticalAutonomy || current.tankKg * current.performance;
  current.autonomy = current.autonomy || current.theoreticalAutonomy;
  current.dieselEquivalent = current.dieselEquivalent || (current.distance && current.dieselPerformance ? current.distance / current.dieselPerformance : 0);
  current.priceGnl = current.priceGnl || 0;
  current.priceDiesel = current.priceDiesel || 0;

  base.fonte = {
    ...base.fonte,
    arquivo: "Google Sheets | 06_Saida_GitHub",
    geradoEm: new Date().toLocaleString("pt-BR"),
    qualidade: "Automática",
    observacao: "Dados carregados automaticamente da planilha publicada em CSV"
  };
  return configureMonthlyPeriods(base, current);
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
  const entries = Object.entries(dashboardData.periods || {});
  document.querySelector("#periodButtons").innerHTML = entries.map(([key, period]) => (
    `<button type="button" class="${key === selectedPeriodKey ? "active" : ""}" data-period="${key}">${period.label}</button>`
  )).join("");
  document.querySelectorAll("#periodButtons button").forEach(button => {
    button.addEventListener("click", () => selectPeriod(button.dataset.period));
  });
}

function selectPeriod(key) {
  if (!dashboardData.periods?.[key]) return;
  selectedPeriodKey = key;
  p = dashboardData.periods[key];
  render();
}

function applyLayoutFixes() {
  const brand = document.querySelector(".brand");
  if (brand) {
    brand.className = "brand brand-text";
    brand.innerHTML = `
      <img class="official-logo" src="logo-minas-port-assinatura.png" alt="Grupo Minas Port - Soluções Integradas">
    `;
  }

  const comparePanel = document.querySelector(".compare-panel .table-wrap");
  if (comparePanel && !document.querySelector("#monthComparisonBody")) {
    comparePanel.insertAdjacentHTML("beforebegin", `
      <div class="month-compare">
        <h3>Comparativo mês anterior</h3>
        <table>
          <thead><tr><th>Indicador</th><th>Maio/2026</th><th>Junho/2026</th><th>Variação</th></tr></thead>
          <tbody id="monthComparisonBody"></tbody>
        </table>
      </div>
    `);
  }
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
  const scenarios = dashboardData.scenariosByPeriod?.[selectedPeriodKey] || buildScenariosForPeriod(p);
  document.querySelector("#comparisonBody").innerHTML = scenarios.map(s => {
    const cls = s.economy >= p.economy ? "up" : s.economy >= p.minimumEconomy * 100 ? "flat" : "down";
    return `<tr><td>${s.name}</td><td>${money(s.priceGnl)}</td><td>${money(s.priceDiesel)}</td><td class="variation ${cls}">${nf1.format(s.economy)}%</td></tr>`;
  }).join("");
}

function variation(current, previous) {
  if (!previous) return 0;
  return ((current - previous) / previous) * 100;
}

function renderMonthComparison() {
  const body = document.querySelector("#monthComparisonBody");
  if (!body) return;
  const rows = [
    ["Distância percorrida", PREVIOUS_MONTH.distance, p.distance, "km", nf1],
    ["Consumo GNL", PREVIOUS_MONTH.gnlKg, p.gnlKg, "kg", nf],
    ["Consumo Nm³", PREVIOUS_MONTH.nm3, p.nm3, "Nm³", nf],
    ["Rendimento", PREVIOUS_MONTH.performance, p.performance, "km/kg", nf],
    ["Custo GNL", PREVIOUS_MONTH.costGnl, p.costGnl, "R$/km", nf],
    ["Economia operacional", PREVIOUS_MONTH.economy, p.economy, "%", nf1]
  ];
  body.innerHTML = rows.map(([name, prev, current, unit, formatter]) => {
    const delta = variation(current, prev);
    const cls = Math.abs(delta) < 0.05 ? "flat" : delta > 0 ? "up" : "down";
    const prefix = unit.startsWith("R$") ? "R$ " : "";
    const suffix = unit.startsWith("R$") ? "/km" : unit === "%" ? "%" : ` ${unit}`;
    return `<tr><td>${name}</td><td>${prefix}${formatter.format(prev)}${suffix}</td><td>${prefix}${formatter.format(current)}${suffix}</td><td class="variation ${cls}">${delta >= 0 ? "+" : ""}${nf1.format(delta)}%</td></tr>`;
  }).join("");
}

function renderNarrative() {
  const scenarios = dashboardData.scenariosByPeriod?.[selectedPeriodKey] || buildScenariosForPeriod(p);
  const stress = scenarios.find(s => s.name === "Stress") || scenarios[0];
  const optimistic = scenarios.find(s => s.name === "Otimista") || scenarios[0];
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
  const scenarios = dashboardData.scenariosByPeriod?.[selectedPeriodKey] || buildScenariosForPeriod(p);
  document.querySelector("#stopGrid").innerHTML = scenarios.map(s => {
    const status = s.economy >= 45 ? "scenario-good" : s.economy >= 30 ? "scenario-warn" : "scenario-bad";
    return `<article class="stop-card ${status}"><span>${s.name}</span><strong>${nf1.format(s.economy)}%</strong><em>GNL ${money(s.priceGnl)} · Diesel ${money(s.priceDiesel)}</em></article>`;
  }).join("");
}

function render() {
  applyLayoutFixes();
  selectedPeriodKey = dashboardData.periods?.[selectedPeriodKey] ? selectedPeriodKey : dashboardData.periodoInicial;
  p = dashboardData.periods[selectedPeriodKey];
  renderSource(); renderKpis(); renderStudy(); renderPerformance(); renderEconomy();
  renderSensitivityTable(); renderMonthComparison(); renderNarrative(); renderProjections(); renderScenarios();
  document.title = `Torre Operacional GNL | ${dashboardData.fonte.geradoEm}`;
}

document.querySelector("#printButton").addEventListener("click", () => window.print());

async function init() {
  try {
    dashboardData = await loadSheetData();
  } catch (error) {
    console.warn("Usando dados locais por falha ao carregar Google Sheets.", error);
    dashboardData = window.GNLDados;
    if (!dashboardData.periods?.maio2026 || !dashboardData.periods?.junho2026) {
      const fallbackCurrent = dashboardData.periods[dashboardData.periodoInicial] || Object.values(dashboardData.periods)[0];
      dashboardData = configureMonthlyPeriods(cloneData(dashboardData), fallbackCurrent);
    }
    dashboardData.fonte.observacao = "Fallback local: não foi possível carregar o Google Sheets.";
  }
  render();
}

init();
