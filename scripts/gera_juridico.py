"""Gera as páginas públicas de Termos de Uso e Política de Privacidade do app a partir de docs/juridico/.

Uso: python3 scripts/gera_juridico.py
Saída: app/termos.html e app/privacidade.html (servidas pelo Worker; o endereço da política vai nas lojas).
Converte só o Markdown que esses documentos usam: títulos, parágrafos, listas, tabelas, negrito e links.
"""
import html
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGINAS = {"termos.html": "termos-de-uso.md", "privacidade.html": "politica-de-privacidade.md"}


def inline(t):
    t = html.escape(t, quote=False)
    t = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", t)
    t = re.sub(r"`(.+?)`", r"<code>\1</code>", t)
    t = re.sub(r"\[(.+?)\]\((https?://[^)]+)\)", r'<a href="\2">\1</a>', t)
    return re.sub(r"(?<![\"/>])(www\.gov\.br/anpd)", r'<a href="https://\1">\1</a>', t)


def converte(md):
    out, linhas, i = [], md.splitlines(), 0
    while i < len(linhas):
        l = linhas[i]
        if not l.strip():
            i += 1
        elif l.startswith("#"):
            n = len(l) - len(l.lstrip("#"))
            out.append(f"<h{n}>{inline(l[n:].strip())}</h{n}>")
            i += 1
        elif l.startswith("|"):
            rows = []
            while i < len(linhas) and linhas[i].startswith("|"):
                if not re.fullmatch(r"\|[\s|:-]+\|", linhas[i].strip()):
                    rows.append([c.strip() for c in linhas[i].strip().strip("|").split("|")])
                i += 1
            head = "".join(f"<th>{inline(c)}</th>" for c in rows[0])
            body = "".join("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>" for r in rows[1:])
            out.append(f'<div class="tbl-wrap"><table><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table></div>')
        elif l.startswith("- "):
            itens = []
            while i < len(linhas) and (linhas[i].startswith("- ") or linhas[i].startswith("  ")):
                if linhas[i].startswith("- "):
                    itens.append(linhas[i][2:])
                else:
                    itens[-1] += " " + linhas[i].strip()
                i += 1
            out.append("<ul>" + "".join(f"<li>{inline(t)}</li>" for t in itens) + "</ul>")
        else:
            par = []
            while i < len(linhas) and linhas[i].strip() and not linhas[i].startswith(("#", "|", "- ")):
                par.append(linhas[i].strip())
                i += 1
            out.append(f"<p>{inline(' '.join(par))}</p>")
    return "\n".join(out)


def pagina(titulo, corpo):
    return f"""<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{html.escape(titulo)}</title>
<link rel="icon" href="icones/icone-192.png" type="image/png">
<link rel="stylesheet" href="estilo.css">
</head>
<body>
<main class="wrap doc">
<p><a href="./">← Voltar ao MY Skin AI</a></p>
{corpo}
</main>
</body>
</html>
"""


for saida, fonte in PAGINAS.items():
    md = (ROOT / "docs/juridico" / fonte).read_text()
    titulo = md.splitlines()[0].lstrip("# ").strip()
    (ROOT / "app" / saida).write_text(pagina(titulo, converte(md)))
    print(f"app/{saida} <- docs/juridico/{fonte}")
