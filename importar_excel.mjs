import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const source = process.argv[2] || "C:/Users/elson.silva/Desktop/Planilhas Petro/Torre Operacional Petro - Dashboard Alta Gestao.xlsx";
const output = new URL("./dados.js", import.meta.url);

const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(source));
const premissas = workbook.worksheets.getItem("Premissas").getRange("B5:B18").values.flat();
const indicadores = workbook.worksheets.getItem("Indicadores").getRange("B5:B22").values.flat();
const cenariosRaw = workbook.worksheets.getItem("Sensibilidade").getRange("A18:E22").values;
const acoesRaw = workbook.worksheets.getItem("Resumo Executivo").getRange("A17:D21").values;
const qualidade = workbook.worksheets.getItem("Resumo Executivo").getRange("C13").values[0][0];

const excelDate = serial => {
  if (typeof serial !== "number") return String(serial || "");
  return new Date(Date.UTC(1899, 11, 30) + serial * 86400000).toISOString().slice(0, 10);
};

const data = {
  periodoInicial: "base",
  fonte: {
    arquivo: path.basename(source),
    geradoEm: excelDate(premissas[13]),
    qualidade: qualidade || "Média",
    observacao: indicadores[17],
  },
  periods: {
    base: {
      label: "Base analisada",
      range: `Consolidação da planilha — geração ${excelDate(premissas[13])}`,
      distance: premissas[0],
      gnlKg: premissas[1],
      conversion: premissas[2],
      priceGnl: premissas[3],
      priceDiesel: premissas[4],
      dieselPerformance: premissas[5],
      density: premissas[6],
      tankLiters: premissas[7],
      tankKg: premissas[8],
      theoreticalAutonomy: premissas[9],
      co2FactorGnl: premissas[10],
      annualKm: premissas[11],
      minimumEconomy: premissas[12],
      nm3: indicadores[0],
      performance: indicadores[1],
      energyPerformance: indicadores[2],
      gnlLiters: indicadores[3],
      litersPerKm: indicadores[4],
      autonomy: indicadores[5],
      costGnl: indicadores[6],
      costDiesel: indicadores[7],
      economyPerKm: indicadores[8],
      economy: indicadores[9] * 100,
      economyRoute: indicadores[10],
      annualPotential: indicadores[11],
      dieselEquivalent: indicadores[12],
      emissionsGnl: indicadores[13],
      status: indicadores[16],
    }
  },
  scenarios: cenariosRaw.map(row => ({
    name: row[0], priceGnl: row[1], priceDiesel: row[2], costGnl: row[3], economy: row[4] * 100,
  })),
  actions: acoesRaw.map(row => ({
    priority: row[0], action: row[1], owner: row[2], result: row[3],
  })),
};

const content = `/* Gerado automaticamente de: ${path.basename(source)} */\nwindow.GNLDados = ${JSON.stringify(data, null, 2)};\n`;
await fs.writeFile(output, content, "utf8");
console.log("Dashboard atualizado: dados.js");
