// MY Skin Care — tom e subtom da pele (devolvidos pela análise quando a pessoa ativa o recurso), conferidos
// com 3 perguntas, e as famílias de cor de maquiagem que costumam combinar. Sem marca nem código de tonalidade.
// Este arquivo não usa o navegador, para poder ser testado com `node --test`.

export const NOMES_TOM = { muito_claro: "muito claro", claro: "claro", medio: "médio", moreno: "moreno", escuro: "escuro", muito_escuro: "muito escuro" };
export const NOMES_SUBTOM = { frio: "frio (rosado)", neutro: "neutro", quente: "quente (dourado)", oliva: "oliva (esverdeado)" };

const POR_SUBTOM = {
  quente: { base: "fundo dourado, amarelado ou pêssego", batom: "terracota, nude pêssego, coral e tijolo", evite: "bases de fundo muito rosado" },
  frio: { base: "fundo rosado", batom: "rosa, frutas vermelhas, vinho e nude rosado", evite: "bases muito amareladas ou alaranjadas" },
  neutro: { base: "fundo bege neutro, nem rosado nem amarelado", batom: "nude rosado, malva e vermelho clássico", evite: "extremos: muito rosado ou muito alaranjado" },
  oliva: { base: "fundo amarelo-esverdeado (oliva) ou neutro-dourado", batom: "tijolo, ameixa, nude amarronzado e vinho", evite: "bases rosadas, que deixam a pele acinzentada" },
};

// ---------- the 3 questions makeup artists use, combined with the photo ----------
// The photo's undertone is the most error-prone part (light, phone processing, makeup), so it is checked
// against three answers about the person's own skin. The person can also pick the undertone by hand.
export const PERGUNTAS = [
  { k: "veias", t: "Olhando as veias do pulso na luz do dia, elas parecem:", op: [["azul", "Azuladas ou roxas"], ["verde", "Esverdeadas"], ["ambas", "Das duas cores"], ["nao_sei", "Não sei dizer"]] },
  { k: "joias", t: "Que joias combinam mais com a sua pele?", op: [["prata", "Prateadas"], ["ouro", "Douradas"], ["ambas", "As duas"], ["nao_sei", "Não sei dizer"]] },
  { k: "sol", t: "No sol, sem protetor, a sua pele:", op: [["queima", "Queima e fica vermelha"], ["bronzeia", "Bronzeia fácil"], ["os_dois", "Queima um pouco e depois bronzeia"], ["nao_sei", "Não sei dizer"]] },
];
// each answer votes for cold (+) or warm (-); the sun counts half, since it mixes depth and undertone
const VOTO = { veias: { azul: 1, verde: -1, ambas: 0 }, joias: { prata: 1, ouro: -1, ambas: 0 }, sol: { queima: 0.5, bronzeia: -0.5, os_dois: 0 } };

/** Undertone from the answers alone: { subtom, forca } (forca = how many answers point that way), or null. */
export function subtomDasRespostas(r) {
  const validas = PERGUNTAS.map((p) => r?.[p.k]).filter((v) => v && v !== "nao_sei");
  if (validas.length < 2) return null; // one answer is not enough
  const soma = PERGUNTAS.reduce((s, p) => s + (VOTO[p.k][r?.[p.k]] ?? 0), 0);
  const subtom = soma >= 1 ? "frio" : soma <= -1 ? "quente" : "neutro";
  const forca = PERGUNTAS.filter((p) => { const v = VOTO[p.k][r?.[p.k]]; return v !== undefined && (subtom === "frio" ? v > 0 : subtom === "quente" ? v < 0 : v === 0); }).length;
  return { subtom, forca };
}
// olive skin usually answers "both"/neutral or warm: the questions cannot tell it apart, so they agree with it
const combina = (foto, resp) => foto === resp || (foto === "oliva" && (resp === "neutro" || resp === "quente"));

/**
 * Final undertone: the person's choice, or the photo checked against the answers.
 * @param {object|null} foto  tone from the analysis ({ avaliavel, tom, subtom, confianca }), usable or not
 * @param {object} p  { respostas, escolhido } kept in the profile
 * @returns {{ tom, subtom, alternativa, confianca, fonte } | null}  fonte: "voce" | "foto+respostas" | "foto" | "respostas"
 */
export function subtomFinal(foto, p = {}) {
  const tom = foto?.avaliavel ? foto.tom : null;
  if (p.escolhido && POR_SUBTOM[p.escolhido]) return { tom, subtom: p.escolhido, alternativa: null, confianca: "alta", fonte: "voce" };
  const fotoOk = foto?.avaliavel && foto.confianca !== "baixa" ? foto.subtom : null;
  const resp = subtomDasRespostas(p.respostas);
  if (fotoOk && resp) {
    if (combina(fotoOk, resp.subtom)) return { tom, subtom: fotoOk, alternativa: null, confianca: "alta", fonte: "foto+respostas" };
    // disagreement: the answers win when they agree among themselves (the photo depends on the light)
    const [sub, alt] = resp.forca >= 2 ? [resp.subtom, fotoOk] : [fotoOk, resp.subtom];
    return { tom, subtom: sub, alternativa: alt, confianca: "media", fonte: "foto+respostas" };
  }
  if (fotoOk) return { tom, subtom: fotoOk, alternativa: null, confianca: foto.confianca === "alta" ? "media" : "baixa", fonte: "foto" };
  if (resp) return { tom, subtom: resp.subtom, alternativa: null, confianca: resp.forca >= 2 ? "media" : "baixa", fonte: "respostas" };
  return null;
}

/** Makeup color suggestions for { tom, subtom } (tom may be unknown), or null. */
export function coresDoTom(t) {
  if (!t || !POR_SUBTOM[t.subtom] || t.avaliavel === false) return null;
  const c = POR_SUBTOM[t.subtom];
  const escuro = t.tom === "escuro" || t.tom === "muito_escuro" || t.tom === "moreno";
  return {
    base: `Base e corretivo com ${c.base}.`,
    corretivo: escuro ? "Para olheiras, um corretivo pêssego ou alaranjado antes da base neutraliza o tom arroxeado." : "Para olheiras, corretivo um tom mais claro que a base, com fundo pêssego se forem arroxeadas.",
    batom: `Batons: ${c.batom}.`,
    evite: `Evite: ${c.evite}.`,
  };
}
