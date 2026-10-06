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

export function criaApp({ cliente } = {}) {
  return {
    async fetch(req, env) {
      const origem = req.headers.get("Origin");
      const permitidas = (env.ORIGENS_PERMITIDAS || "").split(",").map((s) => s.trim()).filter(Boolean);
      const cors = origem && permitidas.includes(origem)
        ? { "Access-Control-Allow-Origin": origem, "Access-Control-Allow-Headers": "Authorization, Content-Type",
            "Access-Control-Allow-Methods": "POST, OPTIONS", Vary: "Origin" }
        : {};
      const json = (status, corpo) => new Response(JSON.stringify(corpo), {
        status, headers: { "Content-Type": "application/json; charset=utf-8", ...cors } });

      const { pathname } = new URL(req.url);
      if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
      if (pathname === "/saude" && req.method === "GET") return json(200, { ok: true, modelo: METODO.modelo });
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
      if (!auth.startsWith("Bearer ") || !(await mesmoToken(auth.slice(7), env.APP_TOKEN)))
        return json(401, { erro: "token inválido" });
      // GET /acesso only checks the access code typed in the app
      if (pathname === "/acesso") return json(200, { ok: true });

      const tipo = (req.headers.get("Content-Type") || "").split(";")[0].trim().toLowerCase();
      if (!TIPOS.has(tipo)) return json(415, { erro: "envie a foto como image/jpeg, image/png ou image/webp" });
      const imagem = await req.arrayBuffer();
      if (!imagem.byteLength) return json(400, { erro: "corpo vazio" });
      if (imagem.byteLength > MAX_BYTES) return json(413, { erro: "foto acima de 5 MB" });

      const client = cliente || new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 2 });
      try {
        const r = await analisa(client, imagem, tipo);
        if (r.recusa) return json(422, { erro: "a IA não analisou esta foto" });
        return json(200, r);
      } catch (e) {
        console.error("falha na IA", e?.status, e?.message); // shows in the Worker's logs
        // detalhe: the API's own message, so the owner can tell a bad key or empty credit from an outage
        const detalhe = String(e?.message || "").slice(0, 300);
        if (e instanceof Anthropic.RateLimitError) return json(503, { erro: "IA sobrecarregada; tente de novo" });
        if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError)
          return json(502, { erro: "chave da Anthropic recusada", causa: "chave", detalhe });
        if (e instanceof Anthropic.BadRequestError) return json(400, { erro: "a IA recusou o pedido", causa: "pedido", detalhe });
        if (e instanceof Anthropic.APIError) return json(502, { erro: `falha na IA (${e.status ?? "conexão"})`, causa: "ia", detalhe });
        return json(500, { erro: "falha interna" });
      }
    },
  };
}

export default criaApp();
