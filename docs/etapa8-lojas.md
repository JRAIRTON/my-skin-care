# Etapa 8 — Abertura ao público e lojas (App Store e Google Play)

07/10/2026. Os testes em iPhone e Android reais foram feitos na etapa 7. Esta etapa prepara o app para
o público e para as lojas.

## Decisões

| Item | Decisão |
|---|---|
| Responsável legal e desenvolvedor nas lojas | Airton Carvalho Junior, CNPJ 38.828.428/0001-08, Foz do Iguaçu (PR) |
| Atendimento e encarregado de dados (LGPD) | Airton Carvalho Junior · myskincare.ia.sac@gmail.com |
| Endereço | Só cidade e estado nos documentos públicos; o endereço completo vai apenas nos cadastros das lojas |
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

**Do responsável (levam dias, podem começar já):**

1. Conferir no cartão do CNPJ se há atividade (CNAE) que cubra software ou serviços de internet; se for
   MEI, confirmar com o contador se pode faturar com o app.
2. Pedir o número D-U-N-S da empresa (grátis, 5 a 14 dias).
3. Criar a conta Apple Developer como organização (US$ 99 por ano) e a Google Play Console como
   organização (US$ 25, uma vez).
4. Assinar o RIPD (`docs/juridico/ripd.md`, item 6).

**Técnicas:**

1. Guardar os registros de acesso ao servidor por 6 meses (Marco Civil, art. 15); hoje não são guardados.
2. Confirmar nos termos comerciais da Anthropic o prazo de retenção dos pedidos.
3. Trocar o código de acesso único pela assinatura: primeira análise grátis por aparelho, depois o
   servidor confere a assinatura no RevenueCat.
4. Projeto Capacitor (iOS e Android), câmera nativa, ícones e telas de abertura; build de iPhone por
   Mac com Xcode ou serviço na nuvem (por exemplo, Codemagic).
5. Fichas das lojas: descrição, capturas de tela, classificação etária, declaração de privacidade
   (App Privacy e Data safety) e declaração de app de saúde no Google Play, sem alegações médicas.
6. Testar a análise com fototipos IV a VI antes do lançamento (RIPD).
7. Conferir a regularização dos produtos do catálogo na ANVISA.
