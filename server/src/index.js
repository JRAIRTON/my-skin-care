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
            "Access-Control-Allow-Methods": "POST, OPTIONS", Vary: "Origin" }
        : {};
      const json = (status, corpo) => new Response(JSON.stringify(corpo), {
        status, headers: { "Content-Type": "application/json; charset=utf-8", ...cors } });

      const { pathname } = new URL(req.url);
      if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
      if (pathname === "/saude" && req.method === "GET") return json(200, { ok: true, modelo: METODO.modelo, registros: !!env.REGISTROS });
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

export default criaApp();
