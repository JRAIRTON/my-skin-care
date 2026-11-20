// Validação do tom e do subtom (antes de ligar TOM_PUBLICO em app/app.js).
// Roda o mesmo pedido do servidor (analisaTom, em server/src/index.js) em fotos com o tom e o subtom já
// conhecidos, e mede os acertos por fototipo. Fotos e respostas não vão para o repositório.
//
//   cd server && npm ci
//   ANTHROPIC_API_KEY=... node ../scripts/tom_validacao.mjs --fotos ../tom-dados/fotos --respostas ../tom-dados/respostas.csv
//
// respostas.csv (uma linha por foto, com cabeçalho):  arquivo,tom,subtom,fototipo
//   F01.jpg,medio,quente,3
// tom: muito_claro, claro, medio, moreno, escuro ou muito_escuro · subtom: frio, neutro, quente ou oliva
// fototipo: 1 a 6 (o que a pessoa ou a profissional informou). Critério para ligar o recurso, em cada grupo
// de fototipo com 3 fotos ou mais: subtom certo em 70% ou mais e tom certo ou vizinho em 85% ou mais.
import { readFileSync, readdirSync } from "node:fs";
import { join, extname } from "node:path";
import Anthropic from "../server/node_modules/@anthropic-ai/sdk/index.mjs";
import { analisaTom, TONS } from "../server/src/index.js";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const pasta = arg("--fotos"), csv = arg("--respostas");
if (!pasta || !csv || !process.env.ANTHROPIC_API_KEY) {
  console.error("Uso: ANTHROPIC_API_KEY=... node scripts/tom_validacao.mjs --fotos PASTA --respostas respostas.csv");
  process.exit(1);
}
const TIPOS = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };
const [cab, ...linhas] = readFileSync(csv, "utf8").trim().split(/\r?\n/);
const cols = cab.split(",").map((c) => c.trim());
const certo = Object.fromEntries(linhas.map((l) => { const v = l.split(",").map((c) => c.trim()); const o = Object.fromEntries(cols.map((c, i) => [c, v[i]])); return [o.arquivo, o]; }));
const fotos = readdirSync(pasta).filter((f) => TIPOS[extname(f).toLowerCase()] && certo[f]);
if (!fotos.length) { console.error("Nenhuma foto da pasta está no respostas.csv."); process.exit(1); }

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY.trim(), maxRetries: 2 });
const linhasRes = [];
for (const f of fotos) {
  const img = readFileSync(join(pasta, f));
  let r;
  try { r = await analisaTom(client, img.buffer.slice(img.byteOffset, img.byteOffset + img.byteLength), TIPOS[extname(f).toLowerCase()]); }
  catch (e) { r = { erro: e.message }; }
  const c = certo[f];
  const d = r?.avaliavel ? Math.abs(TONS.indexOf(r.tom) - TONS.indexOf(c.tom)) : null;
  linhasRes.push({ f, fototipo: c.fototipo || "?", esperado: `${c.tom}/${c.subtom}`, ia: r?.avaliavel ? `${r.tom}/${r.subtom} (${r.confianca})` : r?.erro ? `erro: ${r.erro}` : "não avaliável",
    tomOk: d === 0, tomPerto: d !== null && d <= 1, subOk: r?.avaliavel && r.subtom === c.subtom, baixa: !r?.avaliavel || r.confianca === "baixa" });
  console.log(`${f}\tfototipo ${c.fototipo || "?"}\tesperado ${c.tom}/${c.subtom}\tIA ${linhasRes.at(-1).ia}`);
}
const pct = (xs, k) => xs.length ? Math.round((100 * xs.filter((x) => x[k]).length) / xs.length) : 0;
console.log("\nPor fototipo (só fotos avaliadas com confiança média ou alta):");
console.log("fototipo\tfotos\tsubtom certo\ttom certo\ttom certo ou vizinho\tconfiança baixa ou sem avaliação");
let aprovado = true;
for (const g of [...new Set(linhasRes.map((x) => x.fototipo))].sort()) {
  const todas = linhasRes.filter((x) => x.fototipo === g), uteis = todas.filter((x) => !x.baixa);
  const sub = pct(uteis, "subOk"), perto = pct(uteis, "tomPerto");
  if (uteis.length >= 3 && (sub < 70 || perto < 85)) aprovado = false;
  console.log(`${g}\t${todas.length}\t${sub}%\t${pct(uteis, "tomOk")}%\t${perto}%\t${pct(todas, "baixa")}%`);
}
const grupos = new Set(linhasRes.map((x) => x.fototipo));
console.log(`\nGrupos de fototipo: ${[...grupos].join(", ")}. ${["4", "5", "6"].every((g) => grupos.has(g)) ? "" : "Faltam fotos de fototipos IV a VI: o teste não está completo. "}`);
console.log(aprovado ? "Resultado: dentro do critério nos grupos com 3 fotos ou mais." : "Resultado: FORA do critério. Não ligar TOM_PUBLICO.");
