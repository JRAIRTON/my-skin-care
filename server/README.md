# Servidor de análise do MY Skin AI

Cloudflare Worker que recebe a foto do rosto e devolve as notas do Método MY Skin v1, analisadas pelo
Claude Sonnet 5.5. O mesmo Worker serve o app web da pasta `../app` (ver `docs/etapa7-app-web.md`):
um só endereço para o app e a análise. É o mesmo pedido e o mesmo schema validados na etapa 5
(`docs/etapa5-conclusao.md`). A chave da Anthropic fica só no servidor, nunca no app.

## Rotas

| Rota | O que faz |
|---|---|
| `GET /` e demais arquivos | O app web (pasta `../app`) |
| `GET /saude` | Responde `{"ok": true, "modelo": "claude-sonnet-5-5"}` |
| `GET /acesso` | Confere o código de acesso (`Authorization: Bearer <APP_TOKEN>`): `200` ou `401` |
| `POST /analise` | Analisa uma foto |

`POST /analise` pede:

- cabeçalho `Authorization: Bearer <APP_TOKEN>`;
- cabeçalho `Content-Type: image/jpeg`, `image/png` ou `image/webp`;
- a foto no corpo, como bytes, com até 5 MB.

Resposta `200`:

```json
{
  "notas": {"textura": {"grau": 1, "nota": 82}, "...": {}},
  "skin_score": 80,
  "confianca": "media",
  "idade_aparente": 32,
  "modelo": "claude-sonnet-5-5",
  "tokens": {"entrada": 5755, "saida": 304}
}
```

- **Categoria sem avaliação:** quando a categoria não pode ser avaliada na foto (por exemplo, área
  coberta por barba), ela vem com `grau` e `nota` em `null`.
- **Skin Score:** é a média das notas avaliadas, com o mesmo arredondamento do protótipo.
- **Modelo:** só muda se o Sonnet 5.5 recusar a foto e outro modelo responder no lugar, pela
  recuperação automática da API. Esse modelo não foi validado, então trate o resultado como
  provisório.

Erros: `401` (token inválido), `413` (foto acima de 5 MB), `415` (formato não aceito), `422` (a IA não
analisou a foto), `429` (mais de 10 análises por minuto no mesmo IP), `502` e `503` (falha ou sobrecarga
da IA).

## Publicar (primeira vez)

Precisa de uma conta gratuita na Cloudflare e de Node 20 ou mais novo.

```bash
cd server
npm install
npx wrangler login                        # abre o navegador para entrar na Cloudflare
npx wrangler secret put ANTHROPIC_API_KEY # cola a chave da Anthropic quando pedir
npx wrangler secret put APP_TOKEN         # cola uma senha longa e aleatória (ver abaixo)
npm run deploy                            # mostra o endereço, ex.: https://my-skin-care.<conta>.workers.dev
```

O endereço mostrado é o do app: é ele que você manda para quem vai testar, junto com o código de acesso
(`APP_TOKEN`). O app pede o código na primeira vez que é aberto.

Gerar o código de acesso: `openssl rand -hex 8` (curto o bastante para digitar no celular; o limite de
10 tentativas por minuto impede adivinhar). O código não fica no código-fonte do app: cada pessoa digita
o seu na primeira vez. Se vazar, troque com `npx wrangler secret put APP_TOKEN` e mande o novo para
quem testa (o app pede de novo quando o antigo deixa de valer).

Teste depois de publicar:

```bash
curl https://my-skin-care.<conta>.workers.dev/saude
curl -X POST -H "Authorization: Bearer <APP_TOKEN>" -H "Content-Type: image/jpeg" \
  --data-binary @foto.jpg https://my-skin-care.<conta>.workers.dev/analise
```

## Controle de gasto

- Cada análise custa cerca de US$ 0,015 (cerca de 5.800 tokens de entrada e 300 de saída).
- O servidor limita a 10 análises por minuto por IP. Para mudar, edite `[[ratelimits]]` em
  `wrangler.toml`.
- **Defina um limite mensal de gasto** no Console da Anthropic (Settings → Limits). É a proteção que
  garante um teto mesmo se a senha do app vazar.

## Chamar pelo navegador

O app da pasta `../app` usa o mesmo endereço e não precisa de liberação. Outros sites só chamam o
servidor se o endereço deles estiver em `ORIGENS_PERMITIDAS` no `wrangler.toml` (separados por vírgula).
Apps nativos (iOS, Android) não precisam disso.

O protótipo (`prototipo/index.html`) roda dentro do claude.ai e continua usando a IA do claude.ai.

## Desenvolvimento

```bash
npm test                     # testes do servidor e das regras do app, sem chamar a IA
printf 'ANTHROPIC_API_KEY=...\nAPP_TOKEN=teste\n' > .dev.vars   # fica fora do Git
npm run dev                  # app e servidor locais em http://localhost:8787
```

**Mudou o pedido ou o schema em `scripts/etapa5_validacao.py`?** Rode `npm run metodo` para regenerar
`src/metodo.json`. Qualquer mudança no pedido precisa de uma nova validação (etapa 5) antes de ir para o
app.

**Mudou o catálogo (`docs/catalogo-v1.json`)?** Copie para `app/catalogo.json` (um teste confere que os
dois são iguais), dê classe a qualquer sérum novo em `app/recomenda.js` e troque `VERSAO` em
`app/sw.js` para os celulares baixarem a versão nova.

## Registros de acesso (Marco Civil, art. 15)

Cada pedido que chega ao servidor grava data e hora (UTC), IP, rota e status no banco D1
`myskin-registros` (nunca a foto nem o código de acesso). Uma tarefa diária, às 06:17 UTC, apaga o que
tiver mais de 183 dias. O banco é criado sozinho na primeira publicação; `GET /saude` mostra
`"registros": true` quando ele está ligado.

Para atender a uma ordem judicial, no painel da Cloudflare: **Storage & databases → D1 →
myskin-registros → Console**, e rode, trocando o IP e as datas:

```sql
SELECT quando, ip, rota, status FROM acessos
WHERE ip = '200.1.2.3' AND quando BETWEEN '2026-10-01' AND '2026-10-31'
ORDER BY quando;
```

A Cloudflare não repassa ao Worker a porta de origem do aparelho, então ela não é registrada.

## Quem pode analisar

| Acesso | Como o app se identifica | Limite |
|---|---|---|
| Código de convite | `Authorization: Bearer <APP_TOKEN>` | Sem limite (testes, convidados) |
| Primeira análise grátis | `X-Usuario: <id>` (aleatório, criado pelo app na instalação) | 1 por aparelho e no máximo 3 por IP por dia; só é gasta se a análise der certo |
| Assinatura | `X-Usuario: <id>`, o mesmo id usado no RevenueCat | Sem limite enquanto o direito `premium` estiver ativo |

Sem código, sem análise grátis disponível e sem assinatura ativa, `POST /analise` responde `402`
(`"causa": "assinatura"`) e o app abre a tela de planos. Se o RevenueCat não responder, `503`.

Segredos a mais para a assinatura (painel da Cloudflare → Worker → Settings → Variables and Secrets,
tipo **Secret**):

- `REVENUECAT_API_KEY`: chave **secreta** da API do RevenueCat (começa com `sk_`). Sem ela, só valem o
  código de convite e a análise grátis.
- `ENTITLEMENT` (opcional): nome do direito no RevenueCat; o padrão é `premium`.

Os testadores de licença da App Store e do Google Play compram em ambiente de teste, sem cobrança, e
o RevenueCat marca a assinatura deles como ativa.

A tabela `gratis` do banco D1 guarda o id do aparelho que usou a análise grátis e o IP, que a tarefa
diária apaga depois de 2 dias.
