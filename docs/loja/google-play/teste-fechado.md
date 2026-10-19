# Teste fechado no Google Play

Conta pessoal nova: o Google só libera o app ao público depois de um teste fechado com **pelo menos 12
testadores** que fiquem inscritos **14 dias seguidos**. Convidar 15 a 20 pessoas, porque sempre alguém
esquece de aceitar ou desinstala.

## 0. Ordem certa (por causa da cobrança)

O Google exige que a assinatura seja cobrada pelo Google Play. Com a chave `test_` do RevenueCat, a compra
abre a "loja de teste" do RevenueCat, e isso pode reprovar a revisão. Mas as assinaturas só podem ser
criadas no Play Console depois de enviar um primeiro AAB. Por isso:

1. Build no Codemagic e envio do AAB ao **teste interno** (Testar e lançar → Teste → Teste interno). O
   teste interno não passa por revisão e já libera a criação das assinaturas. Colocar o próprio e-mail
   como testador e instalar para conferir.
2. Criar as assinaturas `myskincare_mensal` (R$ 19,90) e `myskincare_anual` (R$ 129,90) em
   Monetizar com o Google Play → Produtos → Assinaturas (tabela em `docs/etapa8-lojas.md`).
3. RevenueCat: ligar o app do Google Play (Project settings → Apps → Play Store, com o JSON da conta de
   serviço), importar os produtos, entitlement `myskincare_pro`, offering `default` com `$rc_monthly` e
   `$rc_annual`.
4. Trocar a chave `android` de `app/nativo.js` pela chave pública `goog_` do RevenueCat (o Claude faz) e
   rodar um novo build.
5. Esse novo AAB vai para o **teste fechado** (abaixo), que passa pela revisão do Google.

## 1. Lista de testadores

Play Console → **Testar e lançar → Teste → Teste fechado → Testadores → Criar lista de e-mails**.
Nome da lista: `Testadoras MY Skin Care`. Colar os e-mails separados por vírgula, ou subir um arquivo .csv
com um e-mail por linha. O e-mail tem de ser **a conta Google que a pessoa usa no Play Store do celular**
(normalmente o Gmail).

Depois de salvar a lista e enviar a versão, o Play Console mostra o **link de participação** (na aba
Testadores, "Participar no Android" ou "Participar na Web"). É ele que vai na mensagem abaixo. Formato:
`https://play.google.com/apps/testing/br.com.myskin.app`

## 2. Mensagem para pedir o e-mail (WhatsApp)

```
Oi! Tudo bem? 😊

Estou lançando o MY Skin Care, um app que analisa a pele do rosto por uma foto e monta uma rotina de cuidados com produtos baratos de farmácia.

Antes de ir para a Play Store, o Google pede que algumas pessoas testem por 14 dias. Você me ajuda? É de graça e você usa tudo do app, sem pagar nada.

Só preciso do e-mail (Gmail) que você usa no seu celular Android. Me manda aqui?

(Funciona só em Android por enquanto. iPhone vem depois.)
```

## 3. Mensagem com o link (depois que o Google aprovar a versão)

```
Obrigado por topar testar o MY Skin Care! 💛

É só seguir 3 passos no celular Android:

1. Abra este link e toque em "Tornar-se testador":
[COLAR AQUI O LINK DE PARTICIPAÇÃO]

2. Depois toque em "Baixar no Google Play" e instale o app.

3. Faça a sua análise da pele 😊

⚠️ Importante: deixe o app instalado por pelo menos 14 dias. O Google conta os dias, e se desinstalar antes o app não pode ser lançado.

Qualquer coisa estranha, erro ou sugestão, me manda aqui. Ajuda muito!
```

## 4. Lembrete no meio do teste (dia 7)

```
Oi! Passando para agradecer por testar o MY Skin Care 💛

Só um lembrete: se puder, não desinstale o app até [DATA DO DIA 14]. Faltam poucos dias para o Google liberar o lançamento.

Se já usou, o que achou? Alguma coisa difícil ou que você mudaria? Qualquer opinião ajuda!
```

## 5. Notas da versão (campo "Notas da versão" ao criar a versão)

```
<pt-BR>
Primeira versão de testes do MY Skin Care: análise da pele por foto, Skin Score com 10 aspectos, rotina de manhã e de noite, produtos com preço e evolução mês a mês.
</pt-BR>
```

## 6. Testadores não pagam

Para quem testa poder usar as análises sem ser cobrado: Play Console → **Configuração → Teste de
licença** (no menu da conta, fora do app) → adicionar os mesmos e-mails. Assim as compras de assinatura
dessas pessoas são de teste, sem cobrança. Também dá para dar o código de convite do app, que libera as
análises sem assinatura.

## 7. Pedido de acesso à produção (depois dos 14 dias)

Play Console → Painel → **Solicitar acesso à produção**. O Google faz as perguntas abaixo; respostas
prontas para adaptar (trocar os números pelos reais do teste).

**Como foi recrutar testadores?**
```
Convidei amigas, familiares e clientes interessadas em cuidados com a pele, pelo WhatsApp. Foram [N] pessoas inscritas, a maioria mulheres de 25 a 50 anos, o público do app.
```

**Como os testadores usaram o app?**
```
Cada testadora fez a análise da pele por foto, viu o Skin Score e as notas dos 10 aspectos, seguiu a rotina de cuidados marcando os passos do dia e consultou a lista de produtos. Algumas fizeram uma segunda foto para ver a comparação com a anterior.
```

**Resumo do feedback recebido**
```
O retorno veio pelo WhatsApp. Os pontos mais citados foram: [EX.: facilidade de tirar a foto com a câmera guiada, clareza das notas, preço dos produtos]. Os pedidos de melhoria foram: [EX.: ...].
```

**Como você coletou o feedback?**
```
Por mensagens no WhatsApp com cada testadora e um lembrete na metade do teste perguntando o que acharam e o que mudariam.
```

**Público-alvo do app**
```
Adultos (18+) no Brasil que querem cuidar da pele do rosto com uma rotina simples e produtos acessíveis de farmácia, e acompanhar a evolução mês a mês.
```

**Como o app oferece valor aos usuários?**
```
Com uma foto do rosto, o app dá notas de 0 a 100 para 10 aspectos da pele, explica cada nota, monta uma rotina de manhã e de noite e indica produtos baratos vendidos no Brasil. A cada nova foto, mostra o que melhorou. As fotos ficam só no celular da pessoa. O app não faz diagnóstico médico.
```

**Quantas instalações você espera no primeiro ano?**
```
Entre 1.000 e 10.000.
```

**O que você mudou com base no teste?**
```
[LISTAR AS CORREÇÕES FEITAS. Se nada mudou: "O teste não encontrou erros graves; ajustamos textos e pequenos detalhes de uso apontados pelas testadoras."]
```

**Como decidiu que o app está pronto?**
```
O app funcionou sem erros graves nos aparelhos das testadoras durante os 14 dias, as análises foram concluídas normalmente e os pontos levantados no feedback foram corrigidos.
```
