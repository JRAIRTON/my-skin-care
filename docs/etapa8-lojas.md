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
| Empacotamento | Capacitor sobre o app web atual (`app/`), com câmera nativa; o mesmo servidor de `server/` |

O preço é uma estimativa (a validação de mercado, etapa 6, foi pulada). Acompanhar quantos fazem a
análise grátis e quantos assinam; se a conversão for baixa, testar R$ 14,90.

## Feito

- Documentos jurídicos versão 2 (`docs/juridico/`): termos de uso, política de privacidade, termo de
  consentimento e RIPD preenchidos e reescritos para o app real (dados só no aparelho, sem conta, foto
  só em trânsito pelo servidor e pela Anthropic).
- Termos e política publicados no app: `/termos.html` e `/privacidade.html`, gerados por
  `python3 scripts/gera_juridico.py` a partir de `docs/juridico/`. **O endereço da política para as
  lojas é** https://my-skin-care.jr-airton.workers.dev/privacidade.html.
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
