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
