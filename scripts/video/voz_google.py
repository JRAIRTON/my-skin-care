"""Narração com o Google Cloud Text-to-Speech (voz feminina brasileira bem natural).

A chave de API do Google Cloud (com a Text-to-Speech API ativada) pode vir de dois jeitos:
- como segredo de rede do ambiente (recomendado): cabeçalho X-Goog-Api-Key para texttospeech.googleapis.com,
  colocado pela própria rede da sessão; o programa não vê a chave;
- ou na variável GOOGLE_TTS_API_KEY.
Uso:
  python3 scripts/video/voz_google.py <pasta-saida> [voz]
Gera <pasta-saida>/<fala>.wav (24 kHz) e duracoes.json. Voz padrão: pt-BR-Chirp3-HD-Leda; se não existir,
tenta as outras femininas da lista.
"""
import base64, json, os, sys, urllib.request, wave
from pathlib import Path

VOZES = ["pt-BR-Chirp3-HD-Leda", "pt-BR-Chirp3-HD-Aoede", "pt-BR-Chirp3-HD-Kore", "pt-BR-Neural2-A", "pt-BR-Wavenet-A"]
saida = Path(sys.argv[1]); saida.mkdir(parents=True, exist_ok=True)
vozes = [sys.argv[2]] + VOZES if len(sys.argv) > 2 else VOZES
chave = os.environ.get("GOOGLE_TTS_API_KEY", "").strip()  # vazio: a rede da sessão põe o X-Goog-Api-Key
falas = json.loads((Path(__file__).parent / "falas.json").read_text())

def fala(texto, voz):
    corpo = {"input": {"text": texto}, "voice": {"languageCode": "pt-BR", "name": voz},
             "audioConfig": {"audioEncoding": "LINEAR16", "sampleRateHertz": 24000}}
    url = "https://texttospeech.googleapis.com/v1/text:synthesize" + (f"?key={chave}" if chave else "")
    req = urllib.request.Request(url,
                                 data=json.dumps(corpo).encode(), headers={"Content-Type": "application/json"})
    return base64.b64decode(json.load(urllib.request.urlopen(req, timeout=60))["audioContent"])

voz = None
for v in vozes:
    try:
        fala("Teste.", v); voz = v; break
    except Exception as e:
        print(f"voz {v} indisponível: {e}")
if not voz: sys.exit("nenhuma voz disponível; confira a chave (segredo de rede X-Goog-Api-Key ou GOOGLE_TTS_API_KEY) e se a Text-to-Speech API está ativada")
dur = {}
for nome, texto in falas:
    (saida / f"{nome}.wav").write_bytes(fala(texto, voz))  # LINEAR16 já vem com cabeçalho WAV
    with wave.open(str(saida / f"{nome}.wav")) as w: dur[nome] = round(w.getnframes() / w.getframerate(), 2)
(saida / "duracoes.json").write_text(json.dumps(dur))
print(voz, dur)
