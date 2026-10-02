"""Etapa 5 — validação ampliada da IA.

Analisa cada foto várias vezes, de forma independente, em cada modelo, usando o Método MY Skin v1
(grau 0-4 primeiro, nota dentro da faixa do grau). Gera resultados brutos e um relatório.

Uso:
  python3 scripts/etapa5_validacao.py --fotos DIR --mapa mapa.json [--modelos ...] [--repeticoes 3] [--max-usd 8]
  python3 scripts/etapa5_validacao.py --fotos DIR --mapa mapa.json --simular   # testa sem chamar a API

DIR contém F01.jpg ... F16.jpg. mapa.json liga cada código à pessoa e à condição de luz
(documento etapa2/codigos-avaliacao-cega do app). Requer ANTHROPIC_API_KEY, exceto com --simular.
"""
import argparse
import base64
import concurrent.futures as cf
import json
import os
import random
import statistics as st
import sys
import threading
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

CATS = ["textura", "poros", "linhas", "firmeza", "manchas", "uniformidade", "vermelhidao", "oleosidade", "brilho", "hidratacao"]
NOMES = {"textura": "Textura", "poros": "Poros", "linhas": "Rugas e linhas de expressão", "firmeza": "Firmeza e elasticidade aparentes",
         "manchas": "Pigmentação e manchas", "uniformidade": "Tom e uniformidade", "vermelhidao": "Vermelhidão e vasinhos",
         "oleosidade": "Sebo e oleosidade", "brilho": "Brilho e luminosidade", "hidratacao": "Hidratação aparente"}
GRAUS = {  # Método MY Skin v1 (docs/metodo-myskin-v1.md); same text as the prototype prompt
    "textura": ["lisa e regular", "pequenas elevações ou aspereza em uma área", "irregularidade em várias áreas ou cicatrizes rasas", "irregularidade evidente, cicatrizes múltiplas", "intensa e difusa"],
    "poros": ["invisíveis a 30-40 cm", "visíveis só no nariz", "nariz e parte interna das bochechas", "dilatados e numerosos em bochechas e testa", "muito dilatados em todo o rosto"],
    "linhas": ["sem linhas (Glogau I)", "linhas finas só na expressão", "linhas finas visíveis em repouso (Glogau II)", "rugas evidentes em repouso (Glogau III)", "rugas profundas e difusas (Glogau IV)"],
    "firmeza": ["contorno nítido, sem flacidez", "contorno levemente suavizado ou sulco nasogeniano discreto", "sulco nasogeniano marcado, flacidez moderada", "flacidez evidente no contorno da mandíbula", "flacidez intensa"],
    "manchas": ["sem manchas", "poucas sardas ou uma mancha pequena isolada", "várias manchas ou mancha difusa leve em uma região", "manchas múltiplas ou mancha difusa moderada", "manchas extensas"],
    "uniformidade": ["tom homogêneo", "diferença leve localizada (olheiras leves, ao redor do nariz)", "diferenças em várias áreas", "tom evidentemente irregular", "muito irregular"],
    "vermelhidao": ["sem vermelhidão", "quase imperceptível", "leve e bem definida", "moderada, ou vasinhos visíveis", "intensa"],
    "oleosidade": ["sem brilho oleoso", "brilho leve só na zona T", "brilho evidente na zona T", "zona T e bochechas oleosas", "muito oleosa em todo o rosto"],
    "brilho": ["luminosa, com viço", "levemente opaca em algumas áreas", "opaca em boa parte do rosto", "opaca e sem vida", "muito opaca, acinzentada"],
    "hidratacao": ["sem sinal de ressecamento", "aspereza leve", "descamação fina localizada", "descamação evidente", "descamação intensa ou fissuras"],
}
FAIXAS = [(90, 100), (75, 89), (60, 74), (40, 59), (0, 39)]
# Clinical grades from docs/etapa2-avaliacao-tecnica.md (reference for the in-band check).
CLINICO = {
    "aron": [1, 2, 1, 0, 1, 1, 1, 1, 1, 0],
    "airton": [1, 2, 1, 1, 1, 1, 2, 2, 1, 0],
    "meiri": [1, 1, 1, 0, 1, 1, 1, 1, 1, 0],
    "fernanda": [1, 1, 1, 1, 1, 2, 2, 0, 1, 1],
}
# US$ per million tokens (input, output), from the Claude API pricing table.
PRECOS = {"claude-haiku-4-5": (1.0, 5.0), "claude-sonnet-5": (2.0, 10.0), "claude-opus-5": (5.0, 25.0)}
MODELOS_PADRAO = ["claude-haiku-4-5", "claude-sonnet-5", "claude-opus-5"]

PROMPT = f"""Você é o motor de avaliação visual do MY Skin AI, um app de cuidados com a pele (uso cosmético, não é diagnóstico médico).
Avalie a foto do rosto. Avalie SOMENTE esta foto, de forma independente.

MÉTODO (Método MY Skin v1): para cada categoria, PRIMEIRO escolha o grau de 0 a 4 pelo descritor que melhor corresponde ao que se vê; DEPOIS dê a nota dentro da faixa do grau.
Faixas: grau 0 = 90 a 100; grau 1 = 75 a 89; grau 2 = 60 a 74; grau 3 = 40 a 59; grau 4 = 0 a 39.
Grau 0 significa que o sinal está AUSENTE: nesse caso a nota deve ser 90 ou mais. Não puxe as notas para o meio da escala.
{chr(10).join(f"- {k} ({NOMES[k]}). Graus: " + "; ".join(f"{i} = {g}" for i, g in enumerate(GRAUS[k])) for k in CATS)}
Nota sempre "maior = aparência melhor". Não ajuste a escala pela idade. Use avaliavel false (com grau e nota 0) quando a categoria não puder ser avaliada nesta foto (por exemplo, área coberta por barba).
Seja conservador: diferença de luz, ângulo ou distância não é mudança da pele.
Estime também a idade aparente da pele (idade que a pele aparenta, não idade biológica), ou 0 se a foto não permitir.
Responda com o JSON pedido."""

# the API caps union-typed (nullable) fields, so "not assessable" is a boolean flag and is turned back into null in analisa_api
INT = {"type": "integer"}
SCHEMA = {
    "type": "object",
    "properties": {
        "notas": {
            "type": "object",
            "properties": {k: {"type": "object", "properties": {"avaliavel": {"type": "boolean"}, "grau": INT, "nota": INT}, "required": ["avaliavel", "grau", "nota"], "additionalProperties": False} for k in CATS},
            "required": CATS, "additionalProperties": False,
        },
        "confianca": {"type": "string", "enum": ["alta", "media", "baixa"]},
        "idade_aparente": INT,
    },
    "required": ["notas", "confianca", "idade_aparente"], "additionalProperties": False,
}


def normaliza(notas):
    """Same rule as the prototype: keep the score inside the band of its grade."""
    out = {}
    for k in CATS:
        g, n = notas.get(k, {}).get("grau"), notas.get(k, {}).get("nota")
        g = g if isinstance(g, int) and 0 <= g <= 4 else None
        n = max(0, min(100, n)) if isinstance(n, int) else None
        if g is not None:
            lo, hi = FAIXAS[g]
            n = round((lo + hi) / 2) if n is None else max(lo, min(hi, n))
        out[k] = {"grau": g, "nota": n}
    return out


def skin_score(notas):
    v = [notas[k]["nota"] for k in CATS if notas[k]["nota"] is not None]
    return round(st.mean(v)) if v else None


def analisa_api(client, modelo, img_b64):
    resp = client.messages.create(
        model=modelo, max_tokens=16000,
        messages=[{"role": "user", "content": [
            {"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": img_b64}},
            {"type": "text", "text": PROMPT}]}],
        output_config={"format": {"type": "json_schema", "schema": SCHEMA}},
    )
    if resp.stop_reason == "refusal":
        raise RuntimeError("recusa do modelo")
    text = next(b.text for b in resp.content if b.type == "text")
    bruto = json.loads(text)
    for v in bruto["notas"].values():
        if not v.pop("avaliavel", True):
            v["grau"] = v["nota"] = None
    bruto["idade_aparente"] = bruto.get("idade_aparente") or None
    return bruto, resp.usage.input_tokens, resp.usage.output_tokens


def analisa_simulado(pessoa, rng):
    base = CLINICO[pessoa]
    notas = {}
    for k, g in zip(CATS, base):
        gg = max(0, min(4, g + rng.choice([0, 0, 0, 1, -1])))
        lo, hi = FAIXAS[gg]
        notas[k] = {"grau": gg, "nota": rng.randint(lo, hi)}
    return {"notas": notas, "confianca": "alta", "idade_aparente": 38}, 1800, 500


def custo(modelo, tin, tout):
    pi, po = PRECOS.get(modelo, (5.0, 25.0))
    return tin / 1e6 * pi + tout / 1e6 * po


def roda(args):
    mapa = json.loads(Path(args.mapa).read_text())
    fotos = {c: Path(args.fotos) / f"{c}.jpg" for c in sorted(mapa)}
    falta = [c for c, p in fotos.items() if not p.exists()]
    if falta:
        sys.exit(f"Fotos não encontradas: {', '.join(falta)}")
    imgs = {c: base64.standard_b64encode(p.read_bytes()).decode() for c, p in fotos.items()}
    saida = Path(args.saida)
    saida.parent.mkdir(parents=True, exist_ok=True)
    feitos = set()
    if saida.exists():  # resume: skip runs already saved
        for linha in saida.read_text().splitlines():
            r = json.loads(linha)
            if not r.get("erro"):  # failed runs are retried on resume
                feitos.add((r["modelo"], r["codigo"], r["rep"]))
    tarefas = [(m, c, rep) for m in args.modelos for c in fotos for rep in range(1, args.repeticoes + 1) if (m, c, rep) not in feitos]
    print(f"{len(tarefas)} análises a fazer ({len(feitos)} já salvas).", file=sys.stderr)
    if args.simular:
        client = None
    else:
        if not os.environ.get("ANTHROPIC_API_KEY"):
            sys.exit("ANTHROPIC_API_KEY não configurada.")
        import anthropic
        client = anthropic.Anthropic(max_retries=4)
    gasto = sum(json.loads(l)["custo_usd"] for l in saida.read_text().splitlines()) if saida.exists() else 0.0
    trava = threading.Lock()
    rng = random.Random(42)

    def uma(t):
        nonlocal gasto
        modelo, codigo, rep = t
        with trava:
            if gasto >= args.max_usd:
                return None
        t0 = time.time()
        try:
            if args.simular:
                bruto, tin, tout = analisa_simulado(mapa[codigo]["pessoa"], rng)
            else:
                bruto, tin, tout = analisa_api(client, modelo, imgs[codigo])
            erro = None
        except Exception as e:  # keep going; a failed run is recorded, not retried here
            bruto, tin, tout, erro = None, 0, 0, f"{type(e).__name__}: {e}"[:300]
        notas = normaliza(bruto["notas"]) if bruto else None
        reg = {"modelo": modelo, "codigo": codigo, "rep": rep, "pessoa": mapa[codigo]["pessoa"], "condicao": mapa[codigo]["condicao"],
               "notas": notas, "skin": skin_score(notas) if notas else None, "confianca": bruto.get("confianca") if bruto else None,
               "idade_aparente": bruto.get("idade_aparente") if bruto else None, "tokens_in": tin, "tokens_out": tout,
               "custo_usd": round(custo(modelo, tin, tout), 5), "segundos": round(time.time() - t0, 1), "erro": erro}
        with trava:
            gasto += reg["custo_usd"]
            with saida.open("a") as f:
                f.write(json.dumps(reg, ensure_ascii=False) + "\n")
            print(f"{modelo} {codigo} #{rep} skin={reg['skin']} US${gasto:.2f}{' ERRO ' + erro if erro else ''}", file=sys.stderr)
        return reg

    with cf.ThreadPoolExecutor(max_workers=args.paralelo) as ex:
        list(ex.map(uma, tarefas))
    if gasto >= args.max_usd:
        print(f"Limite de US$ {args.max_usd:.2f} atingido; rode de novo com --max-usd maior para continuar.", file=sys.stderr)


def relatorio(args):
    ultimo = {}  # a retried run supersedes its earlier failed attempt
    for l in Path(args.saida).read_text().splitlines():
        r = json.loads(l)
        ultimo[(r["modelo"], r["codigo"], r["rep"])] = r
    regs = list(ultimo.values())
    ok = [r for r in regs if r["notas"]]
    modelos = [m for m in args.modelos if any(r["modelo"] == m for r in ok)]
    L = ["# Etapa 5 — Resultados da validação ampliada da IA", "",
         f"Análises: {len(regs)} ({len(regs) - len(ok)} com erro). Método MY Skin v1. Cada análise é independente: uma chamada por foto, sem foto anterior nem notas anteriores.", ""]

    def spread(vals):
        v = [x for x in vals if x is not None]
        return max(v) - min(v) if len(v) >= 2 else None

    resumo = []
    for m in modelos:
        R = [r for r in ok if r["modelo"] == m]
        # 1) same photo, repeated runs
        por_foto = {}
        for r in R:
            por_foto.setdefault(r["codigo"], []).append(r)
        rep_skin = [spread([r["skin"] for r in rs]) for rs in por_foto.values()]
        rep_skin = [x for x in rep_skin if x is not None]
        rep_cat = [spread([r["notas"][k]["nota"] for r in rs]) for rs in por_foto.values() for k in CATS]
        rep_cat = [x for x in rep_cat if x is not None]
        # 2) same light, different photos (mean of runs per photo)
        media_foto = {c: st.mean([r["skin"] for r in rs]) for c, rs in por_foto.items()}
        pessoas = sorted({r["pessoa"] for r in R})
        mesma = {p: spread([media_foto[c] for c, rs in por_foto.items() if rs[0]["pessoa"] == p and rs[0]["condicao"] == "mesma"]) for p in pessoas}
        luz = {}
        for p in pessoas:
            a = [media_foto[c] for c, rs in por_foto.items() if rs[0]["pessoa"] == p and rs[0]["condicao"] == "mesma"]
            b = [media_foto[c] for c, rs in por_foto.items() if rs[0]["pessoa"] == p and rs[0]["condicao"] == "diferente"]
            luz[p] = round(st.mean(b) - st.mean(a), 1) if a and b else None
        # 3) in-band versus clinical grade
        dentro = total = abaixo = 0
        for r in R:
            ref = CLINICO.get(r["pessoa"])
            if not ref:
                continue
            for k, g in zip(CATS, ref):
                n = r["notas"][k]["nota"]
                if n is None:
                    continue
                total += 1
                lo, hi = FAIXAS[g]
                dentro += lo <= n <= hi
                abaixo += n < lo
        custo_medio = st.mean([r["custo_usd"] for r in R])
        tempo = st.mean([r["segundos"] for r in R])
        erros = sum(1 for r in regs if r["modelo"] == m and not r["notas"])
        resumo.append((m, st.mean(rep_skin) if rep_skin else None, max(rep_skin) if rep_skin else None, st.mean(rep_cat) if rep_cat else None,
                       mesma, luz, dentro / total if total else None, abaixo / total if total else None, custo_medio, tempo, erros, len(R)))

    L += ["## Resumo por modelo", "", "| Modelo | Mesma foto: variação média do Skin Score | Mesma foto: maior variação | Mesma foto: variação média por categoria | Notas dentro da faixa clínica | Notas abaixo da faixa | Custo por análise | Tempo médio | Erros |",
          "|---|---|---|---|---|---|---|---|---|"]
    f = lambda v, d=1: "—" if v is None else f"{v:.{d}f}".replace(".", ",")
    for m, rs_m, rs_max, rc, mesma, luz, dentro, abaixo, cm, tempo, erros, n in resumo:
        L.append(f"| {m} | {f(rs_m)} | {f(rs_max, 0)} | {f(rc)} | {f(dentro * 100 if dentro is not None else None, 0)}% | {f(abaixo * 100 if abaixo is not None else None, 0)}% | US$ {f(cm, 4)} | {f(tempo, 0)} s | {erros} |")
    L += ["", "Referência da etapa 2 (antes do Método v1): 52% das notas dentro da faixa clínica, todas as demais abaixo.", ""]
    L += ["## Variação entre fotos com a mesma luz (média das repetições)", "", "| Modelo | " + " | ".join(p for p in CLINICO) + " |", "|---|" + "---|" * len(CLINICO)]
    for m, *_rest in resumo:
        mesma = _rest[3]
        L.append(f"| {m} | " + " | ".join(f(mesma.get(p)) for p in CLINICO) + " |")
    L += ["", "## Efeito da luz diferente no Skin Score (média das repetições)", "", "| Modelo | " + " | ".join(p for p in CLINICO) + " |", "|---|" + "---|" * len(CLINICO)]
    for m, *_rest in resumo:
        luz = _rest[4]
        L.append(f"| {m} | " + " | ".join(f(luz.get(p)) for p in CLINICO) + " |")
    L += ["", "## Critérios", "",
          "- Mesma foto analisada de novo: variação média do Skin Score até 3 pontos.",
          "- Fotos com a mesma luz: até 5 pontos.",
          "- Notas dentro da faixa clínica: 70% ou mais (era 52%).",
          "- Escolha: o modelo mais barato que cumpra os três critérios.", ""]
    Path(args.relatorio).write_text("\n".join(L) + "\n")
    print(f"Relatório: {args.relatorio}", file=sys.stderr)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--fotos", required=True)
    ap.add_argument("--mapa", required=True)
    ap.add_argument("--modelos", nargs="+", default=MODELOS_PADRAO)
    ap.add_argument("--repeticoes", type=int, default=3)
    ap.add_argument("--max-usd", type=float, default=8.0)
    ap.add_argument("--paralelo", type=int, default=4)
    ap.add_argument("--saida")
    ap.add_argument("--relatorio")
    ap.add_argument("--simular", action="store_true", help="testa o fluxo com respostas falsas, sem chamar a API")
    ap.add_argument("--so-relatorio", action="store_true")
    a = ap.parse_args()
    # a simulated run must never mix with real results (resume would skip them) or overwrite the real report
    sufixo = "-simulado" if a.simular else ""
    a.saida = a.saida or str(ROOT / f"etapa5-dados/resultados{sufixo}.jsonl")
    a.relatorio = a.relatorio or str(ROOT / "etapa5-dados/relatorio-simulado.md" if a.simular else ROOT / "docs/etapa5-resultados.md")
    if not a.so_relatorio:
        roda(a)
    relatorio(a)
