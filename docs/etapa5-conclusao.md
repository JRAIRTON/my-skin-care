# Etapa 5 — Conclusão e escolha do modelo

02/10/2026. Números completos em `etapa5-resultados.md`; plano em `etapa5-plano.md`.

## Execução

144 análises independentes (16 fotos × 3 repetições × 3 modelos), sem erros, por US$ 2,66, mais
US$ 0,06 de um piloto com uma foto. Depois, mais 48 análises só com o Claude Sonnet 5.5, por US$ 0,68.
O limite era US$ 8.

## Metas por modelo

| Modelo | Repetibilidade (meta ≤ 3) | Mesma luz, pior pessoa (meta ≤ 5) | Na faixa clínica (meta ≥ 70%) | Custo por análise | Cumpre? |
|---|---|---|---|---|---|
| Claude Haiku 4.5 | 4,8 ✗ | 7,7 ✗ | 55% ✗ | US$ 0,0054 | Não |
| Claude Sonnet 5 | 1,1 ✓ | 1,7 ✓ | 73% ✓ | US$ 0,0143 | **Sim** |
| Claude Opus 5 | 1,1 ✓ | 2,7 ✓ | 55% ✗ | US$ 0,0357 | Não |
| Claude Sonnet 5.5 | 0,8 ✓ | 2,0 ✓ | 78% ✓ | US$ 0,0143 | **Sim** |

## Recomendação

**Usar o Claude Sonnet 5.5 (`claude-sonnet-5-5`) no app.** Ele e o Sonnet 5 são os únicos que cumprem as
três metas, e os dois custam o mesmo: cerca de US$ 0,014 por análise (mais ou menos R$ 0,08). O
Sonnet 5.5 se sai melhor nas duas medidas principais:

- **Repetibilidade:** a mesma foto varia em média 0,8 ponto (1,1 no Sonnet 5), no máximo 2 pontos.
- **Faixa clínica:** 78% das notas ficam dentro da faixa (73% no Sonnet 5).

Na estabilidade entre fotos com a mesma luz e no efeito da luz, o Sonnet 5 fica um pouco à frente
(1,7 contra 2,0 e 1,9 contra 2,2), mas a diferença é pequena e os dois estão bem dentro das metas. O
Sonnet 5.5 também é o modelo mais novo, então deve ter suporte por mais tempo.

Comparação com os demais modelos:

- **Haiku 4.5:** é instável. A mesma foto chegou a variar 13 pontos entre repetições, e o modelo dá
  notas abaixo da faixa clínica em 29% dos casos.
- **Opus 5:** é tão estável quanto o Sonnet, mas é mais severo. 44% das notas ficaram abaixo da faixa
  clínica, e ele custa 2,5 vezes mais.
- **Efeito da luz:** nos dois Sonnet, a luz diferente mudou o Skin Score em no máximo 2,2 pontos. No
  Haiku e no Opus, chegou a cerca de 4 pontos.
- **Ganho sobre a etapa 2:** o acerto da faixa clínica subiu de 52% para 78% com o Sonnet 5.5, o
  que confirma o Método v1.

## Como o modelo é usado no app

Decisão de 02/10/2026:

- **No protótipo (`prototipo/index.html`), nada muda.** Ele roda como artifact do claude.ai e pede a
  análise pelo recurso `sample` do claude.ai, com a conta de quem abre a página. Esse recurso não aceita
  nome de modelo; a página só escolhe uma faixa (`quick`, `default` ou `complex`). O app já usa
  `modelTier: "default"`, a faixa equilibrada da família Sonnet, e fica assim. O claude.ai decide a
  versão exata e pode servir uma faixa mais barata conforme o plano da pessoa. A resposta informa só a
  faixa aplicada, não o modelo.
- **A chave de API nunca vai dentro da página.** Qualquer pessoa com o link poderia copiá-la.
- **No app definitivo, usar o Claude Sonnet 5.5 por meio de um servidor próprio.** Uma função na nuvem
  guarda a chave e chama a API com `claude-sonnet-5-5`, usando o mesmo pedido e o mesmo schema validados
  em `scripts/etapa5_validacao.py`. O custo, cerca de US$ 0,015 por análise, passa a ser do MY Skin AI,
  e não de quem usa o app. **Feito em `server/`** (Cloudflare Worker): o pedido e o schema vêm de
  `server/src/metodo.json`, gerado pelo script, para não divergirem do que foi validado. Ele tem senha
  de acesso e limite de 10 análises por minuto por IP. Testado localmente com uma foto real: HTTP 200 em
  3 s, cerca de 5.800 tokens de entrada (contra 4.300 na validação) e 300 de saída. Publicado em
  06/10/2026 em https://my-skin-care.jr-airton.workers.dev (Cloudflare Workers Builds, publica sozinho a
  cada envio à branch), com a primeira análise real pelo app funcionando.
- **Consequência para o protótipo:** os números desta etapa valem para o Sonnet 5.5 chamado direto pela
  API. O protótipo pode ser atendido por outra versão, então seus resultados podem diferir um pouco até
  a troca pelo servidor próprio.

## Correções no script feitas nesta rodada

- O schema da resposta tinha 21 campos anuláveis. A API recusa schemas assim (erro 400), então
  "não avaliável" passou a ser um campo `avaliavel` (verdadeiro ou falso), que o script converte de
  volta em `null`.
- Ao retomar uma execução, as análises que deram erro agora são refeitas. Antes, contavam como
  "já salvas".
- A simulação (`--simular`) grava em arquivos separados e não se mistura com os resultados reais.

## Limites e próximos passos

- Os graus clínicos de referência foram dados pelo Claude Code, não por dermatologista. Os 78% medem
  concordância com essa referência, não acerto clínico.
- A amostra tem só 4 pessoas, sem fototipos IV a VI e sem idades fora da faixa de 30 a 50 anos.
- O Sonnet 5.5 entrou depois do plano, numa segunda rodada com as mesmas fotos, o mesmo pedido e o
  mesmo número de repetições.
