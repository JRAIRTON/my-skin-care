# MY Skin AI — protótipo

Protótipo para avaliar a viabilidade do MY Skin AI com a família (spec v3.0, 23/09/2026).

- `prototipo/index.html` — app web publicado como artefato privado no claude.ai.
  Perfis por familiar, upload de foto do rosto, checagem automática de qualidade,
  análise por IA (Claude, pela conta de quem abre), Skin Score, evolução com gráfico
  e comparação antes/depois, rotina com checklist diário e produtos com pesquisa de preço.
- `prototipo/seed/` — dados fictícios ("Ana (exemplo)") usados para demonstração.
- `docs/avaliacao.md` — avaliação de viabilidade e melhorias sugeridas.
- `docs/caracteristicas.md` — o que o protótipo avalia, como e com quais limites.
- `docs/etapa1-conclusao.md` — conclusão da etapa 1 com os 2 perfis testados.
- `docs/etapa1-protocolo.md` — protocolo do teste com a família (etapa 1): metas, passo a passo e critério de decisão.

## Como funciona o protótipo

1. Familiares enviam a foto (guia de foto na aba **Familiares**, com botão para copiar).
2. Você cadastra o familiar (com registro de consentimento) e sobe a foto em **Nova análise**.
3. O app mede qualidade (resolução, iluminação, áreas estouradas, sombra lateral, nitidez, cor da luz).
4. A foto (e a anterior, quando existe) vai ao Claude com uma rubrica fixa de notas 0–100.
   O Skin Score é a média das categorias, calculada no app para ser estável.
5. Dados ficam no banco do artefato; fotos no armazenamento do artefato (privado).

A aba **Etapa 1** reúne o teste de repetição, o questionário, o diário de ocorrências e a exportação
(CSV/JSON). O app também verifica se a foto parece ser da mesma pessoa, segura saltos improváveis na nota
para revisão e considera procedimentos estéticos registrados.

Sem backend próprio e sem chave de API: o artefato usa as capacidades `db`, `assets`, `sample` e `downloads` do claude.ai.
