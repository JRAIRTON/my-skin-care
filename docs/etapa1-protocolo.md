# Etapa 1 — Protocolo de teste com a família

Objetivo: descobrir, antes de investir no app definitivo, se (1) as notas são estáveis,
(2) funcionam para tons de pele e idades diferentes e (3) as pessoas veem valor no app.

Tudo é feito no protótipo, aba **Etapa 1**.

## Metas

| Indicador | Meta | Como medir |
|---|---|---|
| Pessoas com teste de repetição | 3 a 5 | Aba Etapa 1 → Teste de repetição |
| Variação do Skin Score com a mesma luz | até 5 pontos | Coluna "Variação" (verde ≤ 5, amarelo ≤ 10, vermelho > 10) |
| Fototipos diferentes analisados | 3 ou mais | Fototipo no cadastro de cada familiar |
| Faixas de idade | até 29, 30 a 49, 50+ | Idade no cadastro |
| Questionários respondidos | 10 ou mais | Fim da página de cada análise |
| Ocorrências | registrar tudo | Automático + anotações manuais |

## Passo a passo

1. **Cadastro.** Na aba Familiares, cadastre cada pessoa com idade, fototipo e consentimento.
   Marque "fez procedimento estético nos últimos 6 meses" quando for o caso e registre o
   procedimento na aba Evolução.
2. **Teste de repetição.** Envie as instruções (botão "Copiar instruções do teste"):
   3 fotos seguidas com a mesma luz + 1 foto com luz diferente. Suba as 4 fotos no
   "Novo teste" e toque em Analisar. Cada foto é analisada sozinha, sem a anterior,
   e não entra na evolução.
3. **Análise de acompanhamento.** Use uma das fotos boas como primeira análise em
   Nova análise. Repita a cada 15 dias.
4. **Questionário.** Depois de cada análise de acompanhamento, mostre o resultado à pessoa
   e registre as respostas no fim da página (entendimento, concordância, notas que pareceram
   erradas, se seguiria a rotina, se pagaria e quanto).
5. **Ocorrências.** Erros, fotos insuficientes e análises que precisam de revisão entram
   sozinhos. Anote o resto (dúvidas, confusões, pedidos).
6. **Exportar.** Ao fim, use "Exportar planilha (CSV)" para levar ao dermatologista na etapa 2.

## Proteções adicionadas nesta etapa

- **Mesma pessoa:** quando há foto anterior, a IA diz se parece a mesma pessoa. Se "não" ou
  "incerto", a análise fica fora da evolução até você confirmar, mover para outro familiar ou excluir.
- **Salto improvável:** mudança acima de 10 pontos no Skin Score, ou acima de 15 numa categoria,
  sem procedimento registrado no intervalo, também vai para revisão.
- **Procedimentos estéticos:** tipo, data e dias de recuperação. O gráfico marca o procedimento,
  a variação do período ganha aviso, a rotina entra em pausa parcial durante a recuperação e a
  IA é instruída a não atribuir o efeito do procedimento à rotina.

## Como decidir ao fim da etapa

- Variação ≤ 5 na maioria dos testes e questionários positivos → seguir para as etapas 2 e 3.
- Variação 6 a 10 → melhorar a captura (guia, cartão de cor) antes de avançar.
- Variação > 10 ou uma categoria sempre instável → rever o método com o dermatologista
  (etapa 2) ou considerar API especializada (etapa 5).
