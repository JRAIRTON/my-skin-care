# Etapa 1 — Conclusão (teste com a família)

Data: 26/09/2026 · Escopo: 2 perfis (aron, 39 anos; airton, 41 anos), 8 fotos, 2 testes de repetição.
As análises foram feitas pelo Claude Code a partir da fila do protótipo (plano B), porque a página
do claude.ai não permite enviar imagens ao Claude.

## Resultado frente às metas

| Indicador | Meta | Resultado | Situação |
|---|---|---|---|
| Pessoas com teste de repetição | 3 a 5 | 2 | Não atingida |
| Variação do Skin Score com a mesma luz | até 5 pontos | 1 ponto (aron) e 1 ponto (airton) | Atingida, com ressalvas |
| Fototipos diferentes | 3 ou mais | Não informado nos cadastros | Não medida |
| Faixas de idade | 3 | 1 (30 a 49) | Não atingida |
| Questionários respondidos | 10 ou mais | 0 | Não medida |
| Ocorrências registradas | registrar tudo | 0 no app; problemas abaixo registrados neste documento | Parcial |

## Resultados dos testes de repetição

| | aron | airton |
|---|---|---|
| Skin Score (fotos com a mesma luz) | 74 · 75 · 74 | 72 · 73 · 72 |
| Variação do Skin Score | 1 | 1 |
| Maior variação por categoria | 2 (textura, poros, brilho) | 4 (oleosidade) |
| Efeito da luz diferente no Skin Score | −1 | 0 |
| Maior efeito da luz por categoria | −4 (tom e oleosidade) | −3 (poros) |
| Idade aparente da pele | ~37 (34 a 41) | ~40 (36 a 44) |
| Tipo de pele pela foto | mista | oleosa |
| Principais pontos de atenção | poros no nariz, vermelhidão leve ao lado do nariz, brilho na testa | oleosidade forte na zona T, poros, vermelhidão nas bochechas |

## O que a etapa mostrou

1. **O Skin Score foi estável; as categorias, menos.** O total variou 1 ponto nos dois testes, mas
   categorias isoladas oscilaram até 4 pontos com a mesma luz e até 4 com luz diferente. Tom,
   oleosidade, brilho e poros são os mais sensíveis à luz.
2. **A estabilidade provavelmente está superestimada.** As 4 fotos de cada pessoa foram avaliadas em
   sequência pelo mesmo analisador, que lembrava das notas anteriores. O fluxo automático do app, com
   análises independentes, não pôde ser testado.
3. **O maior risco é a captura da foto, não a IA.** Nos 2 perfis houve problema de captura: barba
   cobrindo metade do rosto (os dois), contraluz e troca de ambiente numa foto marcada como "mesma luz"
   (airton), distância diferente entre fotos (aron). O guia de texto não bastou.
4. **Limite técnico da plataforma.** A página publicada no claude.ai não envia imagens ao Claude.
   O plano B (fila analisada pelo Claude Code) funcionou, mas não serve para o produto. O app
   definitivo precisa de servidor próprio chamando a API de IA, como já previa o projeto.
5. **Mapa de pigmentação inválido com barba.** Marcou 22% a 26% da pele como mancha porque conta os
   pelos. Precisa excluir pelos antes de ser usado.
6. **Coerência clínica plausível.** A análise do airton apontou oleosidade como principal ponto, o
   mesmo objetivo que ele declarou no cadastro. Nenhum alerta para dermatologista foi necessário;
   pintas pequenas foram apontadas apenas para observação.

## O que não foi avaliado

- Valor percebido e disposição a pagar (nenhum questionário).
- Diversidade: dois homens de 39 e 41 anos, fototipo não informado, ambos com barba.
- Evolução ao longo do tempo, rotina e produtos (testes de repetição não geram rotina).
- Mulheres, peles sem barba, peles mais claras ou mais escuras, outras idades.

## Conclusão

**Viabilidade técnica: parcialmente demonstrada.** Com fotos na mesma condição, a avaliação foi
consistente e coerente com o que as pessoas relatam. **Viabilidade de produto: ainda não medida**,
porque faltaram questionários e diversidade de perfis.

Pelo critério do protocolo (variação ≤ 5 → seguir para as etapas 2 e 3), a recomendação é
**seguir, com condições**:

1. Tratar a captura como requisito central do app definitivo: câmera guiada com detecção de rosto,
   bloqueio de contraluz e foto de referência sobreposta ("foto fantasma").
2. Refazer o teste de repetição com análises independentes quando houver backend com API, e medir a
   variação real.
3. Na etapa 2, levar ao dermatologista estas 8 análises (exportação CSV) para a primeira medida de
   concordância.
4. Ampliar a amostra antes de decisões de negócio: pelo menos 3 mulheres, 1 pessoa acima de 50 e
   1 abaixo de 30, fototipos variados, e questionário respondido após cada resultado.
5. Corrigir o mapa de pigmentação para ignorar pelos.
