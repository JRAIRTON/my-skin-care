// Testes dos módulos do app que rodam no aparelho: UV calculado, regras do leitor de rótulos e cores do tom.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { uvDoDia, nivelUV, uvCeuAberto } from "../../app/uv.js";
import { classifica, avaliaRotulo } from "../../app/rotulo.js";
import { coresDoTom } from "../../app/tom.js";

test("UV de céu aberto: alto no verão e baixo no inverno do Sul, zero à noite", () => {
  const verao = uvDoDia("2026-12-21", -25.54, -54.58), inverno = uvDoDia("2026-06-21", -25.54, -54.58);
  assert.ok(verao.max >= 12 && verao.max <= 16, `verão em Foz: ${verao.max}`);
  assert.ok(inverno.max >= 3 && inverno.max <= 7, `inverno em Foz: ${inverno.max}`);
  assert.ok(verao.alto && verao.alto[1] - verao.alto[0] >= 4, "janela de UV muito alto de algumas horas"); // horas locais: dependem do fuso
  assert.equal(inverno.alto, null);
  assert.equal(uvCeuAberto(new Date("2026-12-21T05:00:00Z"), -25.54, -54.58), 0); // 2h da manhã em Foz
  assert.ok(uvCeuAberto(new Date("2026-12-21T15:30:00Z"), -25.54, -54.58) > 12); // meio-dia solar em Foz
  assert.equal(nivelUV(11).nivel, "extremo");
  assert.equal(nivelUV(2).nivel, "baixo");
});

test("lista de cidades: todas com UF e coordenadas no Brasil", () => {
  const { cidades } = JSON.parse(readFileSync(new URL("../../app/cidades.json", import.meta.url), "utf8"));
  assert.ok(cidades.length > 5500);
  for (const [n, uf, lat, lon] of cidades) {
    assert.ok(n && /^[A-Z]{2}$/.test(uf));
    assert.ok(lat > -34 && lat < 6 && lon > -74 && lon < -28, n);
  }
  assert.ok(cidades.some(([n, uf]) => n === "Foz do Iguaçu" && uf === "PR"));
});

test("rótulo: reconhece os ativos pelo nome INCI, sem confundir parecidos", () => {
  const a = classifica(["Aqua", "Niacinamide", "Salicylic Acid", "Sodium Hyaluronate", "Parfum", "Retinyl Palmitate", "Citric Acid"]);
  assert.deepEqual(Object.keys(a).sort(), ["fragrancia", "hialuronico", "niacinamida", "retinoide", "salicilico"]);
  assert.deepEqual(Object.keys(classifica(["Aqua", "Glycerin", "Cetearyl Alcohol", "Benzyl Alcohol"])), []);
  assert.ok("alcool" in classifica(["Alcohol Denat.", "Aqua"]));
});

test("rótulo: gestação e ativos de prescrição ficam em vermelho", () => {
  const g = avaliaRotulo(["Aqua", "Retinol"], { perfil: { gestante: true } });
  assert.equal(g.nivel, "vermelho");
  assert.ok(g.pontos.some((p) => /gestação/.test(p.texto)));
  assert.ok(!g.pontos.some((p) => p.tipo === "bom" && /Retinoide/.test(p.texto)), "não elogia retinoide na gestação");
  assert.equal(avaliaRotulo(["Aqua", "Hydroquinone"], {}).nivel, "vermelho");
});

test("rótulo: conflito com a rotina e foco da pessoa", () => {
  const r = avaliaRotulo(["Aqua", "Glycolic Acid", "Niacinamide"], { rotina: ["retinoide"], prioridades: ["Poros"] });
  assert.equal(r.nivel, "amarelo");
  assert.ok(r.pontos.some((p) => p.tipo === "atencao" && /mesma noite do retinoide/.test(p.texto)));
  assert.ok(r.pontos.some((p) => p.tipo === "bom" && /Niacinamida: ajuda em poros/.test(p.texto)));
  const ok = avaliaRotulo(["Aqua", "Niacinamide", "Glycerin"], { prioridades: ["Poros"] });
  assert.equal(ok.nivel, "verde");
  assert.equal(avaliaRotulo(["Aqua", "Glycerin"], {}).pontos.some((p) => /produto básico/.test(p.texto)), true);
});

test("rótulo: pele sensível, fragrância e recuperação de procedimento", () => {
  const s = avaliaRotulo(["Alcohol Denat.", "Aqua", "Parfum"], { sensivel: true });
  assert.equal(s.nivel, "amarelo");
  assert.equal(s.pontos.filter((p) => p.tipo === "atencao").length, 2);
  const rec = avaliaRotulo(["Aqua", "Ascorbic Acid"], { recuperacao: "2026-12-01" });
  assert.ok(rec.pontos.some((p) => /01\/12\/2026/.test(p.texto)));
});

test("tom: cores por subtom, nada quando não deu para avaliar", () => {
  assert.match(coresDoTom({ avaliavel: true, tom: "medio", subtom: "quente" }).base, /dourado/);
  assert.match(coresDoTom({ avaliavel: true, tom: "escuro", subtom: "frio" }).corretivo, /pêssego ou alaranjado/);
  assert.equal(coresDoTom({ avaliavel: false }), null);
  assert.equal(coresDoTom(null), null);
});
