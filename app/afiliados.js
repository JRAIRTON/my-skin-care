// Links de compra dos produtos, com os códigos dos programas de afiliados.
// Os códigos não são segredo: vão no link que a pessoa abre. Código vazio = link comum, sem comissão
// e sem o aviso de parceria. Como preencher cada um: docs/afiliados.md.
//
// A comissão nunca entra na escolha dos produtos (recomenda.js não lê este arquivo). Ela só decide
// para qual loja o botão leva.
export const AFILIADOS = {
  // Amazon Associados: o "ID de rastreamento" (ex.: "myskincare-20")
  amazon: "",
  // Mercado Livre Afiliados: os parâmetros que o gerador de links do programa coloca no endereço
  mercadoLivre: { matt_tool: "", matt_word: "" },
  // Awin: o seu ID de publisher (awinaffid). Cada loja abaixo só aparece com o seu awinmid preenchido
  awin: "",
};

// Lojas pela Awin. Conferir o endereço de busca de cada uma ao ativar (abrir e buscar um produto).
export const LOJAS_AWIN = [
  { nome: "Drogasil", awinmid: "", busca: "https://www.drogasil.com.br/search?w=" },
  { nome: "Droga Raia", awinmid: "", busca: "https://www.drogaraia.com.br/search?w=" },
  { nome: "Beleza na Web", awinmid: "", busca: "https://www.belezanaweb.com.br/busca?q=" },
];

const enc = encodeURIComponent;

// Lista [nome, url, parceiro] para o produto buscado por `q`. Lojas com comissão primeiro; o Google
// Shopping fica no fim, para comparar preços em todas as lojas.
export function linksCompra(q, cfg = AFILIADOS, awin = LOJAS_AWIN) {
  const ml = cfg.mercadoLivre || {};
  const mlParams = [["matt_tool", ml.matt_tool], ["matt_word", ml.matt_word]].filter(([, v]) => v).map(([k, v]) => `${k}=${enc(v)}`).join("&");
  const links = [
    ["Mercado Livre", "https://lista.mercadolivre.com.br/" + enc(q.trim().replace(/\s+/g, "-")) + (mlParams ? "?" + mlParams : ""), !!mlParams],
    ["Amazon", "https://www.amazon.com.br/s?k=" + enc(q) + (cfg.amazon ? "&tag=" + enc(cfg.amazon) : ""), !!cfg.amazon],
    ...(cfg.awin ? awin.filter((l) => l.awinmid).map((l) => [l.nome,
      `https://www.awin1.com/cread.php?awinmid=${enc(l.awinmid)}&awinaffid=${enc(cfg.awin)}&ued=${enc(l.busca + enc(q))}`, true]) : []),
    ["Google Shopping", "https://www.google.com/search?tbm=shop&q=" + enc(q), false],
  ];
  return links.sort((a, b) => b[2] - a[2]); // sort estável: mantém a ordem dentro de cada grupo
}

// Há algum programa ativo? Decide o texto sobre comissão no app.
export const temAfiliado = (cfg = AFILIADOS, awin = LOJAS_AWIN) => linksCompra("x", cfg, awin).some((l) => l[2]);
