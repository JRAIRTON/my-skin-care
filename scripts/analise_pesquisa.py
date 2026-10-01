"""Analisa o CSV exportado do Google Forms da pesquisa da etapa 6 (docs/etapa6-pesquisa.md).

Uso: python3 scripts/analise_pesquisa.py respostas.csv > relatorio.md

As colunas são reconhecidas por palavras-chave do texto das perguntas, então a ordem não importa.
"""
import csv
import re
import sys
from collections import Counter

COLS = {
    "idade": "qual a sua idade",
    "genero": "identifica",
    "gasto": "quanto você gasta",
    "dificuldade": "maior dificuldade",
    "interesse": "interesse nesse aplicativo",
    "funcoes": "funções seriam mais úteis",
    "confianca": "confiaria",
    "privacidade": "preocupa enviar fotos",
    "vw_barato_demais": "tão barato que duvidaria",
    "vw_barato": "boa compra",
    "vw_caro": "caro, mas ainda",
    "vw_caro_demais": "caro demais",
    "assinaria": "r$ 19,90",
    "familia": "plano família",
}
FUNCOES = ["Avaliação da pele por foto", "Acompanhar a evolução com fotos e gráficos", "Rotina de cuidados personalizada",
           "Sugestão de produtos de qualquer marca", "Comparação de preços e opções mais baratas", "Lembretes da rotina",
           "Perfis para a família na mesma conta", "Aviso quando vale procurar um dermatologista"]
DIFICULDADES = ["Não sei quais produtos funcionam para mim", "Já gastei com produtos que não funcionaram", "Produtos caros",
                "Não vejo resultado ou não sei se melhorou", "Informação confusa na internet", "Falta de tempo ou constância",
                "Não tenho dificuldade"]
ASSINARIA = ["Certamente assinaria", "Provavelmente assinaria", "Talvez", "Provavelmente não", "Certamente não"]
PRECO_MINIMO = 14.90  # abaixo disso a margem não cobre loja de apps, IA e servidor


def find_cols(header):
    found = {}
    low = [h.lower() for h in header]
    for key, kw in COLS.items():
        hits = [i for i, h in enumerate(low) if kw in h]
        if key == "vw_caro":  # "caro, mas ainda" must not be confused with "caro demais"
            hits = [i for i in hits if "demais" not in low[i]]
        if hits:
            found[key] = hits[0]
    return found


def num(v):
    v = (v or "").replace("R$", "").strip()
    if not v:
        return None
    v = v.replace(".", "").replace(",", ".") if re.search(r",\d{1,2}$", v) else v.replace(",", ".")
    try:
        x = float(re.sub(r"[^\d.]", "", v))
        return x if 0 < x < 10000 else None
    except ValueError:
        return None


def brl(v):
    return ("R$ %.2f" % v).replace(".", ",") if v is not None else "—"


def pct(a, b):
    return f"{(100 * a / b):.0f}%" if b else "—"


def van_westendorp(rows):
    """Retorna os quatro pontos de Van Westendorp a partir de respostas válidas e coerentes."""
    data = [r for r in rows if None not in r and r[0] <= r[1] <= r[2] <= r[3]]
    if len(data) < 10:
        return None, len(data)
    n = len(data)
    top = max(r[3] for r in data)
    grid = [round(x * 0.5, 2) for x in range(1, int(top * 2) + 2)]
    curves = []
    for p in grid:
        too_cheap = sum(r[0] >= p for r in data) / n
        cheap = sum(r[1] >= p for r in data) / n
        expensive = sum(r[2] <= p for r in data) / n
        too_exp = sum(r[3] <= p for r in data) / n
        curves.append((p, too_cheap, cheap, expensive, too_exp))

    def cross(f, g):
        prev = None
        for c in curves:
            d = f(c) - g(c)
            if prev is not None and prev[1] >= 0 >= d:
                return c[0]
            prev = (c[0], d)
        return None

    return {
        "PMC (preço mínimo aceitável)": cross(lambda c: c[1], lambda c: 1 - c[2]),
        "OPP (preço ótimo)": cross(lambda c: c[1], lambda c: c[4]),
        "IPP (preço indiferente)": cross(lambda c: c[2], lambda c: c[3]),
        "PME (preço máximo aceitável)": cross(lambda c: 1 - c[3], lambda c: c[4]),
    }, n


def main(path):
    with open(path, encoding="utf-8-sig") as f:
        reader = csv.reader(f)
        header = next(reader)
        data = [r for r in reader if any(x.strip() for x in r)]
    col = find_cols(header)
    get = lambda r, k: r[col[k]].strip() if k in col and col[k] < len(r) else ""
    n = len(data)
    out = [f"# Resultado da pesquisa — etapa 6", "", f"Respostas: **{n}**", ""]
    missing = [k for k in COLS if k not in col]
    if missing:
        out += [f"Colunas não encontradas: {', '.join(missing)}", ""]

    interesse = [int(get(r, "interesse")) for r in data if get(r, "interesse").isdigit()]
    alto = sum(x >= 4 for x in interesse)
    assin = Counter(get(r, "assinaria") for r in data if get(r, "assinaria"))
    top2 = assin["Certamente assinaria"] + assin["Provavelmente assinaria"]
    n_assin = sum(assin.values())
    funcs = Counter(f for r in data for f in FUNCOES if f in get(r, "funcoes"))
    difs = Counter(d for r in data for d in DIFICULDADES if d in get(r, "dificuldade"))
    vw, n_vw = van_westendorp([(num(get(r, "vw_barato_demais")), num(get(r, "vw_barato")), num(get(r, "vw_caro")), num(get(r, "vw_caro_demais"))) for r in data])

    analise = funcs["Avaliação da pele por foto"]
    diferencial = max(funcs["Acompanhar a evolução com fotos e gráficos"], funcs["Comparação de preços e opções mais baratas"])
    faixa_ok = vw and vw["PME (preço máximo aceitável)"] and vw["PME (preço máximo aceitável)"] >= PRECO_MINIMO

    out += ["## Critérios de decisão", "", "| Indicador | Meta | Resultado | Atingido? |", "|---|---|---|---|",
            f"| Interesse 4 ou 5 | 40% | {pct(alto, len(interesse))} ({alto} de {len(interesse)}) | {'sim' if interesse and alto / len(interesse) >= .4 else 'não'} |",
            f"| Assinaria a R$ 19,90 (certamente + provavelmente) | 25% | {pct(top2, n_assin)} ({top2} de {n_assin}) | {'sim' if n_assin and top2 / n_assin >= .25 else 'não'} |",
            f"| Preço máximo aceitável ≥ {brl(PRECO_MINIMO)} | sim | {brl(vw['PME (preço máximo aceitável)']) if vw and vw['PME (preço máximo aceitável)'] else 'sem dados suficientes'} | {'sim' if faixa_ok else 'não'} |",
            f"| Evolução ou economia acima de análise | sim | evolução/economia {diferencial} × análise {analise} | {'sim' if diferencial > analise else 'não'} |", ""]

    out += ["## Preço (Van Westendorp)", ""]
    if vw:
        out += [f"Respostas válidas e coerentes: {n_vw}", "", "| Ponto | Valor por mês |", "|---|---|"]
        out += [f"| {k} | {brl(v)} |" for k, v in vw.items()]
        out += ["", "Faixa aceitável: entre PMC e PME. Preço ótimo (OPP): onde menos gente acha barato demais ou caro demais.", ""]
    else:
        out += [f"Respostas válidas insuficientes ({n_vw}; mínimo 10).", ""]

    def table(title, counter, base):
        rows = [f"## {title}", "", "| Opção | Respostas | % |", "|---|---|---|"]
        rows += [f"| {k} | {v} | {pct(v, base)} |" for k, v in counter.most_common()]
        return rows + [""]

    out += table("Intenção de assinar a R$ 19,90", Counter({k: assin[k] for k in ASSINARIA}), n_assin)
    out += table("Funções mais úteis (até 3 por pessoa)", funcs, n)
    out += table("Maiores dificuldades", difs, n)
    out += table("Plano família a R$ 29,90", Counter(get(r, "familia") for r in data if get(r, "familia")), n)

    conf = [int(get(r, "confianca")) for r in data if get(r, "confianca").isdigit()]
    priv = [int(get(r, "privacidade")) for r in data if get(r, "privacidade").isdigit()]
    out += ["## Confiança e privacidade", "",
            f"- Confiança média numa avaliação por IA: {sum(conf) / len(conf):.1f} de 5" if conf else "- Confiança: sem dados",
            f"- Preocupação média com envio de fotos: {sum(priv) / len(priv):.1f} de 5 ({pct(sum(x >= 4 for x in priv), len(priv))} muito preocupados)" if priv else "- Privacidade: sem dados", ""]

    for key, title in [("idade", "Interesse por idade"), ("genero", "Interesse por gênero"), ("gasto", "Interesse por gasto mensal")]:
        groups = {}
        for r in data:
            g, i = get(r, key), get(r, "interesse")
            if g and i.isdigit():
                groups.setdefault(g, []).append(int(i))
        if groups:
            out += [f"## {title}", "", "| Grupo | Respostas | Interesse 4 ou 5 |", "|---|---|---|"]
            out += [f"| {g} | {len(v)} | {pct(sum(x >= 4 for x in v), len(v))} |" for g, v in sorted(groups.items(), key=lambda kv: -len(kv[1]))]
            out.append("")
    print("\n".join(out))


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("Uso: python3 scripts/analise_pesquisa.py respostas.csv")
    main(sys.argv[1])
