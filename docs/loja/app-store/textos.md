# Página do app na App Store

App Store Connect → app → **Distribuição → versão iOS 1.0** (textos e imagens) e **Informações do app**
(nome, subtítulo, categoria, privacidade). Copie cada texto no campo de mesmo nome. As capturas estão nesta
pasta (geradas por `node scripts/loja_apple.mjs`). Os textos seguem os do Google Play
(`docs/loja/google-play/textos.md`), com as regras da Apple para assinatura.

Sem alegações médicas: o app não diagnostica nem trata doenças. A Apple reprova recursos "em breve": antes de
enviar para revisão, as assinaturas têm de estar criadas e a chave `appl_` do RevenueCat no app.

## Informações do app

| Campo | Valor |
|---|---|
| Nome (até 30) | `MY Skin Care: Análise de Pele` |
| Subtítulo (até 30) | `Análise de pele por foto` |
| Categoria principal | **Estilo de vida** (a App Store não tem a categoria Beleza; "Saúde e fitness" e "Medicina" puxam exigências de app de saúde) |
| Categoria secundária | **Utilidades** (opcional) |
| Direitos de conteúdo | O app não contém conteúdo de terceiros que exija direitos |
| URL da política de privacidade | `https://www.myskincareapp.com.br/privacidade` |

## Versão iOS 1.0

**Texto promocional (até 170)**

```
Tire uma foto do rosto e receba notas para 10 aspectos da pele, uma rotina de manhã e de noite e produtos que cabem no bolso. A primeira análise é grátis.
```

**Palavras-chave (até 100, separadas por vírgula, sem espaço depois da vírgula)**

```
skincare,pele,rotina,skin score,manchas,poros,rugas,acne,oleosidade,hidratação,beleza,cuidados
```

**URL de suporte:** `https://www.myskincareapp.com.br`
**URL de marketing:** `https://www.myskincareapp.com.br`
**Direitos autorais:** `2026 Airton Carvalho Junior`

**Descrição (até 4.000)**

```
Sua pele, acompanhada de perto.

Tire uma foto do rosto e receba notas para 10 aspectos da sua pele, uma rotina de cuidados para manhã e noite e produtos que cabem no seu bolso. Mês a mês, veja o que melhorou.

A primeira análise é completa e gratuita. Sem cadastro.

COMO FUNCIONA
1. Tire a foto: a câmera guiada mostra o contorno do rosto e avisa se a luz está boa. Leva menos de um minuto.
2. Receba o seu Skin Score: cada aspecto ganha uma nota de 0 a 100, com a explicação do que foi observado e do que ajuda. O Skin Score é a média dessas notas.
3. Siga a rotina e acompanhe: a cada 4 semanas, uma nova foto mostra o que mudou.

10 ASPECTOS AVALIADOS EM CADA FOTO
Textura, poros, rugas e linhas, firmeza, manchas, uniformidade do tom, vermelhidão, oleosidade, luminosidade e hidratação.

UM RESULTADO QUE VOCÊ ENTENDE
• Notas de 0 a 100: quanto maior, melhor
• Idade aparente da pele e o seu foco agora
• Comparação automática com a foto anterior

VEJA A SUA EVOLUÇÃO
• Gráfico da sua pele mês a mês
• Antes e depois de cada aspecto, com as fotos lado a lado
• Procedimentos estéticos marcados no gráfico
• Imagem pronta para compartilhar nos Stories, sem foto se você preferir

ROTINA SEM EXAGERO
Começa pelo básico: limpeza, hidratante e protetor solar. Os ativos entram aos poucos, para a pele se adaptar com conforto. A rotina pausa sozinha depois de um procedimento estético.

PRODUTOS QUE CABEM NO BOLSO
Não somos de nenhuma marca de cosméticos. A indicação sai de regras fixas, pela sua pele e pelos seus objetivos, sempre pela opção mais em conta que serve. Todos são vendidos em farmácias e lojas do Brasil.
• Preço de referência e custo do kit completo
• Alternativas mais baratas para cada item
• "Já tenho este" tira do custo o que você já usa

SUAS FOTOS SÃO SUAS
Sem conta e sem nuvem: fotos, notas e rotina ficam só no seu celular. A foto passa pelo servidor só durante a análise, não fica guardada e não é usada para treinar a inteligência artificial.

PLANOS
A primeira análise é grátis. Para acompanhar a evolução, escolha um plano:
• Mensal: R$ 19,90 por mês
• Anual: R$ 129,90 por ano (sai a R$ 10,83 por mês)
A assinatura é cobrada na sua conta Apple e renovada automaticamente, a menos que seja cancelada pelo menos 24 horas antes do fim do período. Gerencie ou cancele em Ajustes > seu nome > Assinaturas.

IMPORTANTE
O MY Skin Care é um app de cuidados com a pele e beleza. Ele não faz diagnóstico nem tratamento e não substitui a consulta com um dermatologista. Em caso de lesões, coceira, dor ou alterações que preocupem, procure um médico.

Para maiores de 18 anos.

Termos de Uso: https://www.myskincareapp.com.br/termos
Política de Privacidade: https://www.myskincareapp.com.br/privacidade

Dúvidas: myskincare.ia.sac@gmail.com
Site: https://www.myskincareapp.com.br
```

**Capturas de tela do iPhone 6,9"** (1290 × 2796): `tela-1-inicio.png` a `tela-6-analisar.png`, nesta
ordem. A Apple reduz sozinha para os iPhones menores. iPad: o app é só para iPhone (não enviar).

## Classificação etária

Responder **Nenhum / Não** em todos os itens (violência, conteúdo sexual, linguagem, drogas, apostas,
conteúdo assustador, acesso irrestrito à web, conteúdo gerado por usuários, mensagens entre usuários).
Em "Temas médicos ou de tratamento" e "Saúde ou bem-estar": **Não** (cosmético, sem diagnóstico).
No fim, escolher a classificação **18+** (os Termos são para maiores de 18).

## Privacidade do app (rótulo de privacidade)

Coleta dados? **Sim**. Rastreamento (tracking)? **Não** em todos.

| Tipo de dado | Finalidade | Vinculado à identidade? | Usado para rastreamento? |
|---|---|---|---|
| Fotos ou vídeos | Funcionalidade do app | Não | Não |
| Histórico de compras | Funcionalidade do app | Sim | Não |
| ID do dispositivo | Funcionalidade do app | Sim | Não |

Notas: a foto passa pelo servidor e pela Anthropic só para a análise (a Anthropic pode guardá-la por prazo
limitado, para segurança). O "ID do dispositivo" é o identificador aleatório da instalação, criado pelo app,
usado para a análise grátis e para ligar a assinatura (RevenueCat). Perfil, notas, rotina e procedimentos
ficam só no aparelho e não entram.

## Informações para a revisão da Apple

- Login necessário: **não**.
- Contato: nome, telefone e e-mail do responsável (myskincare.ia.sac@gmail.com).
- Notas (em inglês):

```
The app has no login or account. The first skin analysis is free. To unlock further analyses without a subscription, on the "Tudo pronto" (All set) screen at the end of onboarding, enter the invite code below in the box "Tem um código de convite?" (Have an invite code?) and tap "Usar código" (Use code). It is also in Ajustes (Settings) > Código de convite.

Invite code: [DIGITAR O CÓDIGO AQUI]

To analyze, take a front-facing photo of a face in good light, or pick one from the photo library. Subscriptions (monthly and annual) are sold through In-App Purchase on the plans screen ("Assine o MY Skin Care"), with "Restore purchase" ("Já assinei: restaurar compra"). The app is a cosmetic skincare tool; it does not diagnose or treat any medical condition.
```
