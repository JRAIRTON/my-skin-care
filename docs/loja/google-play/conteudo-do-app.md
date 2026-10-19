# Conteúdo do app no Google Play (Política → Conteúdo do app)

Respostas para as declarações que o Play Console pede antes do primeiro envio. Base: o app manda ao
servidor só a foto (para a análise, sem guardar) e o identificador aleatório da instalação (`X-Usuario`,
para a análise grátis e a assinatura); perfil, notas, rotina e fotos ficam no aparelho. Sem anúncios, sem
analytics, sem login. Permissão do ID de publicidade removida do Android.

## Política de Privacidade

```
https://www.myskincareapp.com.br/privacidade
```

## Acesso ao app

**Todas ou algumas funcionalidades estão restritas** → Adicionar instruções:

- Nome: `Código de convite`
- Nome de usuário: deixar em branco
- Senha: **o código de convite do app** (o mesmo `APP_TOKEN` do servidor; o responsável preenche, não
  vai para o repositório)
- Outras informações:

```
O app não tem login. Na abertura, aceite os termos e avance até a tela "Tudo pronto". No quadro "Tem um código de convite?", digite o código informado no campo Senha e toque em "Usar código": todas as análises ficam liberadas, sem assinatura. (Também em Ajustes → Código de convite.) Para analisar, tire uma foto do rosto de frente, com boa luz, ou escolha uma da galeria.
```

## Anúncios

**Não, meu app não contém anúncios.**

## ID de publicidade

**Não** (o app não usa o ID de publicidade; a permissão `AD_ID` é removida no manifesto).

## Classificação de conteúdo

- E-mail: myskincare.ia.sac@gmail.com
- Categoria: **Todos os outros tipos de apps** (não é jogo nem rede social)
- Violência, sexo, linguagem imprópria, drogas, álcool, tabaco, apostas, conteúdo assustador: **Não** em
  todas
- Os usuários podem interagir ou trocar conteúdo entre si no app? **Não** (o compartilhamento da imagem
  de evolução usa o menu do sistema e vai para outros apps; o app não tem chat nem perfil público)
- Compartilha a localização do usuário com outros? **Não**
- Permite compras de produtos digitais? **Sim** (assinatura)
- Navegador da Web ou mecanismo de pesquisa? **Não**

Resultado esperado: classificação **Livre**. A idade mínima de 18 anos vem do público-alvo abaixo e dos
Termos.

## Público-alvo e conteúdo

- Faixa etária: **18 anos ou mais** (só essa)
- O app pode atrair crianças sem querer? **Não**

## Apps de notícias

**Não.**

## Apps governamentais

**Não.**

## Recursos financeiros

**Meu app não oferece nenhum recurso financeiro.**

## Apps de saúde

Marcar **"Meu app não tem recursos de saúde"** se a opção existir. O app é de beleza e cuidados
cosméticos: não faz diagnóstico, não trata doenças, não mede dados do corpo. Se o formulário obrigar a
escolher algo, não marcar categorias médicas.

## Segurança dos dados

**Visão geral**

- O app coleta ou compartilha algum dos tipos de dados do usuário exigidos? **Sim**
- Todos os dados do usuário coletados pelo app são criptografados em trânsito? **Sim**
- Que métodos de exclusão de conta você oferece? **O app não tem conta** (os dados ficam no aparelho e são
  apagados em Ajustes → Apagar todos os dados ou ao desinstalar). Se pedir um link:
  `https://www.myskincareapp.com.br/privacidade`

**Tipos de dados** (marcar só estes):

| Tipo | Coletado | Compartilhado | Processado temporariamente | Obrigatório | Finalidade |
|---|---|---|---|---|---|
| Fotos e vídeos → **Fotos** | Sim | Não | **Sim** | Obrigatório | Funcionalidade do app |
| Atividade no app → **Histórico de compras** | Sim | Não | Não | Obrigatório | Funcionalidade do app, Gerenciamento da conta |
| IDs do dispositivo ou outros IDs → **IDs do dispositivo ou outros IDs** | Sim | Não | Não | Obrigatório | Funcionalidade do app, Prevenção contra fraudes, segurança e compliance |

Notas:

- "Compartilhado" fica **Não**: Cloudflare, Anthropic e RevenueCat processam os dados em nosso nome
  (prestadores de serviço), o que o Google não conta como compartilhamento.
- Perfil (nome, idade, tipo de pele), gestação, notas, rotina e procedimentos **não** são declarados:
  ficam só no aparelho e não são enviados.
- O IP dos registros de acesso (Marco Civil) não é usado para localização; não declarar localização.
