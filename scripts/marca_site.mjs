// Gera as imagens da marca do site (identidade "Direção 04"): ícones (símbolo "my" no visor) e a prévia
// de compartilhamento og.png. Precisa do site rodando em localhost:8787 (wrangler dev em site/) e do Playwright.
//   node scripts/marca_site.mjs
const { chromium } = await import("playwright").catch(() => import("/opt/node-tools/node_modules/playwright/index.mjs"));
const RAIZ = new URL("../site/public/", import.meta.url).pathname;
const FONTES = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@400;500;600;700&display=swap"><link rel="stylesheet" href="estilo.css">`;
// visor: quatro cantos verdes em volta do "my"
const visor = (cor, esp) => `<svg viewBox="0 0 100 100" style="position:absolute;inset:0;width:100%;height:100%" fill="none" stroke="${cor}" stroke-width="${esp}" stroke-linecap="square">
  <path d="M8 26V8h18M74 8h18v18M92 74v18H74M26 92H8V74"/></svg>`;
const simbolo = (px, fundo, raio) => `<div style="position:relative;width:${px}px;height:${px}px;background:${fundo};border-radius:${raio}px;display:grid;place-items:center;overflow:hidden">
  <div style="position:relative;width:${px * 0.62}px;height:${px * 0.62}px;display:grid;place-items:center">${visor("#4FB3A9", 5)}
  <span style="font-family:'Instrument Serif',serif;font-style:italic;color:#fff;font-size:${px * 0.36}px;line-height:1;margin-top:-${px * 0.04}px;letter-spacing:-.02em">my</span></div></div>`;
const b = await chromium.launch();
const pagina = async (w, h, corpo, saida) => {
  const p = await (await b.newContext({ viewport: { width: w, height: h }, bypassCSP: true })).newPage();
  await p.goto("http://localhost:8787/404.html");
  await p.setContent(`<!doctype html><html><head><base href="http://localhost:8787/">${FONTES}<style>html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden;background:transparent}</style></head><body>${corpo}</body></html>`);
  await p.waitForLoadState("networkidle"); await p.waitForTimeout(400);
  await p.screenshot({ path: RAIZ + saida, omitBackground: true });
  await p.close();
};
// ícones: favicon e atalho do iPhone (cantos arredondados no favicon; o iPhone arredonda sozinho)
await pagina(192, 192, simbolo(192, "#0F1B22", 42), "icones/icone-192.png");
await pagina(512, 512, simbolo(512, "#0F1B22", 112), "icones/icone-512.png");
await pagina(180, 180, simbolo(180, "#0F1B22", 0), "icones/apple-touch-icon.png");
// prévia de compartilhamento 1200x630
await pagina(1200, 630, `<div style="display:flex;width:1200px;height:630px;background:#F6F8F7">
  <div style="flex:1;padding:78px 70px;display:flex;flex-direction:column;justify-content:center">
    <span class="logo" style="font-size:64px">${'<i>my</i><b>sk<span class="i">ı</span>n</b><span class="care">care</span>'}</span>
    <p style="margin:26px 0 0;font:600 17px/1 Manrope,sans-serif;letter-spacing:.32em;color:#1F7A75">ANÁLISE DE PELE POR FOTO</p>
    <h1 style="font-family:'Instrument Serif',serif;font-weight:400;font-size:66px;line-height:1.02;color:#0F1B22;margin:40px 0 0">Sua pele,<br>acompanhada de perto.</h1>
    <span style="align-self:flex-start;margin-top:36px;background:#1F7A75;color:#fff;font:700 24px/1 Manrope,sans-serif;padding:18px 30px;border-radius:999px">Primeira análise grátis</span>
  </div>
  <div style="width:430px;background:#0F1B22;display:grid;place-items:center">${simbolo(300, "transparent", 0)}</div></div>`, "img/og.png");
await b.close();
console.log("ok");
