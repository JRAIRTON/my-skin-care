// MY Skin AI — rotina e produtos a partir das notas (Método MY Skin v1).
// Regras fixas, sem IA: seguem docs/ingredientes-v1.md e escolhem só do catálogo (docs/catalogo-v1.json).
// Este arquivo não usa o navegador, para poder ser testado com `node --test`.

export const CATS = [
  ["textura", "Textura"],
  ["poros", "Poros"],
  ["linhas", "Rugas e linhas"],
  ["firmeza", "Firmeza"],
  ["manchas", "Manchas"],
  ["uniformidade", "Uniformidade do tom"],
  ["vermelhidao", "Vermelhidão"],
  ["oleosidade", "Oleosidade"],
  ["brilho", "Luminosidade"],
  ["hidratacao", "Hidratação"],
];

// O que cada grau quer dizer (mesmos descritores enviados à IA pelo servidor).
export const GRAUS = {
  textura: ["lisa e regular", "pequenas elevações ou aspereza em uma área", "irregularidade em várias áreas ou cicatrizes rasas", "irregularidade evidente, cicatrizes múltiplas", "irregularidade intensa e difusa"],
  poros: ["poros praticamente invisíveis", "poros visíveis só no nariz", "poros visíveis no nariz e na parte interna das bochechas", "poros dilatados em bochechas e testa", "poros muito dilatados em todo o rosto"],
  linhas: ["sem linhas", "linhas finas só na expressão", "linhas finas visíveis em repouso", "rugas evidentes em repouso", "rugas profundas e difusas"],
  firmeza: ["contorno nítido, sem flacidez", "contorno levemente suavizado", "sulco nasogeniano marcado, flacidez moderada", "flacidez evidente no contorno da mandíbula", "flacidez intensa"],
  manchas: ["sem manchas", "poucas sardas ou uma mancha pequena", "várias manchas ou mancha difusa leve", "manchas múltiplas ou mancha difusa moderada", "manchas extensas"],
  uniformidade: ["tom homogêneo", "diferença leve localizada (olheiras, ao redor do nariz)", "diferenças de tom em várias áreas", "tom evidentemente irregular", "tom muito irregular"],
  vermelhidao: ["sem vermelhidão", "vermelhidão quase imperceptível", "vermelhidão leve e bem definida", "vermelhidão moderada ou vasinhos visíveis", "vermelhidão intensa"],
  oleosidade: ["sem brilho oleoso", "brilho leve só na zona T", "brilho evidente na zona T", "zona T e bochechas oleosas", "muito oleosa em todo o rosto"],
  brilho: ["luminosa, com viço", "levemente opaca em algumas áreas", "opaca em boa parte do rosto", "opaca e sem vida", "muito opaca, acinzentada"],
  hidratacao: ["sem sinal de ressecamento", "aspereza leve", "descamação fina localizada", "descamação evidente", "descamação intensa ou fissuras"],
};

export const OBJETIVOS = {
  "Reduzir manchas": ["manchas"],
  "Uniformizar o tom": ["uniformidade", "brilho"],
  "Hidratação": ["hidratacao"],
  "Linhas finas": ["linhas", "textura"],
  "Firmeza": ["firmeza"],
  "Acne e oleosidade": ["oleosidade"],
  "Poros": ["poros"],
  "Vermelhidão": ["vermelhidao"],
};

export const TIPOS_PELE = { nao_sei: "Não sei", normal: "Normal", seca: "Seca", oleosa: "Oleosa", mista: "Mista", sensivel: "Sensível" };
export const FOTOTIPOS = ["Prefiro não informar", "I · muito clara, sempre queima", "II · clara, queima fácil", "III · média, às vezes queima", "IV · morena clara, raramente queima", "V · morena escura", "VI · negra"];

// Classe de cada sérum do catálogo. Teste em server/test garante que nenhum sérum fica sem classe.
export const CLASSE_SERUM = {
  "ser-principia-vc10": "vitc",
  "ser-creamy-vitc": "vitc",
  "ser-principia-nc10": "niacinamida",
  "ser-creamy-niacinamide20": "niacinamida",
  "ser-principia-rn03": "retinoide",
  "ser-creamy-retinal": "retinoide",
  "ser-principia-mix01": "acido",
  "ser-principia-am10": "acido",
  "ser-principia-aa2": "acido",
  "ser-creamy-salicilico": "acido",
  "ser-azelaico-manipulado": "azelaico",
  "ser-ordinary-azelaico": "azelaico",
  "ser-principia-ah2": "hialuronico",
};

const CLASSE_INFO = {
  vitc: { quando: "manha", nome: "Vitamina C", como: "Algumas gotas no rosto seco, antes do hidratante.", cuidado: "Pode arder um pouco no começo." },
  niacinamida: { quando: "manha", nome: "Niacinamida", como: "Algumas gotas no rosto seco, antes do hidratante.", cuidado: "Costuma ser bem tolerada." },
  retinoide: { quando: "noite", nome: "Retinoide", como: "Uma gota do tamanho de uma ervilha no rosto seco, antes do hidratante.", cuidado: "Comece em noites alternadas. Não use na gestação ou amamentação." },
  acido: { quando: "noite", nome: "Ácido esfoliante suave", como: "Uma camada fina no rosto seco, antes do hidratante.", cuidado: "Aumenta a sensibilidade ao sol: protetor solar todos os dias." },
  azelaico: { quando: "noite", nome: "Ácido azelaico", como: "Uma camada fina no rosto seco, antes do hidratante.", cuidado: "Pode formigar nas primeiras semanas." },
  hialuronico: { quando: "manha", nome: "Ácido hialurônico", como: "Algumas gotas na pele ainda úmida, antes do hidratante.", cuidado: "Bem tolerado." },
};

// Classes de sérum por objetivo, em ordem de preferência.
const CLASSES_POR_OBJETIVO = {
  "Reduzir manchas": ["vitc", "azelaico", "acido"],
  "Uniformizar o tom": ["vitc", "niacinamida"],
  "Hidratação": ["hialuronico"],
  "Linhas finas": ["retinoide", "vitc"],
  "Firmeza": ["retinoide", "vitc"],
  "Acne e oleosidade": ["niacinamida", "acido", "azelaico"],
  "Poros": ["niacinamida", "acido"],
  "Vermelhidão": ["azelaico", "niacinamida"],
};

const temSalicilico = (p) => /salic[ií]lico/i.test(p.ativos);
const temGlicolico = (p) => /glic[óo]lico/i.test(p.ativos);
const naoPrimeira = (p) => /não usar como primeira opção/i.test(p.obs || "");
const comCor = (p) => /com cor|cor universal/i.test(`${p.produto} ${p.ativos}`);

export function grauDe(notas, k) {
  const g = notas?.[k]?.grau;
  return Number.isInteger(g) ? g : null;
}
export function notaDe(notas, k) {
  const n = notas?.[k]?.nota;
  return Number.isFinite(n) ? n : null;
}

// Tipo de pele usado nas regras: o informado, ou o estimado pela foto quando a pessoa não sabe.
export function tipoPele(perfil, notas) {
  const t = perfil?.tipoPele || "nao_sei";
  if (t !== "nao_sei") return t;
  const ol = grauDe(notas, "oleosidade") ?? 0;
  const hi = grauDe(notas, "hidratacao") ?? 0;
  if (ol >= 3) return "oleosa";
  if (ol >= 2) return "mista";
  if (hi >= 2) return "seca";
  return "normal";
}

export function ehSensivel(perfil, notas) {
  return perfil?.tipoPele === "sensivel" || (grauDe(notas, "vermelhidao") ?? 0) >= 3;
}

// Objetivos em ordem de prioridade: pior nota primeiro, com peso para o que a pessoa escolheu.
export function prioridades(perfil, notas) {
  const escolhidos = new Set(perfil?.objetivos || []);
  const lista = Object.entries(OBJETIVOS).map(([obj, cats]) => {
    const ns = cats.map((k) => notaDe(notas, k)).filter((n) => n !== null);
    const pior = ns.length ? Math.min(...ns) : null;
    const peso = pior === null ? -1 : 100 - pior + (escolhidos.has(obj) ? 15 : 0);
    return { objetivo: obj, nota: pior, escolhido: escolhidos.has(obj), peso };
  });
  return lista
    .filter((o) => o.nota !== null && (o.nota < 75 || (o.escolhido && o.nota < 90)))
    .sort((a, b) => b.peso - a.peso);
}

function cabe(prod, pele, sensivel) {
  const p = prod.pele || [];
  return p.includes("todas") || p.includes(pele) || (sensivel && p.includes("sensível"));
}

function permitido(prod, perfil, sensivel) {
  if (naoPrimeira(prod)) return false;
  const c = CLASSE_SERUM[prod.id];
  if (perfil?.gestante && (c === "retinoide" || (temSalicilico(prod) && prod.categoria === "Sérum"))) return false;
  if (sensivel && prod.categoria === "Sérum" && (temSalicilico(prod) || temGlicolico(prod))) return false;
  return true;
}

// Menor preço primeiro; `bonus` desempata a favor do produto mais adequado.
function escolhe(lista, bonus = () => 0) {
  return [...lista].sort((a, b) => bonus(b) - bonus(a) || a.preco_min - b.preco_min || a.id.localeCompare(b.id));
}

function pegaBase(catalogo, categoria, ctx, bonus) {
  const cands = catalogo.filter((p) => p.categoria === categoria && permitido(p, ctx.perfil, ctx.sensivel));
  const cabem = cands.filter((p) => cabe(p, ctx.pele, ctx.sensivel));
  const ordem = escolhe(cabem.length ? cabem : cands, bonus);
  return { produto: ordem[0] || null, opcoes: ordem.slice(1, 4) };
}

/**
 * Monta rotina e produtos.
 * @param {object} perfil  { tipoPele, fototipo (0-6), objetivos[], gestante }
 * @param {object} notas   notas do servidor: { textura: {grau, nota}, ... }
 * @param {Array}  catalogo itens de catalogo-v1.json
 */
export function recomenda(perfil, notas, catalogo) {
  const pele = tipoPele(perfil, notas);
  const sensivel = ehSensivel(perfil, notas);
  const fototipo = Number(perfil?.fototipo) || 0;
  const ctx = { perfil, pele, sensivel };
  const prios = prioridades(perfil, notas);
  const objs = prios.map((p) => p.objetivo);
  const quer = (o) => objs.includes(o);

  const limpeza = pegaBase(catalogo, "Limpeza", ctx, (p) =>
    (sensivel || pele === "seca") ? (/hidratante/i.test(p.produto) ? 2 : 0) : (temSalicilico(p) && !perfil?.gestante ? 1 : 0));

  const hidratante = pegaBase(catalogo, "Hidratante", ctx, (p) => {
    let b = 0;
    const calmante = (p.objetivos || []).includes("Vermelhidão");
    if (sensivel || quer("Vermelhidão")) b += calmante ? 2 : 0;
    else if (calmante) b -= 1; // calmantes ficam para quem precisa
    if (pele === "seca" && /ceramidas/i.test(p.ativos)) b += 1;
    if ((pele === "oleosa" || pele === "mista") && /gel/i.test(p.produto + (p.obs || ""))) b += 1;
    return b;
  });

  const protetor = pegaBase(catalogo, "Protetor solar", ctx, (p) => {
    let b = 0;
    if (fototipo >= 5 && /pele negra/i.test(p.produto)) b += 3;
    if (fototipo >= 4 && (quer("Reduzir manchas") || quer("Uniformizar o tom")) && comCor(p)) b += 2;
    if ((pele === "oleosa" || pele === "mista") && /toque seco|oil control|antioleosidade/i.test(`${p.produto} ${p.ativos}`)) b += 1;
    if (/FPS 30\b/.test(p.ativos)) b -= 1; // o mínimo recomendado; preferir FPS mais alto
    return b;
  });

  // Até dois séruns, um por objetivo principal, sem repetir classe.
  const seruns = [];
  const usadas = new Set();
  for (const pr of prios) {
    if (seruns.length >= 2) break;
    const classes = [...CLASSES_POR_OBJETIVO[pr.objetivo]];
    // Fototipos IV a VI e pele sensível: ativos suaves primeiro (docs/ingredientes-v1.md).
    if ((fototipo >= 4 || sensivel) && pr.objetivo === "Reduzir manchas") classes.sort((a, b) => (b === "azelaico") - (a === "azelaico"));
    for (const classe of classes) {
      if (usadas.has(classe)) {
        // um sérum já escolhido também atende este objetivo
        const ja = seruns.find((s) => s.classe === classe);
        if (!ja.objetivos.includes(pr.objetivo)) ja.objetivos.push(pr.objetivo);
        break;
      }
      const cands = catalogo.filter((p) => p.categoria === "Sérum" && CLASSE_SERUM[p.id] === classe && permitido(p, perfil, sensivel));
      const cabem = cands.filter((p) => cabe(p, pele, sensivel));
      const ordem = escolhe(cabem.length ? cabem : cands, (p) => (sensivel && (p.pele || []).includes("sensível") ? 1 : 0));
      if (!ordem.length) continue;
      seruns.push({ classe, produto: ordem[0], opcoes: ordem.slice(1, 3), objetivos: [pr.objetivo], ...CLASSE_INFO[classe] });
      usadas.add(classe);
      break;
    }
  }

  // Retinoide e ácido não vão na mesma noite: ficam em noites alternadas.
  const noite = seruns.filter((s) => s.quando === "noite");
  const alternar = noite.length > 1;
  // Dois séruns de manhã: o segundo vai para a noite.
  const manha = seruns.filter((s) => s.quando === "manha");
  if (manha.length > 1 && !noite.length) manha[1].quando = "noite";

  const passos = { manha: [], noite: [] };
  const base = (id, passo, prod, como, porque) => ({ id, passo, produto: prod, como, porque, ativo: false });
  passos.manha.push(base("m-limpeza", "Limpeza", limpeza.produto, "Lave o rosto com água fria ou morna e seque sem esfregar.", "Tira a oleosidade da noite e prepara a pele."));
  passos.noite.push(base("n-limpeza", "Limpeza", limpeza.produto, "Lave o rosto para tirar protetor, maquiagem e poluição.", "Pele limpa absorve melhor o que vem depois."));
  seruns.forEach((s, i) => {
    const alvo = s.quando === "manha" ? passos.manha : passos.noite;
    alvo.push({
      id: `${s.quando[0]}-serum-${s.classe}`, passo: s.nome, produto: s.produto, como: s.como,
      porque: `Para ${s.objetivos.map((o) => o.toLowerCase()).join(" e ")}.`, cuidado: s.cuidado, ativo: true, ordem: i,
      alternado: s.quando === "noite" && alternar,
    });
  });
  passos.manha.push(base("m-hidratante", "Hidratante", hidratante.produto, "Uma camada fina no rosto e no pescoço.", "Mantém a barreira da pele."));
  passos.noite.push(base("n-hidratante", "Hidratante", hidratante.produto, "Uma camada fina no rosto e no pescoço.", "A pele se recupera durante a noite."));
  passos.manha.push(base("m-protetor", "Protetor solar", protetor.produto, "Quantidade de dois dedos para o rosto. Reaplique a cada 2 a 3 horas se ficar no sol.", "É o passo que mais previne manchas e linhas."));

  const alertas = [];
  if ((grauDe(notas, "vermelhidao") ?? 0) >= 4) alertas.push("Vermelhidão intensa: vale conversar com um dermatologista antes de usar ativos.");
  if ((grauDe(notas, "hidratacao") ?? 0) >= 4) alertas.push("Descamação intensa ou fissuras: vale conversar com um dermatologista.");
  if ((grauDe(notas, "textura") ?? 0) >= 4) alertas.push("Irregularidade intensa na pele: um dermatologista pode indicar tratamentos que não são cosméticos.");
  if (perfil?.gestante) alertas.push("Na gestação ou amamentação, confirme a rotina com seu médico. Retinoides e ácido salicílico em sérum ficaram de fora.");

  return {
    pele, sensivel, prioridades: prios, passos, alertas,
    produtos: { limpeza, hidratante, protetor, seruns },
  };
}

// Calendário de introdução: base nas semanas 1 e 2; um ativo a partir da semana 3; o segundo a partir da 5.
export function liberadoEm(inicioISO, ordem) {
  const d = new Date(inicioISO + "T12:00:00");
  d.setDate(d.getDate() + (ordem === 0 ? 14 : 28));
  return d.toISOString().slice(0, 10);
}

export function skinScore(notas) {
  const v = CATS.map(([k]) => notaDe(notas, k)).filter((n) => n !== null);
  return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
}
