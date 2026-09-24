# Características avaliadas pelo protótipo

Situação após a versão 3 do protótipo. "Foto comum" = foto de celular com luz natural.

| Característica | Como o protótipo avalia | Limite |
|---|---|---|
| Poros | Nota própria (antes vinha junto com oleosidade) | Visual |
| Rugas e linhas de expressão | Nota com definição: testa, glabela, olhos, sulco nasogeniano | Visual |
| Elasticidade e firmeza | Nota "firmeza e elasticidade aparentes" (contorno, flacidez, sulcos) | Elasticidade real exige aparelho (cutômetro) |
| Pigmentação e manchas | Nota + **mapa de pigmentação** calculado pela cor + área com manchas (%) + análise de foto **polarizada/UV** quando houver acessório | Luz polarizada/UV exige lente ou aparelho |
| Brilho | Nota "brilho e luminosidade" (viço vs. pele opaca); brilho oleoso vai em "sebo e oleosidade" | Visual |
| Tom e uniformidade | Nota | Visual |
| Vermelhidão e áreas vasculares/sensíveis | Nota (inclui vasinhos) + **mapa de vermelhidão** + área avermelhada (%) + sinal de sensibilidade no tipo de pele | Mapa depende da luz |
| Sebo e oleosidade | Nota própria + questionário | Medida real exige sebômetro |
| Porfirinas | Só em **foto com luz UV** (pontos laranja fluorescentes nos poros) | Impossível em foto comum. "Porfiria", a doença, não é avaliada: é diagnóstico médico |
| Hidratação / umidade | Nota "hidratação aparente" + "como a pele está hoje" no contexto | Umidade real exige corneômetro |
| Classificação do tipo de pele | Questionário de 8 perguntas inspirado em Baumann (código de 4 letras) + estimativa pela foto, com aviso quando divergem | Questionário não validado |
| Idade da pele vs. idade real | **Idade aparente da pele** com faixa, comparada à idade do cadastro; pode ser ocultada por pessoa | Idade biológica exige exames; aqui é só aparência |

## Mapas de cor (experimental)

Calculados no próprio aparelho a partir da foto comum:
- pigmentação: índice de melanina aproximado (log 1/R) comparado com a pele ao redor;
- vermelhidão: índice de eritema aproximado (log 1/G − log 1/R) comparado com a média do rosto,
  excluindo as manchas marrons.

Testados com imagens sintéticas: pele sem manchas marca 0%, clara ou escura; manchas e área
avermelhada são detectadas no tamanho certo. Em fotos reais, a luz muda os números: compare apenas
fotos tiradas do mesmo jeito.

## Observação sobre o Skin Score

Com 10 categorias (antes 8), o Skin Score das análises novas não é diretamente comparável
com análises feitas antes desta versão.
