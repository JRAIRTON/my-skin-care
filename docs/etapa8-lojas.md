# Etapa 8 — Abertura ao público e lojas (App Store e Google Play)

07/10/2026. Os testes em iPhone e Android reais foram feitos na etapa 7. Esta etapa prepara o app para
o público e para as lojas.

## Decisões

| Item | Decisão |
|---|---|
| Responsável legal e desenvolvedor nas lojas | **Airton Carvalho Junior, pessoa física (CPF)**, Foz do Iguaçu (PR), para a fase de testes nas lojas (decisão de 07/10/2026). O CNPJ existente fica de fora porque só tem atividades de comércio varejista |
| Atendimento e encarregado de dados (LGPD) | Airton Carvalho Junior · myskincare.ia.sac@gmail.com |
| Endereço | Só cidade e estado nos documentos públicos; o endereço completo vai apenas nos cadastros das lojas |
| Imposto | Receita das lojas (vem do exterior) declarada no carnê-leão, pela tabela do IR da pessoa física |
| Preço | R$ 19,90 por mês ou R$ 129,90 por ano, renovação automática; **primeira análise grátis**, sem período de teste |
| Cobrança | Pela loja (obrigatório para assinatura digital), com RevenueCat para unificar iPhone e Android e o servidor conferir a assinatura |
| Nome do app | **MY Skin Care** no aparelho e no app; nas lojas, **"MY Skin Care: Análise de Pele"** (decisão de 17/10/2026). "MY Skin" sozinho já existe na App Store; o nome da loja precisa ser único e só se confirma ao criar o app no App Store Connect. O id `br.com.myskin.app` e o endereço do site não mudam |
| Empacotamento | Capacitor sobre o app web atual (`app/`), com câmera nativa; o mesmo servidor de `server/` |

O preço é uma estimativa (a validação de mercado, etapa 6, foi pulada). Acompanhar quantos fazem a
análise grátis e quantos assinam; se a conversão for baixa, testar R$ 14,90.

## Feito

- Documentos jurídicos versão 2 (`docs/juridico/`): termos de uso, política de privacidade, termo de
  consentimento e RIPD preenchidos e reescritos para o app real (dados só no aparelho, sem conta, foto
  só em trânsito pelo servidor e pela Anthropic).
- Termos e política publicados no app: `/termos.html` e `/privacidade.html`, gerados por
  `python3 scripts/gera_juridico.py` a partir de `docs/juridico/`. **O endereço da política para as
  lojas é** https://www.myskincareapp.com.br/privacidade (a mesma política também fica no app, em
  https://app.myskincareapp.com.br/privacidade.html).
- Primeira tela do app e Ajustes com a marca MY Skin, o e-mail e os links; o nome do responsável fica só
  nos Termos e na Política, onde a LGPD exige (decisão de 09/10/2026, após a revisão de textos do app).
- Revisão de textos e telas (PDF de 09/10/2026): texto de boas-vindas que valoriza o resultado; "Antes de
  começar" em tópicos (primeiro passo, como funciona, o que saber, seus dados); aviso da foto diz quais
  itens estão razoáveis; explicação de que o Skin Score é a média das notas; resumo da avaliação com a
  idade aparente e o foco; instruções de uso da rotina; passo feito em verde em vez de riscado; efeito
  do registro de procedimento; desenho por categoria nos produtos; texto do "Seu foco agora";
  explicação do arquivo .json da cópia.
- Melhorias de uso (10/10/2026): câmera guiada com contorno do rosto e leitura da luz ao vivo (volta à
  câmera do sistema se não houver suporte; permissão CAMERA no Android); comparação automática com a
  foto anterior no resultado; explicação de cada nota (o que é e o que ajuda); sequência de dias da
  rotina; rotina do período atual em destaque; lembrete da nova foto no calendário (.ics); "Já tenho
  este" nos produtos, que tira o item do custo do kit; tela de planos com o resultado da pessoa, prévia
  bloqueada da evolução e o anual como melhor custo. Notificações de verdade entram no app das lojas.
- Compartilhar evolução (10/10/2026): imagem gerada no aparelho (stories 1080×1920 ou post 1080×1350)
  com a nota antes e agora, o que mais melhorou, os dias seguidos de rotina e o link do app; sem foto
  por padrão, com aviso quando a pessoa escolhe incluir as fotos.
  No rodapé, um "botão" desenhado com o logo ("Baixe o app MY Skin"); a imagem não tem clique, então o
  link para `/baixar` vai no texto da mensagem compartilhada (clicável no WhatsApp e no Facebook). O QR
  Code foi testado e retirado (decisão de 10/10/2026).
  Ao compartilhar ou salvar, o app também copia o link `/baixar` para colar no adesivo de link do Stories
  do Instagram, e há o botão "Copiar só o link do app".
- Aviso de sérum novo (18/10/2026): o resultado da análise lista os séruns que vão começar e quando, com "Ver onde
  comprar"; até 5 dias antes, a tela inicial pergunta se a pessoa já tem o produto ("Já tenho" ou "Ver onde comprar").
- Rotina depois da 1ª análise (18/10/2026): um ativo que entra por uma nova análise (ou volta depois de sair)
  só começa 2 semanas depois dela (4 para o segundo, se entrarem juntos), além do calendário de sempre
  (dia 15 e dia 29); regra em `app/recomenda.js` (`liberaAtivo`, `entradaDosAtivos`). Com a última análise
  com 4 semanas ou mais, a tela de rotina mostra o lembrete "Sua pele pode ter mudado" com o botão de nova análise.
- Métricas de uso (18/10/2026): o app conta, sem identificar ninguém, aberturas, aceite dos termos, 1ª análise,
  análise grátis, planos vistos, toque em assinar, assinatura, compartilhamento e cliques em lojas. Painel em
  https://app.myskincareapp.com.br/metricas, com o código de acesso (`APP_TOKEN`). Política na versão 4.
- Android sem cópia de segurança automática (18/10/2026): `allowBackup="false"`, para as fotos não irem ao
  Google Drive sem a pessoa pedir.
- Endereço do app no domínio próprio (17/10/2026): https://app.myskincareapp.com.br (rota em
  `server/wrangler.toml`), sem o nome da conta. O endereço workers.dev continua no ar por enquanto: os dados
  de cada pessoa ficam no navegador e são separados por endereço, e os apps de teste já instalados chamam
  o servidor por ele. Desligar só depois de avisar os testadores (Ajustes → Exportar cópia, no endereço
  antigo, e importar no novo) e de um novo build dos apps das lojas.
- Link da imagem compartilhada (17/10/2026): agora é https://www.myskincareapp.com.br/baixar, a página `/baixar`
  do site (`site/public/baixar.html`), que leva o celular à loja ou, sem loja, à página inicial do site; o
  endereço também vai escrito na imagem. Ao publicar nas lojas, preencher `site/public/lojas.js`.
- Página `/baixar` (`app/baixar.html` e `app/baixar.js`): manda o iPhone para a App Store e o Android
  para o Google Play. **Ao publicar nas lojas, preencher os dois endereços em `LOJAS` de
  `app/baixar.js`**; até lá, mostra o botão para abrir o app pelo navegador.
- Links de afiliados (17/10/2026): botões de compra prontos para os códigos da Amazon, do Mercado
  Livre e de farmácias pela Awin, com aviso de parceria automático; Termos e Política na versão 3.
  Falta o cadastro nos programas (`docs/afiliados.md`).
- Fotos dos produtos: ficam de fora por enquanto (decisão de 09/10/2026); os cards usam o desenho da
  categoria. Copiar ou linkar as fotos dos sites das marcas tem risco autoral. Se voltar ao tema: fotos
  próprias dos produtos ou autorização das marcas (kit de imprensa).

## Pendências

**Do responsável (podem começar já):**

1. Abrir o carnê-leão (Receita Federal, gov.br) e declarar todo mês o que as lojas pagarem; confirmar
   com o contador.
2. Criar a conta Apple Developer como **pessoa física** (US$ 99 por ano; não precisa de D-U-N-S) e a
   Google Play Console como **conta pessoal** (US$ 25, uma vez). Na conta pessoal do Google, apps novos
   precisam de um **teste fechado com pelo menos 12 pessoas por 14 dias seguidos** antes de ir ao
   público; conferir as regras atuais na hora do cadastro.
3. Assinar o RIPD (`docs/juridico/ripd.md`, item 6).

**Se a receita crescer (passar para o CNPJ):** a carga do IR da pessoa física chega a 27,5%; no CNPJ,
no Simples Nacional, a alíquota inicial para software costuma ficar perto de 6%. Para isso:

- **Incluir no CNPJ uma atividade de software (indispensável antes de receber pelo CNPJ).** Cadastro
  estadual consultado em 07/10/2026: atividade principal 4772-5/00 (comércio varejista de cosméticos)
  e secundárias de comércio varejista de vestuário, calçados, joias e relógios, todas de venda de
  mercadorias (ICMS). Nenhuma cobre assinatura de app, que é serviço ou licença de software (ISS).
  Levar ao contador: incluir 6203-1/00 (licenciamento de programas não customizáveis) e, se ele
  indicar, 6319-4/00 (serviços de informação na internet); fazer a inscrição municipal em Foz do
  Iguaçu para o ISS; confirmar o regime tributário (o cadastro estadual mostra "regime normal") e se
  ainda é MEI, pois o MEI não pode ter essas atividades.
- Pedir o número D-U-N-S e migrar as contas das lojas para organização (as lojas permitem transferir
  o app).

**Técnicas:**

1. ~~Guardar os registros de acesso ao servidor por 6 meses (Marco Civil, art. 15).~~ Feito em
   07/10/2026: banco D1 `myskin-registros` com data e hora (UTC), IP, rota e status de cada pedido;
   tarefa diária apaga o que passar de 183 dias. A Cloudflare não repassa ao Worker a porta de origem
   do aparelho; se uma ordem judicial exigir, informar isso. Consulta em `server/README.md`.
2. Confirmar nos termos comerciais da Anthropic o prazo de retenção dos pedidos.
3. ~~Trocar o código de acesso único pela assinatura.~~ Feito em 07/10/2026 no servidor e no app web:
   código de convite opcional (sem limite), primeira análise grátis por aparelho (no máximo 3 por IP
   por dia) e, depois, assinatura conferida no RevenueCat; tela de planos no app. A compra em si
   (plugin do RevenueCat) entra com o projeto Capacitor; o app web mostra os planos sem botão de compra.
   Testadores do teste fechado: testadores de licença das lojas, sem cobrança.
4. ~~Projeto Capacitor.~~ Feito em 08/10/2026 em `mobile/` (Capacitor 8, id `br.com.myskin.app`,
   nome MY Skin): projetos iOS e Android gerados, ícones, textos de permissão da câmera em português,
   compra pelo RevenueCat (`app/nativo.js`, chave pública de teste por enquanto) e chamadas ao servidor
   pelo endereço completo (CORS liberado para o app). A câmera usa o seletor de fotos do sistema (o
   mesmo campo de arquivo do app web); trocar pelo plugin de câmera só se o teste em aparelho pedir.
   Compilação na nuvem pelo Codemagic (`codemagic.yaml`); falta configurar (seção abaixo) e testar em
   aparelho.
5. Fichas das lojas: descrição, capturas de tela, classificação etária, declaração de privacidade
   (App Privacy e Data safety) e declaração de app de saúde no Google Play, sem alegações médicas.
6. Testar a análise com fototipos IV a VI antes do lançamento (RIPD).
7. Conferir a regularização dos produtos do catálogo na ANVISA.

## Compilar os apps (Codemagic)

O Codemagic compila na nuvem, sem Mac: iOS para o TestFlight e Android para o teste interno do Google
Play. O plano gratuito tem minutos de Mac por mês suficientes para os testes. Passos (depois das contas
Apple Developer e Google Play aprovadas):

1. Criar conta em codemagic.io com o GitHub e adicionar o repositório `my-skin-care` (ele lê o
   `codemagic.yaml` da raiz).
2. **iOS:** no App Store Connect, criar o app com o id `br.com.myskin.app` e uma chave de API
   (Users and Access → Integrations → App Store Connect API, papel App Manager). No Codemagic, em
   Team settings → Integrations → Developer Portal, cadastrar a chave com o nome `myskin_asc`; em
   Code signing identities, deixar o Codemagic gerar o certificado e o perfil de distribuição.
3. **Android:** no Codemagic, em Code signing identities → Android keystores, gerar uma chave com o
   nome `myskin_upload` (guardar uma cópia: sem ela não dá para atualizar o app). No Play Console, criar
   o app, e no Google Cloud uma conta de serviço com acesso ao Play Console; salvar o JSON no Codemagic
   como variável `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS` no grupo `google_play`. A primeira versão do
   Android tem de ser enviada à mão no Play Console (o AAB fica nos artefatos do build).
4. Rodar os workflows `android` e `ios`.
5. No RevenueCat, ligar as lojas (Project settings → Apps) e trocar as chaves `test_` de
   `app/nativo.js` pelas chaves públicas `appl_` e `goog_`.

O id `br.com.myskin.app` não pode ser trocado depois do primeiro envio às lojas.

## Teste grátis, Plano Família e "Indique uma amiga" (18/10/2026)

O app e o servidor já estão prontos; falta configurar nas lojas e no RevenueCat.

**Escondido por enquanto (decisão de 18/10/2026):** até a configuração abaixo, as três novidades não aparecem
no app nem no site. Para ligar: `NOVIDADES = true` em `app/app.js` e em `site/public/site.js`, e devolver os
planos da família ao JSON-LD de `site/public/index.html`. Testadores com código de convite já veem os perfis
da família no app.

**Produtos nas lojas** (Google Play Console → app → Monetizar com o Google Play → Produtos → Assinaturas;
App Store Connect → app → Assinaturas, no mesmo grupo de assinaturas):

| ID do produto | Plano | Preço | Teste grátis |
|---|---|---|---|
| `myskincare_mensal` | mensal, renovação automática | R$ 19,90 | não |
| `myskincare_anual` | anual, renovação automática | R$ 129,90 | **7 dias** (oferta introdutória "teste gratuito") |
| `myskincare_familia_mensal` | mensal, renovação automática | R$ 29,90 | não |
| `myskincare_familia_anual` | anual, renovação automática | R$ 199,90 | **7 dias** |

No Google Play, o teste é uma "oferta" no plano básico (fase gratuita de 7 dias, para novos clientes). Na
Apple, é uma "oferta introdutória" do tipo "teste gratuito" de 1 semana. As lojas só dão o teste uma vez
por conta; o app só mostra "7 dias grátis" quando a loja oferece o teste para aquela pessoa.

**RevenueCat:**

1. Product catalog → Products: importar os 4 produtos de cada loja.
2. Entitlements: `myskincare_pro` com **os 4 produtos** (libera as análises; o servidor confere este) e
   `myskincare_familia` só com os 2 da família (libera até 4 perfis no aparelho).
3. Offerings → `default` (current): pacotes `$rc_monthly` (mensal), `$rc_annual` (anual), e dois pacotes
   personalizados com os identificadores `familia_mensal` e `familia_anual`.
4. Project settings → API keys: a chave do servidor (`npx wrangler secret put REVENUECAT_API_KEY`) tem de ser
   **secreta (sk_)**, com permissão de escrita em "customer information": o "indique uma amiga" dá os meses
   grátis como *promotional entitlements* pela API.

**Plano Família:** perfis no mesmo aparelho (o compartilhamento familiar da Apple não existe no Google Play,
por isso não é usado). Cada perfil passa pelo próprio aceite dos termos e da autorização de uso da foto.
Testadores com código de convite também podem criar perfis.

**Indique uma amiga:** servidor em `POST/GET /indicacao` (`server/src/index.js`), página do link em
`site/public/convite.html` (`www.myskincareapp.com.br/convite?c=CODIGO`). Regras nos Termos (versão 4):
amiga ganha 1 mês ao usar o código; quem convidou ganha 1 mês quando a amiga paga (máx. 12 por ano); um
convite por aparelho; até 2 usos por internet a cada 30 dias. O painel de métricas conta "Enviaram convite"
e "Usaram convite de amiga".

## Logo novo no app (18/10/2026)

Logo "myskin care" da Direção 04 nas cores da paleta creme/nude/café: no topo do app, na página `/baixar` e na
imagem de evolução compartilhada (desenhada no aparelho); o símbolo "my" no visor na tela de boas-vindas.
Ícones e telas de abertura novos (antes a abertura era o logo padrão do Capacitor): as fontes ficam em
`mobile/assets/` (geradas por `node scripts/marca_app.mjs`, com o site rodando em localhost:8787) e viram os
arquivos de Android e iPhone com:

    cd mobile && npx @capacitor/assets generate --ios --android --iconBackgroundColor '#3B2A22' \
      --iconBackgroundColorDark '#3B2A22' --splashBackgroundColor '#F7F2EC' --splashBackgroundColorDark '#17110E'

O ícone nas fichas das lojas (512×512) é `app/icones/icone-512.png`. Os apps instalados mudam no próximo build do Codemagic.
