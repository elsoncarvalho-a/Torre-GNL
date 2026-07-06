/* Gerado automaticamente de: Torre Operacional Petro - Dashboard Alta Gestao.xlsx */
window.GNLDados = {
  "periodoInicial": "base",
  "fonte": {
    "arquivo": "Torre Operacional Petro - Dashboard Alta Gestao.xlsx",
    "geradoEm": "2026-06-01",
    "qualidade": "Media",
    "observacao": "Emissao calculada para GNL"
  },
  "periods": {
    "base": {
      "label": "Base analisada",
      "range": "Consolidação da planilha — geração 2026-06-01",
      "distance": 14290.3,
      "gnlKg": 5005.34,
      "conversion": 1.39,
      "priceGnl": 2.71,
      "priceDiesel": 6.74,
      "dieselPerformance": 2.6,
      "density": 0.38,
      "tankLiters": 711.4499999999999,
      "tankKg": 270.351,
      "theoreticalAutonomy": 729.9477,
      "co2FactorGnl": 2.75,
      "annualKm": 100000,
      "minimumEconomy": 0.25,
      "nm3": 6957.4226,
      "performance": 2.855010848413894,
      "energyPerformance": 2.0539646391466864,
      "gnlLiters": 13171.947368421053,
      "litersPerKm": 0.9217404371091618,
      "autonomy": 729.9477,
      "costGnl": 1.3193995399676703,
      "costDiesel": 2.5923076923076924,
      "economyPerKm": 1.272908152340022,
      "economy": 49.103281841009746,
      "economyRoute": 18190.239369384617,
      "annualPotential": 127290.8152340022,
      "dieselEquivalent": 5496.2692307692305,
      "emissionsGnl": 13764.685000000001,
      "status": "Acima da meta"
    }
  },
  "scenarios": [
    {
      "name": "Base",
      "priceGnl": 2.71,
      "priceDiesel": 6.74,
      "costGnl": 1.3193995399676703,
      "economy": 49.103281841009746
    },
    {
      "name": "GNL +10%",
      "priceGnl": 2.9810000000000003,
      "priceDiesel": 6.74,
      "costGnl": 1.4513394939644375,
      "economy": 44.01361002511072
    },
    {
      "name": "Diesel -10%",
      "priceGnl": 2.71,
      "priceDiesel": 6.066000000000001,
      "costGnl": 1.3193995399676703,
      "economy": 43.44809093445529
    },
    {
      "name": "Stress",
      "priceGnl": 2.9810000000000003,
      "priceDiesel": 6.066000000000001,
      "costGnl": 1.4513394939644375,
      "economy": 37.792900027900814
    },
    {
      "name": "Otimista",
      "priceGnl": 2.439,
      "priceDiesel": 7.414000000000001,
      "costGnl": 1.1874595859709034,
      "economy": 58.35723059718979
    }
  ],
  "actions": [
    {
      "priority": "1",
      "action": "Padronizar base mensal por veiculo/rota",
      "owner": "Operacoes",
      "result": "KPI confiavel por perfil operacional"
    },
    {
      "priority": "2",
      "action": "Negociar contrato GNL com gatilho de spread vs Diesel",
      "owner": "Suprimentos/Financeiro",
      "result": "Protecao da economia capturada"
    },
    {
      "priority": "3",
      "action": "Incluir fator CO2 Diesel e fonte oficial",
      "owner": "Sustentabilidade",
      "result": "Comparativo ambiental completo"
    },
    {
      "priority": "4",
      "action": "Acompanhar economia real vs meta minima",
      "owner": "Controladoria",
      "result": "Governanca de resultado"
    },
    {
      "priority": "5",
      "action": "Expandir piloto com amostra estatistica",
      "owner": "Torre Operacional",
      "result": "Decisao de escala com menor risco"
    }
  ]
};
