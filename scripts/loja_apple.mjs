// Gera as capturas de tela da App Store (docs/loja/app-store/): iPhone 6,9" em 1290x2796, com título, as mesmas
// telas e frases das imagens do Google Play (scripts/loja_play.mjs). As telas são tiradas do app com os dados fictícios da
// "Ana" (os mesmos do vídeo). Precisa do app em localhost:8765 (python3 -m http.server em app/), do site em
// localhost:8787 (wrangler dev em site/, para as fontes e o estilo do logo) e do Playwright.
//   node scripts/loja_play.mjs
// Depois: python3 -c (no fim do arquivo) tira o canal alfa, que a Apple não aceita nas capturas.
const { chromium } = await import("playwright").catch(() => import("/opt/node-tools/node_modules/playwright/index.mjs"));
const fs = await import("node:fs");
const SAIDA = new URL("../docs/loja/app-store/", import.meta.url).pathname;
fs.mkdirSync(SAIDA, { recursive: true });
const b = await chromium.launch();

// 1) telas do app, em 3x (1170x2532)
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, colorScheme: "light" });
const p = await ctx.newPage();
await p.goto("http://localhost:8765/"); await p.waitForTimeout(600);
await p.evaluate(async () => {
  const db = await new Promise((ok) => { const r = indexedDB.open("myskin", 1); r.onupgradeneeded = () => { r.result.createObjectStore("kv"); r.result.createObjectStore("analises", { keyPath: "id" }); }; r.onsuccess = () => ok(r.result); });
  const ymd = (d) => d.toISOString().slice(0, 10);
  const dia = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return ymd(d); };
  const cats = ["textura","poros","linhas","firmeza","manchas","uniformidade","vermelhidao","oleosidade","brilho","hidratacao"];
  const mk = (base) => Object.fromEntries(cats.map((k, i) => { const nota = Math.max(45, Math.min(96, base[i])); const grau = nota >= 90 ? 0 : nota >= 75 ? 1 : nota >= 60 ? 2 : nota >= 40 ? 3 : 4; return [k, { grau, nota }]; }));
  const sets = [[70, 62, 80, 84, 58, 64, 78, 60, 66, 68], [74, 66, 81, 84, 63, 69, 82, 66, 71, 75], [79, 70, 82, 85, 68, 74, 86, 72, 76, 82]];
  const datas = [dia(62), dia(33), dia(4)];
  const { recomenda } = await import("/recomenda.js");
  const cat = await (await fetch("/catalogo.json")).json();
  const perfil = { nome: "Ana", idade: 34, tipoPele: "mista", fototipo: 3, objetivos: ["Manchas", "Poros"] };
  const r = recomenda(perfil, mk(sets[2]), cat);
  const todos = [...r.passos.manha, ...r.passos.noite].map((x) => x.id);
  const checks = {}; for (let n = 1; n <= 12; n++) checks[dia(n)] = todos;
  checks[dia(0)] = r.passos.manha.map((x) => x.id);
  const tx = db.transaction(["kv", "analises"], "readwrite");
  tx.objectStore("kv").put({ ...perfil, consentimento: Date.now(), semCodigo: true }, "perfil");
  sets.forEach((s, i) => { const notas = mk(s); const v = Object.values(notas).map((n) => n.nota); tx.objectStore("analises").put({ id: "a" + i, data: datas[i], criadoEm: datas[i] + "T10:00:00Z", notas, skin_score: Math.round(v.reduce((a, b) => a + b) / v.length), confianca: "alta", idade_aparente: 32, nivelQualidade: "good" }); });
  tx.objectStore("kv").put(checks, "checks");
  tx.objectStore("kv").put(datas[0], "rotinaInicio");
  await new Promise((ok) => (tx.oncomplete = ok));
});
await p.reload(); await p.waitForTimeout(900);
const tela = async (nome, ir, rolar = 0) => {
  await ir(); await p.waitForTimeout(700);
  await p.evaluate((y) => scrollTo(0, y), rolar); await p.waitForTimeout(400);
  return (await p.screenshot()).toString("base64");
};
const TELAS = {
  inicio: await tela("inicio", async () => {}),
  analisar: await tela("analisar", () => p.click('[data-act="tela:analisar"]')),
  resultado: await tela("resultado", async () => { await p.click('[data-act="tela:inicio"]'); await p.waitForTimeout(500); await p.click('button:has-text("Ver detalhes")'); }, 0),
  evolucao: await tela("evolucao", () => p.click('[data-act="tela:evolucao"]')),
  rotina: await tela("rotina", () => p.click('[data-act="tela:rotina"]')),
  produtos: await tela("produtos", () => p.click('[data-act="tela:produtos"]')),
};
await ctx.close();

// 2) composições, com as fontes e o logo do site
const FONTES = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Instrument+Serif:ital@1&family=Manrope:wght@400;500;600;700&display=swap"><link rel="stylesheet" href="estilo.css">`;
const LOGO = '<i>my</i><b>sk<span class="i">ı</span>n</b><span class="care">care</span>';
const visor = (cor, esp) => `<svg viewBox="0 0 100 100" style="position:absolute;inset:0;width:100%;height:100%" fill="none" stroke="${cor}" stroke-width="${esp}" stroke-linecap="square">
  <path d="M8 26V8h18M74 8h18v18M92 74v18H74M26 92H8V74"/></svg>`;
const simbolo = (px, fundo) => `<div style="position:relative;width:${px}px;height:${px}px;background:${fundo};display:grid;place-items:center;overflow:hidden">
  <div style="position:relative;width:${px * 0.62}px;height:${px * 0.62}px;display:grid;place-items:center">${visor("#D2A587", 5)}
  <span style="font-family:'Instrument Serif',serif;font-style:italic;color:#F7EFE7;font-size:${px * 0.36}px;line-height:1;margin-top:-${px * 0.04}px;letter-spacing:-.02em">my</span></div></div>`;
const pagina = async (w, h, corpo, saida) => {
  const pg = await (await b.newContext({ viewport: { width: w, height: h }, bypassCSP: true })).newPage();
  await pg.goto("http://localhost:8787/404.html");
  await pg.setContent(`<!doctype html><html><head><base href="http://localhost:8787/">${FONTES}<style>h1{font-variant-numeric:lining-nums}html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden;background:#F7F2EC}</style></head><body>${corpo}</body></html>`);
  await pg.waitForLoadState("networkidle"); await pg.waitForTimeout(500);
  await pg.screenshot({ path: SAIDA + saida });
  await pg.close();
};

// capturas 1290x2796 (iPhone 6,9"): título em cima e o celular saindo pela borda de baixo
const CAPTURAS = [
  ["inicio", "Sua pele, acompanhada de perto", "Uma foto do rosto e você recebe o seu Skin Score"],
  ["resultado", "Notas de 0 a 100 para 10 aspectos", "Com a explicação de cada nota e o que mais ajuda"],
  ["evolucao", "Veja o que melhorou mês a mês", "Gráfico da evolução e o antes e depois por aspecto"],
  ["rotina", "Rotina de manhã e de noite", "Feita para a sua pele, com os ativos entrando aos poucos"],
  ["produtos", "Produtos que cabem no bolso", "Preço de referência e alternativas mais baratas"],
  ["analisar", "Câmera guiada, em menos de 1 minuto", "Mostra o contorno do rosto e avisa se a luz está boa"],
];
let n = 1;
for (const [chave, titulo, sub] of CAPTURAS) {
  await pagina(1290, 2796, `<div style="width:1290px;height:2796px;background:linear-gradient(180deg,#F7F2EC 0%,#EFE4D8 100%);position:relative;overflow:hidden;text-align:center">
    <span class="logo" style="font-size:58px;display:inline-block;margin-top:150px">${LOGO}</span>
    <h1 style="font-family:'Cormorant Garamond',serif;font-weight:600;font-size:112px;line-height:1.02;color:#2E211B;margin:56px 90px 0">${titulo}</h1>
    <p style="font:500 46px/1.35 Manrope,sans-serif;color:#6B5245;margin:40px 130px 0">${sub}</p>
    <div style="position:absolute;left:150px;top:860px;width:990px;border-radius:110px;background:#1F1612;padding:28px;box-shadow:0 40px 90px rgba(59,42,34,.28)">
      <img src="data:image/png;base64,${TELAS[chave]}" style="display:block;width:100%;border-radius:84px">
    </div></div>`, `tela-${n++}-${chave}.png`);
}
await b.close();
// sem canal alfa (a Apple recusa capturas com transparência)
const { execFileSync } = await import("node:child_process");
execFileSync("python3", ["-c", "import sys,glob\nfrom PIL import Image\nfor f in glob.glob(sys.argv[1]+'tela-*.png'): Image.open(f).convert('RGB').save(f)", SAIDA]);
console.log("ok", fs.readdirSync(SAIDA));
