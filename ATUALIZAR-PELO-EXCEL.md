# Atualização do dashboard pelo Excel

O dashboard usa como fonte o arquivo `Torre Operacional Petro - Dashboard Alta Gestao.xlsx`.

## Processo recomendado

1. Atualize os valores na aba **Premissas** da planilha.
2. Confira os resultados nas abas **Indicadores**, **Sensibilidade** e **Resumo Executivo**.
3. Envie a planilha atualizada ao Codex e peça: **“Atualize o dashboard GNL com esta planilha”**.
4. O conversor lê as células, recria o arquivo `dados.js` e valida o painel.
5. No GitHub, substitua o arquivo `dados.js`. O GitHub Pages publicará os números atualizados.

## Informações importadas

- distância e consumo GNL;
- conversão para Nm³ e volume em litros;
- rendimento físico e energético;
- autonomia e capacidade útil do tanque;
- custos GNL e Diesel por quilômetro;
- economia por km, economia total e percentual;
- potencial anual e diesel equivalente;
- emissão estimada do GNL;
- meta mínima e status;
- cinco cenários de sensibilidade;
- ações recomendadas e responsáveis.

Viagens, CT-es e tempos de ciclo não são exibidos porque não existem na planilha fornecida.
