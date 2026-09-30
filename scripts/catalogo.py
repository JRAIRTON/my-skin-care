"""Regenera docs/catalogo-v1.md e o catálogo embutido em prototipo/index.html a partir de docs/catalogo-v1.json."""
import json, re
from collections import OrderedDict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
C = json.loads((ROOT / "docs/catalogo-v1.json").read_text())
byid = {c["id"]: c for c in C}

# Markdown: keep the fixed intro and the closing sections, rebuild the product tables.
md_path = ROOT / "docs/catalogo-v1.md"
md = md_path.read_text()
head = md[: md.index("## Limpeza")]
tail = md[md.index("## Rotina mínima por objetivo"):]
groups = OrderedDict()
for c in C:
    groups.setdefault(c["categoria"], []).append(c)
body = []
for cat, items in groups.items():
    body += [f"## {cat}", "", "| Produto | Ativos declarados | Tamanho | Preço (R$) | Faixa | Para | Alternativa mais barata |", "|---|---|---|---|---|---|---|"]
    for c in items:
        pr = f"{c['preco_min']}" if c["preco_min"] == c["preco_max"] else f"{c['preco_min']}–{c['preco_max']}"
        alt = f"{byid[c['alternativa']]['marca']} {byid[c['alternativa']]['produto']}" if c["alternativa"] else "—"
        body.append(f"| **{c['marca']}** {c['produto']} | {c['ativos']} | {c['tamanho']} | {pr} | {c['faixa']} | {', '.join(c['objetivos'])} | {alt} |")
    notes = [c for c in items if c["obs"]]
    if notes:
        body += ["", *[f"- **{c['marca']} {c['produto']}:** {c['obs']}" for c in notes]]
    body.append("")
md_path.write_text(head + "\n".join(body) + "\n" + tail)

# App: replace the embedded CATALOGO constant.
keep = ["id", "categoria", "marca", "produto", "ativos", "tamanho", "preco_min", "preco_max", "faixa", "objetivos", "pele", "obs", "fontes", "alternativa", "data_preco"]
compact = json.dumps([{k: c[k] for k in keep} for c in C], ensure_ascii=False)
html_path = ROOT / "prototipo/index.html"
html = html_path.read_text()
html, n = re.subn(r"const CATALOGO = \[.*?\];\n", lambda m: f"const CATALOGO = {compact};\n", html, count=1, flags=re.S)
assert n == 1, "CATALOGO não encontrado"
html_path.write_text(html)
print(f"{len(C)} produtos · markdown e app atualizados")
