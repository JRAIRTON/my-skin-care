# Etapa 6 — Validação de mercado

01/10/2026. Objetivo: descobrir, antes de investir no app definitivo, se existe demanda e quanto as
pessoas pagariam. A etapa 1 não respondeu a isso (nenhum questionário foi preenchido).

## Perguntas que a etapa precisa responder

1. **O problema existe?** As pessoas gastam com skincare e têm dificuldade de saber o que funciona?
2. **A proposta interessa?** Análise por foto + evolução + rotina + produtos com preço.
3. **Por que pagar, se há apps gratuitos das marcas?** Qual diferencial pesa mais?
4. **Quanto pagariam?** Faixa de preço aceitável por mês.
5. **Quem é o público?** Idade, gênero e gasto mensal com skincare de quem mais se interessa.

## Métodos

| Método | Meta | Material |
|---|---|---|
| Pesquisa online (Google Forms, ~5 min) | 100 respostas ou mais | `etapa6-pesquisa.md` |
| Entrevistas (15 min, vídeo ou presencial) | 15 a 30 pessoas | `etapa6-entrevista.md` |
| Página de apresentação para divulgar a pesquisa | link para WhatsApp e redes | página publicada no claude.ai |
| Análise da concorrência | concluída | `etapa6-concorrencia.md` |

**Preço:** método de Van Westendorp (4 perguntas: barato demais, barato, caro, caro demais), que
mostra a faixa aceitável, mais uma pergunta de intenção de assinar a um preço fixo.

**Quem convidar:** além da família, pessoas fora do círculo próximo. Família tende a ser gentil e
infla o interesse. Buscar mulheres e homens, de 18 a 60 anos, com peles e tons variados.

## Critérios de decisão

| Indicador | Meta para seguir | Por quê |
|---|---|---|
| Interesse na proposta (nota 4 ou 5 de 5) | 40% ou mais | Mostra que o conceito atrai |
| "Certamente" ou "provavelmente assinaria" a R$ 19,90/mês | 25% ou mais | Intenção de compra costuma ser 2 a 3 vezes maior que a compra real |
| Faixa de preço aceitável (Van Westendorp) | incluir R$ 14,90/mês ou mais | Abaixo disso, a margem não cobre loja de apps (15–30%), IA e servidor |
| Diferencial escolhido entre as 3 funções mais valiosas | evolução ou economia acima de "análise" | A análise sozinha existe de graça nas marcas |
| Entrevistas com dor concreta relatada | metade ou mais | Ex.: já gastou com produto que não funcionou |

**Resultado:** todos atingidos → seguir para o app definitivo. Interesse alto mas preço baixo →
rever o modelo (por exemplo, gratuito com afiliados ou plano anual). Interesse baixo → rever a
proposta antes de investir.

## Cronograma sugerido

| Semana | Atividade |
|---|---|
| 1 | Criar o formulário, divulgar a página, começar entrevistas |
| 2 | Continuar a divulgação até 100 respostas; terminar entrevistas |
| 3 | Exportar respostas (CSV) e analisar com `scripts/analise_pesquisa.py`; relatório da etapa |

## Cuidados (LGPD)

A pesquisa é anônima. Contato (e-mail ou WhatsApp) só para quem aceitar participar de entrevista,
com finalidade informada, e apagado ao fim da etapa.
