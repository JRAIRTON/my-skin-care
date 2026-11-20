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

test("erros da API viram causa para o app, sem detalhes técnicos nem a chave", async () => {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const falha = (err) => ({ beta: { messages: { create: async () => { throw err; } } } });
  const h = new Headers();
  const casos = [
    [new Anthropic.AuthenticationError(401, { error: { message: "invalid x-api-key" } }, "invalid x-api-key", h), 502, "indisponivel"],
    [new Anthropic.BadRequestError(400, { error: { message: "credit balance is too low" } }, "credit balance is too low", h), 502, "indisponivel"],
    [new Anthropic.BadRequestError(400, { error: { message: "image too large" } }, "image too large", h), 400, "pedido"],
    [new Anthropic.InternalServerError(529, {}, "Overloaded", h), 502, "ia"],
  ];
  const err = console.error, logs = []; console.error = (...a) => logs.push(a.join(" "));
  try {
    for (const [e, status, causa] of casos) {
      const r = await criaApp({ cliente: falha(e) }).fetch(pede("x"), ENV);
      assert.equal(r.status, status);
      const texto = await r.text(), j = JSON.parse(texto);
      assert.equal(j.causa, causa);
      assert.equal(j.detalhe, undefined); assert.equal(j.chave, undefined);
      assert.ok(!texto.includes(ENV.ANTHROPIC_API_KEY.slice(0, 8)));
    }
    assert.ok(logs.some((l) => l.includes("invalid x-api-key")), "o motivo fica no log do Worker");
  } finally { console.error = err; }
});

test("impressão da chave não revela a chave", async () => {
  const { impressao } = await import("../src/index.js");
  const k = "sk-ant-api03-" + "a".repeat(80) + "WXYZ";
  assert.deepEqual(impressao(" " + k + "\n"), { inicio: "sk-ant-api03-", fim: "WXYZ", tamanho: k.length });
  assert.deepEqual(impressao("curta"), { inicio: "curta", fim: "", tamanho: 5 });
});

// D1 em memória: só as consultas que o servidor usa
function d1Falso() {
  const linhas = [], gratis = [];
  const exec = (sql, args) => {
    if (sql.startsWith("INSERT INTO acessos")) linhas.push({ quando: args[0], ip: args[1], rota: args[2], status: args[3] });
    if (sql.startsWith("DELETE FROM acessos")) for (let i = linhas.length - 1; i >= 0; i--) if (linhas[i].quando < args[0]) linhas.splice(i, 1);
    if (sql.startsWith("UPDATE gratis SET ip")) gratis.forEach((g) => { if (g.quando < args[0]) g.ip = ""; });
    if (sql.startsWith("INSERT OR IGNORE INTO gratis") && !gratis.some((g) => g.usuario === args[0])) gratis.push({ usuario: args[0], ip: args[1], quando: args[2] });
  };
  const consulta = (sql, args) => {
    if (sql.startsWith("SELECT 1 AS x FROM gratis")) return gratis.some((g) => g.usuario === args[0]) ? { x: 1 } : null;
    if (sql.startsWith("SELECT COUNT(*) AS n FROM gratis")) return { n: gratis.filter((g) => g.ip === args[0] && g.quando >= args[1]).length };
    return null;
  };
  const prepare = (sql) => ({ sql, args: [], bind(...a) { this.args = a; return this; },
    async run() { exec(sql, this.args); }, async first() { return consulta(sql, this.args); } });
  return { linhas, gratis, prepare, async batch(st) { st.forEach((x) => exec(x.sql, x.args)); } };
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
  db.gratis.push({ usuario: "antigo-000000000001", ip: "5.5.5.5", quando: new Date(agora.getTime() - 3 * 864e5).toISOString() });
  db.gratis.push({ usuario: "recente-00000000001", ip: "6.6.6.6", quando: agora.toISOString() });
  await apagaAcessosAntigos(env, agora);
  assert.equal(db.linhas.length, 1);
  assert.deepEqual(db.gratis.map((g) => g.ip), ["", "6.6.6.6"]);
});

test("falha no banco de registros não derruba o app", async () => {
  const env = { ...ENV, REGISTROS: { batch: async () => { throw new Error("D1 fora"); }, prepare: () => ({}) } };
  const err = console.error; console.error = () => {};
  try {
    const r = await criaApp({ cliente: falso(resp({ notas: notasOk, confianca: "alta", idade_aparente: 40 })) }).fetch(pede(new Uint8Array([1])), env);
    assert.equal(r.status, 200);
  } finally { console.error = err; }
});

// ---------- primeira análise grátis e assinatura ----------
const semCodigo = (usuario, ip = "200.0.0.1") => new Request("https://s/analise", {
  method: "POST", body: new Uint8Array([1]), headers: { "Content-Type": "image/jpeg", "X-Usuario": usuario, "CF-Connecting-IP": ip } });
const okIA = () => falso(resp({ notas: notasOk, confianca: "alta", idade_aparente: 40 }));
const rc = (ent) => async () => new Response(JSON.stringify({ subscriber: { entitlements: ent ? { myskincare_pro: ent } : {} } }), { status: 200 });

test("sem código: a primeira análise do aparelho é grátis, a segunda pede assinatura", async () => {
  const db = d1Falso(); const env = { ...ENV, REGISTROS: db };
  const app = criaApp({ cliente: okIA() });
  const r1 = await app.fetch(semCodigo("aparelho-0000000001"), env);
  assert.equal(r1.status, 200);
  assert.equal((await r1.json()).gratis, true);
  assert.equal(db.gratis.length, 1);
  const r2 = await app.fetch(semCodigo("aparelho-0000000001"), env);
  assert.equal(r2.status, 402);
  assert.equal((await r2.json()).causa, "assinatura");
});

test("sem código: assinatura ativa no RevenueCat libera; vencida não", async () => {
  const db = d1Falso(); const env = { ...ENV, REGISTROS: db, REVENUECAT_API_KEY: "sk_rc" };
  db.gratis.push({ usuario: "aparelho-0000000002", ip: "1.1.1.1", quando: new Date().toISOString() });
  const futuro = new Date(Date.now() + 864e5).toISOString(), passado = new Date(Date.now() - 864e5).toISOString();
  const ativa = await criaApp({ cliente: okIA(), busca: rc({ expires_date: futuro }) }).fetch(semCodigo("aparelho-0000000002"), env);
  assert.equal(ativa.status, 200);
  assert.equal((await ativa.json()).gratis, false);
  const vencida = await criaApp({ cliente: okIA(), busca: rc({ expires_date: passado }) }).fetch(semCodigo("aparelho-0000000002"), env);
  assert.equal(vencida.status, 402);
  const sem = await criaApp({ cliente: okIA(), busca: rc(null) }).fetch(semCodigo("aparelho-0000000002"), env);
  assert.equal(sem.status, 402);
});

test("no máximo 3 análises grátis por IP por dia", async () => {
  const db = d1Falso(); const env = { ...ENV, REGISTROS: db };
  const app = criaApp({ cliente: okIA() });
  for (let i = 1; i <= 3; i++) assert.equal((await app.fetch(semCodigo(`aparelho-ip-000000${i}`, "9.9.9.9"), env)).status, 200);
  assert.equal((await app.fetch(semCodigo("aparelho-ip-0000004", "9.9.9.9"), env)).status, 402);
  assert.equal((await app.fetch(semCodigo("aparelho-ip-0000005", "8.8.8.8"), env)).status, 200);
});

test("grátis só é gasta se a análise der certo; id inválido e /acesso sem código são recusados", async () => {
  const db = d1Falso(); const env = { ...ENV, REGISTROS: db };
  const r = await criaApp({ cliente: falso(resp({}, { stop_reason: "refusal" })) }).fetch(semCodigo("aparelho-0000000003"), env);
  assert.equal(r.status, 422);
  assert.equal(db.gratis.length, 0);
  assert.equal((await criaApp({ cliente: okIA() }).fetch(semCodigo("curto"), env)).status, 401);
  const acesso = new Request("https://s/acesso", { headers: { "X-Usuario": "aparelho-0000000004" } });
  assert.equal((await criaApp({ cliente: okIA() }).fetch(acesso, env)).status, 401);
});

test("falha do RevenueCat vira 503, sem análise", async () => {
  const db = d1Falso(); const env = { ...ENV, REGISTROS: db, REVENUECAT_API_KEY: "sk_rc" };
  db.gratis.push({ usuario: "aparelho-0000000005", ip: "1.1.1.1", quando: new Date().toISOString() });
  const c = okIA();
  const err = console.error; console.error = () => {};
  try {
    const r = await criaApp({ cliente: c, busca: async () => new Response("", { status: 500 }) }).fetch(semCodigo("aparelho-0000000005"), env);
    assert.equal(r.status, 503);
    assert.equal(c.chamadas.length, 0);
  } finally { console.error = err; }
});

// D1 sobre o SQLite do Node, para testar as consultas das métricas de verdade
async function d1Sqlite() {
  const { DatabaseSync } = await import("node:sqlite");
  const db = new DatabaseSync(":memory:");
  const prepare = (sql) => ({ args: [], bind(...a) { this.args = a; return this; },
    async run() { db.prepare(sql).run(...this.args); return {}; },
    async all() { return { results: db.prepare(sql).all(...this.args) }; },
    async first() { return db.prepare(sql).get(...this.args) ?? null; } });
  return { prepare, async batch(st) { for (const x of st) await x.run(); } };
}

test("métricas: /evento conta por dia, evento e plataforma, sem identificar ninguém", async () => {
  const db = await d1Sqlite();
  const env = { ...ENV, REGISTROS: db };
  const app = criaApp({ cliente: {} });
  const ev = (corpo) => app.fetch(new Request("https://s/evento", { method: "POST", headers: { "Content-Type": "text/plain", "CF-Connecting-IP": "1.2.3.4" }, body: corpo }), env);
  for (const c of [{ nome: "abriu", plataforma: "web" }, { nome: "abriu", plataforma: "web" }, { nome: "assinou", plataforma: "android" }])
    assert.equal((await ev(JSON.stringify(c))).status, 204);
  // eventos fora da lista, plataforma inválida e lixo são ignorados, sem erro
  for (const c of [JSON.stringify({ nome: "hack", plataforma: "web" }), JSON.stringify({ nome: "abriu", plataforma: "x" }), "{", ""])
    assert.equal((await ev(c)).status, 204);

  const leitura = (tok) => app.fetch(new Request("https://s/metricas.json", { headers: tok ? { Authorization: `Bearer ${tok}` } : {} }), env);
  assert.equal((await leitura()).status, 401);
  assert.equal((await leitura("errado")).status, 401);
  const r = await leitura("segredo");
  assert.equal(r.status, 200);
  const d = await r.json();
  const total = Object.fromEntries(d.total.map((x) => [`${x.nome}/${x.plataforma}`, x.n]));
  assert.deepEqual(total, { "abriu/web": 2, "assinou/android": 1 });
  assert.equal(d.diario.length, 2);
  // a tabela de métricas não tem colunas de IP nem de usuário
  assert.deepEqual(Object.keys(d.diario[0]).sort(), ["dia", "n", "nome", "plataforma"]);

  const painel = await app.fetch(new Request("https://s/metricas"), env);
  assert.equal(painel.status, 200);
  assert.match(await painel.text(), /Métricas do MY Skin Care/);
});

// RevenueCat falso para as indicações: guarda os meses grátis dados e quem já paga
function rcFalso(pagantes = new Set()) {
  const meses = [];
  const busca = async (url, op = {}) => {
    const u = decodeURIComponent(new URL(url).pathname.split("/")[3]);
    if (op.method === "POST") { meses.push(u); return new Response("{}", { status: 201 }); }
    const subs = pagantes.has(u) ? { anual: { store: "play_store", period_type: "normal" } } : { promo: { store: "promotional", period_type: "normal" } };
    return new Response(JSON.stringify({ subscriber: { subscriptions: subs, entitlements: {} } }), { status: 200 });
  };
  return { busca, meses };
}

test("indique uma amiga: código, mês grátis para a amiga e prêmio para quem convidou quando a amiga paga", async () => {
  const db = await d1Sqlite();
  const env = { ...ENV, REGISTROS: db, REVENUECAT_API_KEY: "sk_rc" };
  const pagantes = new Set(), rc = rcFalso(pagantes);
  const app = criaApp({ cliente: {}, busca: rc.busca });
  const req = (usuario, metodo = "GET", corpo, ip = "1.1.1.1") => app.fetch(new Request("https://s/indicacao", { method: metodo,
    headers: { "X-Usuario": usuario, "CF-Connecting-IP": ip, "Content-Type": "application/json" }, body: corpo ? JSON.stringify(corpo) : undefined }), env);

  const ana = "aparelho-ana-0000001", bia = "aparelho-bia-0000001", cris = "aparelho-cris-000001", duda = "aparelho-duda-000001";
  const r1 = await (await req(ana)).json();
  assert.match(r1.codigo, /^[A-HJ-NP-Z2-9]{6}$/);
  assert.equal((await (await req(ana)).json()).codigo, r1.codigo); // sempre o mesmo código
  assert.equal((await req("curto")).status, 401);

  // amiga usa o código (com espaço e minúsculas): ganha 1 mês
  const uso = await req(bia, "POST", { codigo: ` ${r1.codigo.toLowerCase()} ` });
  assert.equal(uso.status, 200);
  assert.deepEqual(rc.meses, [bia]);
  assert.equal((await req(bia, "POST", { codigo: r1.codigo })).status, 409); // só uma vez por aparelho
  assert.equal((await req(ana, "POST", { codigo: r1.codigo })).status, 400); // nem o próprio código
  assert.equal((await req(cris, "POST", { codigo: "XXXXXX" })).status, 404);

  // limite de 2 convites por internet em 30 dias
  assert.equal((await req(cris, "POST", { codigo: r1.codigo })).status, 200);
  assert.equal((await req(duda, "POST", { codigo: r1.codigo })).status, 403);
  assert.equal((await req(duda, "POST", { codigo: r1.codigo }, "2.2.2.2")).status, 200);

  // quem convidou só ganha quando a amiga paga (o mês grátis não conta)
  let st = await (await req(ana)).json();
  assert.deepEqual([st.convidadas, st.premiadas, st.novos], [3, 0, 0]);
  pagantes.add(bia);
  st = await (await req(ana)).json();
  assert.deepEqual([st.convidadas, st.premiadas, st.novos], [3, 1, 1]);
  assert.equal(rc.meses.filter((u) => u === ana).length, 1);
  st = await (await req(ana)).json(); // não premia de novo pela mesma amiga
  assert.equal(st.novos, 0);
  assert.equal(rc.meses.filter((u) => u === ana).length, 1);
});

test("indique uma amiga: sem chave do RevenueCat não dá mês grátis, e falha do RevenueCat não gasta o convite", async () => {
  const db = await d1Sqlite();
  const semChave = criaApp({ cliente: {} });
  const post = (app, env, usuario, codigo) => app.fetch(new Request("https://s/indicacao", { method: "POST", headers: { "X-Usuario": usuario }, body: JSON.stringify({ codigo }) }), env);
  const { codigo } = await (await semChave.fetch(new Request("https://s/indicacao", { headers: { "X-Usuario": "aparelho-ana-0000002" } }), { ...ENV, REGISTROS: db })).json();
  assert.equal((await post(semChave, { ...ENV, REGISTROS: db }, "aparelho-bia-0000002", codigo)).status, 503);
  const err = console.error; console.error = () => {};
  try {
    const quebrado = criaApp({ cliente: {}, busca: async () => new Response("", { status: 500 }) });
    assert.equal((await post(quebrado, { ...ENV, REGISTROS: db, REVENUECAT_API_KEY: "sk" }, "aparelho-bia-0000002", codigo)).status, 503);
  } finally { console.error = err; }
  const rc = rcFalso();
  assert.equal((await post(criaApp({ cliente: {}, busca: rc.busca }), { ...ENV, REGISTROS: db, REVENUECAT_API_KEY: "sk" }, "aparelho-bia-0000002", codigo)).status, 200);
});

// ---------- leitor de rótulos ----------
const rotuloOk = (legivel = true) => falso(resp({ legivel, produto: "Marca Sérum X", ingredientes: legivel ? ["Aqua", "Niacinamide", "Salicylic Acid"] : [] }));
const pedeRotulo = (headers = {}) => new Request("https://s/rotulo", {
  method: "POST", body: new Uint8Array([1]), headers: { "Content-Type": "image/jpeg", "X-Usuario": "aparelho-rotulo-0001", ...headers } });
const rcSub = (ativa, pacotes = 0) => async () => new Response(JSON.stringify({ subscriber: {
  entitlements: ativa ? { myskincare_pro: { expires_date: new Date(Date.now() + 864e5).toISOString() } } : {},
  non_subscriptions: pacotes ? { myskincare_rotulos10: Array.from({ length: pacotes }, (_, i) => ({ id: `c${i}` })) } : {},
} }), { status: 200 });

test("rótulo: transcreve com o modelo validado e só para quem assina", async () => {
  const db = await d1Sqlite(); const env = { ...ENV, REGISTROS: db, REVENUECAT_API_KEY: "sk_rc" };
  const c = rotuloOk();
  const r = await criaApp({ cliente: c, busca: rcSub(true) }).fetch(pedeRotulo(), env);
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.deepEqual(j.ingredientes, ["Aqua", "Niacinamide", "Salicylic Acid"]);
  assert.equal(j.produto, "Marca Sérum X");
  assert.equal(j.restam, 4); assert.equal(j.extras, 0);
  assert.equal(c.chamadas[0].model, METODO.modelo);
  assert.equal(c.chamadas[0].output_config.format.schema.required.includes("ingredientes"), true);
  // sem assinatura: 402, sem chamar a IA (a análise grátis não vale para o leitor)
  const c2 = rotuloOk();
  const sem = await criaApp({ cliente: c2, busca: rcSub(false) }).fetch(pedeRotulo({ "X-Usuario": "aparelho-rotulo-0002" }), env);
  assert.equal(sem.status, 402);
  assert.equal(c2.chamadas.length, 0);
});

test("rótulo: 5 por semana; depois, pacote extra; rótulo ilegível não gasta leitura", async () => {
  const db = await d1Sqlite(); const env = { ...ENV, REGISTROS: db, REVENUECAT_API_KEY: "sk_rc" };
  const app = criaApp({ cliente: rotuloOk(), busca: rcSub(true) });
  for (let i = 0; i < 5; i++) assert.equal((await app.fetch(pedeRotulo(), env)).status, 200);
  // ilegível depois do limite também é recusado antes da IA; antes do limite, não conta
  const cheio = await app.fetch(pedeRotulo(), env);
  assert.equal(cheio.status, 429);
  const j = await cheio.json();
  assert.equal(j.causa, "limite_rotulos");
  assert.equal(j.pacote, "myskincare_rotulos10");
  assert.ok(new Date(j.liberaEm) > new Date());
  // com 1 pacote comprado: 10 leituras extras
  const comPacote = criaApp({ cliente: rotuloOk(), busca: rcSub(true, 1) });
  const e1 = await (await comPacote.fetch(pedeRotulo(), env)).json();
  assert.equal(e1.extras, 9);
  const ilegivel = await (await criaApp({ cliente: rotuloOk(false), busca: rcSub(true, 1) }).fetch(pedeRotulo(), env)).json();
  assert.equal(ilegivel.legivel, false);
  assert.equal(ilegivel.extras, 9, "ilegível não gasta o extra");
  const e2 = await (await comPacote.fetch(pedeRotulo(), env)).json();
  assert.equal(e2.extras, 8);
  // outro aparelho tem a própria cota
  const outro = await (await app.fetch(pedeRotulo({ "X-Usuario": "aparelho-rotulo-0009" }), env)).json();
  assert.equal(outro.restam, 4);
});

test("rótulo: código de convite não tem cota; limpeza apaga leituras semanais antigas e guarda as extras", async () => {
  const { apagaRotulosAntigos } = await import("../src/index.js");
  const db = await d1Sqlite(); const env = { ...ENV, REGISTROS: db, REVENUECAT_API_KEY: "sk_rc" };
  const app = criaApp({ cliente: rotuloOk(), busca: async () => { throw new Error("não deve consultar o RevenueCat"); } });
  for (let i = 0; i < 7; i++) assert.equal((await app.fetch(pedeRotulo({ Authorization: "Bearer segredo" }), env)).status, 200);
  const velho = new Date(Date.now() - 10 * 864e5).toISOString();
  await apagaRotulosAntigos(env); // creates the table (the invite code never touches the quota)
  await db.prepare("INSERT INTO rotulos (usuario, quando, extra) VALUES (?1, ?2, 0)").bind("a", velho).run();
  await db.prepare("INSERT INTO rotulos (usuario, quando, extra) VALUES (?1, ?2, 1)").bind("a", velho).run();
  await apagaRotulosAntigos(env);
  const sobra = await db.prepare("SELECT extra FROM rotulos").all();
  assert.deepEqual(sobra.results.map((x) => x.extra), [1]);
});

test("tom e subtom: só com X-Tom: 1, em chamada separada; falha no tom não derruba a análise", async () => {
  const chamadas = [];
  const cliente = { beta: { messages: { create: async (p) => {
    chamadas.push(p);
    if (p.output_config.format.schema.required.includes("subtom")) return resp({ avaliavel: true, tom: "medio", subtom: "quente", confianca: "alta" });
    return resp({ notas: notasOk, confianca: "alta", idade_aparente: 40 });
  } } } };
  const sem = await (await criaApp({ cliente }).fetch(pede(new Uint8Array([1])), ENV)).json();
  assert.equal(sem.tom, undefined);
  assert.equal(chamadas.length, 1);
  assert.equal(chamadas[0].messages[0].content[1].text, METODO.prompt, "o pedido validado não muda");
  const com = await (await criaApp({ cliente }).fetch(pede(new Uint8Array([1]), { "X-Tom": "1" }), ENV)).json();
  assert.deepEqual(com.tom, { avaliavel: true, tom: "medio", subtom: "quente", confianca: "alta" });
  assert.equal(com.skin_score, 80);
  const quebra = { beta: { messages: { create: async (p) => {
    if (p.output_config.format.schema.required.includes("subtom")) throw new Error("falhou");
    return resp({ notas: notasOk, confianca: "alta", idade_aparente: 40 });
  } } } };
  const err = console.error; console.error = () => {};
  try {
    const r = await criaApp({ cliente: quebra }).fetch(pede(new Uint8Array([1]), { "X-Tom": "1" }), ENV);
    assert.equal(r.status, 200);
    assert.equal((await r.json()).tom, null);
  } finally { console.error = err; }
});
