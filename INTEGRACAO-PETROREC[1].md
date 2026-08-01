# Integração PetroRec na Torre GNL

## O que foi implementado

- Leitura somente consulta da planilha operacional PetroRec publicada no Google Sheets.
- Carga principal por JSONP/GViz, sem dependência de CORS, com CSV como contingência.
- Atualização automática a cada 60 minutos e botão de atualização manual.
- Cache local da última carga válida para manter o painel disponível em falhas temporárias.
- Filtros por competência, período, cavalo, reboque e motorista.
- Indicadores de frete, CT-e, volume, custo GNL, comparação estimada com diesel e produtividade.
- Comparação mensal com gráficos e tabela.
- Ranking por motorista e frota.
- Base operacional detalhada.
- DRE de maio e junho como referência gerencial do painel PetroRec, com julho operacional.

## Governança da fonte

A operação é sincronizada diretamente da planilha pública usada pelo painel PetroRec. A integração é somente leitura e não exige senha nem credencial.

A DRE de maio e junho não está na planilha operacional: ela está cadastrada no código do painel PetroRec. Por isso, seus números foram mantidos como referência estática e identificados visualmente. Para automatizar fechamentos futuros, publique uma aba DRE compartilhada com uma linha por competência.

## Arquivos adicionados

- `petrorec.js`: integração, cálculos, filtros e renderização.
- `petrorec.css`: identidade visual e responsividade do módulo.

O `index.html` recebeu apenas o novo bloco PetroRec e as referências aos dois arquivos. Os arquivos originais `script.js`, `dados.js`, `styles.css` e `logo-fix.css` foram preservados.

## Publicação

Copie os arquivos deste pacote para a raiz do repositório `Torre-GNL`, substituindo o `index.html` e mantendo os demais arquivos. Após o commit no branch publicado pelo GitHub Pages, a integração entra no ar no endereço atual da Torre.

## Referência de validação

Na base publicada em 01/08/2026, o painel de origem apresentava 127 registros, R$ 488.400,62 de frete, R$ 385.094,26 de CT-e líquido, 6.037,09 m³ transportados e R$ 64.053,98 de custo GNL. Esses totais foram usados para conferir os cálculos da integração.
