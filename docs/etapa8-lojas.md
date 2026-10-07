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
- Primeira tela do app e Ajustes com o responsável, o e-mail e os links.

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
