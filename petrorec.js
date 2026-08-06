(() => {
  "use strict";

  const CONFIG = {
    sheetId: "1EHUdFAkqeRXeP4iEBsJ8qO1jUnQU_Tah",
    sheetGid: "1555328701",
    csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQu07iklj_r4xxrmVLHxbuTa6g-HewhEfbNpw5lkkzVcjkDD1oui83wRwscQfuE_A/pub?gid=1555328701&single=true&output=csv",
    refreshMinutes: 60,
    diesel: { price: 6, kmEachWay: 136, loadedKmL: 1.9, returnKmL: 3 }
  };

  const DRE = {
    "2026-05": {
      label: "Mai/26", fatTotal: 191684, combustivelGNL: 23104.57,
      receitaLiquida: 152985.83, custoOperTotal: 109145.53,
      ebitda: 43840.30, margemEbitda: 0.29, viagens: 50,
      volume: 2421.72, kmPorKg: 2.855
    },
    "2026-06": {
      label: "Jun/26", fatTotal: 206154.32, combustivelGNL: 28682.80,
      receitaLiquida: 161055.41, custoOperTotal: 93294.03,
      ebitda: 67761.38, margemEbitda: 0.42, viagens: 54,
      volume: 2548.26, kmPorKg: 2.1414
    }
  };

  const $ = id => document.getElementById(id);
  const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const BRL_COMPACT = new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1
  });
  const NUM = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
  const NUM1 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const NUM3 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 });
  const INT = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
  const MONTH_FMT = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit", timeZone: "UTC" });

  let allRows = [];
  let lastUpdatedAt = null;

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[char]);
  }

  function normalizeText(value) {
    return String(value ?? "")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function parseNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    let text = String(value).replace(/R\$/gi, "").replace(/[\s\u00a0]/g, "").trim();
    if (!text) return null;
    if (text.includes(",")) text = text.replace(/\./g, "").replace(",", ".");
    const number = Number.parseFloat(text);
    return Number.isFinite(number) ? number : null;
  }

  function parseDate(value) {
    if (value === null || value === undefined || value === "") return null;
    if (value instanceof Date && !Number.isNaN(value.valueOf())) return value.toISOString().slice(0, 10);
    const text = String(value).trim();
    let match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;
    match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
    if (match) {
      const year = match[3].length === 2 ? `20${match[3]}` : match[3];
      return `${year}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
    }
    match = text.match(/Date\((\d{4}),(\d{1,2}),(\d{1,2})\)/);
    if (match) return `${match[1]}-${String(Number(match[2]) + 1).padStart(2, "0")}-${match[3].padStart(2, "0")}`;
    if (/^\d{4,6}$/.test(text)) {
      const excelDate = new Date(Math.round((Number(text) - 25569) * 86400 * 1000));
      if (!Number.isNaN(excelDate.valueOf())) return excelDate.toISOString().slice(0, 10);
    }
    return null;
  }

  function field(row, aliases) {
    const entries = Object.keys(row).map(key => ({ key, normalized: normalizeText(key) }));
    for (const alias of aliases.map(normalizeText)) {
      const exact = entries.find(item => item.normalized === alias);
      if (exact) return row[exact.key];
    }
    for (const alias of aliases.map(normalizeText)) {
      const partial = entries.find(item => item.normalized.includes(alias));
      if (partial) return row[partial.key];
    }
    return undefined;
  }

  function normalizeRows(rows) {
    return rows.map(row => {
      const data = parseDate(field(row, ["data"]));
      if (!data) return null;
      return {
        data,
        motorista: String(field(row, ["motorista"]) ?? "").split("|")[0].trim().toUpperCase(),
        cavalo: String(field(row, ["placa cavalo", "cavalo"]) ?? "").trim().toUpperCase(),
        reboque: String(field(row, ["placa reboque", "reboque"]) ?? "").trim().toUpperCase(),
        ncmi: String(field(row, ["ncmi", "ncm"]) ?? "").trim(),
        petroleo: parseNumber(field(row, ["petroleo", "petróleo", "m3"])),
        gnlKg: parseNumber(field(row, ["valor gnl kg", "gnl kg"])),
        gnlAbast: parseNumber(field(row, ["gnl abast", "gnl abastecida", "qtd gnl", "gnl abastecido"])),
        gnlViagem: parseNumber(field(row, ["valor gnl viagem", "gnl viagem"])),
        freteCNB: parseNumber(field(row, ["frete cnb", "frete"])),
        cteBruto: parseNumber(field(row, ["cte bruto", "valor cte bruto"])),
        valorCarga: parseNumber(field(row, ["valor da carga", "valor carga"])),
        cteLiq: parseNumber(field(row, ["cte liq", "cte líquido", "valor cte liq"])),
        valorKm: parseNumber(field(row, ["valor km", "valor por km", "r km"]))
      };
    }).filter(Boolean);
  }

  function parseCsv(text) {
    const rows = [];
    let row = [], fieldValue = "", quoted = false;
    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      const next = text[i + 1];
      if (char === '"' && quoted && next === '"') { fieldValue += '"'; i += 1; }
      else if (char === '"') quoted = !quoted;
      else if (char === "," && !quoted) { row.push(fieldValue); fieldValue = ""; }
      else if ((char === "\n" || char === "\r") && !quoted) {
        if (char === "\r" && next === "\n") i += 1;
        row.push(fieldValue);
        if (row.some(cell => String(cell).trim())) rows.push(row);
        row = []; fieldValue = "";
      } else fieldValue += char;
    }
    row.push(fieldValue);
    if (row.some(cell => String(cell).trim())) rows.push(row);
    if (rows.length < 2) return [];
    const headers = rows.shift().map(header => String(header).trim());
    return rows.map(values => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
  }

  function loadGviz() {
    return new Promise((resolve, reject) => {
      const callback = `__torrePetroRec_${Date.now()}`;
      const script = document.createElement("script");
      let finished = false;
      const cleanup = () => {
        try { delete window[callback]; } catch (_) { window[callback] = undefined; }
        script.remove();
      };
      const timer = window.setTimeout(() => {
        if (finished) return;
        finished = true; cleanup(); reject(new Error("tempo esgotado na planilha"));
      }, 15000);
      window[callback] = response => {
        if (finished) return;
        finished = true; window.clearTimeout(timer); cleanup();
        try {
          const table = response?.table;
          if (!table?.cols) throw new Error("resposta inválida do Google Sheets");
          const columns = table.cols.map(column => String(column.label || column.id || "").trim());
          const rows = (table.rows || []).map(sourceRow => {
            const object = {};
            (sourceRow.c || []).forEach((cell, index) => {
              object[columns[index]] = cell ? (cell.f ?? cell.v ?? "") : "";
            });
            return object;
          });
          resolve(rows);
        } catch (error) { reject(error); }
      };
      script.onerror = () => {
        if (finished) return;
        finished = true; window.clearTimeout(timer); cleanup(); reject(new Error("falha no endpoint gviz"));
      };
      script.src = `https://docs.google.com/spreadsheets/d/${CONFIG.sheetId}/gviz/tq?tqx=responseHandler:${callback}&headers=1&gid=${CONFIG.sheetGid}&_=${Date.now()}`;
      document.head.appendChild(script);
    });
  }

  async function loadCsv() {
    const separator = CONFIG.csvUrl.includes("?") ? "&" : "?";
    const response = await fetch(`${CONFIG.csvUrl}${separator}_=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return parseCsv(await response.text());
  }

  function setStatus(text, state, updatedText) {
    const status = $("prStatus");
    if (!status) return;
    status.textContent = text;
    status.dataset.state = state;
    if (updatedText) $("prUpdatedAt").textContent = updatedText;
  }

  async function refreshData({ silent = false } = {}) {
    setStatus("Atualizando planilha…", "loading");
    $("prRefresh").disabled = true;
    let rawRows;
    try {
      try { rawRows = await loadGviz(); }
      catch (_) { rawRows = await loadCsv(); }
      const normalized = normalizeRows(rawRows);
      if (!normalized.length) throw new Error("nenhum registro operacional válido");
      allRows = normalized.sort((a, b) => a.data.localeCompare(b.data));
      lastUpdatedAt = new Date();
      populateFilters();
      render();
      setStatus(
        "Planilha original sincronizada",
        "ok",
        `${allRows.length} registros · ${lastUpdatedAt.toLocaleString("pt-BR")}`
      );
    } catch (error) {
      allRows = [];
      setStatus("Planilha original indisponível", "error", error.message);
      showEmptyState();
      if (!silent) console.warn("Falha ao atualizar PetroRec.", error);
    } finally {
      $("prRefresh").disabled = false;
    }
  }

  function uniqueValues(key) {
    return [...new Set(allRows.map(row => row[key]).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }

  function monthLabel(key) {
    const [year, month] = key.split("-").map(Number);
    return MONTH_FMT.format(new Date(Date.UTC(year, month - 1, 1))).replace(".", "");
  }

  function setOptions(select, values, allLabel, labelFn = value => value) {
    const previous = select.value;
    select.innerHTML = `<option value="">${escapeHtml(allLabel)}</option>` +
      values.map(value => `<option value="${escapeHtml(value)}">${escapeHtml(labelFn(value))}</option>`).join("");
    if (values.includes(previous)) select.value = previous;
  }

  function populateFilters() {
    const months = [...new Set(allRows.map(row => row.data.slice(0, 7)))].sort();
    setOptions($("prMonth"), months, "Todo o período", monthLabel);
    setOptions($("prTruck"), uniqueValues("cavalo"), "Todos");
    setOptions($("prTrailer"), uniqueValues("reboque"), "Todos");
    setOptions($("prDriver"), uniqueValues("motorista"), "Todos");
    if (allRows.length) {
      const minDate = allRows[0].data;
      const maxDate = allRows[allRows.length - 1].data;
      const start = $("prDateStart"), end = $("prDateEnd");
      const previousMax = end.max;
      const wasAtLatestDate = !end.value || !previousMax || end.value === previousMax;
      start.min = end.min = minDate;
      start.max = end.max = maxDate;
      if (!start.value) start.value = minDate;
      if (wasAtLatestDate || end.value > maxDate) end.value = maxDate;
    }
  }

  function passesDimensions(row) {
    const truck = $("prTruck").value;
    const trailer = $("prTrailer").value;
    const driver = $("prDriver").value;
    return (!truck || row.cavalo === truck) &&
      (!trailer || row.reboque === trailer) &&
      (!driver || row.motorista === driver);
  }

  function filteredRows() {
    const month = $("prMonth").value;
    const start = $("prDateStart").value;
    const end = $("prDateEnd").value;
    return allRows.filter(row => passesDimensions(row) &&
      (!month || row.data.startsWith(month)) &&
      (!start || row.data >= start) &&
      (!end || row.data <= end));
  }

  function comparisonRows() {
    return allRows.filter(passesDimensions);
  }

  function sum(rows, key) {
    return rows.reduce((total, row) => total + (Number(row[key]) || 0), 0);
  }

  function average(rows, key) {
    const values = rows.map(row => Number(row[key])).filter(Number.isFinite);
    return values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;
  }

  function groupByMonth(rows) {
    const groups = new Map();
    rows.forEach(row => {
      const key = row.data.slice(0, 7);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(row);
    });
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, monthRows]) => ({
      key,
      label: monthLabel(key),
      rows: monthRows,
      trips: monthRows.length,
      freight: sum(monthRows, "freteCNB"),
      net: sum(monthRows, "cteLiq"),
      volume: sum(monthRows, "petroleo"),
      gnlCost: sum(monthRows, "gnlViagem"),
      gnlKg: sum(monthRows, "gnlAbast")
    }));
  }

  function dateBr(iso) {
    const [year, month, day] = iso.split("-");
    return `${day}/${month}/${year}`;
  }

  function periodText(rows) {
    if (!rows.length) return "sem registros no recorte";
    return `${dateBr(rows[0].data)} a ${dateBr(rows[rows.length - 1].data)}`;
  }

  function delta(current, previous) {
    return previous ? ((current - previous) / previous) * 100 : null;
  }

  function deltaText(value) {
    if (value === null || !Number.isFinite(value)) return "sem base comparável";
    return `${value >= 0 ? "+" : ""}${NUM1.format(value)}% vs. mês anterior`;
  }

  function renderKpis(rows) {
    const trips = rows.length;
    const freight = sum(rows, "freteCNB");
    const net = sum(rows, "cteLiq");
    const volume = sum(rows, "petroleo");
    const gnlCost = sum(rows, "gnlViagem");
    const fuelRows = rows.filter(row => (row.gnlViagem || 0) > 0 || (row.gnlAbast || 0) > 0);
    const dieselPerTrip = CONFIG.diesel.price * (
      CONFIG.diesel.kmEachWay / CONFIG.diesel.loadedKmL +
      CONFIG.diesel.kmEachWay / CONFIG.diesel.returnKmL
    );
    const dieselTotal = dieselPerTrip * fuelRows.length;
    const saving = dieselTotal - gnlCost;
    const savingPct = dieselTotal ? saving / dieselTotal * 100 : 0;
    const trucks = new Set(rows.map(row => row.cavalo).filter(Boolean)).size;
    const drivers = new Set(rows.map(row => row.motorista).filter(Boolean)).size;
    const months = groupByMonth(comparisonRows());
    const last = months.at(-1), previous = months.at(-2);
    const revenueDelta = last && previous ? delta(last.net, previous.net) : null;
    const items = [
      ["Frete faturado", BRL_COMPACT.format(freight), `${BRL.format(freight)} no recorte`, ""],
      ["CT-e líquido", BRL_COMPACT.format(net), deltaText(revenueDelta), "blue"],
      ["CT-e emitidos", INT.format(trips), `Ticket médio ${trips ? BRL.format(net / trips) : "—"}`, ""],
      ["Volume transportado", `${NUM.format(volume)} m³`, `${trips ? NUM3.format(volume / trips) : "0"} m³/viagem`, "blue"],
      ["Custo total GNL", BRL_COMPACT.format(gnlCost), `${fuelRows.length ? BRL.format(gnlCost / fuelRows.length) : "—"} por viagem`, ""],
      ["Economia vs. diesel", BRL_COMPACT.format(saving), `${NUM1.format(savingPct)}% estimados`, "blue"],
      ["Valor médio por km", BRL.format(average(rows, "valorKm")), "média das viagens", ""],
      ["Produtividade da frota", trucks ? NUM1.format(trips / trucks) : "0", `viagens/cavalo · ${drivers} motoristas`, "blue"]
    ];
    $("prKpis").innerHTML = items.map(([label, value, note, theme]) => `
      <article class="pr-kpi ${theme}">
        <span class="label">${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
        <em class="${note.includes("estimados") ? "trend" : ""}">${escapeHtml(note)}</em>
      </article>`).join("");
  }

  function renderMonthly(rows) {
    const months = groupByMonth(rows);
    if (!months.length) {
      $("prMonthChart").innerHTML = '<div class="pr-empty">Sem histórico mensal.</div>';
      $("prMonthHead").innerHTML = "";
      $("prMonthBody").innerHTML = "";
      return;
    }
    const maxNet = Math.max(...months.map(month => month.net), 1);
    const maxVolume = Math.max(...months.map(month => month.volume), 1);
    $("prMonthChart").innerHTML = months.map(month => `
      <div class="pr-month-column">
        <div class="pr-bars">
          <i class="pr-bar" style="--h:${Math.max(3, month.net / maxNet * 100)}%" data-tip="${escapeHtml(BRL.format(month.net))}"></i>
          <i class="pr-bar volume" style="--h:${Math.max(3, month.volume / maxVolume * 100)}%" data-tip="${escapeHtml(NUM.format(month.volume))} m³"></i>
        </div>
        <div><b>${escapeHtml(month.label)}</b><small>${month.trips} CT-e</small></div>
      </div>`).join("");

    $("prMonthHead").innerHTML = `<tr><th>Indicador</th>${months.map(month => `<th>${escapeHtml(month.label)}</th>`).join("")}<th>Variação</th></tr>`;
    const last = months.at(-1), previous = months.at(-2);
    const metrics = [
      ["CT-e líquido", "net", value => BRL_COMPACT.format(value)],
      ["Frete faturado", "freight", value => BRL_COMPACT.format(value)],
      ["Viagens", "trips", value => INT.format(value)],
      ["Volume m³", "volume", value => NUM.format(value)],
      ["Custo GNL", "gnlCost", value => BRL_COMPACT.format(value)]
    ];
    $("prMonthBody").innerHTML = metrics.map(([label, key, formatter]) => {
      const change = previous ? delta(last[key], previous[key]) : null;
      return `<tr><td>${label}</td>${months.map(month => `<td>${formatter(month[key])}</td>`).join("")}<td class="${change !== null && change >= 0 ? "good" : ""}">${change === null ? "—" : `${change >= 0 ? "+" : ""}${NUM1.format(change)}%`}</td></tr>`;
    }).join("");
  }

  function renderFuel(rows) {
    const fuelRows = rows.filter(row => (row.gnlViagem || 0) > 0 || (row.gnlAbast || 0) > 0);
    const trips = fuelRows.length;
    const gnlTotal = sum(fuelRows, "gnlViagem");
    const gnlKg = sum(fuelRows, "gnlAbast");
    const dieselPerTrip = CONFIG.diesel.price * (
      CONFIG.diesel.kmEachWay / CONFIG.diesel.loadedKmL +
      CONFIG.diesel.kmEachWay / CONFIG.diesel.returnKmL
    );
    const dieselTotal = dieselPerTrip * trips;
    const saving = dieselTotal - gnlTotal;
    const savingPct = dieselTotal ? saving / dieselTotal * 100 : 0;
    const gnlPerTrip = trips ? gnlTotal / trips : 0;
    const max = Math.max(gnlPerTrip, dieselPerTrip, 1);
    $("prFuelCards").innerHTML = `
      <div class="pr-fuel-card"><span>GNL realizado</span><strong>${BRL.format(gnlPerTrip)}</strong><em>${NUM1.format(trips ? gnlKg / trips : 0)} kg por viagem</em></div>
      <div class="pr-fuel-card"><span>Diesel estimado</span><strong>${BRL.format(dieselPerTrip)}</strong><em>${NUM.format(CONFIG.diesel.kmEachWay / CONFIG.diesel.loadedKmL + CONFIG.diesel.kmEachWay / CONFIG.diesel.returnKmL)} litros por viagem</em></div>
      <div class="pr-fuel-card saving"><span>Economia estimada</span><strong>${BRL.format(saving)}</strong><em>${NUM1.format(savingPct)}% · ${BRL.format(trips ? saving / trips : 0)} por viagem</em></div>`;
    $("prFuelBars").innerHTML = `
      <div class="pr-fuel-row"><span>GNL</span><div class="pr-fuel-track"><i style="--w:${gnlPerTrip / max * 100}%"></i></div><b>${BRL.format(gnlPerTrip)}</b></div>
      <div class="pr-fuel-row diesel"><span>Diesel</span><div class="pr-fuel-track"><i style="--w:${dieselPerTrip / max * 100}%"></i></div><b>${BRL.format(dieselPerTrip)}</b></div>`;
  }

  function tripCycleCost(row) {
    if ((row.gnlViagem || 0) > 0) return row.gnlViagem;
    if ((row.gnlAbast || 0) > 0 && (row.gnlKg || 0) > 0) return row.gnlAbast * row.gnlKg;
    return null;
  }

  function renderTripCycle(rows) {
    const cycleKm = CONFIG.diesel.kmEachWay * 2;
    const fuelRows = rows.filter(row => (row.gnlAbast || 0) > 0 || tripCycleCost(row) !== null);
    const totalKg = sum(fuelRows, "gnlAbast");
    const totalCost = fuelRows.reduce((total, row) => total + (tripCycleCost(row) || 0), 0);
    const avgKg = fuelRows.length ? totalKg / fuelRows.length : 0;
    const avgYield = totalKg ? cycleKm * fuelRows.length / totalKg : 0;
    const avgCost = fuelRows.length ? totalCost / fuelRows.length : 0;
    const avgCostKm = cycleKm ? avgCost / cycleKm : 0;
    const avgVolume = rows.length ? sum(rows, "petroleo") / rows.length : 0;
    const avgNet = rows.length ? sum(rows, "cteLiq") / rows.length : 0;

    const metrics = [
      ["Viagens analisadas", INT.format(rows.length), `${INT.format(fuelRows.length)} com dados de GNL`, ""],
      ["Ciclo estimado", `${INT.format(cycleKm)} km`, `${INT.format(CONFIG.diesel.kmEachWay)} km por trecho`, ""],
      ["Consumo médio", `${NUM1.format(avgKg)} kg`, `${NUM.format(avgYield)} km/kg`, "blue"],
      ["Custo médio do ciclo", BRL.format(avgCost), `${BRL.format(avgCostKm)} por km`, "featured"],
      ["Volume médio", `${NUM3.format(avgVolume)} m³`, "por viagem", "blue"],
      ["CT-e líquido médio", BRL.format(avgNet), `${BRL.format(Math.max(0, avgNet - avgCost))} após GNL`, ""]
    ];

    $("prTripSummary").innerHTML = metrics.map(([label, value, note, theme]) => `
      <div class="pr-trip-metric ${theme}">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
        <em>${escapeHtml(note)}</em>
      </div>`).join("");

    if (!rows.length) {
      $("prTripBody").innerHTML = '<tr><td colspan="9" class="pr-empty">Sem viagens no recorte selecionado.</td></tr>';
      return;
    }

    $("prTripBody").innerHTML = [...rows].sort((a, b) => b.data.localeCompare(a.data)).map(row => {
      const cost = tripCycleCost(row);
      const consumption = row.gnlAbast || null;
      const yieldKmKg = consumption ? cycleKm / consumption : null;
      const costKm = cost !== null ? cost / cycleKm : null;
      const set = [row.cavalo, row.reboque].filter(Boolean).join(" + ") || "—";
      return `<tr>
        <td>${dateBr(row.data)}</td>
        <td>${escapeHtml(row.motorista || "—")}</td>
        <td>${escapeHtml(set)}</td>
        <td>${row.petroleo ? `${NUM3.format(row.petroleo)} m³` : "—"}</td>
        <td>${consumption ? `${NUM1.format(consumption)} kg` : "—"}</td>
        <td>${yieldKmKg ? `${NUM.format(yieldKmKg)} km/kg` : "—"}</td>
        <td class="${cost !== null ? "good" : "pending"}">${cost !== null ? BRL.format(cost) : "Pendente"}</td>
        <td>${costKm !== null ? BRL.format(costKm) : "—"}</td>
        <td>${BRL.format(row.cteLiq || 0)}</td>
      </tr>`;
    }).join("");
  }

  function renderDre(rows) {
    const operational = Object.fromEntries(groupByMonth(rows).map(month => [month.key, month]));
    const firstDreMonth = Object.keys(DRE).sort()[0];
    const columns = [...new Set([...Object.keys(DRE), ...Object.keys(operational)])]
      .filter(key => !firstDreMonth || key >= firstDreMonth)
      .sort();
    const dreColumnLabel = key => DRE[key]?.label || `${monthLabel(key)} (op.)`;
    $("prDreHead").innerHTML = `<tr><th>Indicador</th>${columns.map(key => `<th>${escapeHtml(dreColumnLabel(key))}</th>`).join("")}</tr>`;
    const valueFor = (key, metric) => {
      if (DRE[key]) return DRE[key][metric];
      const month = operational[key];
      if (!month) return null;
      const mapping = {
        fatTotal: month.freight, combustivelGNL: month.gnlCost, receitaLiquida: month.net,
        viagens: month.trips, volume: month.volume,
        kmPorKg: month.gnlKg ? month.trips * CONFIG.diesel.kmEachWay * 2 / month.gnlKg : null
      };
      return mapping[metric] ?? null;
    };
    const metrics = [
      ["Faturamento total", "fatTotal", BRL.format],
      ["Receita / CT-e líquido", "receitaLiquida", BRL.format],
      ["Combustível GNL", "combustivelGNL", BRL.format],
      ["Custo operacional", "custoOperTotal", BRL.format],
      ["EBITDA", "ebitda", BRL.format],
      ["Margem EBITDA", "margemEbitda", value => `${NUM1.format(value * 100)}%`],
      ["Viagens faturadas", "viagens", INT.format],
      ["Volume transportado", "volume", value => `${NUM.format(value)} m³`],
      ["Produtividade GNL", "kmPorKg", value => `${NUM.format(value)} km/kg`]
    ];
    $("prDreBody").innerHTML = metrics.map(([label, metric, formatter]) => `
      <tr><td>${label}</td>${columns.map(key => {
        const value = valueFor(key, metric);
        const pending = value === null || value === undefined;
        const good = metric === "ebitda" && !pending;
        return `<td class="${pending ? "pending" : good ? "good" : ""}">${pending ? "Pendente" : formatter(value)}</td>`;
      }).join("")}</tr>`).join("");
  }

  function groupRows(rows, key) {
    const groups = new Map();
    rows.forEach(row => {
      const name = row[key] || "NÃO INFORMADO";
      if (!groups.has(name)) groups.set(name, []);
      groups.get(name).push(row);
    });
    return [...groups.entries()].map(([name, group]) => ({ name, rows: group }));
  }

  function renderRanking(containerId, groups, type) {
    const ranked = groups.map(group => ({
      ...group,
      trips: group.rows.length,
      net: sum(group.rows, "cteLiq"),
      volume: sum(group.rows, "petroleo"),
      gnlKg: sum(group.rows, "gnlAbast"),
      activeDays: new Set(group.rows.map(row => row.data)).size,
      trucks: [...new Set(group.rows.map(row => row.cavalo).filter(Boolean))],
      trailers: [...new Set(group.rows.map(row => row.reboque).filter(Boolean))]
    })).sort((a, b) => b.trips - a.trips || b.net - a.net).slice(0, 8);
    if (!ranked.length) {
      $(containerId).innerHTML = '<div class="pr-empty">Sem dados no recorte.</div>';
      return;
    }
    const maxTrips = Math.max(...ranked.map(item => item.trips), 1);
    $(containerId).innerHTML = ranked.map((item, index) => {
      const note = type === "driver"
        ? `${item.activeDays} dias ativos · ${item.trucks.join(", ") || "sem cavalo"}`
        : `${item.trailers.join(", ") || "sem reboque"} · ${NUM1.format(item.trips ? item.gnlKg / item.trips : 0)} kg/viagem`;
      return `<div class="pr-rank-row">
        <span class="pr-rank-no">${index + 1}</span>
        <span class="pr-rank-name"><b title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</b><small>${escapeHtml(note)}</small></span>
        <span class="pr-rank-track"><i style="--w:${item.trips / maxTrips * 100}%"></i></span>
        <span class="pr-rank-value"><strong>${item.trips} viagens</strong><small>${BRL_COMPACT.format(item.net)} líquidos</small></span>
      </div>`;
    }).join("");
  }

  function renderDetails(rows) {
    $("prDetailCount").textContent = `${INT.format(rows.length)} registros`;
    if (!rows.length) {
      $("prDetailBody").innerHTML = '<tr><td colspan="10" class="pr-empty">Sem registros no recorte selecionado.</td></tr>';
      return;
    }
    $("prDetailBody").innerHTML = [...rows].sort((a, b) => b.data.localeCompare(a.data)).map(row => `
      <tr>
        <td>${dateBr(row.data)}</td>
        <td>${escapeHtml(row.motorista || "—")}</td>
        <td>${escapeHtml(row.cavalo || "—")}</td>
        <td>${escapeHtml(row.reboque || "—")}</td>
        <td>${BRL.format(row.cteLiq || 0)}</td>
        <td>${BRL.format(row.freteCNB || 0)}</td>
        <td>${NUM3.format(row.petroleo || 0)}</td>
        <td>${NUM1.format(row.gnlAbast || 0)}</td>
        <td>${BRL.format(row.gnlViagem || 0)}</td>
        <td>${BRL.format(row.valorKm || 0)}</td>
      </tr>`).join("");
  }

  function render() {
    const rows = filteredRows();
    $("prContext").textContent = `${periodText(rows)} · ${INT.format(rows.length)} viagens · ${new Set(rows.map(row => row.cavalo).filter(Boolean)).size} cavalos · filtros aplicados ao recorte`;
    renderTripCycle(rows);
  }

  function showEmptyState() {
    $("prContext").textContent = "A planilha original não respondeu. Nenhum dado alternativo foi exibido.";
    renderTripCycle([]);
  }

  function clearFilters() {
    ["prMonth", "prTruck", "prTrailer", "prDriver"].forEach(id => { $(id).value = ""; });
    if (allRows.length) {
      $("prDateStart").value = allRows[0].data;
      $("prDateEnd").value = allRows[allRows.length - 1].data;
    }
    render();
  }

  function bindEvents() {
    ["prMonth", "prDateStart", "prDateEnd", "prTruck", "prTrailer", "prDriver"].forEach(id => {
      $(id).addEventListener("change", render);
    });
    $("prClearFilters").addEventListener("click", clearFilters);
    $("prRefresh").addEventListener("click", () => refreshData());
  }

  function init() {
    if (!$("petrorec")) return;
    bindEvents();
    refreshData({ silent: true });
    window.setInterval(() => refreshData({ silent: true }), CONFIG.refreshMinutes * 60 * 1000);
  }

  init();
})();
