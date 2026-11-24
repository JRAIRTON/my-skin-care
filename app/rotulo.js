// MY Skin Care — avaliação de um rótulo lido pelo servidor (POST /rotulo devolve só os ingredientes).
// Regras fixas, sem IA, as mesmas de docs/ingredientes-v1.md: o que o produto tem, se combina com os focos da
// pessoa e se conflita com a rotina, a gestação, a pele sensível ou uma recuperação de procedimento. Tudo
// roda no aparelho: o perfil e a rotina não vão ao servidor.
// Este arquivo não usa o navegador, para poder ser testado com `node --test`.

// ingredient classes, recognized by the INCI name printed on the label (accents and case ignored)
export const CLASSES = {
  retinoide: { nome: "Retinoide", re: /\bretin(ol|al|aldehyde|yl)|hydroxypinacolone retinoate|\bretinoate\b/ },
  receita: { nome: "Ativo de prescrição", re: /\btretinoin|\badapalen|\bisotretinoin|\bhydroquinon|\btazaroten/ },
  glicolico: { nome: "Ácido glicólico", re: /\bglycolic acid/ },
  latico: { nome: "Ácido lático", re: /\blactic acid/ },
  mandelico: { nome: "Ácido mandélico", re: /\bmandelic acid/ },
  salicilico: { nome: "Ácido salicílico", re: /\bsalicylic acid|\bbetaine salicylate/ },
  vitc: { nome: "Vitamina C", re: /\bascorbic acid|\bascorbyl|\bascorbate/ },
  niacinamida: { nome: "Niacinamida", re: /\bniacinamide/ },
  azelaico: { nome: "Ácido azelaico", re: /\bazelaic acid|\bazeloyl/ },
  peroxido: { nome: "Peróxido de benzoíla", re: /\bbenzoyl peroxide/ },
  tranexamico: { nome: "Ácido tranexâmico", re: /\btranexamic acid/ },
  arbutin: { nome: "Alfa-arbutin", re: /\barbutin/ },
  hialuronico: { nome: "Ácido hialurônico", re: /\bhyaluron/ },
  ceramidas: { nome: "Ceramidas", re: /\bceramide/ },
  pantenol: { nome: "Pantenol", re: /\bpanthenol/ },
  centella: { nome: "Centella asiática", re: /\bcentella|\bmadecassoside|\basiaticoside/ },
  ureia: { nome: "Ureia", re: /^urea$|\burea\b/ },
  zinco: { nome: "Zinco", re: /\bzinc (pca|gluconate)/ },
  peptideos: { nome: "Peptídeos", re: /\bpeptide|\bpalmitoyl (tri|tetra|penta|hexa)/ },
  fragrancia: { nome: "Fragrância", re: /^(parfum|fragrance|aroma)$|\bparfum\b|\bfragrance\b/ },
  alcool: { nome: "Álcool", re: /^alcohol( denat\.?)?$|\balcohol denat|^ethanol$/ },
};
const ACIDOS = ["glicolico", "latico", "mandelico", "salicilico"];

// what each class helps with, by the objectives of the Método MY Skin v1 (OBJETIVOS in recomenda.js)
const AJUDA = {
  retinoide: ["Linhas finas", "Firmeza"], glicolico: ["Uniformizar o tom"], latico: ["Hidratação", "Uniformizar o tom"],
  mandelico: ["Reduzir manchas", "Uniformizar o tom"], salicilico: ["Acne e oleosidade", "Poros"],
  vitc: ["Reduzir manchas", "Uniformizar o tom"], niacinamida: ["Poros", "Acne e oleosidade", "Uniformizar o tom", "Vermelhidão"],
  azelaico: ["Reduzir manchas", "Vermelhidão"], tranexamico: ["Reduzir manchas"], arbutin: ["Reduzir manchas"],
  hialuronico: ["Hidratação"], ceramidas: ["Hidratação"], pantenol: ["Vermelhidão", "Hidratação"], centella: ["Vermelhidão"],
  ureia: ["Hidratação"], zinco: ["Acne e oleosidade"], peptideos: ["Firmeza", "Linhas finas"],
};

const limpa = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Classes found in the ingredient list, with the position of the first match (0 = first ingredient). */
export function classifica(ingredientes) {
  const achados = {};
  (ingredientes || []).forEach((ing, i) => {
    const t = limpa(ing);
    for (const [k, c] of Object.entries(CLASSES)) if (!(k in achados) && c.re.test(t)) achados[k] = i;
  });
  return achados;
}

/**
 * @param {string[]} ingredientes  as printed (INCI)
 * @param {object} ctx  { perfil, rotina: classes of the actives in the routine (["vitc","retinoide",...]),
 *                        prioridades: objectives in order, sensivel, fototipo, recuperacao: "AAAA-MM-DD" or null }
 * @returns {{ nivel: "verde"|"amarelo"|"vermelho", titulo: string, pontos: {tipo:"bom"|"atencao"|"evitar"|"dica", texto:string}[], achados: string[] }}
 */
export function avaliaRotulo(ingredientes, ctx = {}) {
  const a = classifica(ingredientes);
  const tem = (k) => k in a;
  const nome = (k) => CLASSES[k].nome;
  const pontos = [];
  const evitar = (t) => pontos.push({ tipo: "evitar", texto: t });
  const atencao = (t) => pontos.push({ tipo: "atencao", texto: t });
  const bom = (t) => pontos.push({ tipo: "bom", texto: t });
  const dica = (t) => pontos.push({ tipo: "dica", texto: t }); // advice that does not change the verdict
  const rotina = new Set(ctx.rotina || []);
  const acidos = ACIDOS.filter(tem);
  const fototipo = Number(ctx.perfil?.fototipo) || 0;

  // never without a prescription
  if (tem("receita")) evitar("Contém um ativo que só deve ser usado com prescrição médica (como tretinoína, adapaleno ou hidroquinona). Converse com um dermatologista antes de usar.");
  // pregnancy and breastfeeding
  if (ctx.perfil?.gestante) {
    if (tem("retinoide")) evitar("Contém retinoide, que deve ser evitado na gestação e na amamentação.");
    if (tem("salicilico")) atencao("Contém ácido salicílico: na gestação e na amamentação, só em baixa concentração e com o aval do seu médico.");
  }
  // recovery after a procedure
  if (ctx.recuperacao && (tem("retinoide") || acidos.length || tem("vitc") || tem("peroxido")))
    atencao(`Você está em recuperação de um procedimento até ${ctx.recuperacao.split("-").reverse().join("/")}. Deixe este ativo para depois, a menos que o profissional oriente diferente.`);
  // conflicts with the routine (same application)
  if (tem("retinoide") && (acidos.length || rotina.has("acido"))) atencao(`Retinoide e ácido esfoliante irritam juntos. ${acidos.length ? "Este produto já tem os dois: use com cautela, em noites alternadas." : "Não use na mesma noite do ácido da sua rotina: alterne as noites."}`);
  if (acidos.length && rotina.has("retinoide") && !tem("retinoide")) atencao(`Contém ${nome(acidos[0]).toLowerCase()}. Não use na mesma noite do retinoide da sua rotina: alterne as noites.`);
  if (tem("retinoide") && rotina.has("retinoide")) atencao("Sua rotina já tem um retinoide. Dois ao mesmo tempo aumentam a irritação: use um ou outro.");
  if (tem("peroxido") && (tem("retinoide") || rotina.has("retinoide"))) atencao("Peróxido de benzoíla com retinoide irrita e pode inativar alguns retinoides. Use em horários diferentes.");
  if (tem("vitc") && (acidos.length || rotina.has("acido"))) atencao("Vitamina C com ácido esfoliante pode irritar. Use a vitamina C de manhã e o ácido à noite.");
  if (tem("vitc") && rotina.has("vitc")) atencao("Sua rotina já tem vitamina C: não precisa de outra.");
  // sensitive skin
  if (ctx.sensivel) {
    if (tem("glicolico") || tem("salicilico")) atencao("Para pele sensível, este ácido pode irritar. Prefira ácido mandélico ou lático e teste numa pequena área.");
    if (tem("fragrancia")) atencao("Tem fragrância, que pode irritar pele sensível.");
    if (tem("alcool") && a.alcool <= 4) atencao("Álcool entre os primeiros ingredientes pode ressecar e irritar pele sensível.");
  } else if (tem("alcool") && a.alcool <= 4 && (ctx.prioridades || []).includes("Hidratação")) {
    atencao("Álcool entre os primeiros ingredientes pode ressecar: atenção, já que hidratação é um dos seus focos.");
  }
  // skin types IV to VI: gentle actives and more sunscreen (docs/ingredientes-v1.md)
  if (fototipo >= 4 && tem("glicolico")) atencao("Em peles morenas e negras, ácido glicólico pode deixar manchas se irritar. Comece devagar e reforce o protetor solar.");
  if (acidos.length || tem("retinoide")) dica("Aumenta a sensibilidade ao sol: protetor solar todos os dias.");

  // what it does for this person
  const focos = new Set(ctx.prioridades || []);
  for (const k of Object.keys(AJUDA)) {
    if (!tem(k) || (ctx.perfil?.gestante && k === "retinoide")) continue;
    const meus = AJUDA[k].filter((o) => focos.has(o));
    if (meus.length) {
      // objectives already contain "e" ("Acne e oleosidade"): list them with commas
      const l = meus.map((o) => o.toLowerCase()), lista = l.length > 1 ? `${l.slice(0, -1).join(", ")}, e ${l.at(-1)}` : l[0];
      bom(`${nome(k)}: ajuda em ${lista}, ${meus.length > 1 ? "focos" : "um foco"} da sua pele.`);
    }
  }
  if (!tem("fragrancia") && ingredientes?.length) bom("Sem fragrância na lista.");
  if (!Object.keys(AJUDA).some(tem) && !tem("receita")) dica("Não encontramos ativos de tratamento: é um produto básico (limpeza, hidratação ou proteção).");

  const achados = Object.keys(a).filter((k) => k !== "fragrancia" && k !== "alcool").map(nome);
  const nivel = pontos.some((p) => p.tipo === "evitar") ? "vermelho" : pontos.some((p) => p.tipo === "atencao") ? "amarelo" : "verde";
  const titulo = { vermelho: "Não recomendado para você agora", amarelo: "Combina, com cuidados", verde: "Combina com a sua pele" }[nivel];
  return { nivel, titulo, pontos, achados };
}
