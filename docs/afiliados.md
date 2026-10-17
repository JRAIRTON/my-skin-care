# Links de afiliados

17/10/2026. Os botões de compra dos produtos (Mercado Livre, Amazon, farmácias) podem levar os
códigos de programas de afiliados: quem compra pelo link gera comissão para o app, sem pagar mais.

## Como funciona no app

- Os códigos ficam em `app/afiliados.js`. **Código vazio = link comum**, como antes.
- Com algum código preenchido, o app passa a mostrar sozinho o aviso de parceria (na tela de
  produtos e no "Antes de começar"), põe as lojas parceiras primeiro e marca os links como
  patrocinados (`rel="sponsored"`). O Google Shopping fica sempre no fim, para comparar preços.
- **A comissão nunca entra na escolha dos produtos:** `recomenda.js` não lê `afiliados.js` (há um
  teste que confere). Isso protege o principal diferencial do app, a independência de marca.
- Termos de Uso e Política de Privacidade (versão 3) já cobrem os links de parceiros. O parecer
  (`docs/juridico/parecer-enquadramento.md`, item 6) pede identificar a parceria, seguindo o CONAR.

## Passo a passo

Cadastre-se com o mesmo CPF das lojas de apps e declare as comissões no carnê-leão (como a receita das
lojas, `docs/etapa8-lojas.md`). Ao cadastrar, informe o site
`https://my-skin-care.jr-airton.workers.dev` e, depois de publicado, os links do app nas lojas.

1. **Amazon Associados** (associados.amazon.com.br): depois de aprovado, copie o "ID de
   rastreamento" (termina em `-20`) para `amazon`. A Amazon costuma exigir **3 vendas nos primeiros 180 dias**
   para manter a conta (conferir as regras no cadastro).
2. **Mercado Livre Afiliados** (mercadolivre.com.br/afiliados): gere um link no painel e copie os
   valores de `matt_tool` e `matt_word` que aparecem no endereço para `mercadoLivre`.
3. **Awin** (awin.com, para farmácias e lojas de beleza): copie o seu ID de publisher para `awin`.
   Peça para entrar nos programas das lojas de `LOJAS_AWIN`; quando aprovado, preencha o `awinmid`
   da loja (fica na página do programa). Antes de ativar, abra o endereço de busca da loja e confira
   se ainda funciona. Para somar outra loja, acrescente uma linha com nome, `awinmid` e endereço de
   busca.

Depois de preencher: rodar os testes (`cd server && npm test`), publicar o servidor
(`npx wrangler deploy`, que publica a pasta `app/`) e compilar de novo os apps das lojas.

## Acompanhar

Os painéis de cada programa mostram cliques, vendas e comissão. Verifique uma vez por mês qual loja
converte melhor; se alguma não vender nada em 3 meses, retire-a para deixar a tela mais limpa.
