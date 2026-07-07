Torre Operacional GNL — Dashboard Executivo
Painel web responsivo alimentado pela planilha Torre Operacional Petro - Dashboard Alta Gestao.xlsx.
Conteúdo
composição executiva 16:9 baseada no mockup de referência;
identidade visual e fotografia de frota fornecidas pela Minas Port;
18 indicadores derivados das abas Premissas e Indicadores;
cinco cenários de sensibilidade de preço GNL/Diesel;
economia por km, economia total e potencial anual;
autonomia, capacidade do tanque e diesel equivalente;
emissão estimada de GNL, meta e status executivo;
ações recomendadas, responsáveis e lacunas de governança;
publicação automática pelo GitHub Pages.
Viagens, CT-es e tempos de ciclo foram retirados porque esses campos não existem na planilha fornecida.
Atualização
O conversor importar_excel.mjs lê a planilha e gera o arquivo dados.js, utilizado pela página. Consulte ATUALIZAR-PELO-EXCEL.md.
Publicação no GitHub Pages
Envie os arquivos desta pasta ao repositório.
Acesse Settings > Pages.
Selecione GitHub Actions como fonte.
O fluxo em .github/workflows/pages.yml publicará a página.
Estrutura
.
├── .github/workflows/pages.yml
├── assets/painel-referencia.png
├── ATUALIZAR-PELO-EXCEL.md
├── dados.js
├── importar_excel.mjs
├── index.html
├── script.js
└── styles.css
Atualizacao automatica via Google Sheets
O dashboard agora tenta carregar automaticamente a aba publicada no Google Sheets em formato CSV:
https://docs.google.com/spreadsheets/d/e/2PACX-1vSZVFrMhHyHomcj_9lNVaX6LCH-jMhAtubakhXnVG-gbRGvT--XPaKtwIO04fVAAA/pub?gid=1776941332&single=true&output=csv
Quando a planilha publicada for atualizada, basta recarregar o dashboard para buscar os novos dados.
