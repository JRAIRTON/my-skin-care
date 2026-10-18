#!/usr/bin/env bash
# Converte as falas gravadas por uma pessoa (áudios do WhatsApp, .m4a, .mp3, .ogg...) para o formato do
# monta.sh. Nomeie os arquivos 1-inicio, 2-foto, 3-resultado, 4-evolucao, 5-rotina, 6-produtos, 7-final
# (com qualquer extensão). Uso: scripts/video/converte_gravacoes.sh <pasta-gravacoes> <pasta-falas-wav>
set -euo pipefail
E="$1"; S="$2"; mkdir -p "$S"; echo -n "{" > "$S/duracoes.json"; sep=""
for n in 1-inicio 2-foto 3-resultado 4-evolucao 5-rotina 6-produtos 7-final; do
  f=$(ls "$E"/"$n".* | head -1)
  # mono 24 kHz, sem o silêncio do começo e do fim, volume normalizado
  ffmpeg -hide_banner -loglevel error -y -i "$f" -ac 1 -ar 24000 \
    -af "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,highpass=f=80,loudnorm=I=-16:TP=-1.5" \
    "$S/$n.wav"
  d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$S/$n.wav")
  echo -n "$sep\"$n\": $d" >> "$S/duracoes.json"; sep=", "
done
echo "}" >> "$S/duracoes.json"; cat "$S/duracoes.json"
