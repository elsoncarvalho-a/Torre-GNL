(() => {
  "use strict";

  const CONFIG = {
    sheetId: "1SF96YVvS0CdFAGurbbqhk6aifVFZvYne",
    sheetName: "06_Saida_GitHub",
    refreshMinutes: 60,
    cacheKey: "torreGnlOriginalSaidaGithubV1"
  };

  const METRICS = new Set([
    "distancia_percorrida_km",
    "consumo_gnl_kg",
    "rendimento_gnl_km_kg",
    "custo_gnl_rs_km",
    "economia_rs_km",
    "qtd_viagens",
    "qtd_cte",
    "valor_total_cte_rs"
  ]);

  const $ = id => document.getElementById(id);
  const numberFormat = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
  const currencyFormat = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function parseNumber(value) {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    let clean = String(value ?? "").trim().replace(/[^0-9,.-]/g, "");
    if (!clean) return 0;
    if (clean.includes(",")) clean = clean.replace(/\./g, "").replace(",", ".");
    const parsed = Number(clean);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function formatNumber(value, digits = 2) {
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    }).format(Number(value) || 0);
  }

  function formatCurrency(value) {
    return currencyFormat.format(Number(value) || 0);
  }

  function dateSortKey(value) {
    const match = String(value || "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    return match ? `${match[3]}-${match[2]}-${match[1]}` : String(value || "");
  }

  function cellValue(cell) {
    if (!cell) return "";
    if (typeof cell.v === "number") return cell.v;
    return cell.f ?? cell.v ?? "";
  }

  function loadJsonp() {
    return new Promise((resolve, reject) => {
      const callback = `torreGnlOriginal_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const script = document.createElement("script");
      const timeout = setTimeout(() => finish(new Error("Tempo de resposta excedido")), 15000);

      function finish(error, rows) {
        clearTimeout(timeout);
        delete window[callback];
        script.remove();
        error ? reject(error) : resolve(rows);
      }

      window[callback] = response => {
        if (!response || response.status === "error" || !response.table) {
          finish(new Error("Resposta inválida da planilha"));
          return;
        }
        const rows = (response.table.rows || []).map(row => (row.c || []).map(cellValue));
        finish(null, rows);
      };

      script.onerror = () => finish(new Error("Falha ao conectar à planilha"));
      script.src = `https://docs.google.com/spreadsheets/d/${CONFIG.sheetId}/gviz/tq?tqx=responseHandler:${callback}&headers=0&sheet=${encodeURIComponent(CONFIG.sheetName)}&_=${Date.now()}`;
      document.head.appendChild(script);
    });
  }

  function parseCsv(text) {
    const rows = [];
    let row = [], field = "", quoted = false;
    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      if (char === '"') {
        if (quoted && text[i + 1] === '"') { field += '"'; i += 1; }
        else quoted = !quoted;
      } else if (char === "," && !quoted) {
        row.push(field); field = "";
      } else if ((char === "\n" || char === "\r") && !quoted) {
        if (char === "\r" && text[i + 1] === "\n") i += 1;
        row.push(field); field = "";
        if (row.some(item => item !== "")) rows.push(row);
        row = [];
      } else field += char;
    }
    row.push(field);
    if (row.some(item => item !== "")) rows.push(row);
    return rows;
  }

  async function loadCsv() {
    const url = `https://docs.google.com/spreadsheets/d/${CONFIG.sheetId}/gviz/tq?tqx=out:csv&headers=0&sheet=${encodeURIComponent(CONFIG.sheetName)}&_=${Date.now()}`;
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return parseCsv(await response.text());
  }

  function normalizePeriods(rows) {
    const groups = new Map();
    rows.forEach(row => {
      const metric = String(row[0] ?? "").trim();
      if (!METRICS.has(metric)) return;
      const period = String(row[5] ?? "").trim() || "Fechamento";
      const start = String(row[6] ?? "").trim();
      const end = String(row[7] ?? "").trim();
      const key = `${period}|${start}|${end}`;
      if (!groups.has(key)) groups.set(key, { key, period, start, end, values: {} });
      groups.get(key).values[metric] = parseNumber(row[2]);
    });

    return [...groups.values()]
      .map(item => {
        const values = item.values;
        const trips = values.qtd_viagens || 0;
        const cteCount = values.qtd_cte || trips;
        const distance = values.distancia_percorrida_km || 0;
        const gnlKg = values.consumo_gnl_kg || 0;
        const yieldGnl = values.rendimento_gnl_km_kg || (gnlKg ? distance / gnlKg : 0);
        const costKm = values.custo_gnl_rs_km || 0;
        const totalCte = values.valor_total_cte_rs || 0;
        const totalGnlCost = costKm * distance;
        return {
          ...item,
          trips,
          cteCount,
          distance,
          gnlKg,
          yieldGnl,
          costKm,
          totalCte,
          avgDistance: trips ? distance / trips : 0,
          avgGnl: trips ? gnlKg / trips : 0,
          totalGnlCost,
          avgCycleCost: trips ? totalGnlCost / trips : 0,
          avgCte: cteCount ? totalCte / cteCount : 0,
          avgEconomy: trips ? (values.economia_rs_km || 0) * distance / trips : 0
        };
      })
      .filter(item => item.trips > 0 && item.distance > 0)
      .sort((a, b) => dateSortKey(a.start).localeCompare(dateSortKey(b.start)) || a.period.localeCompare(b.period));
  }

  function periodLabel(item) {
    return item.period || `${item.start} a ${item.end}`;
  }

  function populatePeriods(periods) {
    const select = $("prMonth");
    const previous = select.value;
    select.innerHTML = periods.map(item => `<option value="${escapeHtml(item.key)}">${escapeHtml(periodLabel(item))}</option>`).join("");
    select.value = periods.some(item => item.key === previous) ? previous : periods[periods.length - 1].key;
  }

  function selectedPeriod(periods) {
    return periods.find(item => item.key === $("prMonth").value) || periods[periods.length - 1];
  }

  function renderSummary(item) {
    const netAfterGnl = item.avgCte - item.avgCycleCost;
    const metrics = [
      ["Viagens do fechamento", numberFormat.format(item.trips), `${numberFormat.format(item.cteCount)} CT-e emitidos`, ""],
      ["Distância média / ciclo", `${formatNumber(item.avgDistance)} km`, `${formatNumber(item.distance)} km no mês`, "blue"],
      ["Consumo médio / ciclo", `${formatNumber(item.avgGnl)} kg`, `${formatNumber(item.gnlKg)} kg no mês`, ""],
      ["Rendimento GNL", `${formatNumber(item.yieldGnl)} km/kg`, "indicador do fechamento", "blue"],
      ["Custo GNL por ciclo", formatCurrency(item.avgCycleCost), `${formatCurrency(item.totalGnlCost)} no mês`, "featured"],
      ["CT-e médio / ciclo", formatCurrency(item.avgCte), `após GNL: ${formatCurrency(netAfterGnl)}`, "featured"]
    ];
    $("prTripSummary").innerHTML = metrics.map(([label, value, note, theme]) => `
      <div class="pr-trip-metric ${theme}">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
        <em>${escapeHtml(note)}</em>
      </div>`).join("");
  }

  function renderTable(periods) {
    $("prTripBody").innerHTML = [...periods].reverse().map(item => `
      <tr>
        <td>${escapeHtml(periodLabel(item))}</td>
        <td>${numberFormat.format(item.trips)}</td>
        <td>${formatNumber(item.distance)} km</td>
        <td>${formatNumber(item.avgDistance)} km</td>
        <td>${formatNumber(item.gnlKg)} kg</td>
        <td>${formatNumber(item.avgGnl)} kg</td>
        <td>${formatNumber(item.yieldGnl)} km/kg</td>
        <td class="good">${formatCurrency(item.avgCycleCost)}</td>
        <td>${formatCurrency(item.avgCte)}</td>
      </tr>`).join("");
  }

  function render(periods) {
    const item = selectedPeriod(periods);
    renderSummary(item);
    renderTable(periods);
    const interval = item.start && item.end ? ` · ${item.start} a ${item.end}` : "";
    $("prContext").textContent = `${periodLabel(item)}${interval} · médias calculadas sobre ${numberFormat.format(item.trips)} viagens`;
  }

  function setStatus(state, message, detail) {
    const status = $("prStatus");
    status.dataset.state = state;
    status.textContent = message;
    $("prUpdatedAt").textContent = detail;
  }

  function saveCache(periods) {
    try { localStorage.setItem(CONFIG.cacheKey, JSON.stringify({ savedAt: Date.now(), periods })); } catch (_) { /* cache opcional */ }
  }

  function readCache() {
    try {
      const cache = JSON.parse(localStorage.getItem(CONFIG.cacheKey) || "null");
      if (!cache || !Array.isArray(cache.periods) || !cache.periods.length) return null;
      return cache;
    } catch (_) { return null; }
  }

  let allPeriods = [];

  async function refresh() {
    setStatus("loading", "Conectando à planilha original…", `Fonte: ${CONFIG.sheetName}`);
    $("prRefresh").disabled = true;
    try {
      let rows;
      try { rows = await loadJsonp(); }
      catch (_) { rows = await loadCsv(); }
      const periods = normalizePeriods(rows);
      if (!periods.length) throw new Error("Nenhum fechamento válido encontrado");
      allPeriods = periods;
      populatePeriods(periods);
      render(periods);
      saveCache(periods);
      setStatus("ok", "Planilha original sincronizada", `${CONFIG.sheetName} · ${periods.length} fechamentos · ${new Date().toLocaleString("pt-BR")}`);
    } catch (error) {
      const cache = readCache();
      if (cache) {
        allPeriods = cache.periods;
        populatePeriods(allPeriods);
        render(allPeriods);
        setStatus("cache", "Exibindo última carga da planilha original", `${CONFIG.sheetName} · cache de ${new Date(cache.savedAt).toLocaleString("pt-BR")}`);
      } else {
        $("prTripSummary").innerHTML = "";
        $("prTripBody").innerHTML = '<tr><td colspan="9" class="pr-empty">Não foi possível carregar a planilha original.</td></tr>';
        $("prContext").textContent = "Sem dados disponíveis. Tente atualizar novamente.";
        setStatus("error", "Planilha original indisponível", error.message || "Erro de conexão");
      }
    } finally {
      $("prRefresh").disabled = false;
    }
  }

  function bindEvents() {
    $("prMonth").addEventListener("change", () => render(allPeriods));
    $("prClearFilters").addEventListener("click", () => {
      if (!allPeriods.length) return;
      $("prMonth").value = allPeriods[allPeriods.length - 1].key;
      render(allPeriods);
    });
    $("prRefresh").addEventListener("click", refresh);
  }

  function init() {
    if (!$("petrorec")) return;
    bindEvents();
    refresh();
    setInterval(refresh, CONFIG.refreshMinutes * 60 * 1000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
