# Etapa 1 — Conclusão (teste com a família)

Atualizado em 30/09/2026 · Escopo: 4 perfis (aron, 39; airton, 41; meiri, 36; fernanda, 40),
16 fotos, 4 testes de repetição (3 fotos com a mesma luz + 1 com luz diferente por pessoa).
As análises foram feitas pelo Claude Code a partir da fila do protótipo (plano B), porque a página
do claude.ai não permite enviar imagens ao Claude.

## Resultado frente às metas

| Indicador | Meta | Resultado | Situação |
|---|---|---|---|
| Pessoas com teste de repetição | 3 a 5 | 4 (2 homens, 2 mulheres) | Atingida |
| Variação do Skin Score com a mesma luz | até 5 pontos | 1 · 1 · 1 · 0 | Atingida nos 4, com ressalvas |
| Variação por categoria com a mesma luz | até 5 pontos | 3 de 4 testes; meiri teve 6 em oleosidade | Parcial |
| Fototipos diferentes | 3 ou mais | Não informado nos cadastros; pelas fotos, todos claros a médios | Não atingida |
| Faixas de idade | 3 | 1 (todos entre 36 e 41 anos) | Não atingida |
| Questionários respondidos | 10 ou mais | 0 | Não medida |
| Ocorrências registradas | registrar tudo | 1 no app (foto no perfil errado) + problemas de captura abaixo | Parcial |

## Resultados dos testes de repetição

| | aron | airton | meiri | fernanda |
|---|---|---|---|---|
| Skin Score (mesma luz) | 74 · 75 · 74 | 72 · 73 · 72 | 77 · 76 · 76 | 76 · 76 · 76 |
| Variação do Skin Score | 1 | 1 | 1 | **0** |
| Maior variação por categoria | 2 | 4 (oleosidade) | **6 (oleosidade)** | 1 |
| Efeito da luz diferente no Skin Score | −1 | 0 | +1 | 0 |
| Maior efeito da luz por categoria | −4 (tom, oleosidade) | −3 (poros) | −3 (brilho) | ±2 (vermelhidão, tom, brilho) |
| Captura das fotos "mesma luz" | distância variou | foto 2 em outro ambiente; contraluz | foto 1 em outro ambiente; sombra lateral | **correta** |
| Idade aparente × idade real | ~37 × 39 | ~40 × 41 | ~36 × 36 | ~40 × 40 |
| Tipo de pele pela foto × questionário | mista × não respondido | oleosa × incompleto | mista × normal | normal × normal |
| Principal ponto de atenção | poros, vermelhidão no nariz | oleosidade forte na zona T | oleosidade na testa, sardas | vermelhidão nas bochechas |

## O que a etapa mostrou

1. **Com captura correta, a análise foi estável.** No único teste com as 3 fotos realmente na mesma
   condição (fernanda), o Skin Score não variou e nenhuma categoria variou mais de 1 ponto.
2. **O maior risco é a captura, não a IA.** Em 3 dos 4 testes, as fotos marcadas como "mesma luz"
   foram tiradas em lugares ou distâncias diferentes. Nesses casos, oleosidade e brilho oscilaram
   até 4 e 6 pontos. Houve ainda contraluz, sombra lateral e barba cobrindo metade do rosto.
3. **Oleosidade, brilho, tom e poros são as categorias mais sensíveis à luz.** Firmeza, linhas e
   hidratação quase não mudaram.
4. **Fotos no perfil errado acontecem.** Um teste inteiro da fernanda foi enviado no perfil do
   airton. Foi detectado na análise, mas o teste de repetição do app não confere a pessoa.
5. **Idade aparente plausível.** Nos 4 perfis, a estimativa ficou a no máximo 2 anos da idade real.
6. **Tipo de pele coerente.** Onde o questionário estava completo, foto e questionário coincidiram
   em 1 de 2 casos (fernanda); a divergência da meiri (mista × normal) é explicável pela testa oleosa.
7. **A estabilidade provavelmente está superestimada.** As fotos de cada pessoa foram avaliadas em
   sequência pelo mesmo analisador, que lembrava das notas anteriores. O fluxo automático do app, com
   análises independentes, não pôde ser testado.
8. **Mapas de cor não confiáveis.** O mapa de pigmentação marcou 14% a 26% da pele como mancha,
   contando pelos, sobrancelhas e fios de cabelo, inclusive nas mulheres. Precisa ser refeito.
9. **Limite da plataforma.** A página publicada no claude.ai não envia imagens ao Claude. O app
   definitivo precisa de servidor próprio chamando a API de IA.

## O que não foi avaliado

- Valor percebido e disposição a pagar (nenhum questionário).
- Diversidade de fototipo (todos claros a médios) e de idade (todos entre 36 e 41 anos).
- Concordância com um dermatologista.
- Evolução ao longo do tempo, rotina e produtos (testes de repetição não geram rotina).

## Conclusão

**Viabilidade técnica: demonstrada em condição controlada.** Com fotos tiradas corretamente, a
avaliação foi estável, a idade aparente foi plausível e os pontos de atenção foram coerentes com o que
as pessoas relatam. **Viabilidade de produto: ainda não medida.**

Pelo critério do protocolo (variação ≤ 5 → seguir), a recomendação é **seguir para a etapa 2**, com
estas condições para o app definitivo e para as próximas rodadas de teste:

1. Captura guiada obrigatória: detecção de rosto, bloqueio de contraluz e sombra lateral, distância
   fixa e foto de referência sobreposta.
2. Confirmação da pessoa antes do envio e checagem de "mesma pessoa" também no teste de repetição.
3. Refazer os testes com análises independentes quando houver servidor com API.
4. Ampliar a amostra: fototipos IV a VI, pessoas abaixo de 30 e acima de 50, e questionário
   respondido após cada resultado.
5. Refazer o mapa de pigmentação excluindo pelos e cabelo, ou retirá-lo até lá.
