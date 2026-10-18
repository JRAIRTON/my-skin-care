#!/usr/bin/env bash
# Monta o vídeo do site (site/public/video/app.mp4) e a versão vertical para redes, a partir das falas.
# Uso: scripts/video/monta.sh <pasta-falas-wav> <pasta-trabalho>
# Precisa: ffmpeg, node com playwright, python3 com numpy; o app servido em localhost:8765 (pasta app/)
# e o site em localhost:8787 (wrangler dev em site/).
set -euo pipefail
FALAS="$1"; T="$2"; RAIZ="$(cd "$(dirname "$0")/../.." && pwd)"; mkdir -p "$T"
node "$RAIZ/scripts/video/grava.mjs" "$T/quadros" "$FALAS/duracoes.json" "$T/tempos.json"
python3 - "$FALAS" "$T" <<'PY'
import sys, json, wave, numpy as np
F, T = sys.argv[1:]; t = json.load(open(f"{T}/tempos.json"))
clip = {}
for nome in t["inicios"]:
    with wave.open(f"{F}/{nome}.wav") as w: sr = w.getframerate(); clip[nome] = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
trilha = np.zeros(int(t["total"] * sr) + sr, dtype=np.float32)
for nome, ini in t["inicios"].items():
    o = int((ini + 0.35) * sr); a = clip[nome]; trilha[o:o + len(a)] += a[:len(trilha) - o]
trilha = trilha[:int(t["total"] * sr)]
with wave.open(f"{T}/narracao.wav", "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((np.clip(trilha, -1, 1) * 32767).astype(np.int16).tobytes())
PY
ffmpeg -hide_banner -loglevel error -y -framerate 30 -i "$T/quadros/f%05d.png" -i "$T/narracao.wav" \
  -vf "scale=600:-2:flags=lanczos,format=yuv420p" -c:v libx264 -preset slow -crf 25 -profile:v high \
  -af "highpass=f=70,loudnorm=I=-16:TP=-1.5,aresample=48000" -c:a aac -b:a 96k -ac 1 -shortest -movflags +faststart \
  "$RAIZ/site/public/video/app.mp4"
node "$RAIZ/scripts/video/fundo_social.mjs" "$T"
python3 -c "
from PIL import Image, ImageDraw
m=Image.new('L',(556,1203),0); ImageDraw.Draw(m).rounded_rectangle((0,0,555,1202),radius=52,fill=255); m.save('$T/mascara.png')"
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$RAIZ/site/public/video/app.mp4")
ffmpeg -hide_banner -loglevel error -y -loop 1 -t "$D" -i "$T/social-fundo.png" -i "$RAIZ/site/public/video/app.mp4" -loop 1 -t "$D" -i "$T/mascara.png" \
  -filter_complex "[1:v]scale=556:1203,format=rgba[v];[2:v]format=gray[m];[v][m]alphamerge[vm];[0:v][vm]overlay=262:342,format=yuv420p[o]" \
  -map "[o]" -map 1:a -t "$D" -c:v libx264 -preset medium -crf 23 -r 30 -c:a aac -b:a 128k -movflags +faststart "$T/myskincare-reels.mp4"
echo "site: site/public/video/app.mp4 · redes: $T/myskincare-reels.mp4"
