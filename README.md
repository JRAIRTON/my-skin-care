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
- `docs/etapa2-plano.md` — etapa 2: validação com dermatologista (entregas, passo a passo, critérios, perguntas).
- `docs/etapa2-avaliacao-tecnica.md` — avaliação clínica das 4 pessoas por escalas reconhecidas e comparação com as notas da IA.
- `docs/metodo-myskin-v1.md` — Método MY Skin v1 (grau de 0 a 4 por categoria, depois a nota), aplicado no protótipo.
- `docs/ingredientes-v1.md` — tabela de ingredientes v1 usada pela IA do protótipo.
- `docs/catalogo-v1.md` e `docs/catalogo-v1.json` — etapa 4: catálogo de 34 produtos com ativos, tamanho e preço pesquisado; a IA recomenda só deste catálogo.
- `docs/etapa5-plano.md` e `scripts/etapa5_validacao.py` — etapa 5: análises independentes pela API em 4 modelos (estabilidade, acerto da faixa clínica, custo); escolhido o Claude Sonnet 5.5 (`docs/etapa5-conclusao.md`).
- `app/` — etapa 7: o app definitivo, um app web instalável (PWA) para iPhone e Android. Fotos e histórico
  ficam só no aparelho; a análise vai ao servidor. Rotina e produtos saem de regras fixas e do catálogo
  (`app/recomenda.js`). Decisões em `docs/etapa7-app-web.md`.
- `docs/etapa8-lojas.md` — etapa 8: abertura ao público e lojas (decisões, preço, pendências); termos e política publicados no app por `scripts/gera_juridico.py`.
- `mobile/` e `codemagic.yaml` — app das lojas (Capacitor sobre `app/`, compra pelo RevenueCat) e compilação na nuvem; passos em `docs/etapa8-lojas.md`.
- `server/` — servidor de análise (Cloudflare Worker com Claude Sonnet 5.5, código de acesso e limite de uso),
  que também serve o app; como publicar em `server/README.md`.
- `docs/etapa6-*.md` — etapa 6 (validação de mercado): plano e critérios de decisão, concorrência e mercado, pesquisa para o Google Forms e roteiro de entrevista.
- `prototipo/apresentacao.html` — página de apresentação para divulgar a pesquisa.
- `scripts/analise_pesquisa.py` — analisa o CSV do Google Forms (critérios de decisão e preço por Van Westendorp).
- `docs/juridico/` — etapa 3: análise de enquadramento (ANVISA, LGPD, CDC, lojas), termos de uso, política de privacidade, termo de consentimento, RIPD e termo de participação no teste.
- `docs/etapa2-ficha-dermatologista.csv` e `docs/etapa2-notas-ia.csv` — ficha de avaliação às cegas (fotos F01–F16) e notas da IA pelos mesmos códigos. As fotos não ficam no repositório.
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
