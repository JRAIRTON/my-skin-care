// Grava o passo a passo do app em quadros PNG (30 por segundo), com os dados fictícios da "Ana".
// Cada tela dura o tempo da sua fala (duracoes.json) + 0,9 s. Uso (com o app servido em localhost:8765):
//   node scripts/video/grava.mjs <pasta-quadros> <duracoes.json> <tempos.json>
const { chromium } = await import("playwright").catch(() => import("/opt/node-tools/node_modules/playwright/index.mjs"));
const outDir = process.argv[2];
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: "light" });
const p = await ctx.newPage();
const erros = []; p.on("pageerror", (e) => erros.push(e.message));
await p.goto("http://localhost:8765/"); await p.waitForTimeout(600);
await p.evaluate(async () => {
  const db = await new Promise((ok) => { const r = indexedDB.open("myskin", 1); r.onupgradeneeded = () => { r.result.createObjectStore("kv"); r.result.createObjectStore("analises", { keyPath: "id" }); }; r.onsuccess = () => ok(r.result); });
  const ymd = (d) => d.toISOString().slice(0, 10);
  const dia = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return ymd(d); };
  const cats = ["textura","poros","linhas","firmeza","manchas","uniformidade","vermelhidao","oleosidade","brilho","hidratacao"];
  const mk = (base) => Object.fromEntries(cats.map((k, i) => { const nota = Math.max(45, Math.min(96, base[i])); const grau = nota >= 90 ? 0 : nota >= 75 ? 1 : nota >= 60 ? 2 : nota >= 40 ? 3 : 4; return [k, { grau, nota }]; }));
  const sets = [
    [70, 62, 80, 84, 58, 64, 78, 60, 66, 68],
    [74, 66, 81, 84, 63, 69, 82, 66, 71, 75],
    [79, 70, 82, 85, 68, 74, 86, 72, 76, 82],
  ];
  const datas = [dia(62), dia(33), dia(4)];
  const { recomenda } = await import("/recomenda.js");
  const cat = await (await fetch("/catalogo.json")).json();
  const perfil = { nome: "Ana", idade: 34, tipoPele: "mista", fototipo: 3, objetivos: ["Manchas", "Poros"] };
  const r = recomenda(perfil, mk(sets[2]), cat);
  const todos = [...r.passos.manha, ...r.passos.noite].map((x) => x.id);
  const checks = {}; for (let n = 1; n <= 12; n++) checks[dia(n)] = todos;
  checks[dia(0)] = r.passos.manha.map((x) => x.id);
  const tx = db.transaction(["kv", "analises"], "readwrite");
  tx.objectStore("kv").put({ nome: "Ana", idade: 34, tipoPele: "mista", fototipo: 3, objetivos: ["Manchas", "Poros"], consentimento: Date.now(), semCodigo: true }, "perfil");
  sets.forEach((s, i) => { const notas = mk(s); const v = Object.values(notas).map((n) => n.nota); tx.objectStore("analises").put({ id: "a" + i, data: datas[i], criadoEm: datas[i] + "T10:00:00Z", notas, skin_score: Math.round(v.reduce((a, b) => a + b) / v.length), confianca: "alta", idade_aparente: 32, modelo: "claude-sonnet-5-5", nivelQualidade: "good" }); });
  tx.objectStore("kv").put(checks, "checks");
  tx.objectStore("kv").put(datas[0], "rotinaInicio");
  await new Promise((ok) => (tx.oncomplete = ok));
});
await p.reload(); await p.waitForTimeout(900);

const fs = await import("node:fs");
const dir = outDir; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
let f = 0, ultimo = null;
const quadro = async () => { const n = `${dir}/f${String(f++).padStart(5, "0")}.png`; await p.screenshot({ path: n }); ultimo = n; };
const segura = async (seg) => { for (let i = 0; i < Math.round(seg * 30); i++) fs.copyFileSync(ultimo, `${dir}/f${String(f++).padStart(5, "0")}.png`); };
const grava = async (seg) => { for (let i = 0; i < Math.round(seg * 30); i++) await quadro(); };
await p.addStyleTag({ content: ".toque{position:fixed;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;background:rgba(59,42,34,.22);border:2px solid rgba(59,42,34,.55);pointer-events:none;z-index:99999;transition:transform .25s,opacity .25s}" });
const toca = async (sel) => {
  const el = await p.$(sel); const bx = await el.boundingBox();
  await p.evaluate(([x, y]) => { const d = document.createElement("div"); d.className = "toque"; d.style.left = x + "px"; d.style.top = y + "px"; document.body.append(d); }, [bx.x + bx.width / 2, bx.y + bx.height / 2]);
  await grava(0.35);
  await p.evaluate(() => document.querySelector(".toque")?.remove());
  await el.click();
  await grava(0.6);
};
const rola = async (ate, seg) => {
  const y0 = await p.evaluate(() => scrollY), n = Math.round(seg * 30);
  for (let i = 1; i <= n; i++) { const t = i / n, e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; await p.evaluate((y) => scrollTo(0, y), y0 + (ate - y0) * e); await quadro(); }
};

const DUR = JSON.parse(fs.readFileSync(process.argv[3], "utf8"));
const inicios = {};
let seg0 = 0;
const segmento = async (nome, acoes) => {
  seg0 = f; inicios[nome] = f / 30;
  await acoes();
  const alvo = Math.round((DUR[nome] + 0.9) * 30);
  if (f - seg0 < alvo) await segura((alvo - (f - seg0)) / 30);
};
await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(600);
await segmento("1-inicio", async () => { await quadro(); });
await segmento("2-foto", async () => { await toca('[data-act="tela:analisar"]'); });
await segmento("3-resultado", async () => { await toca('[data-act="tela:inicio"]'); await toca('button:has-text("Ver detalhes")'); await segura(0.5); await rola(900, 3.0); });
await segmento("4-evolucao", async () => { await toca('[data-act="tela:evolucao"]'); await segura(0.8); await rola(700, 2.2); });
await segmento("5-rotina", async () => { await toca('[data-act="tela:rotina"]'); await segura(0.8); await rola(1300, 2.8); });
await segmento("6-produtos", async () => { await toca('[data-act="tela:produtos"]'); await segura(0.8); await rola(1100, 2.6); });
await segmento("7-final", async () => {
  await toca('[data-act="tela:inicio"]');
  await p.evaluate(() => {
    const d = document.createElement("div");
    d.style.cssText = "position:fixed;inset:0;z-index:99998;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;background:var(--bg);opacity:0;transition:opacity .5s;text-align:center;padding:24px";
    d.innerHTML = `<div style="transform:scale(2.2);margin-bottom:26px">${document.querySelector(".brand svg").outerHTML}</div>
      <div style="font-family:var(--display);font-size:40px;font-weight:600;line-height:1.05">MY <span style="color:var(--gold-ink)">Skin Care</span></div>
      <div style="font-family:var(--display);font-size:26px;color:var(--ink-2)">Sua pele, acompanhada de perto.</div>
      <div style="margin-top:18px;background:var(--espresso);color:var(--cream);padding:14px 26px;border-radius:999px;font-weight:700;font-size:19px">Primeira análise grátis</div>
      <div style="font-size:19px;font-weight:600;color:var(--ink-2)">myskincareapp.com.br</div>`;
    document.body.append(d); requestAnimationFrame(() => (d.style.opacity = 1));
  });
  await grava(0.7);
});
fs.writeFileSync(process.argv[4], JSON.stringify({ inicios, total: f / 30 }));
console.log("quadros", f, "segundos", (f / 30).toFixed(1), "erros", erros);
await b.close();
