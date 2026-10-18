# Vídeo do app

18/10/2026. `site/public/video/app.mp4` (45 s, 600×1298, H.264 + AAC) toca no celular do topo do site (regravado em 18/10/2026 com o logo novo do app), sem som
e em loop. Por enquanto vai sem a faixa de áudio e sem o botão de som (decisão de 18/10/2026: a voz
sintética soou artificial); voltam quando houver a voz humana. Gravado do app de verdade com os
dados fictícios da "Ana" (as mesmas das imagens do site). Existe também a versão vertical 1080×1920
para Reels, Stories e TikTok, gerada a partir deste vídeo (enviada no chat; não fica no repositório).

## Narração

Voz sintética feminina em português do Brasil (Kokoro, voz "pf_dora", licença Apache 2.0), uma fala por tela:

1. Início: "Conheça o MY Skin Care, o aplicativo que acompanha a sua pele de perto."
2. Foto: "Primeiro, tire uma foto do rosto. O aplicativo mostra como fazer: luz boa e sem maquiagem."
3. Resultado: "Em segundos, você recebe o seu Skin Score e uma nota para cada um dos dez aspectos da pele,
   com a explicação de cada uma."
4. Evolução: "A cada mês, uma nova foto mostra o que melhorou, no gráfico e no antes e depois."
5. Rotina: "O aplicativo monta uma rotina de cuidados para a manhã e a noite. É só marcar os passos do dia."
6. Produtos: "E indica produtos vendidos no Brasil, sempre pela opção mais em conta, com o preço de referência."
7. Final: "Faça a sua primeira análise grátis. Acesse myskincareapp.com.br."

## Trocar a voz por uma mais humana

A voz atual é sintética e gratuita (gerada aqui, sem serviço externo) e soa artificial. Dois caminhos,
ambos com os programas de `scripts/video/` (o `monta.sh` regrava as telas no tempo de cada fala e gera
o vídeo do site e a versão para redes):

1. **Voz profissional do Google (recomendado, praticamente de graça).** No Google Cloud: criar um projeto,
   ativar a "Cloud Text-to-Speech API" e criar uma chave de API restrita a ela. Guardar a chave no ambiente
   da sessão do Claude como variável `GOOGLE_TTS_API_KEY` (nunca no chat) e abrir uma nova sessão. Depois:
   `python3 scripts/video/voz_google.py <falas>` e `scripts/video/monta.sh <falas> <trabalho>`. O roteiro
   tem uns 600 caracteres; o Google cobra por milhão, então o custo é de centavos ou zero na cota grátis.
2. **Voz de uma pessoa.** Gravar as 7 frases no celular, num lugar silencioso, um áudio por frase, com os
   nomes `1-inicio` a `7-final`. Depois: `scripts/video/converte_gravacoes.sh <gravacoes> <falas>` e o
   `monta.sh`. Uma locutora profissional (Workana, 99Freelas, Fiverr) costuma cobrar pouco por 45 segundos.

## Retomar com a voz do Google (checklist para a próxima sessão)

1. Conferir a chave: `[ -n "$GOOGLE_TTS_API_KEY" ] && echo ok` (variável do ambiente da sessão; nunca no chat).
2. Servir o app (`cd app && python3 -m http.server 8765`) e o site (`cd site && ../server/node_modules/.bin/wrangler dev --port 8787 --local`).
3. Gerar as falas: `python3 scripts/video/voz_google.py <pasta-falas>` (voz feminina pt-BR; ouvir antes de seguir).
4. Montar: `scripts/video/monta.sh <pasta-falas> <pasta-trabalho>` (regrava as telas no tempo das falas, gera
   `site/public/video/app.mp4` com áudio e `<pasta-trabalho>/myskincare-reels.mp4`).
5. Devolver ao site o botão "Ouvir o passo a passo" (removido em 18/10/2026; ver o commit "Remove the sound
   button and the narration from the site video for now" para o HTML, o CSS e o trecho de `site.js`).
6. Mandar a versão vertical ao usuário e publicar.
