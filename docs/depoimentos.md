# Depoimentos no site

18/10/2026. A seção "O que dizem do MY Skin Care" do site (`site/public/depoimentos.js`) fica escondida
até ter o primeiro depoimento. **Só depoimentos reais**, com as palavras da pessoa e autorização por
escrito: depoimento inventado é publicidade enganosa (CDC, art. 37) e vai contra o CONAR.

## Mensagem para pedir (WhatsApp)

> Oi, [nome]! Obrigado por testar o MY Skin Care. Posso te pedir um favor rápido? Em uma ou duas frases,
> conta o que você achou do app (o que mais gostou, se ajudou na sua rotina, se percebeu alguma mudança).
> Pode ser bem sincero, inclusive críticas, que também me ajudam.
>
> Se você autorizar, eu publico a sua frase no site do app (www.myskincareapp.com.br) com o seu primeiro
> nome, a inicial do sobrenome e a sua idade. Para autorizar, responda: **"Autorizo a publicação do meu
> depoimento no site do MY Skin Care."** Se quiser tirar depois, é só me avisar que eu retiro.

Guarde a conversa com a autorização (print ou exportação), é a prova do consentimento (LGPD).

## Regras

- Usar o texto como a pessoa escreveu. Dá para cortar, mas não mudar o sentido nem acrescentar.
- Nada de promessa médica: se alguém escrever "curou minha acne", não publique essa parte (o app é
  cosmético e não pode sugerir tratamento).
- Quem testou de graça ou é da família: escrever "testadora do app" (ou "testador") no detalhe, para
  ninguém achar que é cliente comum.
- Sem foto da pessoa, a menos que ela autorize também a foto.
- Se a pessoa pedir para retirar, apagar a linha de `depoimentos.js` no mesmo dia.

## Como publicar

Mande os depoimentos autorizados para o Claude, ou acrescente em `site/public/depoimentos.js`:

```js
export const DEPOIMENTOS = [
  { texto: "Frase da pessoa.", nome: "Ana P.", detalhe: "34 anos · testadora do app" },
];
```
