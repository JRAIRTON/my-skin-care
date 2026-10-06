// Testes do app web (pasta ../app) e da rota /acesso que ele usa.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { criaApp } from "../src/index.js";
import METODO from "../src/metodo.json" with { type: "json" };
import { CATS, GRAUS, CLASSE_SERUM, recomenda, prioridades, tipoPele, skinScore, liberadoEm } from "../../app/recomenda.js";

const ler = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), "utf8"));
const CATALOGO = ler("../../app/catalogo.json");
const ENV = { APP_TOKEN: "segredo", ANTHROPIC_API_KEY: "x" };
const notas = (graus) => Object.fromEntries(METODO.categorias.map((k) => {
  const g = graus[k] ?? 0;
  return [k, { grau: g, nota: [95, 82, 67, 50, 20][g] }];
}));

test("GET /acesso confere o código de acesso, depois do limite de uso", async () => {
  const app = criaApp({ cliente: {} });
  const get = (tok) => new Request("https://s/acesso", { headers: tok ? { Authorization: `Bearer ${tok}` } : {} });
  assert.equal((await app.fetch(get("segredo"), ENV)).status, 200);
  assert.equal((await app.fetch(get("errado"), ENV)).status, 401);
  assert.equal((await app.fetch(get(), ENV)).status, 401);
  assert.equal((await app.fetch(new Request("https://s/acesso", { method: "POST" }), ENV)).status, 405);
  const limitado = { ...ENV, LIMITE: { limit: async () => ({ success: false }) } };
  assert.equal((await app.fetch(get("segredo"), limitado)).status, 429);
});

test("o app usa o mesmo catálogo e as mesmas categorias do método", () => {
  assert.deepEqual(CATALOGO, ler("../../docs/catalogo-v1.json"));
  assert.deepEqual(CATS.map(([k]) => k), METODO.categorias);
  for (const [k] of CATS) assert.equal(GRAUS[k].length, 5, k);
  const seruns = CATALOGO.filter((p) => p.categoria === "Sérum").map((p) => p.id).sort();
  assert.deepEqual(Object.keys(CLASSE_SERUM).sort(), seruns);
});

test("rotina tem sempre limpeza, hidratante e protetor, só com produtos do catálogo", () => {
  const ids = new Set(CATALOGO.map((p) => p.id));
  for (const tipoPele of ["nao_sei", "normal", "seca", "oleosa", "mista", "sensivel"]) {
    const r = recomenda({ tipoPele, fototipo: 3, objetivos: [] }, notas({ manchas: 2, oleosidade: 2 }), CATALOGO);
    for (const k of ["limpeza", "hidratante", "protetor"]) assert.ok(ids.has(r.produtos[k].produto.id), `${tipoPele} ${k}`);
    assert.equal(r.passos.manha.at(-1).passo, "Protetor solar");
    assert.ok(r.produtos.seruns.length <= 2);
    for (const s of r.produtos.seruns) assert.ok(ids.has(s.produto.id));
  }
});

test("prioriza a pior nota e o objetivo escolhido", () => {
  const p = prioridades({ objetivos: ["Hidratação"] }, notas({ linhas: 3, hidratacao: 2 }));
  assert.deepEqual(p.map((x) => x.objetivo), ["Linhas finas", "Hidratação"]);
  assert.deepEqual(prioridades({}, notas({})), []);
});

test("linhas pedem retinoide à noite, mas não na gestação", () => {
  const n = notas({ linhas: 3, firmeza: 2 });
  const r = recomenda({ tipoPele: "normal" }, n, CATALOGO);
  assert.equal(r.produtos.seruns[0].classe, "retinoide");
  assert.ok(r.passos.noite.some((s) => s.passo === "Retinoide"));
  const g = recomenda({ tipoPele: "normal", gestante: true }, n, CATALOGO);
  assert.ok(!g.produtos.seruns.some((s) => s.classe === "retinoide"));
  assert.ok(g.alertas.some((a) => /gestação/.test(a)));
});

test("retinoide e ácido ficam em noites alternadas", () => {
  const r = recomenda({ tipoPele: "oleosa" }, notas({ linhas: 3, oleosidade: 3, poros: 3 }), CATALOGO);
  const noite = r.passos.noite.filter((s) => s.ativo);
  if (noite.length > 1) assert.ok(noite.every((s) => s.alternado));
});

test("pele sensível não recebe sérum com salicílico ou glicólico", () => {
  const r = recomenda({ tipoPele: "sensivel" }, notas({ oleosidade: 3, poros: 3, manchas: 3 }), CATALOGO);
  for (const s of r.produtos.seruns) assert.doesNotMatch(s.produto.ativos, /salic|glic/i);
});

test("fototipo V ou VI com manchas recebe protetor com cor", () => {
  const r = recomenda({ tipoPele: "normal", fototipo: 6 }, notas({ manchas: 2 }), CATALOGO);
  assert.match(r.produtos.protetor.produto.produto, /com cor/i);
});

test("tipo de pele estimado pela foto quando a pessoa não sabe", () => {
  assert.equal(tipoPele({ tipoPele: "nao_sei" }, notas({ oleosidade: 3 })), "oleosa");
  assert.equal(tipoPele({ tipoPele: "nao_sei" }, notas({ hidratacao: 2 })), "seca");
  assert.equal(tipoPele({ tipoPele: "seca" }, notas({ oleosidade: 3 })), "seca");
});

test("skin score e calendário de introdução", () => {
  assert.equal(skinScore(notas({})), 95);
  assert.equal(skinScore({ textura: { grau: null, nota: null }, poros: { grau: 1, nota: 80 } }), 80);
  assert.equal(liberadoEm("2026-10-01", 0), "2026-10-15");
  assert.equal(liberadoEm("2026-10-01", 1), "2026-10-29");
});
