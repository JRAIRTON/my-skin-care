# Etapa 5 — Conclusão e escolha do modelo

02/10/2026. Números completos em `etapa5-resultados.md`; plano em `etapa5-plano.md`.

## Execução

144 análises independentes (16 fotos × 3 repetições × 3 modelos), sem erros. Custo real: US$ 2,66,
mais US$ 0,06 de um piloto com uma foto. O limite era US$ 8.

## Metas por modelo

| Modelo | Repetibilidade (meta ≤ 3) | Mesma luz, pior pessoa (meta ≤ 5) | Na faixa clínica (meta ≥ 70%) | Custo por análise | Cumpre? |
|---|---|---|---|---|---|
| Claude Haiku 4.5 | 4,8 ✗ | 7,7 ✗ | 55% ✗ | US$ 0,0054 | Não |
| Claude Sonnet 5 | 1,1 ✓ | 1,7 ✓ | 73% ✓ | US$ 0,0143 | **Sim** |
| Claude Opus 5 | 1,1 ✓ | 2,7 ✓ | 55% ✗ | US$ 0,0357 | Não |

## Recomendação

**Usar o Claude Sonnet 5 (`claude-sonnet-5`) no app.** É o único dos três que cumpre as três metas, e
custa cerca de US$ 0,014 por análise (mais ou menos R$ 0,08).

- **Haiku 4.5:** é instável. A mesma foto chegou a variar 13 pontos entre repetições, e o modelo dá
  notas abaixo da faixa clínica em 29% dos casos.
- **Opus 5:** é tão estável quanto o Sonnet, mas é mais severo. 44% das notas ficaram abaixo da faixa
  clínica, e ele custa 2,5 vezes mais.
- **Efeito da luz:** no Sonnet, a luz diferente mudou o Skin Score em no máximo 1,9 ponto. No Haiku e
  no Opus, chegou a cerca de 4 pontos.
- **Ganho sobre a etapa 2:** o acerto da faixa clínica subiu de 52% para 73%, o que confirma o
  Método v1.

## Correções no script feitas nesta rodada

- O schema da resposta tinha 21 campos anuláveis. A API recusa schemas assim (erro 400), então
  "não avaliável" passou a ser um campo `avaliavel` (verdadeiro ou falso), que o script converte de
  volta em `null`.
- Ao retomar uma execução, as análises que deram erro agora são refeitas. Antes, contavam como
  "já salvas".
- A simulação (`--simular`) grava em arquivos separados e não se mistura com os resultados reais.

## Limites e próximos passos

- Os graus clínicos de referência foram dados pelo Claude Code, não por dermatologista. Os 73% medem
  concordância com essa referência, não acerto clínico.
- A amostra tem só 4 pessoas, sem fototipos IV a VI e sem idades fora da faixa de 30 a 50 anos.
- O Claude Sonnet 5.5 (`claude-sonnet-5-5`) saiu depois do plano, com o mesmo preço do Sonnet 5, e não
  foi testado. Vale uma rodada só com ele (cerca de US$ 0,70) antes de fechar o modelo.
