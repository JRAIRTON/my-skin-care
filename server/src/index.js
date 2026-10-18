// MY Skin AI — servidor de análise (Cloudflare Worker).
// POST /analise com a foto no corpo devolve as notas do Método MY Skin v1, pelo mesmo pedido e schema
// validados na etapa 5 (src/metodo.json é gerado por scripts/etapa5_validacao.py --exportar-metodo).
import Anthropic from "@anthropic-ai/sdk";
import METODO from "./metodo.json" with { type: "json" };

const TIPOS = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024; // image limit of the Claude API

export function normaliza(bruto) {
  const notas = {};
  for (const k of METODO.categorias) {
    const v = bruto.notas?.[k] || {};
    let g = v.avaliavel === false ? null : v.grau;
    let n = v.avaliavel === false ? null : v.nota;
    g = Number.isInteger(g) && g >= 0 && g <= 4 ? g : null;
    n = Number.isInteger(n) ? Math.max(0, Math.min(100, n)) : null;
    if (g !== null) {
      const [lo, hi] = METODO.faixas[g];
      n = n === null ? Math.round((lo + hi) / 2) : Math.max(lo, Math.min(hi, n));
    }
    notas[k] = { grau: g, nota: n };
  }
  const v = Object.values(notas).map((x) => x.nota).filter((x) => x !== null);
  return {
    notas,
    skin_score: v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null, // same rule as the prototype
    confianca: bruto.confianca ?? null,
    idade_aparente: bruto.idade_aparente || null,
  };
}

function base64(buf) {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

// enough to compare with the key list in the Anthropic Console, never enough to use the key
export function impressao(chave) {
  const k = String(chave || "").trim();
  return { inicio: k.slice(0, 13), fim: k.length > 20 ? k.slice(-4) : "", tamanho: k.length };
}

async function mesmoToken(a, b) {
  // compare SHA-256 digests so the comparison takes the same time whatever the input
  const enc = new TextEncoder();
  const [x, y] = await Promise.all([a, b].map((t) => crypto.subtle.digest("SHA-256", enc.encode(t))));
  const u = new Uint8Array(x), w = new Uint8Array(y);
  let d = 0;
  for (let i = 0; i < u.length; i++) d |= u[i] ^ w[i];
  return d === 0;
}

export async function analisa(client, imagem, tipo) {
  const resp = await client.beta.messages.create({
    model: METODO.modelo,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    messages: [{ role: "user", content: [
      { type: "image", source: { type: "base64", media_type: tipo, data: base64(imagem) } },
      { type: "text", text: METODO.prompt },
    ] }],
    output_config: { format: { type: "json_schema", schema: METODO.schema } },
  });
  if (resp.stop_reason === "refusal") return { recusa: true };
  const texto = resp.content.find((b) => b.type === "text")?.text;
  if (!texto) throw new Error("resposta sem texto");
  return {
    ...normaliza(JSON.parse(texto)),
    modelo: resp.model, // differs from METODO.modelo only if a refusal fallback answered
    tokens: { entrada: resp.usage.input_tokens, saida: resp.usage.output_tokens },
  };
}

// Access logs required by the Marco Civil da Internet (art. 15): date and time (UTC), IP, route and
// status of every request that reaches the Worker, kept for 6 months in D1. Never the photo or the code.
export const RETENCAO_DIAS = 183;
let tabelaPronta = null;
function garanteTabela(db) {
  tabelaPronta ||= db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS acessos (quando TEXT NOT NULL, ip TEXT NOT NULL, rota TEXT NOT NULL, status INTEGER NOT NULL)"),
    db.prepare("CREATE INDEX IF NOT EXISTS acessos_quando ON acessos (quando)"),
  ]).catch((e) => { tabelaPronta = null; throw e; });
  return tabelaPronta;
}
export async function registraAcesso(env, req, status, agora = new Date()) {
  if (!env.REGISTROS) return;
  try {
    await garanteTabela(env.REGISTROS);
    await env.REGISTROS.prepare("INSERT INTO acessos (quando, ip, rota, status) VALUES (?1, ?2, ?3, ?4)")
      .bind(agora.toISOString(), req.headers.get("CF-Connecting-IP") || "sem-ip", new URL(req.url).pathname, status).run();
  } catch (e) {
    console.error("falha ao registrar acesso", e?.message); // a logging failure must not break the app
  }
}
export async function apagaAcessosAntigos(env, agora = new Date()) {
  if (!env.REGISTROS) return;
  await garanteTabela(env.REGISTROS);
  const limite = new Date(agora.getTime() - RETENCAO_DIAS * 864e5).toISOString();
  await env.REGISTROS.prepare("DELETE FROM acessos WHERE quando < ?1").bind(limite).run();
  // the IP of a free analysis only serves the per-day limit: blank it after 2 days, keep the install id
  await garanteGratis(env.REGISTROS);
  const doisDias = new Date(agora.getTime() - 2 * 864e5).toISOString();
  await env.REGISTROS.prepare("UPDATE gratis SET ip = '' WHERE quando < ?1 AND ip <> ''").bind(doisDias).run();
  // the IP of an invite only serves the 30-day limit: blank it after 31 days
  await garanteIndicacao(env.REGISTROS);
  const trintaUm = new Date(agora.getTime() - 31 * 864e5).toISOString();
  await env.REGISTROS.prepare("UPDATE indicacoes SET ip = '' WHERE quando < ?1 AND ip <> ''").bind(trintaUm).run();
}

// ---------- anonymous usage counts ----------
// POST /evento {nome, plataforma}: adds 1 to the day's count of that event. Only the day, the event name
// and the platform are kept: no IP, no install id, nothing from the profile. GET /metricas shows them.
export const EVENTOS = new Set(["primeiro_acesso", "abriu", "consentiu", "primeira_analise", "analise_gratis", "analise",
  "viu_planos", "iniciou_compra", "assinou", "compartilhou", "clicou_loja", "convidou", "usou_convite"]);
const PLATAFORMAS = new Set(["web", "ios", "android"]);
let metricasPronta = null;
function garanteMetricas(db) {
  metricasPronta ||= db.prepare("CREATE TABLE IF NOT EXISTS metricas (dia TEXT NOT NULL, nome TEXT NOT NULL, plataforma TEXT NOT NULL, n INTEGER NOT NULL, PRIMARY KEY (dia, nome, plataforma))")
    .run().catch((e) => { metricasPronta = null; throw e; });
  return metricasPronta;
}
export async function contaEvento(env, corpo, agora = new Date()) {
  let d;
  try { d = JSON.parse(corpo); } catch { return false; }
  if (!d || !EVENTOS.has(d.nome) || !PLATAFORMAS.has(d.plataforma) || !env.REGISTROS) return false;
  await garanteMetricas(env.REGISTROS);
  await env.REGISTROS.prepare("INSERT INTO metricas (dia, nome, plataforma, n) VALUES (?1, ?2, ?3, 1) ON CONFLICT (dia, nome, plataforma) DO UPDATE SET n = n + 1")
    .bind(agora.toISOString().slice(0, 10), d.nome, d.plataforma).run();
  return true;
}
export async function leMetricas(env, dias = 30, agora = new Date()) {
  await garanteMetricas(env.REGISTROS);
  const desde = new Date(agora.getTime() - (dias - 1) * 864e5).toISOString().slice(0, 10);
  const { results: diario } = await env.REGISTROS.prepare("SELECT dia, nome, plataforma, n FROM metricas WHERE dia >= ?1 ORDER BY dia DESC").bind(desde).all();
  const { results: total } = await env.REGISTROS.prepare("SELECT nome, plataforma, SUM(n) AS n FROM metricas GROUP BY nome, plataforma").all();
  return { desde, diario, total };
}

// ---------- who may analyse ----------
// 1) invite code (APP_TOKEN): unlimited; 2) first analysis free per install (X-Usuario, an id the app
// creates), at most GRATIS_POR_IP_DIA per IP per day; 3) active subscription checked in RevenueCat.
export const GRATIS_POR_IP_DIA = 3;
const ID_USUARIO = /^[A-Za-z0-9_-]{16,64}$/;
let gratisPronta = null;
function garanteGratis(db) {
  gratisPronta ||= db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS gratis (usuario TEXT PRIMARY KEY, ip TEXT NOT NULL, quando TEXT NOT NULL)"),
    db.prepare("CREATE INDEX IF NOT EXISTS gratis_ip ON gratis (ip, quando)"),
  ]).catch((e) => { gratisPronta = null; throw e; });
  return gratisPronta;
}
async function podeGratis(env, usuario, ip, agora) {
  if (!env.REGISTROS) return false;
  await garanteGratis(env.REGISTROS);
  const usou = await env.REGISTROS.prepare("SELECT 1 AS x FROM gratis WHERE usuario = ?1").bind(usuario).first();
  if (usou) return false;
  const desde = new Date(agora.getTime() - 864e5).toISOString();
  const n = await env.REGISTROS.prepare("SELECT COUNT(*) AS n FROM gratis WHERE ip = ?1 AND quando >= ?2").bind(ip, desde).first();
  return (n?.n ?? 0) < GRATIS_POR_IP_DIA;
}
async function marcaGratis(env, usuario, ip, agora) {
  await env.REGISTROS.prepare("INSERT OR IGNORE INTO gratis (usuario, ip, quando) VALUES (?1, ?2, ?3)").bind(usuario, ip, agora.toISOString()).run();
}
// RevenueCat REST API v1: the entitlement is active when it never expires or expires in the future
export async function assinaturaAtiva(env, usuario, agora = new Date(), busca = fetch) {
  if (!env.REVENUECAT_API_KEY) return false;
  const r = await busca(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(usuario)}`, {
    headers: { Authorization: `Bearer ${env.REVENUECAT_API_KEY.trim()}`, Accept: "application/json" },
  });
  if (!r.ok) throw new Error(`RevenueCat ${r.status}`);
  const ent = (await r.json())?.subscriber?.entitlements?.[env.ENTITLEMENT || "myskincare_pro"];
  if (!ent) return false;
  return !ent.expires_date || new Date(ent.expires_date) > agora;
}

// GET /metricas: the owner's panel. The page has no data; it asks for the invite code and fetches /metricas.json.
const PAINEL = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Métricas · MY Skin Care</title><style>
body{margin:0;font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:#F7F2EC;color:#2E211B}
main{max-width:860px;margin:0 auto;padding:24px 16px 48px}h1{font-size:24px;margin:0 0 4px}h2{font-size:16px;margin:28px 0 8px}
p{color:#5A4A40;margin:6px 0}form{display:flex;gap:8px;margin:16px 0}input{flex:1;padding:10px 12px;border:1px solid #E8DDD2;border-radius:10px;font:inherit}
button{padding:10px 16px;border:0;border-radius:10px;background:#3B2A22;color:#F7EFE7;font:inherit;font-weight:600}
.tbl{overflow-x:auto;background:#FFFDFB;border:1px solid #E8DDD2;border-radius:14px}table{border-collapse:collapse;width:100%;font-size:14px}
th,td{padding:8px 10px;border-bottom:1px solid #F1E9E0;text-align:right;white-space:nowrap}th:first-child,td:first-child{text-align:left}
th{color:#8A5F43;font-weight:600}.taxa{color:#8E7D71;font-size:12px}.erro{color:#A63A33}
@media (prefers-color-scheme:dark){body{background:#17110E;color:#F3E9DF}p{color:#D2C2B5}.tbl{background:#211915;border-color:#34281F}
th,td{border-color:#2B211C}th{color:#E2BBA0}input{background:#211915;color:#F3E9DF;border-color:#34281F}button{background:#D2A587;color:#1A120E}}
</style></head><body><main><h1>Métricas do MY Skin Care</h1>
<p>Contagens anônimas: só o dia, o evento e a plataforma. Ninguém é identificado.</p>
<form id="f"><input id="c" type="password" placeholder="Código de convite (APP_TOKEN)" autocomplete="current-password" required><button>Ver</button></form>
<div id="r"></div></main><script>
const NOMES={primeiro_acesso:"Abriram o app pela 1ª vez",consentiu:"Aceitaram os termos",primeira_analise:"Fizeram a 1ª análise",analise_gratis:"Usaram a análise grátis",viu_planos:"Viram os planos",iniciou_compra:"Tocaram em assinar",assinou:"Assinaram ou começaram o teste grátis",convidou:"Enviaram convite",usou_convite:"Usaram convite de amiga",abriu:"Aberturas (1 por aparelho por dia)",analise:"Análises feitas",compartilhou:"Compartilharam a evolução",clicou_loja:"Cliques em lojas de produtos"};
const FUNIL=["primeiro_acesso","consentiu","primeira_analise","viu_planos","iniciou_compra","assinou"];
const USO=["abriu","analise","analise_gratis","compartilhou","clicou_loja","convidou","usou_convite"];
const PL=["web","android","ios"],esc=s=>String(s).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
function tabela(cab,linhas){return '<div class="tbl"><table><thead><tr>'+cab.map(c=>'<th>'+c+'</th>').join("")+'</tr></thead><tbody>'+linhas.map(l=>'<tr>'+l.map(c=>'<td>'+c+'</td>').join("")+'</tr>').join("")+'</tbody></table></div>';}
async function carrega(codigo){const r=await fetch("/metricas.json",{headers:{Authorization:"Bearer "+codigo},cache:"no-store"});
if(!r.ok){document.getElementById("r").innerHTML='<p class="erro">'+(r.status===401?"Código inválido.":r.status===429?"Muitas tentativas. Espere 1 minuto.":"Erro "+r.status+".")+'</p>';return;}
const d=await r.json(),tot={},dia={};
for(const x of d.total){(tot[x.nome]||={})[x.plataforma]=x.n;}
for(const x of d.diario){((dia[x.dia]||={})[x.nome]||=0);dia[x.dia][x.nome]+=x.n;}
const soma=n=>PL.reduce((s,p)=>s+((tot[n]||{})[p]||0),0);
let ant=null;const funil=FUNIL.map(n=>{const t=soma(n),tx=ant?'<span class="taxa">'+(ant?Math.round(100*t/ant):0)+'% da etapa anterior</span>':"";ant=t||ant;return[esc(NOMES[n]),...PL.map(p=>(tot[n]||{})[p]||0),'<b>'+t+'</b> '+tx];});
const uso=USO.map(n=>[esc(NOMES[n]),...PL.map(p=>(tot[n]||{})[p]||0),'<b>'+soma(n)+'</b>']);
const dias=Object.keys(dia).sort().reverse().map(k=>[k.split("-").reverse().join("/"),...["abriu","primeiro_acesso","analise","viu_planos","assinou","clicou_loja"].map(n=>dia[k][n]||0)]);
document.getElementById("r").innerHTML='<h2>Funil (desde o início)</h2>'+tabela(["Etapa","Web","Android","iPhone","Total"],funil)
+'<h2>Uso (desde o início)</h2>'+tabela(["Evento","Web","Android","iPhone","Total"],uso)
+'<h2>Últimos 30 dias</h2>'+(dias.length?tabela(["Dia","Aberturas","Novos","Análises","Viram planos","Assinaram","Cliques lojas"],dias):"<p>Sem dados ainda.</p>");}
document.getElementById("f").addEventListener("submit",e=>{e.preventDefault();carrega(document.getElementById("c").value.trim());});
</script></body></html>`;

// ---------- "indique uma amiga" ----------
// Cada aparelho tem um código. Quem usa o código de outra pessoa ganha 1 mês grátis na hora; quem convidou
// ganha 1 mês quando a amiga vira assinante paga (no máximo PREMIOS_POR_ANO por ano). Os meses grátis são
// "promotional entitlements" do RevenueCat (precisa da chave secreta sk_ em REVENUECAT_API_KEY).
export const PREMIOS_POR_ANO = 12;
export const CONVITES_POR_IP_30_DIAS = 2;
const LETRAS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // sem 0/O, 1/I/L, para ditar sem confusão
const indicacaoPronta = new WeakMap(); // per database, so tests with fresh databases also get the tables
function garanteIndicacao(db) {
  if (!indicacaoPronta.has(db)) indicacaoPronta.set(db, db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS convites (codigo TEXT PRIMARY KEY, usuario TEXT NOT NULL UNIQUE, quando TEXT NOT NULL)"),
    db.prepare("CREATE TABLE IF NOT EXISTS indicacoes (amiga TEXT PRIMARY KEY, codigo TEXT NOT NULL, ip TEXT NOT NULL, quando TEXT NOT NULL, premiado TEXT)"),
    db.prepare("CREATE INDEX IF NOT EXISTS indicacoes_codigo ON indicacoes (codigo)"),
    db.prepare("CREATE INDEX IF NOT EXISTS indicacoes_ip ON indicacoes (ip, quando)"),
  ]).catch((e) => { indicacaoPronta.delete(db); throw e; }));
  return indicacaoPronta.get(db);
}
async function codigoDe(db, usuario, agora) {
  const tem = await db.prepare("SELECT codigo FROM convites WHERE usuario = ?1").bind(usuario).first();
  if (tem) return tem.codigo;
  for (let i = 0; i < 6; i++) {
    const codigo = Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => LETRAS[b % LETRAS.length]).join("");
    try {
      await db.prepare("INSERT INTO convites (codigo, usuario, quando) VALUES (?1, ?2, ?3)").bind(codigo, usuario, agora.toISOString()).run();
      return codigo;
    } catch {
      const outro = await db.prepare("SELECT codigo FROM convites WHERE usuario = ?1").bind(usuario).first();
      if (outro) return outro.codigo; // two requests at once: keep the first code
    }
  }
  throw new Error("não foi possível criar o código");
}
const rcBase = (usuario) => `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(usuario)}`;
export async function daMesGratis(env, usuario, busca = fetch) {
  const r = await busca(`${rcBase(usuario)}/entitlements/${env.ENTITLEMENT || "myskincare_pro"}/promotional`, {
    method: "POST", body: JSON.stringify({ duration: "monthly" }),
    headers: { Authorization: `Bearer ${env.REVENUECAT_API_KEY.trim()}`, "Content-Type": "application/json", Accept: "application/json" },
  });
  if (!r.ok) throw new Error(`RevenueCat ${r.status}`);
}
// paid subscriber = a store subscription in its normal (paid) period; trials and free months do not count
export async function pagou(env, usuario, busca = fetch) {
  const r = await busca(rcBase(usuario), { headers: { Authorization: `Bearer ${env.REVENUECAT_API_KEY.trim()}`, Accept: "application/json" } });
  if (!r.ok) throw new Error(`RevenueCat ${r.status}`);
  const subs = (await r.json())?.subscriber?.subscriptions || {};
  return Object.values(subs).some((s) => ["app_store", "play_store", "stripe", "amazon"].includes(s.store) && s.period_type === "normal");
}
export async function meuConvite(env, usuario, agora = new Date(), busca = fetch) {
  const db = env.REGISTROS;
  await garanteIndicacao(db);
  const codigo = await codigoDe(db, usuario, agora);
  // reward the inviter for friends who became paying subscribers since the last look
  const umAno = new Date(agora.getTime() - 365 * 864e5).toISOString();
  let ganhos = (await db.prepare("SELECT COUNT(*) AS n FROM indicacoes WHERE codigo = ?1 AND premiado >= ?2").bind(codigo, umAno).first())?.n ?? 0;
  let novos = 0;
  if (env.REVENUECAT_API_KEY) {
    const { results: pendentes } = await db.prepare("SELECT amiga FROM indicacoes WHERE codigo = ?1 AND premiado IS NULL ORDER BY quando LIMIT 10").bind(codigo).all();
    for (const { amiga } of pendentes) {
      if (ganhos >= PREMIOS_POR_ANO) break;
      try {
        if (!(await pagou(env, amiga, busca))) continue;
        await daMesGratis(env, usuario, busca);
        await db.prepare("UPDATE indicacoes SET premiado = ?1 WHERE amiga = ?2").bind(agora.toISOString(), amiga).run();
        ganhos++; novos++;
      } catch (e) { console.error("falha ao premiar indicação", e?.message); break; }
    }
  }
  const t = await db.prepare("SELECT COUNT(*) AS n, COUNT(premiado) AS p FROM indicacoes WHERE codigo = ?1").bind(codigo).first();
  return { codigo, convidadas: t?.n ?? 0, premiadas: t?.p ?? 0, novos };
}
export async function usaConvite(env, usuario, codigo, ip, agora = new Date(), busca = fetch) {
  const db = env.REGISTROS;
  await garanteIndicacao(db);
  const c = String(codigo || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  const dono = c && await db.prepare("SELECT usuario FROM convites WHERE codigo = ?1").bind(c).first();
  if (!dono) return [404, { erro: "Código de convite não encontrado. Confira as letras." }];
  if (dono.usuario === usuario) return [400, { erro: "Este é o seu próprio código. Ele serve para enviar às amigas." }];
  if (await db.prepare("SELECT 1 AS x FROM indicacoes WHERE amiga = ?1").bind(usuario).first()) return [409, { erro: "Este aparelho já usou um convite de amiga." }];
  const desde = new Date(agora.getTime() - 30 * 864e5).toISOString();
  const n = (await db.prepare("SELECT COUNT(*) AS n FROM indicacoes WHERE ip = ?1 AND quando >= ?2").bind(ip, desde).first())?.n ?? 0;
  if (n >= CONVITES_POR_IP_30_DIAS) return [403, { erro: "Limite de convites nesta internet atingido. Tente de novo em alguns dias." }];
  await daMesGratis(env, usuario, busca);
  await db.prepare("INSERT INTO indicacoes (amiga, codigo, ip, quando) VALUES (?1, ?2, ?3, ?4)").bind(usuario, c, ip, agora.toISOString()).run();
  return [200, { ok: true, meses: 1 }];
}

export function criaApp({ cliente, busca } = {}) {
  const app = {
    async fetch(req, env, ctx) {
      const resp = await app.atende(req, env);
      const registro = registraAcesso(env, req, resp.status);
      if (ctx?.waitUntil) ctx.waitUntil(registro); else await registro;
      return resp;
    },
    // daily cron (wrangler.toml): drops access logs older than RETENCAO_DIAS
    async scheduled(evento, env, ctx) {
      ctx.waitUntil(apagaAcessosAntigos(env));
    },
    async atende(req, env) {
      const origem = req.headers.get("Origin");
      const permitidas = (env.ORIGENS_PERMITIDAS || "").split(",").map((s) => s.trim()).filter(Boolean);
      const cors = origem && permitidas.includes(origem)
        ? { "Access-Control-Allow-Origin": origem, "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Usuario",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS", Vary: "Origin" }
        : {};
      const json = (status, corpo) => new Response(JSON.stringify(corpo), {
        status, headers: { "Content-Type": "application/json; charset=utf-8", ...cors } });

      const { pathname } = new URL(req.url);
      if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
      if (pathname === "/saude" && req.method === "GET") return json(200, { ok: true, modelo: METODO.modelo, registros: !!env.REGISTROS });
      if (pathname === "/evento" && req.method === "POST") {
        // text/plain body (a "simple" request, so the store app needs no CORS preflight); at most 200 bytes
        const corpo = (await req.text()).slice(0, 200);
        try { await contaEvento(env, corpo); } catch (e) { console.error("falha ao contar evento", e?.message); }
        return new Response(null, { status: 204, headers: cors });
      }
      if (pathname === "/metricas" && req.method === "GET") return new Response(PAINEL, { headers: {
        "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex",
        "Content-Security-Policy": "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'" } });
      if (pathname === "/metricas.json" && req.method === "GET") {
        // same rate limit and invite code (APP_TOKEN) as the app: only the owner reads the numbers
        if (env.LIMITE) {
          const { success } = await env.LIMITE.limit({ key: req.headers.get("CF-Connecting-IP") || "sem-ip" });
          if (!success) return json(429, { erro: "muitas tentativas seguidas; tente em 1 minuto" });
        }
        const a = req.headers.get("Authorization") || "";
        if (!env.APP_TOKEN || !a.startsWith("Bearer ") || !(await mesmoToken(a.slice(7).trim(), env.APP_TOKEN.trim()))) return json(401, { erro: "código inválido" });
        if (!env.REGISTROS) return json(503, { erro: "banco não ligado" });
        return new Response(JSON.stringify(await leMetricas(env)), { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
      }
      if (pathname === "/indicacao") {
        if (req.method !== "GET" && req.method !== "POST") return json(405, { erro: "use GET ou POST" });
        if (env.LIMITE) {
          const { success } = await env.LIMITE.limit({ key: req.headers.get("CF-Connecting-IP") || "sem-ip" });
          if (!success) return json(429, { erro: "muitas tentativas seguidas; tente em 1 minuto" });
        }
        const usuario = (req.headers.get("X-Usuario") || "").trim();
        if (!ID_USUARIO.test(usuario)) return json(401, { erro: "aparelho não identificado" });
        if (!env.REGISTROS) return json(503, { erro: "indicação indisponível" });
        try {
          if (req.method === "GET") return json(200, await meuConvite(env, usuario, new Date(), busca));
          if (!env.REVENUECAT_API_KEY) return json(503, { erro: "indicação indisponível" });
          let corpo = {};
          try { corpo = JSON.parse((await req.text()).slice(0, 200)); } catch {}
          const [status, r] = await usaConvite(env, usuario, corpo.codigo, req.headers.get("CF-Connecting-IP") || "sem-ip", new Date(), busca);
          return json(status, r);
        } catch (e) {
          console.error("falha na indicação", e?.message);
          return json(503, { erro: "não foi possível usar o convite agora; tente de novo" });
        }
      }
      if (pathname !== "/analise" && pathname !== "/acesso") return json(404, { erro: "rota inexistente" });
      const metodo = pathname === "/acesso" ? "GET" : "POST";
      if (req.method !== metodo) return json(405, { erro: `use ${metodo}` });

      if (!env.APP_TOKEN || !env.ANTHROPIC_API_KEY) return json(500, { erro: "servidor sem configuração" });
      // the rate limit comes first so the access code cannot be guessed by brute force
      if (env.LIMITE) {
        const ip = req.headers.get("CF-Connecting-IP") || "sem-ip";
        const { success } = await env.LIMITE.limit({ key: ip });
        if (!success) return json(429, { erro: "muitas tentativas seguidas; tente em 1 minuto" });
      }
      const auth = req.headers.get("Authorization") || "";
      const ip = req.headers.get("CF-Connecting-IP") || "sem-ip";
      const agora = new Date();
      let gratis = null; // set when this analysis uses the free one, marked only if it succeeds
      if (auth.startsWith("Bearer ")) {
        if (!(await mesmoToken(auth.slice(7).trim(), env.APP_TOKEN.trim()))) return json(401, { erro: "token inválido" });
        // GET /acesso only checks the access code typed in the app
        if (pathname === "/acesso") return json(200, { ok: true });
      } else {
        const usuario = (req.headers.get("X-Usuario") || "").trim();
        if (pathname === "/acesso" || !ID_USUARIO.test(usuario)) return json(401, { erro: "token inválido" });
        try {
          if (await podeGratis(env, usuario, ip, agora)) gratis = usuario;
          else if (!(await assinaturaAtiva(env, usuario, agora, busca)))
            return json(402, { erro: "assinatura necessária", causa: "assinatura" });
        } catch (e) {
          console.error("falha ao conferir acesso", e?.message);
          return json(503, { erro: "não foi possível conferir a assinatura; tente de novo" });
        }
      }

      const tipo = (req.headers.get("Content-Type") || "").split(";")[0].trim().toLowerCase();
      if (!TIPOS.has(tipo)) return json(415, { erro: "envie a foto como image/jpeg, image/png ou image/webp" });
      const imagem = await req.arrayBuffer();
      if (!imagem.byteLength) return json(400, { erro: "corpo vazio" });
      if (imagem.byteLength > MAX_BYTES) return json(413, { erro: "foto acima de 5 MB" });

      const client = cliente || new Anthropic({ apiKey: env.ANTHROPIC_API_KEY.trim(), maxRetries: 2 /* spaces or a line break pasted with the secret */ });
      try {
        const r = await analisa(client, imagem, tipo);
        if (r.recusa) return json(422, { erro: "a IA não analisou esta foto" });
        if (gratis) await marcaGratis(env, gratis, ip, agora).catch((e) => console.error("falha ao marcar grátis", e?.message));
        return json(200, { ...r, gratis: !!gratis });
      } catch (e) {
        console.error("falha na IA", e?.status, e?.message); // shows in the Worker's logs
        // detalhe: the API's own message, so the owner can tell a bad key or empty credit from an outage
        const detalhe = String(e?.message || "").slice(0, 300);
        if (e instanceof Anthropic.RateLimitError) return json(503, { erro: "IA sobrecarregada; tente de novo" });
        if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError)
          return json(502, { erro: "chave da Anthropic recusada", causa: "chave", detalhe, chave: impressao(env.ANTHROPIC_API_KEY) });
        if (e instanceof Anthropic.BadRequestError) return json(400, { erro: "a IA recusou o pedido", causa: "pedido", detalhe });
        if (e instanceof Anthropic.APIError) return json(502, { erro: `falha na IA (${e.status ?? "conexão"})`, causa: "ia", detalhe });
        return json(500, { erro: "falha interna" });
      }
    },
  };
  return app;
}
