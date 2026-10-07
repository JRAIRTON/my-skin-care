import { test } from "node:test";
import assert from "node:assert/strict";
import { criaApp, normaliza } from "../src/index.js";
import METODO from "../src/metodo.json" with { type: "json" };

const ENV = { APP_TOKEN: "segredo", ANTHROPIC_API_KEY: "x", ORIGENS_PERMITIDAS: "https://app.exemplo" };
const notasOk = Object.fromEntries(METODO.categorias.map((k) => [k, { avaliavel: true, grau: 1, nota: 80 }]));

function falso(resposta) {
  const chamadas = [];
  return { chamadas, beta: { messages: { create: async (p) => { chamadas.push(p); return resposta; } } } };
}
const resp = (bruto, extra = {}) => ({
  model: "claude-sonnet-5-5", stop_reason: "end_turn", usage: { input_tokens: 4300, output_tokens: 230 },
  content: [{ type: "text", text: JSON.stringify(bruto) }], ...extra,
});
const pede = (corpo, headers = {}) => new Request("https://s/analise", {
  method: "POST", body: corpo, headers: { Authorization: "Bearer segredo", "Content-Type": "image/jpeg", ...headers } });

test("analisa a foto com o modelo, pedido e schema validados", async () => {
  const c = falso(resp({ notas: notasOk, confianca: "alta", idade_aparente: 40 }));
  const r = await criaApp({ cliente: c }).fetch(pede(new Uint8Array([1, 2, 3])), ENV);
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.equal(j.skin_score, 80);
  assert.equal(j.modelo, "claude-sonnet-5-5");
  const p = c.chamadas[0];
  assert.equal(p.model, "claude-sonnet-5-5");
  assert.deepEqual(p.output_config.format.schema, METODO.schema);
  assert.equal(p.messages[0].content[1].text, METODO.prompt);
  assert.equal(p.messages[0].content[0].source.data, "AQID");
});

test("categoria não avaliável vira null e nota fica dentro da faixa do grau", () => {
  const n = structuredClone(notasOk);
  n.textura = { avaliavel: false, grau: 0, nota: 0 };
  n.poros = { avaliavel: true, grau: 0, nota: 70 };
  const r = normaliza({ notas: n, confianca: "media", idade_aparente: 0 });
  assert.deepEqual(r.notas.textura, { grau: null, nota: null });
  assert.equal(r.notas.poros.nota, 90);
  assert.equal(r.idade_aparente, null);
  assert.equal(r.skin_score, Math.round((90 + 80 * 8) / 9));
});

test("recusa token errado, tipo errado e corpo vazio", async () => {
  const app = criaApp({ cliente: falso(resp({})) });
  assert.equal((await app.fetch(pede("x", { Authorization: "Bearer outro" }), ENV)).status, 401);
  assert.equal((await app.fetch(pede("x", { Authorization: "" }), ENV)).status, 401);
  assert.equal((await app.fetch(pede("x", { "Content-Type": "text/plain" }), ENV)).status, 415);
  assert.equal((await app.fetch(pede(new Uint8Array()), ENV)).status, 400);
  assert.equal((await app.fetch(pede(new Uint8Array(5 * 1024 * 1024 + 1)), ENV)).status, 413);
  assert.equal((await app.fetch(new Request("https://s/analise"), ENV)).status, 405);
  assert.equal((await app.fetch(pede("x"), { APP_TOKEN: "segredo" })).status, 500);
});

test("recusa da IA vira 422 e limite de uso vira 429", async () => {
  const app = criaApp({ cliente: falso(resp({}, { stop_reason: "refusal" })) });
  assert.equal((await app.fetch(pede("x"), ENV)).status, 422);
  const limitado = { ...ENV, LIMITE: { limit: async () => ({ success: false }) } };
  assert.equal((await app.fetch(pede("x"), limitado)).status, 429);
});

test("CORS só para origens permitidas", async () => {
  const app = criaApp({ cliente: falso(resp({ notas: notasOk, confianca: "alta", idade_aparente: 40 })) });
  const ok = await app.fetch(pede("x", { Origin: "https://app.exemplo" }), ENV);
  assert.equal(ok.headers.get("Access-Control-Allow-Origin"), "https://app.exemplo");
  const nao = await app.fetch(pede("x", { Origin: "https://outro.site" }), ENV);
  assert.equal(nao.headers.get("Access-Control-Allow-Origin"), null);
});

test("erros da API viram causa e detalhe para o app", async () => {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const falha = (err) => ({ beta: { messages: { create: async () => { throw err; } } } });
  const h = new Headers();
  const casos = [
    [new Anthropic.AuthenticationError(401, { error: { message: "invalid x-api-key" } }, "invalid x-api-key", h), 502, "chave"],
    [new Anthropic.BadRequestError(400, { error: { message: "credit balance is too low" } }, "credit balance is too low", h), 400, "pedido"],
    [new Anthropic.InternalServerError(529, {}, "Overloaded", h), 502, "ia"],
  ];
  const err = console.error; console.error = () => {};
  try {
    for (const [e, status, causa] of casos) {
      const r = await criaApp({ cliente: falha(e) }).fetch(pede("x"), ENV);
      assert.equal(r.status, status);
      const j = await r.json();
      assert.equal(j.causa, causa);
      assert.ok(j.detalhe.length > 0);
    }
  } finally { console.error = err; }
});

test("impressão da chave não revela a chave", async () => {
  const { impressao } = await import("../src/index.js");
  const k = "sk-ant-api03-" + "a".repeat(80) + "WXYZ";
  assert.deepEqual(impressao(" " + k + "\n"), { inicio: "sk-ant-api03-", fim: "WXYZ", tamanho: k.length });
  assert.deepEqual(impressao("curta"), { inicio: "curta", fim: "", tamanho: 5 });
});

// D1 em memória: só o que o servidor usa (batch, prepare, bind, run)
function d1Falso() {
  const linhas = [];
  const exec = (sql, args) => {
    if (sql.startsWith("INSERT")) linhas.push({ quando: args[0], ip: args[1], rota: args[2], status: args[3] });
    if (sql.startsWith("DELETE")) for (let i = linhas.length - 1; i >= 0; i--) if (linhas[i].quando < args[0]) linhas.splice(i, 1);
  };
  const prepare = (sql) => ({ sql, args: [], bind(...a) { this.args = a; return this; }, async run() { exec(sql, this.args); } });
  return { linhas, prepare, async batch(st) { st.forEach((x) => exec(x.sql, x.args)); } };
}

test("registra data, IP, rota e status de cada pedido, sem foto nem código", async () => {
  const db = d1Falso();
  const env = { ...ENV, REGISTROS: db };
  const app = criaApp({ cliente: falso(resp({ notas: notasOk, confianca: "alta", idade_aparente: 40 })) });
  const espera = [];
  const ctx = { waitUntil: (p) => espera.push(p) };
  await app.fetch(pede(new Uint8Array([1]), { "CF-Connecting-IP": "200.1.2.3" }), env, ctx);
  await app.fetch(pede("x", { "CF-Connecting-IP": "200.1.2.3", Authorization: "Bearer errado" }), env, ctx);
  await Promise.all(espera);
  assert.equal(db.linhas.length, 2);
  assert.deepEqual(db.linhas.map((l) => [l.ip, l.rota, l.status]), [["200.1.2.3", "/analise", 200], ["200.1.2.3", "/analise", 401]]);
  assert.ok(!JSON.stringify(db.linhas).includes("segredo"));
  const saude = await (await app.fetch(new Request("https://s/saude"), env, ctx)).json();
  assert.equal(saude.registros, true);
});

test("apaga registros com mais de 6 meses e mantém os recentes", async () => {
  const { apagaAcessosAntigos, registraAcesso, RETENCAO_DIAS } = await import("../src/index.js");
  const db = d1Falso();
  const env = { REGISTROS: db };
  const agora = new Date("2026-10-07T12:00:00Z");
  const req = new Request("https://s/acesso", { headers: { "CF-Connecting-IP": "1.1.1.1" } });
  await registraAcesso(env, req, 200, new Date(agora.getTime() - (RETENCAO_DIAS + 1) * 864e5));
  await registraAcesso(env, req, 200, new Date(agora.getTime() - 10 * 864e5));
  await apagaAcessosAntigos(env, agora);
  assert.equal(db.linhas.length, 1);
});

test("falha no banco de registros não derruba o app", async () => {
  const env = { ...ENV, REGISTROS: { batch: async () => { throw new Error("D1 fora"); }, prepare: () => ({}) } };
  const err = console.error; console.error = () => {};
  try {
    const r = await criaApp({ cliente: falso(resp({ notas: notasOk, confianca: "alta", idade_aparente: 40 })) }).fetch(pede(new Uint8Array([1])), env);
    assert.equal(r.status, 200);
  } finally { console.error = err; }
});
