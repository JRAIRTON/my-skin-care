# Etapa 7 — App definitivo (app web instalável)

05/10/2026. Decisão: o app definitivo começa como **app web instalável (PWA)**, e não como app de loja.
Abre por um link no iPhone e no Android, vai para a tela inicial como um app e não depende de
aprovação da App Store nem do Google Play. Código em `app/`; servido pelo mesmo Worker de `server/`.

## O que o app faz

| Tela | Conteúdo |
|---|---|
| Primeira vez | Condições de uso e consentimento para dados sensíveis (LGPD, art. 11), perfil e código de acesso |
| Analisar | Guia de foto, câmera frontal ou galeria, checagem de qualidade (as mesmas 6 medidas da etapa 1) e análise pelo servidor |
| Resultado | Skin Score, as 10 notas com o descritor do grau, confiança, idade aparente e avisos (variação grande, foto ruim, modelo de reserva) |
| Evolução | Gráfico do Skin Score, antes e depois com divisória arrastável, diferença por categoria e histórico |
| Rotina | Manhã e noite com checklist diário, últimos 7 dias, introdução gradual dos ativos e pausa após procedimento estético |
| Produtos | Kit indicado com preço de referência, motivo, outras opções e links de busca de preço; catálogo completo |
| Ajustes | Perfil, código de acesso, exportar e restaurar cópia, apagar todos os dados |

## Decisões

- **Dados só no aparelho.** Perfil, fotos e análises ficam no IndexedDB do celular; não há conta nem
  banco na nuvem. A foto passa pelo servidor e pela API da Anthropic só durante a análise e não é
  guardada. Isso reduz o risco LGPD (`docs/juridico/ripd.md`) e o custo. Em troca, trocar de celular
  exige a cópia de segurança (Ajustes → Exportar cópia).
- **iPhone:** o Safari pode apagar dados de sites não usados por 7 dias, mas não de apps adicionados à
  tela inicial. Por isso a tela inicial pede para instalar, e o app pede armazenamento persistente.
- **Código de acesso por convite.** A pessoa digita o `APP_TOKEN` na primeira vez (rota `GET /acesso`).
  O código não fica no código-fonte do app. O limite de 10 pedidos por minuto por IP vale também para a
  conferência do código.
- **Rotina e produtos por regras fixas** (`app/recomenda.js`), não pela IA. O servidor devolve só as
  notas validadas na etapa 5; o resto é determinístico e testado (`server/test/app.test.js`):
  - prioridade pelas piores notas, com peso para os objetivos escolhidos;
  - base: limpeza, hidratante e protetor pelo tipo de pele (informado, ou estimado pela foto);
  - até dois séruns, um por objetivo principal, pela opção mais barata do catálogo que serve;
  - gestação ou amamentação: sem retinoide e sem sérum com ácido salicílico;
  - pele sensível: sem sérum com salicílico ou glicólico; calmante no hidratante;
  - fototipos IV a VI: ácido azelaico antes da vitamina C para manchas; protetor com cor;
  - retinoide e ácido em noites alternadas; ativos entram na semana 3 e na semana 5
    (`docs/ingredientes-v1.md`, ordem de introdução);
  - procedimento estético registrado pausa os ativos pelo tempo de recuperação.
- **Funciona sem internet** para ver histórico, rotina e produtos (service worker). Só a análise precisa
  de conexão.

## Testado

- `npm test` em `server/`: 15 testes (servidor, rota de acesso, regras de rotina e produtos, catálogo igual
  ao de `docs/`).
- Fluxo completo no Chromium em tela de celular (390 × 844), com o Worker real e a IA simulada:
  primeira vez, código errado e certo, foto, análise, segunda análise, evolução, rotina com checklist,
  procedimento, produtos, exportar, apagar tudo e restaurar.
- Publicado em 06/10/2026 em https://my-skin-care.jr-airton.workers.dev e testado em iPhone e Android
  reais, com a IA de verdade (Claude Sonnet 5.5). O primeiro teste falhou por chave da Anthropic inválida
  na Cloudflare; desde então o servidor devolve a causa do erro e uma impressão da chave (começo, fim e
  tamanho) para o app mostrar.

## Próximos passos

1. ~~Publicar e definir o limite mensal de gasto na Anthropic.~~ Feito em 06/10/2026.
2. ~~Testar em iPhone e Android.~~ Feito.
3. Antes de abrir ao público: preencher as minutas de `docs/juridico/` (controlador, CNPJ, fornecedores)
   e trocar o texto de consentimento do app pela versão final; conferir os produtos na ANVISA.
4. App de loja (Expo) só se a validação de mercado (etapa 6) indicar demanda.
