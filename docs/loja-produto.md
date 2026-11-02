# MY Rosé Sculpt Cream — melhorias de produto e oferta

02/11/2026. Recomendações para o produto vendido em `loja/index.html`. Não substituem o formulador,
o responsável técnico nem a consulta à ANVISA.

## 1. Promessa e alegações

O que o produto promete define o enquadramento na ANVISA e o risco com o CDC.

- Fale em **aparência**: "melhora a aparência da celulite", "pele com aspecto mais firme". "Elimina
  celulite", "reduz medidas", "queima gordura", "drena" e "modela o corpo" soam terapêuticos e
  exigem outra categoria e outras provas.
- "Sculpt" no nome sugere modelar o corpo. Mantenha o nome só com o texto deixando claro que o efeito
  é na pele, ou avalie um nome sem essa leitura.
- Produto com alegação anticelulite ou firmadora é cosmético de **grau 2**: precisa de registro ou
  notificação conforme a categoria e de **comprovação de eficácia** de cada alegação.
- "Em 8 semanas", "dermatologicamente testado", "não testado em animais", "sem parabenos" e "vegano"
  precisam de laudo ou documento do fabricante. Sem a prova, o selo sai do site.

## 2. Fórmula

| Ativo | Para que serve | Observação |
|---|---|---|
| Cafeína | Ativo clássico para a aparência da celulite | Manter como ativo principal |
| Centella asiática | Firmeza e aspecto uniforme | Manter |
| Niacinamida | Textura e tom | Manter |
| Ácido hialurônico | Hidratação imediata | Dá o "efeito no primeiro uso" |
| Retinol (opcional) | É o ativo com melhor evidência para a textura da pele com uso longo | Só à noite, contraindicado na gestação, exige embalagem que proteja da luz e do ar. Decidir com o formulador |

Concentrações, estabilidade e compatibilidade entre os ativos são decisão do formulador, com testes.

## 3. Fragrância e textura

Nessa categoria, o perfume é o que faz a cliente recomendar e comprar de novo. Vale investir numa
**fragrância assinatura** própria (o campo `produto.fragrancia` do site está vazio esperando por ela)
e numa textura que absorva rápido sem deixar a pele pegajosa. Depois, um body splash com o mesmo
perfume aumenta o valor médio do pedido.

## 4. Embalagem e rendimento

- 200 g a 2 aplicações por dia rende cerca de 4 semanas. A promessa é de 8 semanas, então o
  **kit de 2 potes é o tratamento completo**. O site agora mostra isso em cada kit (4, 8 e 12 semanas).
- O pote é bonito e fácil de reconhecer. Se entrar retinol, troque por embalagem airless ou bisnaga.

## 5. Oferta

- **Brinde de massagem** (luva ou massageador) no kit de 3: a massagem é metade do resultado e
  diferencia o kit. No site, basta incluir em `extras` do kit.
- **Assinatura** a cada 4 semanas com desconto (por exemplo, 10%), para quem já está no ritual.
- **Garantia de satisfação de 30 dias**, além dos 7 dias de arrependimento do CDC. Reduz o medo de
  comprar um produto de R$ 197; o custo é a devolução de quem não gostou. Decisão de negócio.

## 6. Provas para o site

Os blocos de resultados, antes e depois e depoimentos estão vazios até haver dados reais.

1. **Teste de percepção** com laboratório ou instituto: por exemplo, 30 ou mais voluntárias usando
   2× ao dia por 8 semanas, com questionário no início e no fim. Os percentuais vão para `resultados`.
2. **Fotos de antes e depois** com protocolo: mesma luz, mesma distância, mesmo ângulo e mesma roupa,
   com termo de autorização de uso de imagem. A checagem de qualidade de foto do MY Skin AI (luz,
   sombra, nitidez) pode ser reaproveitada para padronizar essas fotos.
3. **Depoimentos** só de clientes reais, com autorização; nome abreviado e idade.

## 7. Antes de publicar a loja

- Foto real do pote em `produto.foto` e a lista INCI em `produto.inci`.
- Links de pagamento por kit em `kits[].link` (Mercado Pago, PagSeguro ou outro). Sem link, o pedido
  segue pelo WhatsApp.
- Endereço, e-mail e telefone em `empresa`, exigidos para venda online (Decreto 7.962/2013), e as
  páginas de política de privacidade e termos de uso em `links`.
- IDs do Meta Pixel e do Google Analytics em `rastreamento`, se for anunciar. Eles só carregam depois
  que a visitante aceita os cookies.
- Hospedagem com domínio próprio (por exemplo, GitHub Pages ou Netlify, que servem a pasta `loja/`).
