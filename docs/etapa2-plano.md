# Etapa 2 — Validação com dermatologista

Objetivo: dar ao MY Skin AI uma base de conhecimento revisada por um profissional e medir, pela
primeira vez, se as notas da IA concordam com a avaliação de um dermatologista.

## Entregas

| # | Entrega | Quem | Material de partida |
|---|---|---|---|
| 1 | Escala de notas revisada, com critério de cada faixa por categoria | Dermatologista | `etapa2-metodo-rascunho.md` |
| 2 | Avaliação às cegas das 16 fotos da etapa 1 | Dermatologista | Ficha de avaliação (PDF com fotos codificadas + planilha) |
| 3 | Relatório de concordância IA × dermatologista | Claude Code | Planilha preenchida + notas da IA (`etapa2-notas-ia.csv`) |
| 4 | Tabela de ingredientes revisada | Dermatologista | `etapa2-ingredientes-rascunho.md` |
| 5 | Documento "Método MY Skin" (versão 1) | Claude Code, com revisão do dermatologista | Entregas 1, 3 e 4 |

## Passo a passo

1. **Autorização das 4 pessoas.** O consentimento registrado cobre o "uso das fotos neste teste".
   Antes de mostrar as fotos a um dermatologista, peça uma autorização específica
   (uma mensagem por escrito basta nesta fase).
2. **Escolher o dermatologista.** De preferência com experiência em cosmiatria. Se possível, dois
   profissionais avaliando as mesmas fotos: a diferença entre eles mostra quanto dois humanos
   discordam entre si, que é a referência justa para julgar a IA.
3. **Primeira conversa (30 a 45 min).** Apresentar o projeto e o objetivo, combinar a remuneração
   e entregar o material: o rascunho do método, a ficha de avaliação e o rascunho de ingredientes.
4. **Avaliação às cegas.** O dermatologista dá nota de 0 a 100 às 10 categorias de cada foto,
   usando as faixas do rascunho do método, sem ver as notas da IA. As fotos estão em ordem
   embaralhada e identificadas só por código (F01 a F16).
5. **Revisão do método e dos ingredientes.** Em paralelo, o dermatologista corrige as faixas das
   escalas e a tabela de ingredientes.
6. **Concordância.** Com a planilha preenchida, o Claude Code calcula a concordância e escreve o
   relatório.
7. **Reunião de fechamento (30 a 45 min).** Discutir onde a IA mais errou e fechar a versão 1 do
   Método MY Skin.

## Critérios de sucesso

| Medida | Meta |
|---|---|
| Diferença média entre IA e dermatologista, por categoria | até 10 pontos (uma faixa da escala) |
| Fotos com diferença de até 10 pontos no Skin Score | 80% ou mais |
| Principal ponto de atenção de cada pessoa | mesmo apontado pelos dois em 3 de 4 pessoas |
| Alerta para dermatologista | nenhum caso que o profissional indicaria e a IA não indicou |

Se houver dois dermatologistas, a meta passa a ser: a diferença IA × dermatologista não ser maior
que a diferença entre os dois dermatologistas.

## Perguntas para o dermatologista

1. As 10 categorias fazem sentido? Alguma deveria ser juntada, separada ou retirada?
2. As faixas de nota de cada categoria estão bem descritas? Qual escala clínica usar como referência?
3. O que pode ser dito ao usuário sem configurar diagnóstico? Onde está a linha?
4. Quais sinais devem sempre gerar o alerta "procure um dermatologista"?
5. Quais ingredientes e concentrações são seguros para recomendar sem prescrição no Brasil?
6. Como a rotina deve mudar depois de procedimentos (toxina, laser, peeling, preenchimento)?
7. Aceitaria ser responsável técnico do conteúdo do app numa fase seguinte?

## O que já se sabe da etapa 1 (para levar à conversa)

- Com captura correta, a IA foi estável (variação de 0 a 1 ponto).
- Oleosidade, brilho, tom e poros são as categorias mais sensíveis à luz.
- A idade aparente ficou a no máximo 2 anos da idade real nos 4 perfis.
- Faltam fototipos IV a VI e pessoas abaixo de 30 e acima de 50.

## Em paralelo (etapas 3 e 4)

- Etapa 3, jurídico: advogado de proteção de dados e parecer sobre o enquadramento na ANVISA.
- Etapa 4, catálogo: produtos com lista INCI e situação na ANVISA, revisados por farmacêutico.
