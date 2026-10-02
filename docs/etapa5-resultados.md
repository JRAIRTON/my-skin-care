# Etapa 5 — Resultados da validação ampliada da IA

Análises: 144 (0 com erro). Método MY Skin v1. Cada análise é independente: uma chamada por foto, sem foto anterior nem notas anteriores.

## Resumo por modelo

| Modelo | Mesma foto: variação média do Skin Score | Mesma foto: maior variação | Mesma foto: variação média por categoria | Notas dentro da faixa clínica | Notas abaixo da faixa | Custo por análise | Tempo médio | Erros |
|---|---|---|---|---|---|---|---|---|
| claude-haiku-4-5 | 4,8 | 13 | 6,4 | 55% | 29% | US$ 0,0054 | 2 s | 0 |
| claude-sonnet-5 | 1,1 | 3 | 2,7 | 73% | 9% | US$ 0,0143 | 3 s | 0 |
| claude-opus-5 | 1,1 | 3 | 1,3 | 55% | 44% | US$ 0,0357 | 4 s | 0 |

Referência da etapa 2 (antes do Método v1): 52% das notas dentro da faixa clínica, todas as demais abaixo.

## Variação entre fotos com a mesma luz (média das repetições)

| Modelo | aron | airton | meiri | fernanda |
|---|---|---|---|---|
| claude-haiku-4-5 | 2,7 | 7,7 | 0,3 | 2,0 |
| claude-sonnet-5 | 1,7 | 1,0 | 0,7 | 0,7 |
| claude-opus-5 | 0,3 | 2,7 | 0,3 | 2,3 |

## Efeito da luz diferente no Skin Score (média das repetições)

| Modelo | aron | airton | meiri | fernanda |
|---|---|---|---|---|
| claude-haiku-4-5 | -3,8 | -0,7 | 4,6 | 1,6 |
| claude-sonnet-5 | -0,1 | 0,7 | 1,9 | -1,8 |
| claude-opus-5 | -4,2 | 1,8 | -0,1 | -2,8 |

## Critérios

- Mesma foto analisada de novo: variação média do Skin Score até 3 pontos.
- Fotos com a mesma luz: até 5 pontos.
- Notas dentro da faixa clínica: 70% ou mais (era 52%).
- Escolha: o modelo mais barato que cumpra os três critérios.

