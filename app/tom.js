// MY Skin Care — tom e subtom da pele (devolvidos pela análise quando a pessoa ativa o recurso) e as famílias
// de cor de maquiagem que costumam combinar. Sugestões de cor, sem marca nem código de tonalidade.
// Este arquivo não usa o navegador, para poder ser testado com `node --test`.

export const NOMES_TOM = { muito_claro: "muito claro", claro: "claro", medio: "médio", moreno: "moreno", escuro: "escuro", muito_escuro: "muito escuro" };
export const NOMES_SUBTOM = { frio: "frio (rosado)", neutro: "neutro", quente: "quente (dourado)", oliva: "oliva (esverdeado)" };

const POR_SUBTOM = {
  quente: { base: "fundo dourado, amarelado ou pêssego", batom: "terracota, nude pêssego, coral e tijolo", evite: "bases de fundo muito rosado" },
  frio: { base: "fundo rosado", batom: "rosa, frutas vermelhas, vinho e nude rosado", evite: "bases muito amareladas ou alaranjadas" },
  neutro: { base: "fundo bege neutro, nem rosado nem amarelado", batom: "nude rosado, malva e vermelho clássico", evite: "extremos: muito rosado ou muito alaranjado" },
  oliva: { base: "fundo amarelo-esverdeado (oliva) ou neutro-dourado", batom: "tijolo, ameixa, nude amarronzado e vinho", evite: "bases rosadas, que deixam a pele acinzentada" },
};

/** Makeup color suggestions for a tone result ({ tom, subtom }), or null. */
export function coresDoTom(t) {
  if (!t?.avaliavel || !POR_SUBTOM[t.subtom]) return null;
  const c = POR_SUBTOM[t.subtom];
  const escuro = t.tom === "escuro" || t.tom === "muito_escuro" || t.tom === "moreno";
  return {
    base: `Base e corretivo com ${c.base}.`,
    corretivo: escuro ? "Para olheiras, um corretivo pêssego ou alaranjado antes da base neutraliza o tom arroxeado." : "Para olheiras, corretivo um tom mais claro que a base, com fundo pêssego se forem arroxeadas.",
    batom: `Batons: ${c.batom}.`,
    evite: `Evite: ${c.evite}.`,
  };
}
