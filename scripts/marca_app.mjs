// Gera as imagens da marca do app (símbolo "my" no visor, nas cores creme/nude/café):
// ícones do app web (app/icones) e as fontes do app das lojas (mobile/assets), que o
// @capacitor/assets transforma nos ícones e telas de abertura de Android e iPhone.
// Precisa do site rodando em localhost:8787 (só para carregar as fontes) e do Playwright.
//   node scripts/marca_app.mjs && cd mobile && npx @capacitor/assets generate ...  (ver docs/etapa8-lojas.md)
const { chromium } = await import("playwright").catch(() => import("/opt/node-tools/node_modules/playwright/index.mjs"));
const RAIZ = new URL("..", import.meta.url).pathname;
const FONTES = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&display=swap">`;
const CAFE = "#3B2A22", NUDE = "#D2A587", CREME = "#F7EFE7";
const visor = (cor) => `<svg viewBox="0 0 100 100" style="position:absolute;inset:0;width:100%;height:100%" fill="none" stroke="${cor}" stroke-width="5" stroke-linecap="square">
  <path d="M8 26V8h18M74 8h18v18M92 74v18H74M26 92H8V74"/></svg>`;
// lado = tamanho da imagem; escala = fração ocupada pelo visor; fundo "transparent" para a camada da frente
const simbolo = (lado, fundo, escala, corMy = CREME, corVisor = NUDE) => { const v = lado * escala; return `<div style="width:${lado}px;height:${lado}px;background:${fundo};display:grid;place-items:center">
  <div style="position:relative;width:${v}px;height:${v}px;display:grid;place-items:center">${visor(corVisor)}
  <span style="font-family:'Instrument Serif',serif;font-style:italic;color:${corMy};font-size:${v * 0.58}px;line-height:1;margin-top:-${v * 0.065}px;letter-spacing:-.02em">my</span></div></div>`; };
const b = await chromium.launch();
const gera = async (lado, corpo, saida) => {
  const p = await (await b.newContext({ viewport: { width: lado, height: lado }, bypassCSP: true })).newPage();
  await p.goto("http://localhost:8787/404.html");
  await p.setContent(`<!doctype html><html><head>${FONTES}<style>html,body{margin:0;background:transparent}</style></head><body>${corpo}</body></html>`);
  await p.waitForLoadState("networkidle"); await p.waitForTimeout(400);
  await p.screenshot({ path: RAIZ + saida, omitBackground: true });
  await p.close();
};
// app web (instalado pelo navegador): quadrado cheio; o sistema arredonda. "maskable" com folga para cortes.
await gera(192, simbolo(192, CAFE, 0.62), "app/icones/icone-192.png");
await gera(512, simbolo(512, CAFE, 0.62), "app/icones/icone-512.png");
await gera(512, simbolo(512, CAFE, 0.5), "app/icones/icone-maskable-512.png");
await gera(180, simbolo(180, CAFE, 0.62), "app/icones/apple-touch-icon.png");
// app das lojas: ícone inteiro, camada da frente (área segura de 66%) e fundo; telas de abertura claro e escuro
await gera(1024, simbolo(1024, CAFE, 0.62), "mobile/assets/icon-only.png");
await gera(1024, simbolo(1024, "transparent", 0.42), "mobile/assets/icon-foreground.png");
await gera(1024, `<div style="width:1024px;height:1024px;background:${CAFE}"></div>`, "mobile/assets/icon-background.png");
await gera(2732, simbolo(2732, "#F7F2EC", 0.2, "#3B2A22", "#B88A6A"), "mobile/assets/splash.png");
await gera(2732, simbolo(2732, "#17110E", 0.2, CREME, NUDE), "mobile/assets/splash-dark.png");
await b.close();
console.log("ok");
