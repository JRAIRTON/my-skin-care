# Site do MY Skin Care (www.myskincareapp.com.br)

Página de apresentação do app: o que faz, como funciona, recursos, planos, dúvidas, Termos e
Privacidade. É um Worker da Cloudflare separado do app (`my-skin-care`, pasta `server/`), com o nome
`myskincare-site`. Os botões "Abrir o app" levam ao app em https://app.myskincareapp.com.br/.

| Arquivo | O que é |
|---|---|
| `public/index.html` e `public/estilo.css` | A página, na paleta do app (creme, nude e café), com o logo "myskin care" da Direção 04 em texto (círculo de foco no i), em claro e escuro |
| `scripts/marca_site.mjs` | Gera os ícones (símbolo "my" no visor, nas cores da paleta) e a prévia `img/og.png` com o site rodando localmente |
| `public/lojas.js` | Endereços da App Store e do Google Play: vazios mostram "Em breve" |
| `public/site.js` | Liga os botões das lojas na página inicial |
| `public/baixar.html` | `/baixar`, o link da imagem de evolução do app: leva o celular à loja ou, sem loja, ao site |
| `public/termos.html` e `public/privacidade.html` | Geradas por `python3 scripts/gera_juridico.py`; não editar à mão |
| `public/video/app.mp4` | Vídeo do app (dados fictícios) dentro do celular do topo; toca sem som, em loop, e não toca para quem pediu menos movimento |
| `public/depoimentos.js` | Depoimentos reais e autorizados; lista vazia esconde a seção (regras em `docs/depoimentos.md`) |
| `public/img/` | Telas do app com dados fictícios ("Ana") e `og.png`, a prévia ao compartilhar o link |
| `worker.js` | Redireciona `myskincareapp.com.br` para `www.` e põe os cabeçalhos de segurança |
| `wrangler.toml` | Nome do Worker e os dois endereços do domínio |

## Publicar pela primeira vez

1. **Registrar o domínio** `myskincareapp.com.br` no [registro.br](https://registro.br) (com o CPF,
   cerca de R$ 40 por ano), se ainda não estiver registrado.
2. **Pôr o domínio na Cloudflare:** no painel, **Add a domain** (ou "Adicionar domínio"), digitar
   `myskincareapp.com.br` e escolher o plano **Free**. A Cloudflare mostra dois *nameservers*
   (algo como `xxx.ns.cloudflare.com`). No registro.br, em **Domínios → myskincareapp.com.br → DNS →
   Alterar servidores DNS**, troque pelos dois da Cloudflare. Pode levar de minutos a algumas horas;
   a Cloudflare avisa por e-mail quando o domínio estiver ativo.
3. **Publicar o site**, de um dos dois jeitos:
   - **Automático pelo GitHub (recomendado):** no painel, **Workers & Pages → Create → Import a
     repository**, escolher `jrairton/my-skin-care`, **Root directory** `site`, **Deploy command**
     `npx wrangler deploy`. A cada mudança no branch escolhido, o site é publicado de novo.
   - **Pelo computador:** `cd site && npx wrangler deploy` (com o `wrangler login` já feito).

   A publicação liga os dois endereços (`www.myskincareapp.com.br` e `myskincareapp.com.br`) e
   cria o certificado HTTPS sozinha. Se der erro de domínio, o passo 2 ainda não terminou.
4. **Conferir:** abrir https://www.myskincareapp.com.br e https://myskincareapp.com.br (deve ir para
   o com www). Para testar a prévia do link, colar o endereço numa conversa do WhatsApp.

## Depois

- **Lojas publicadas:** preencher os endereços em `public/lojas.js` (e em `app/baixar.js`).
- **Fichas das lojas:** dá para usar `https://www.myskincareapp.com.br/privacidade` como endereço da
  política de privacidade e o site como "site de marketing".
- **Google:** cadastrar o site no [Google Search Console](https://search.google.com/search-console)
  e enviar o `sitemap.xml`, para aparecer nas buscas mais rápido.
- **Preços ou textos mudaram no app:** atualizar a seção de planos e as dúvidas em `index.html`.

## Trocar imagens, vídeo ou ícones

O site manda o navegador guardar imagens e ícones por 7 dias. Ao substituir um arquivo de `img/`, `icones/` ou
`video/`, troque também o número de versão (`?v=AAAAMMDD`) nos endereços em `public/*.html` (e no
`scripts/gera_juridico.py`), senão quem já visitou continua vendo o arquivo antigo.
