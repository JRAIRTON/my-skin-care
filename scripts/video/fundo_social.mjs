// Fundo 1080x1920 da versão para Reels/Stories (marca, título e endereço), com o site servido em localhost:8787.
//   node scripts/video/fundo_social.mjs <pasta-saida>   -> <pasta-saida>/social-fundo.png
const { chromium } = await import("playwright").catch(() => import("/opt/node-tools/node_modules/playwright/index.mjs"));
const S = process.argv[2];
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1080, height: 1920 }, bypassCSP: true })).newPage();
await p.goto("http://localhost:8787/404.html");
await p.setContent(`<!doctype html><html><head><base href="http://localhost:8787/">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Instrument+Serif:ital@1&family=Manrope:wght@500;600;700&display=swap">
<link rel="stylesheet" href="estilo.css"><style>
html,body{margin:0;width:1080px;height:1920px;overflow:hidden}
.c{position:relative;width:1080px;height:1920px;text-align:center}
.t{position:absolute;top:70px;left:0;right:0}

.t h1{font-size:76px;line-height:1.02;margin:22px 0 0}
.f{position:absolute;left:250px;top:330px;width:580px;height:1255px;border-radius:64px;background:var(--cafe);box-shadow:0 50px 90px -40px rgba(59,42,34,.6)}
.r{position:absolute;bottom:90px;left:0;right:0}
.r p{font-size:34px;color:var(--tinta-2);margin:0 0 18px}
.r .pill{display:inline-block;background:var(--cafe);color:var(--creme);padding:20px 40px;border-radius:999px;font-weight:700;font-size:36px}
</style></head><body><div class="c">
<div class="t"><span class="logo" style="font-size:60px"><i>my</i><b>sk<span class="i">ı</span>n</b><span class="care">care</span></span>
<h1>Sua pele, acompanhada de perto.</h1></div>
<div class="f"></div>
<div class="r"><p>Primeira análise grátis</p><span class="pill">myskincareapp.com.br</span></div>
</div></body></html>`);
await p.waitForLoadState("networkidle"); await p.waitForTimeout(500);
await p.screenshot({ path: `${S}/social-fundo.png` });
await b.close();
