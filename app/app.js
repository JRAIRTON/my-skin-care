// MY Skin AI — app web instalável (PWA).
// Os dados ficam só neste aparelho (IndexedDB). A foto vai ao servidor apenas para a análise
// (POST /analise) e não é guardada lá. A rotina e os produtos saem de regras fixas (recomenda.js).
import { CATS, GRAUS, OBJETIVOS, TIPOS_PELE, FOTOTIPOS, recomenda, liberadoEm, skinScore } from "./recomenda.js";

const MODELO_VALIDADO = "claude-sonnet-5-5";
const INTERVALO_DIAS = 28;      // próxima foto sugerida
const SALTO = 10;               // variação do Skin Score que pede atenção
const PROCS = [["Limpeza de pele", 3], ["Microagulhamento", 7], ["Peeling químico", 14], ["Toxina botulínica", 14], ["Preenchimento", 14], ["Laser ou luz pulsada", 21], ["Bioestimulador de colágeno", 30], ["Cirurgia facial", 60], ["Outro", 14]];
const GUIA = [
  "Rosto limpo, sem maquiagem e sem creme há pelo menos 30 minutos.",
  "De frente para uma janela, com luz do dia indireta. Sem sol direto e sem flash.",
  "Cabelo preso, sem óculos, expressão neutra.",
  "Celular na altura dos olhos, a uns 30 a 40 cm do rosto.",
  "Sem filtros e sem modo beleza ou retrato.",
  "Nas próximas fotos: mesmo lugar, mesmo horário, mesma posição.",
];

// ---------- utilidades ----------
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const novoId = () => (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now()).replace(/-/g, "").slice(0, 20);
const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hoje = () => ymd(new Date());
const soma = (s, n) => { const d = new Date(s + "T12:00:00"); d.setDate(d.getDate() + n); return ymd(d); };
const fmt = (s) => { if (!s) return "—"; const [y, m, d] = s.split("-"); return `${d}/${m}/${y}`; };
const fmtC = (s) => { if (!s) return "—"; const [, m, d] = s.split("-"); return `${d}/${m}`; };
const dias = (a, b) => Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 86400000);
const brl = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const preco = (p) => p.preco_min === p.preco_max ? brl(p.preco_min) : `${brl(p.preco_min)} a ${brl(p.preco_max)}`;
const lsGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.hidden = false;
  clearTimeout(toast.t); toast.t = setTimeout(() => { t.hidden = true; }, 3800);
}

// ---------- banco local (IndexedDB) ----------
const DB = {
  conn: null,
  abre() {
    if (this.conn) return Promise.resolve(this.conn);
    return new Promise((ok, erro) => {
      const r = indexedDB.open("myskin", 1);
      r.onupgradeneeded = () => {
        r.result.createObjectStore("kv");
        r.result.createObjectStore("analises", { keyPath: "id" });
      };
      r.onsuccess = () => { this.conn = r.result; ok(r.result); };
      r.onerror = () => erro(r.error);
    });
  },
  async op(store, modo, fn) {
    const db = await this.abre();
    return new Promise((ok, erro) => {
      const tx = db.transaction(store, modo);
      const res = fn(tx.objectStore(store));
      tx.oncomplete = () => ok(res?.result);
      tx.onerror = () => erro(tx.error);
      tx.onabort = () => erro(tx.error);
    });
  },
  get: (k) => DB.op("kv", "readonly", (s) => s.get(k)),
  set: (k, v) => DB.op("kv", "readwrite", (s) => s.put(v, k)),
  todas: () => DB.op("analises", "readonly", (s) => s.getAll()),
  salva: (a) => DB.op("analises", "readwrite", (s) => s.put(a)),
  apaga: (id) => DB.op("analises", "readwrite", (s) => s.delete(id)),
  async limpa() { await DB.op("kv", "readwrite", (s) => s.clear()); await DB.op("analises", "readwrite", (s) => s.clear()); },
};

// ---------- estado ----------
const S = {
  catalogo: [], perfil: null, codigo: null, usuario: null, analises: [], checks: {}, eventos: [], rotinaInicio: null,
  tela: "inicio", detalhe: null, onb: 0, rascunho: null, ocupado: null, cmp: { a: null, b: null, corte: 50 },
  editando: false, procForm: false, instalar: null, catFiltro: "Todos",
};
const urls = {};
const fotoUrl = (a) => { if (!a?.foto) return null; if (!urls[a.id]) urls[a.id] = URL.createObjectURL(a.foto); return urls[a.id]; };
const ordenadas = () => [...S.analises].sort((a, b) => (a.data + a.criadoEm).localeCompare(b.data + b.criadoEm));
const ultima = () => ordenadas().at(-1) || null;
const anterior = (a) => { const l = ordenadas(); const i = l.findIndex((x) => x.id === a.id); return i > 0 ? l[i - 1] : null; };
const recuperacao = (data = hoje()) => S.eventos.find((e) => data >= e.data && data <= soma(e.data, e.dias)) || null;

async function carrega() {
  const [cat, perfil, codigo, analises, checks, eventos, inicio, usuario] = await Promise.all([
    fetch("catalogo.json").then((r) => r.json()), DB.get("perfil"), DB.get("codigo"), DB.todas(),
    DB.get("checks"), DB.get("eventos"), DB.get("rotinaInicio"), DB.get("usuario"),
  ]);
  Object.assign(S, { catalogo: cat, perfil: perfil || null, codigo: codigo || null, analises: analises || [], checks: checks || {}, eventos: eventos || [], rotinaInicio: inicio || null, usuario: usuario || null });
  // random id of this install: the server uses it for the free first analysis and the subscription
  if (!S.usuario) { S.usuario = crypto.randomUUID(); await DB.set("usuario", S.usuario); }
}

// ---------- servidor ----------
const ERROS = {
  401: "Código de convite inválido. Confira em Ajustes.",
  402: "Sua análise grátis já foi usada. Assine para continuar.",
  413: "A foto ficou grande demais. Tente outra.",
  415: "Formato de foto não aceito. Use JPG, PNG ou WebP.",
  422: "A IA não analisou esta foto. Tente outra, só do rosto e bem iluminada.",
  429: "Muitas tentativas seguidas. Espere 1 minuto e tente de novo.",
  502: "A IA falhou desta vez. Tente de novo em instantes.",
  503: "A IA está sobrecarregada. Tente de novo em alguns minutos.",
};
// the store app runs from capacitor://localhost (iOS) or https://localhost (Android), so it calls the
// published server by its full address; the web version uses the same origin
const NATIVO = !!window.Capacitor?.isNativePlatform?.();
const SERVIDOR = NATIVO ? "https://my-skin-care.jr-airton.workers.dev/" : "";
async function chama(caminho, opcoes = {}, codigo = S.codigo) {
  let r;
  try {
    const h = { ...(opcoes.headers || {}), "X-Usuario": S.usuario };
    if (codigo) h.Authorization = `Bearer ${codigo}`;
    r = await fetch(SERVIDOR + caminho, { ...opcoes, headers: h });
  } catch {
    throw new Error(navigator.onLine === false ? "Sem internet. A análise precisa de conexão." : "Não foi possível falar com o servidor.");
  }
  if (!r.ok) {
    let msg = ERROS[r.status], corpo = {};
    try { corpo = await r.json(); } catch {}
    if (corpo.causa === "chave") msg = "O servidor está sem uma chave válida da Anthropic. Avise quem administra o app.";
    else if (corpo.causa === "pedido") msg = "A IA recusou o pedido. Tente outra foto; se repetir, avise quem administra o app.";
    if (!msg) msg = corpo.erro;
    if (corpo.chave) msg += ` Chave cadastrada: ${corpo.chave.inicio}…${corpo.chave.fim} (${corpo.chave.tamanho} caracteres).`;
    if (corpo.detalhe) msg += ` (Detalhe: ${corpo.detalhe})`;
    const e = new Error(msg || `Erro ${r.status} no servidor.`); e.status = r.status; throw e;
  }
  return r.json();
}

// ---------- foto: redução e checagem de qualidade ----------
async function decodifica(file) {
  try { return await createImageBitmap(file, { imageOrientation: "from-image" }); } catch {}
  const u = URL.createObjectURL(file);
  try { const img = new Image(); img.src = u; await img.decode(); return img; } finally { URL.revokeObjectURL(u); }
}
async function preparaFoto(file) {
  const bmp = await decodifica(file);
  const W = bmp.width, H = bmp.height;
  const sc = Math.min(1, 1600 / Math.max(W, H));
  const cv = document.createElement("canvas"); cv.width = Math.round(W * sc); cv.height = Math.round(H * sc);
  cv.getContext("2d").drawImage(bmp, 0, 0, cv.width, cv.height);
  const blob = await new Promise((ok) => cv.toBlob(ok, "image/jpeg", 0.88));
  const ms = Math.min(1, 384 / Math.max(W, H));
  const m = document.createElement("canvas"); m.width = Math.max(8, Math.round(W * ms)); m.height = Math.max(8, Math.round(H * ms));
  const mx = m.getContext("2d", { willReadFrequently: true }); mx.drawImage(bmp, 0, 0, m.width, m.height);
  return { blob, url: URL.createObjectURL(blob), q: mede(mx.getImageData(0, 0, m.width, m.height).data, m.width, m.height, W, H) };
}
// Mesmas medidas do protótipo (etapa 1): resolução, luz, áreas estouradas, sombra, nitidez e cor da luz.
function mede(px, w, h, W, H) {
  const lum = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) lum[i] = 0.2126 * px[i * 4] + 0.7152 * px[i * 4 + 1] + 0.0722 * px[i * 4 + 2];
  const x0 = Math.floor(w * .25), x1 = Math.floor(w * .75), y0 = Math.floor(h * .2), y1 = Math.floor(h * .8), xm = (x0 + x1) / 2;
  let sum = 0, n = 0, hi = 0, rs = 0, bs = 0, esq = 0, dir = 0, ne = 0, nd = 0;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const i = y * w + x, L = lum[i]; sum += L; n++;
    if (L >= 250) hi++;
    rs += px[i * 4]; bs += px[i * 4 + 2];
    if (x < xm) { esq += L; ne++; } else { dir += L; nd++; }
  }
  const media = sum / n, hiPct = (hi / n) * 100, lado = Math.abs(esq / ne - dir / nd), rb = (rs / n) / Math.max(1, bs / n);
  let ls = 0, ls2 = 0, ln = 0;
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x, v = lum[i - w] + lum[i + w] + lum[i - 1] + lum[i + 1] - 4 * lum[i];
    ls += v; ls2 += v * v; ln++;
  }
  const lap = ls2 / ln - (ls / ln) ** 2, menor = Math.min(W, H);
  const itens = [
    { k: "Resolução", s: menor < 480 ? "bad" : menor < 900 ? "warn" : "ok", dica: "Use a câmera do celular, sem zoom, ou a foto original." },
    { k: "Iluminação", s: media < 55 || media > 225 ? "bad" : media < 85 || media > 200 ? "warn" : "ok", dica: media < 85 ? "Foto escura. Fique de frente para uma janela, de dia." : "Foto clara demais. Evite sol direto e flash." },
    { k: "Reflexos", s: hiPct > 12 ? "bad" : hiPct > 4 ? "warn" : "ok", dica: "Reflexo forte apagando a textura da pele." },
    { k: "Sombra lateral", s: lado > 55 ? "bad" : lado > 30 ? "warn" : "ok", dica: "Um lado do rosto mais escuro. A luz deve vir de frente." },
    { k: "Nitidez", s: lap < 12 ? "bad" : lap < 35 ? "warn" : "ok", dica: "Foto tremida ou fora de foco. Apoie o celular e toque no rosto para focar." },
    { k: "Cor da luz", s: rb < 0.9 || rb > 2.4 ? "warn" : "ok", dica: "Luz muito azulada ou amarelada altera a leitura de manchas e vermelhidão." },
  ];
  const nivel = itens.some((i) => i.s === "bad") ? "bad" : itens.some((i) => i.s === "warn") ? "warn" : "ok";
  return { itens, nivel, medidas: { brilho: Math.round(media), estourado: +hiPct.toFixed(1), sombra: Math.round(lado), nitidez: Math.round(lap), corRB: +rb.toFixed(2), largura: W, altura: H } };
}

// ---------- desenho ----------
const ICONES = {
  inicio: '<path d="M4 11l8-6 8 6v8a1 1 0 0 1-1 1h-4v-5h-6v5H5a1 1 0 0 1-1-1z"/>',
  evolucao: '<polyline points="4,17 9,11 13,14 20,6"/><polyline points="15,6 20,6 20,11"/>',
  analisar: '<path d="M4 8h3l2-2h6l2 2h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  rotina: '<rect x="5" y="4" width="14" height="17" rx="2"/><polyline points="9,10 11,12 15,8"/><line x1="9" y1="16" x2="15" y2="16"/>',
  produtos: '<path d="M9 3h6v4l2 3v10a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V10l2-3z"/><line x1="7" y1="13" x2="17" y2="13"/>',
  ajustes: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
};
const ico = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONES[k]}</svg>`;
const LOGO = `<svg width="28" height="28" viewBox="0 0 30 30" aria-hidden="true"><polyline points="5,23 9,8 15,17 21,8 25,23" fill="none" stroke="var(--ink)" stroke-width="1.6" stroke-linejoin="round"/>${[[5, 23], [9, 8], [15, 17], [21, 8], [25, 23]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.3" fill="var(--gold)"/>`).join("")}</svg>`;

function anel(v, tam = 128) {
  const r = tam / 2 - 9, c = 2 * Math.PI * r, f = v == null ? 0 : Math.max(0, Math.min(100, v)) / 100;
  return `<svg width="${tam}" height="${tam}" viewBox="0 0 ${tam} ${tam}" role="img" aria-label="Skin Score ${v ?? "sem nota"}">
    <circle cx="${tam / 2}" cy="${tam / 2}" r="${r}" fill="none" stroke="var(--surface-2)" stroke-width="8"/>
    <circle cx="${tam / 2}" cy="${tam / 2}" r="${r}" fill="none" stroke="var(--gold)" stroke-width="8" stroke-linecap="round" stroke-dasharray="${c * f} ${c}" transform="rotate(-90 ${tam / 2} ${tam / 2})"/>
    <text x="50%" y="50%" text-anchor="middle" class="ring-v" dy="4">${v ?? "—"}</text>
    <text x="50%" y="50%" text-anchor="middle" class="ring-l" dy="26">Skin Score</text></svg>`;
}
function delta(cur, prev) {
  if (cur == null || prev == null) return "";
  const d = cur - prev;
  return d === 0 ? `<span class="delta">=</span>` : `<span class="delta ${d > 0 ? "up" : "down"}">${d > 0 ? "+" : "−"}${Math.abs(d)}</span>`;
}
function barras(a, prev) {
  return `<div class="bars">${CATS.map(([k, l]) => {
    const n = a.notas[k] || {}; const ok = Number.isFinite(n.nota);
    return `<div class="bar"><span class="lbl">${l}</span><span class="v num">${ok ? n.nota : "—"}${ok ? delta(n.nota, prev?.notas?.[k]?.nota) : ""}</span>
      <span class="track"><span class="fill" style="width:${ok ? n.nota : 0}%"></span></span>
      <span class="desc">${ok ? esc(cap(GRAUS[k][n.grau])) : "Não avaliável nesta foto"}</span></div>`;
  }).join("")}</div>`;
}
const cap = (s) => s ? s[0].toUpperCase() + s.slice(1) : "";
const aviso = (tipo, html, ic = tipo === "bad" || tipo === "warn" ? "!" : "i") => `<div class="notice ${tipo}"><span class="ico">${ic}</span><div>${html}</div></div>`;

// ---------- telas ----------
const TELAS = [["inicio", "Início"], ["evolucao", "Evolução"], ["analisar", "Analisar"], ["rotina", "Rotina"], ["produtos", "Produtos"]];

function render() {
  const pronto = S.perfil?.consentimento && (S.codigo || S.perfil.semCodigo);
  $("#topo").innerHTML = `<div class="top-in"><span class="brand">${LOGO}<b>MY <span>Skin</span></b></span>
    ${pronto ? `<button class="icon-btn" data-act="tela:ajustes" aria-label="Ajustes"${S.tela === "ajustes" ? ' aria-current="page"' : ""}>${ico("ajustes")}</button>` : ""}</div>`;
  $("#nav").hidden = !pronto;
  $("#nav").innerHTML = `<div class="nav-in">${TELAS.map(([k, l]) => `<button data-act="tela:${k}" class="${k === "analisar" ? "cta" : ""}"${S.tela === k && !S.detalhe ? ' aria-current="page"' : ""}>${k === "analisar" ? `<span class="ic">${ico(k)}</span>` : ico(k)}${l}</button>`).join("")}</div>`;
  const main = $("#main");
  main.classList.toggle("solo", !pronto);
  main.innerHTML = !pronto ? vOnboarding() : S.detalhe ? vDetalhe() : ({ inicio: vInicio, evolucao: vEvolucao, analisar: vAnalisar, rotina: vRotina, produtos: vProdutos, ajustes: vAjustes, assinar: vAssinar }[S.tela] || vInicio)();
  depois();
}
function vai(tela) { S.tela = tela; S.detalhe = null; S.editando = false; S.procForm = false; render(); window.scrollTo(0, 0); }

// ----- primeira vez
function formPerfil(p = {}) {
  const obj = new Set(p.objetivos || []);
  return `<div class="fields" id="f-perfil">
    <label class="f">Como quer ser chamada?<input type="text" name="nome" value="${esc(p.nome || "")}" autocomplete="given-name" maxlength="40"></label>
    <label class="f">Idade<input type="number" name="idade" inputmode="numeric" min="16" max="100" value="${esc(p.idade || "")}"></label>
    <label class="f">Tipo de pele<select name="tipoPele">${Object.entries(TIPOS_PELE).map(([k, l]) => `<option value="${k}"${(p.tipoPele || "nao_sei") === k ? " selected" : ""}>${l}</option>`).join("")}</select></label>
    <label class="f">Fototipo (como a pele reage ao sol)<select name="fototipo">${FOTOTIPOS.map((l, i) => `<option value="${i}"${Number(p.fototipo || 0) === i ? " selected" : ""}>${l}</option>`).join("")}</select></label>
    <div class="f stack"><span class="small" style="font-weight:600;color:var(--ink-2)">O que mais quer melhorar? (opcional)</span>
      <div class="checks">${Object.keys(OBJETIVOS).map((o) => `<label class="pill-check"><input type="checkbox" name="objetivos" value="${esc(o)}"${obj.has(o) ? " checked" : ""}>${esc(o)}</label>`).join("")}</div></div>
    <label class="agree"><input type="checkbox" name="gestante"${p.gestante ? " checked" : ""}><span>Estou grávida ou amamentando <span class="muted">(alguns ativos ficam de fora da rotina)</span></span></label>
  </div>`;
}
function lePerfil() {
  const f = $("#f-perfil"); const v = (n) => f.querySelector(`[name="${n}"]`);
  return {
    nome: v("nome").value.trim(), idade: Number(v("idade").value) || null, tipoPele: v("tipoPele").value,
    fototipo: Number(v("fototipo").value) || 0, gestante: v("gestante").checked,
    objetivos: [...f.querySelectorAll('[name="objetivos"]:checked')].map((i) => i.value),
  };
}
const TEXTO_PRIVACIDADE = `
  <ul>
    <li><b>Suas fotos e resultados ficam só neste aparelho.</b> Não há conta nem cópia em nuvem.</li>
    <li>Na hora da análise, a foto passa pelo nosso servidor e vai à Anthropic (empresa do Claude, nos EUA), que devolve as notas. Nosso servidor não guarda a foto. A Anthropic não a usa para treinar IA e só pode guardá-la por prazo limitado, para segurança.</li>
    <li>A avaliação é <b>cosmética</b>, feita por IA a partir de uma foto. Não é diagnóstico médico e não substitui o dermatologista.</li>
    <li>Rotina e produtos saem de regras fixas e de um catálogo de 34 produtos vendidos no Brasil. O app não vende nada e não ganha comissão.</li>
    <li>Você pode exportar ou apagar todos os seus dados a qualquer momento, em Ajustes.</li>
    <li>Responsável: Airton Carvalho Junior · <a href="mailto:myskincare.ia.sac@gmail.com">myskincare.ia.sac@gmail.com</a>. Leia os <a href="termos.html">Termos de Uso</a> e a <a href="privacidade.html">Política de Privacidade</a>.</li>
  </ul>`;
function vOnboarding() {
  const passo = S.perfil?.consentimento ? 2 : S.onb;
  const dots = `<div class="steps-dots" aria-hidden="true">${[0, 1, 2].map((i) => `<i class="${i === passo ? "on" : ""}"></i>`).join("")}</div>`;
  if (passo === 0) return `
    <section class="card center" style="padding-block:28px">${LOGO.replace('width="28" height="28"', 'width="56" height="56"')}
      <h1>Sua pele, acompanhada de perto</h1>
      <p class="lede">Tire uma foto do rosto e receba notas em 10 aspectos da pele, uma rotina simples e produtos com preço. Repita a cada 4 semanas para ver a evolução.</p></section>
    <section class="card"><h3>Antes de começar</h3><div class="legal">${TEXTO_PRIVACIDADE}</div>
      <label class="agree"><input type="checkbox" id="ok-termos"><span>Tenho 18 anos ou mais, li e concordo com os <a href="termos.html">Termos de Uso</a> e a <a href="privacidade.html">Política de Privacidade</a>.</span></label>
      <label class="agree"><input type="checkbox" id="ok-dados"><span>Autorizo o uso das fotos do meu rosto e das informações da minha pele para a avaliação, como descrito acima. Posso retirar esta autorização apagando meus dados.</span></label>
      <button class="btn primary block" data-act="onb:1">Continuar</button></section>${dots}`;
  if (passo === 1) return `
    <section class="card"><h2>Sobre você</h2><p class="small muted">Ajuda a montar a rotina. Tudo fica só neste aparelho.</p>${formPerfil(S.perfil || {})}
      <button class="btn primary block" data-act="onb:2">Continuar</button></section>${dots}`;
  return `
    <section class="card"><h2>Tudo pronto</h2>
      <p class="lede">Sua <b>primeira análise é grátis</b>. Depois, as análises fazem parte da assinatura.</p>
      <button class="btn primary block" data-act="sem-codigo">Começar</button></section>
    <section class="card"><h3>Tem um código de convite?</h3>
      <label class="f">Código<input type="password" id="in-codigo" autocomplete="off" autocapitalize="off" spellcheck="false"></label>
      <button class="btn block" data-act="codigo"${S.ocupado ? " disabled" : ""}>${S.ocupado ? "Conferindo…" : "Usar código"}</button></section>${dots}`;
}

// ----- início
function vInicio() {
  const a = ultima(), nome = S.perfil.nome ? `, ${esc(S.perfil.nome)}` : "";
  const instalar = dicaInstalar();
  if (!a) return `
    <section class="card empty"><h1>Olá${nome}</h1><p class="lede">Comece pela primeira foto. Leva 1 minuto e a análise sai em segundos.</p>
      <button class="btn primary" data-act="tela:analisar">Fazer a primeira análise</button></section>${instalar}`;
  const ant = anterior(a), prox = soma(a.data, INTERVALO_DIAS), r = rec(a);
  const passos = passosDeHoje(r), feitos = passos.filter((p) => (S.checks[hoje()] || []).includes(p.id)).length;
  return `
    <section class="card"><div class="hero">${anel(a.skin_score)}
      <div class="stack"><h2>Olá${nome}</h2><p class="small muted">Última análise em ${fmt(a.data)}${ant ? ` · ${delta(a.skin_score, ant.skin_score) || ""} desde ${fmtC(ant.data)}` : ""}</p>
      <button class="btn sm" data-act="ver:${a.id}">Ver detalhes</button></div></div></section>
    ${recuperacao() ? aviso("warn", `<b>Pele em recuperação</b> até ${fmt(soma(recuperacao().data, recuperacao().dias))}: a rotina está só com o básico.`) : ""}
    <section class="card"><div class="row between"><h3>Rotina de hoje</h3><span class="chip gold num">${feitos} de ${passos.length}</span></div>
      <button class="btn block" data-act="tela:rotina">${feitos >= passos.length ? "Tudo feito hoje ✓" : "Marcar os passos"}</button></section>
    ${r.prioridades.length ? `<section class="card"><h3>Seu foco agora</h3><div class="checks">${r.prioridades.slice(0, 3).map((p) => `<span class="chip gold">${esc(p.objetivo)}</span>`).join("")}</div>
      <p class="small muted">Os aspectos com as notas mais baixas${S.perfil.objetivos?.length ? ", junto com o que você escolheu" : ""}.</p></section>` : ""}
    <section class="card"><h3>Próxima foto</h3>
      <p>${hoje() >= prox ? "Já é hora de uma nova foto para acompanhar a evolução." : `Sugerida para <b>${fmt(prox)}</b>. Intervalos de 4 semanas mostram mudanças reais.`}</p>
      ${hoje() >= prox ? `<button class="btn primary" data-act="tela:analisar">Nova análise</button>` : ""}</section>
    ${instalar}`;
}

function dicaInstalar() {
  const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  if (NATIVO || standalone || lsGet("myskin-instalar-ok")) return "";
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const corpo = S.instalar
    ? `<button class="btn sm gold" data-act="instalar">Instalar o app</button>`
    : ios ? `No Safari, toque em <b>Compartilhar</b> e depois em <b>Adicionar à Tela de Início</b>.`
    : `No menu do navegador, toque em <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.`;
  return `<section class="card flat"><h3>Instale na tela inicial</h3>
    <p class="small">Abre como app e protege seus dados: ${ios ? "no iPhone, o Safari pode apagar dados de sites não usados por 7 dias, mas não de apps instalados." : "o navegador não apaga os dados de apps instalados."}</p>
    <div class="row">${corpo}<button class="btn sm ghost" data-act="instalar-ok">Já instalei</button></div></section>`;
}

// ----- analisar
function vAnalisar() {
  const d = S.rascunho;
  if (S.ocupado) return `<section class="card"><div class="busy"><b>Analisando sua pele…</b><span class="small">Leva de 5 a 20 segundos. Não feche o app.</span><div class="anim"></div></div></section>`;
  if (!d) return `
    <section class="card"><h2>Nova análise</h2><ol class="guide">${GUIA.map((g) => `<li>${esc(g)}</li>`).join("")}</ol>
      <div class="btns"><button class="btn primary" data-act="camera">Tirar foto</button><button class="btn" data-act="galeria">Escolher da galeria</button></div></section>
    ${recuperacao() ? aviso("warn", "Você registrou um procedimento recente. Vermelhidão, inchaço ou descamação podem ser temporários e baixar as notas.") : ""}`;
  const q = d.q;
  const cor = { ok: "good", warn: "warn", bad: "bad" };
  return `
    <section class="card"><h2>Confira a foto</h2>
      <div class="preview"><img class="photo" src="${d.url}" alt="Foto escolhida">
        <ul class="qlist">${q.itens.map((i) => `<li><span class="dot" style="color:var(--${cor[i.s]})"></span><span>${i.k}</span><span class="small muted">${i.s === "ok" ? "boa" : i.s === "warn" ? "razoável" : "ruim"}</span>${i.s !== "ok" ? `<span class="tip">${esc(i.dica)}</span>` : ""}</li>`).join("")}</ul></div>
      ${q.nivel === "bad" ? aviso("bad", "A foto tem problemas que podem distorcer as notas. O melhor é tirar outra seguindo o guia.") : q.nivel === "warn" ? aviso("warn", "A foto está razoável. Dá para analisar, mas uma foto melhor deixa a evolução mais confiável.") : ""}
      <div class="btns">
        <button class="btn ${q.nivel === "bad" ? "" : "primary"}" data-act="analisar">${q.nivel === "bad" ? "Analisar mesmo assim" : "Analisar"}</button>
        <button class="btn ${q.nivel === "bad" ? "primary" : ""}" data-act="camera">Tirar outra</button></div>
      <button class="btn ghost sm" data-act="descartar">Cancelar</button></section>`;
}

async function escolheuFoto(file) {
  if (!file) return;
  if (file.type && !/^image\//.test(file.type)) return toast("Escolha uma foto.");
  try {
    const r = await preparaFoto(file);
    if (S.rascunho?.url) URL.revokeObjectURL(S.rascunho.url);
    S.rascunho = r; S.tela = "analisar"; S.detalhe = null; render(); window.scrollTo(0, 0);
  } catch { toast("Não foi possível abrir esta imagem. Fotos HEIC: envie como JPG."); }
}

async function analisar() {
  const d = S.rascunho; if (!d || S.ocupado) return;
  S.ocupado = true; render();
  try {
    const r = await chama("analise", { method: "POST", headers: { "Content-Type": "image/jpeg" }, body: d.blob });
    const a = {
      id: novoId(), data: hoje(), criadoEm: new Date().toISOString(), notas: r.notas,
      skin_score: r.skin_score ?? skinScore(r.notas), confianca: r.confianca, idade_aparente: r.idade_aparente,
      modelo: r.modelo, qualidade: d.q.medidas, nivelQualidade: d.q.nivel, foto: d.blob,
    };
    await DB.salva(a);
    S.analises.push(a);
    if (!S.rotinaInicio) { S.rotinaInicio = a.data; await DB.set("rotinaInicio", a.data); }
    URL.revokeObjectURL(d.url); S.rascunho = null; S.ocupado = false;
    S.detalhe = a.id; render(); window.scrollTo(0, 0);
    if (r.gratis) toast("Esta foi sua análise grátis. As próximas fazem parte da assinatura.");
  } catch (e) {
    S.ocupado = false; render(); toast(e.message);
    if (e.status === 401) vai("ajustes");
    if (e.status === 402) vai("assinar");
  }
}

// ----- detalhe da análise
function vDetalhe() {
  const a = S.analises.find((x) => x.id === S.detalhe);
  if (!a) { S.detalhe = null; return vInicio(); }
  const ant = anterior(a), url = fotoUrl(a);
  const salto = ant && a.skin_score != null && ant.skin_score != null && Math.abs(a.skin_score - ant.skin_score) > SALTO && dias(ant.data, a.data) <= 60;
  const conf = { alta: ["good", "Confiança alta"], media: ["gold", "Confiança média"], baixa: ["warn", "Confiança baixa"] }[a.confianca];
  const r = rec(a);
  return `
    <button class="btn ghost sm" data-act="tela:${S.tela === "analisar" ? "inicio" : S.tela}" style="justify-self:start">← Voltar</button>
    <section class="card"><div class="hero">${anel(a.skin_score)}<div class="stack">
      <h2>${fmt(a.data)}</h2>
      <div class="row">${conf ? `<span class="chip ${conf[0]}">${conf[1]}</span>` : ""}${a.idade_aparente ? `<span class="chip">Pele aparenta ~${a.idade_aparente} anos</span>` : ""}</div>
      ${ant ? `<p class="small muted">${delta(a.skin_score, ant.skin_score)} em relação a ${fmt(ant.data)}</p>` : `<p class="small muted">Primeira análise: ela é a sua referência.</p>`}</div></div>
      ${salto ? aviso("warn", "A nota mudou bastante desde a última análise. Diferença de luz, distância ou ângulo também muda a nota: confira se as fotos foram tiradas do mesmo jeito.") : ""}
      ${a.nivelQualidade === "bad" ? aviso("warn", "Esta foto tinha problemas de qualidade. Trate as notas com cautela.") : ""}
      ${a.modelo && a.modelo !== MODELO_VALIDADO ? aviso("warn", "Esta análise foi feita por um modelo de reserva, ainda não validado. Considere o resultado provisório.") : ""}
    </section>
    ${url ? `<section class="card"><img class="photo" src="${url}" alt="Foto de ${fmt(a.data)}"></section>` : ""}
    <section class="card"><h3>As 10 notas</h3><p class="small muted">De 0 a 100: maior é melhor. Abaixo de cada nota, o que a IA viu.</p>${barras(a, ant)}</section>
    ${r.alertas.length ? aviso("bad", r.alertas.map(esc).join("<br>")) : ""}
    <section class="card"><h3>O que fazer</h3>
      <p>${r.prioridades.length ? `Foco em <b>${r.prioridades.slice(0, 2).map((p) => p.objetivo.toLowerCase()).join("</b> e <b>")}</b>.` : "Pele em bom estado: o essencial é manter limpeza, hidratação e protetor solar."}</p>
      <div class="btns"><button class="btn primary" data-act="tela:rotina">Ver rotina</button><button class="btn" data-act="tela:produtos">Ver produtos</button></div></section>
    ${aviso("", "Avaliação visual e cosmética feita por IA. Não é diagnóstico. Em caso de ferida que não cicatriza, pinta que muda ou lesão que sangra, procure um dermatologista.")}
    <button class="btn danger ghost sm" data-act="apagar-analise:${a.id}" style="justify-self:center">Apagar esta análise</button>`;
}

// ----- evolução
function grafico(lista) {
  const W = 340, H = 180, L = 30, R = 14, T = 18, B = 26;
  const vs = lista.map((a) => a.skin_score);
  const lo = Math.max(0, Math.floor((Math.min(...vs) - 8) / 10) * 10), hi = Math.min(100, Math.ceil((Math.max(...vs) + 6) / 10) * 10);
  const t0 = new Date(lista[0].data).getTime(), t1 = new Date(lista.at(-1).data).getTime();
  const x = (a) => lista.length === 1 ? (L + W - R) / 2 : L + ((new Date(a.data).getTime() - t0) / Math.max(1, t1 - t0)) * (W - L - R);
  const y = (v) => T + (1 - (v - lo) / Math.max(1, hi - lo)) * (H - T - B);
  const pts = lista.map((a) => [x(a), y(a.skin_score)]);
  const linhas = [lo, (lo + hi) / 2, hi].map((v) => `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="ax" x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${Math.round(v)}</text>`).join("");
  const procs = S.eventos.filter((e) => e.data >= lista[0].data && e.data <= lista.at(-1).data && lista.length > 1).map((e) => { const xx = L + ((new Date(e.data).getTime() - t0) / Math.max(1, t1 - t0)) * (W - L - R); return `<line class="proc" x1="${xx}" x2="${xx}" y1="${T}" y2="${H - B}"><title>${esc(e.tipo)} em ${fmt(e.data)}</title></line>`; }).join("");
  const area = pts.length > 1 ? `<path class="ar" d="M${pts[0][0]},${H - B} L${pts.map((p) => p.join(",")).join(" L")} L${pts.at(-1)[0]},${H - B} Z"/>` : "";
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Skin Score ao longo do tempo">${linhas}${procs}${area}
    ${pts.length > 1 ? `<polyline class="ln" points="${pts.map((p) => p.join(",")).join(" ")}"/>` : ""}
    ${pts.map((p, i) => `<circle class="pt${i === pts.length - 1 ? " end" : ""}" cx="${p[0]}" cy="${p[1]}" r="4"/>`).join("")}
    <text class="lab" x="${pts.at(-1)[0]}" y="${pts.at(-1)[1] - 10}" text-anchor="${pts.length > 1 ? "end" : "middle"}">${vs.at(-1)}</text>
    <text class="ax" x="${L}" y="${H - 6}">${fmtC(lista[0].data)}</text>${lista.length > 1 ? `<text class="ax" x="${W - R}" y="${H - 6}" text-anchor="end">${fmtC(lista.at(-1).data)}</text>` : ""}</svg></div>`;
}
function vEvolucao() {
  const l = ordenadas();
  if (!l.length) return `<section class="card empty"><h2>Sem análises ainda</h2><p class="lede">A evolução aparece a partir da segunda foto.</p><button class="btn primary" data-act="tela:analisar">Nova análise</button></section>`;
  const ids = new Set(l.map((a) => a.id));
  if (!ids.has(S.cmp.a)) S.cmp.a = l[0].id;
  if (!ids.has(S.cmp.b)) S.cmp.b = l.at(-1).id;
  const A = l.find((a) => a.id === S.cmp.a), B = l.find((a) => a.id === S.cmp.b);
  const opc = (sel) => l.map((a) => `<option value="${a.id}"${a.id === sel ? " selected" : ""}>${fmt(a.data)} · ${a.skin_score ?? "—"}</option>`).join("");
  const melhoras = l.length > 1 ? CATS.map(([k, n]) => ({ n, d: (B.notas[k]?.nota ?? null) !== null && (A.notas[k]?.nota ?? null) !== null ? B.notas[k].nota - A.notas[k].nota : null })).filter((x) => x.d !== null && x.d !== 0).sort((a, b) => b.d - a.d) : [];
  return `
    <section class="card"><div class="row between"><h2>Evolução</h2><span class="chip num">${l.length} ${l.length === 1 ? "análise" : "análises"}</span></div>
      ${grafico(l)}
      ${l.length === 1 ? `<p class="small muted">Faça uma nova foto em ${fmt(soma(l[0].data, INTERVALO_DIAS))} para ver a primeira comparação.</p>` : ""}
      ${S.eventos.length && l.length > 1 ? `<p class="small muted">Linhas tracejadas: procedimentos registrados.</p>` : ""}</section>
    ${l.length > 1 ? `<section class="card"><h3>Antes e depois</h3>
      <div class="row" style="flex-wrap:nowrap"><label class="f" style="flex:1">Antes<select data-cmp="a">${opc(S.cmp.a)}</select></label><label class="f" style="flex:1">Depois<select data-cmp="b">${opc(S.cmp.b)}</select></label></div>
      ${fotoUrl(A) && fotoUrl(B) ? `<div class="compare" style="--cut:${S.cmp.corte}%"><img src="${fotoUrl(A)}" alt="Antes"><img class="after" src="${fotoUrl(B)}" alt="Depois"><span class="handle"></span><span class="tag l">${fmtC(A.data)}</span><span class="tag r">${fmtC(B.data)}</span></div>
      <input type="range" min="0" max="100" value="${S.cmp.corte}" data-act-input="corte" aria-label="Mover a divisão entre antes e depois">` : ""}
      ${melhoras.length ? `<div class="stack">${melhoras.map((m) => `<div class="row between small"><span>${m.n}</span>${delta(m.d, 0)}</div>`).join("")}</div>` : `<p class="small muted">Sem diferenças entre as duas análises.</p>`}
    </section>` : ""}
    <section class="card"><h3>Histórico</h3><div class="list">${[...l].reverse().map((a) => {
      const ant = anterior(a);
      return `<button class="item" data-act="ver:${a.id}">${fotoUrl(a) ? `<img class="thumb" src="${fotoUrl(a)}" alt="">` : `<span class="thumb"></span>`}<span class="item-b"><span class="item-t">${fmt(a.data)}</span><span class="small muted">${a.confianca ? `Confiança ${a.confianca === "media" ? "média" : a.confianca}` : ""}</span></span><span class="score-s">${a.skin_score ?? "—"}</span>${ant ? delta(a.skin_score, ant.skin_score) : ""}</button>`;
    }).join("")}</div></section>`;
}

// ----- rotina
const rec = (a) => recomenda(S.perfil, a.notas, S.catalogo);
function passosDeHoje(r) {
  const emRec = !!recuperacao();
  const inicio = S.rotinaInicio || hoje();
  return [...r.passos.manha, ...r.passos.noite].filter((p) => !p.ativo || (!emRec && hoje() >= liberadoEm(inicio, p.ordem)));
}
function vRotina() {
  const a = ultima();
  if (!a) return `<section class="card empty"><h2>Rotina ainda não definida</h2><p class="lede">Sua rotina é montada a partir da primeira análise.</p><button class="btn primary" data-act="tela:analisar">Nova análise</button></section>`;
  const r = rec(a), t = hoje(), feitos = new Set(S.checks[t] || []), emRec = recuperacao();
  const ativos = passosDeHoje(r), inicio = S.rotinaInicio || t;
  const semana = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); const s = ymd(d); return { s, n: (S.checks[s] || []).filter((k) => ativos.some((p) => p.id === k)).length, l: "DSTQQSS"[d.getDay()] }; });
  const bloco = (titulo, lista) => `<section class="card"><h3>${titulo}</h3><ul class="steps">${lista.map((p) => {
    const libera = p.ativo ? liberadoEm(inicio, p.ordem) : null;
    const off = p.ativo && (emRec || t < libera);
    const on = feitos.has(p.id);
    return `<li class="step${on ? " done" : ""}${off ? " off" : ""}"><input type="checkbox" id="st-${p.id}" data-act="check:${p.id}"${on ? " checked" : ""}${off ? " disabled" : ""}>
      <label for="st-${p.id}"><span class="step-t">${esc(p.passo)}</span>${p.alternado ? ` <span class="chip">noite sim, noite não</span>` : ""}<br>
      <span class="small">${p.produto ? `${esc(p.produto.marca)} ${esc(p.produto.produto)}. ` : ""}${esc(p.como)}</span><br>
      <span class="small muted">${esc(p.porque)}${p.cuidado ? ` ${esc(p.cuidado)}` : ""}</span>
      ${off ? `<br><span class="chip warn">${emRec ? "pausado na recuperação" : `começa em ${fmt(libera)}`}</span>` : ""}</label></li>`;
  }).join("")}</ul></section>`;
  const n = ativos.filter((p) => feitos.has(p.id)).length;
  return `
    <section class="card"><div class="row between"><div class="stack" style="gap:2px"><h2>Sua rotina</h2><p class="small muted">Pela análise de ${fmt(a.data)}. Pele ${esc(TIPOS_PELE[r.pele]?.toLowerCase() || r.pele)}${S.perfil.tipoPele === "nao_sei" ? " (estimada pela foto)" : ""}.</p></div><span class="chip gold num">${n} de ${ativos.length} hoje</span></div>
      <div class="week" aria-label="Últimos 7 dias">${semana.map((w) => `<span class="day"><i class="${w.n === 0 ? "" : w.n >= ativos.length ? "full" : "part"}" title="${fmt(w.s)}: ${w.n} de ${ativos.length}"></i>${w.l}</span>`).join("")}</div></section>
    ${emRec ? aviso("warn", `<b>Recuperação de ${esc(emRec.tipo.toLowerCase())}</b> até ${fmt(soma(emRec.data, emRec.dias))}. Só limpeza suave, hidratante e protetor; ativos pausados, a menos que o profissional oriente diferente. <button class="btn sm ghost" data-act="apagar-proc:${emRec.id}">Remover registro</button>`) : ""}
    ${r.passos.manha.some((p) => p.ativo) || r.passos.noite.some((p) => p.ativo) ? aviso("gold", "Os ativos entram aos poucos: duas semanas só com o básico, depois um ativo, e o segundo duas semanas depois. Assim dá para saber o que a pele aceita.") : ""}
    ${bloco("Manhã", r.passos.manha)}
    ${bloco("Noite", r.passos.noite)}
    ${S.procForm ? `<section class="card"><h3>Procedimento estético</h3><div class="fields">
        <label class="f">Qual?<select id="proc-tipo">${PROCS.map(([p, d]) => `<option value="${esc(p)}" data-dias="${d}">${esc(p)}</option>`).join("")}</select></label>
        <label class="f">Data<input type="date" id="proc-data" value="${t}" max="${t}"></label></div>
        <div class="btns"><button class="btn primary" data-act="salva-proc">Registrar</button><button class="btn" data-act="proc-form">Cancelar</button></div></section>`
      : `<button class="btn ghost sm" data-act="proc-form" style="justify-self:center">Fiz um procedimento estético</button>`}
    ${aviso("", "Rotina educativa. Ao começar um ativo, teste antes numa pequena área. Pele sensível, gestação ou tratamento em curso: confirme com um dermatologista.")}`;
}

// ----- produtos
const LOJAS = (q) => [
  ["Google Shopping", "https://www.google.com/search?tbm=shop&q=" + encodeURIComponent(q)],
  ["Mercado Livre", "https://lista.mercadolivre.com.br/" + encodeURIComponent(q.trim().replace(/\s+/g, "-"))],
  ["Amazon", "https://www.amazon.com.br/s?k=" + encodeURIComponent(q)],
];
function cardProduto(titulo, p, porque, opcoes = []) {
  if (!p) return "";
  const q = `${p.marca} ${p.produto}`;
  return `<article class="card"><div class="stack" style="gap:2px"><span class="small muted">${esc(titulo)}</span><span class="prod-n">${esc(p.marca)} ${esc(p.produto)}</span><span class="chip gold" style="justify-self:start;white-space:normal">${esc(p.ativos)}</span></div>
    <div class="box rec"><span>${esc(porque)}</span>${p.obs ? `<span class="small">${esc(p.obs)}</span>` : ""}</div>
    <div class="box"><span class="price-v">${preco(p)}</span><span class="small muted">${esc(p.tamanho)} · preço pesquisado em ${fmt(p.data_preco)}. Preços mudam: confira.</span></div>
    <div class="links">${LOJAS(q).map(([n, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${n} ↗</a>`).join("")}</div>
    ${opcoes.length ? `<details><summary class="small">Outras opções</summary><div class="list">${opcoes.map((o) => `<div class="item" style="cursor:default"><span class="item-b"><span class="item-t">${esc(o.marca)} ${esc(o.produto)}</span><span class="small muted">${esc(o.ativos)} · ${esc(o.tamanho)}</span></span><span class="num small">${preco(o)}</span></div>`).join("")}</div></details>` : ""}
  </article>`;
}
function vProdutos() {
  const a = ultima();
  const cats = ["Todos", ...new Set(S.catalogo.map((c) => c.categoria))];
  const itens = S.catalogo.filter((c) => S.catFiltro === "Todos" || c.categoria === S.catFiltro);
  const catalogo = `<section class="card"><details><summary>Catálogo completo (${S.catalogo.length} produtos)</summary>
    <div class="stack" style="margin-top:10px"><div class="seg" role="group" aria-label="Categoria">${cats.map((k) => `<button data-act="catf:${esc(k)}" aria-pressed="${S.catFiltro === k}">${esc(k)}</button>`).join("")}</div>
    <div class="tbl-wrap"><table><thead><tr><th>Produto</th><th class="r">Preço</th></tr></thead><tbody>${itens.map((c) => `<tr><td><b>${esc(c.marca)}</b> ${esc(c.produto)}<br><span class="small muted">${esc(c.ativos)} · ${esc(c.tamanho)}</span></td><td class="r num">${preco(c)}</td></tr>`).join("")}</tbody></table></div></div></details></section>`;
  if (!a) return `<section class="card empty"><h2>Produtos para você</h2><p class="lede">As indicações saem da sua análise.</p><button class="btn primary" data-act="tela:analisar">Nova análise</button></section>${catalogo}`;
  const r = rec(a), P = r.produtos;
  const custo = [P.limpeza.produto, P.hidratante.produto, P.protetor.produto, ...P.seruns.map((s) => s.produto)].filter(Boolean);
  const total = (k) => custo.reduce((s, p) => s + p[k], 0);
  return `
    <section class="card"><h2>Produtos para você</h2>
      <p class="small muted">Escolhidos por regras fixas a partir da análise de ${fmt(a.data)}, do seu tipo de pele e dos seus objetivos, sempre pela opção mais em conta que serve. O app não vende nada e não ganha comissão.</p>
      <div class="box"><span class="small muted">Kit completo (${custo.length} itens)</span><span class="price-v">${total("preco_min") === total("preco_max") ? brl(total("preco_min")) : `${brl(total("preco_min"))} a ${brl(total("preco_max"))}`}</span><span class="small muted">Comece pelo básico; os séruns entram depois.</span></div></section>
    <h3 style="padding-inline:4px">O básico</h3>
    ${cardProduto("Protetor solar", P.protetor.produto, "Todo dia de manhã, mesmo em casa ou nublado. É o que mais previne manchas e linhas.", P.protetor.opcoes)}
    ${cardProduto("Limpeza", P.limpeza.produto, `Para pele ${TIPOS_PELE[r.pele]?.toLowerCase() || r.pele}${r.sensivel ? " e sensível" : ""}, de manhã e à noite.`, P.limpeza.opcoes)}
    ${cardProduto("Hidratante", P.hidratante.produto, `Para pele ${TIPOS_PELE[r.pele]?.toLowerCase() || r.pele}${r.sensivel ? " e sensível" : ""}, de manhã e à noite.`, P.hidratante.opcoes)}
    ${P.seruns.length ? `<h3 style="padding-inline:4px">Tratamento</h3>${P.seruns.map((s) => cardProduto(`Sérum · ${s.nome}`, s.produto, `Para ${s.objetivos.map((o) => o.toLowerCase()).join(" e ")}. ${s.quando === "manha" ? "De manhã" : "À noite"}. ${s.cuidado}`, s.opcoes)).join("")}` : ""}
    ${catalogo}
    <p class="foot">Composição completa e registro na ANVISA ainda a conferir. Teste qualquer produto novo numa pequena área antes.</p>`;
}

// ----- ajustes
function vAjustes() {
  const n = S.analises.length;
  return `
    <section class="card"><div class="row between"><h2>Seu perfil</h2>${S.editando ? "" : `<button class="btn sm" data-act="editar">Editar</button>`}</div>
      ${S.editando ? `${formPerfil(S.perfil)}<div class="btns"><button class="btn primary" data-act="salva-perfil">Salvar</button><button class="btn" data-act="editar">Cancelar</button></div>` : `
      <div class="stack small"><span><b>Nome:</b> ${esc(S.perfil.nome || "—")}</span><span><b>Idade:</b> ${esc(S.perfil.idade || "—")}</span>
      <span><b>Tipo de pele:</b> ${esc(TIPOS_PELE[S.perfil.tipoPele] || "—")}</span><span><b>Fototipo:</b> ${esc(FOTOTIPOS[S.perfil.fototipo || 0])}</span>
      <span><b>Objetivos:</b> ${esc((S.perfil.objetivos || []).join(", ") || "—")}</span>${S.perfil.gestante ? `<span><b>Gestação ou amamentação:</b> sim</span>` : ""}</div>`}</section>
    <section class="card"><h3>Assinatura</h3>
      <p class="small">${S.codigo ? "Você usa um código de convite: as análises estão liberadas." : "A primeira análise é grátis; as seguintes fazem parte da assinatura."}</p>
      ${S.codigo ? "" : `<button class="btn" data-act="tela:assinar">Ver planos</button>`}</section>
    <section class="card"><h3>Código de convite</h3>
      <label class="f">Código<input type="password" id="in-codigo" value="" placeholder="••••••••" autocomplete="off" autocapitalize="off" spellcheck="false"></label>
      <button class="btn" data-act="codigo"${S.ocupado ? " disabled" : ""}>${S.ocupado ? "Conferindo…" : "Trocar código"}</button></section>
    <section class="card"><h3>Seus dados</h3>
      <p class="small">${n} ${n === 1 ? "análise guardada" : "análises guardadas"} neste aparelho. Faça uma cópia de segurança de vez em quando: se o app for apagado ou você trocar de celular, é ela que traz o histórico de volta.</p>
      <div class="btns"><button class="btn" data-act="exportar"${n ? "" : " disabled"}>Exportar cópia</button><button class="btn" data-act="importar">Restaurar cópia</button></div>
      <button class="btn danger" data-act="apagar-tudo">Apagar todos os dados</button></section>
    <section class="card"><h3>Privacidade</h3><div class="legal">${TEXTO_PRIVACIDADE}</div>
      <p class="small muted">Consentimento dado em ${S.perfil.consentimento ? fmt(ymd(new Date(S.perfil.consentimento))) : "—"}. Para retirar, apague seus dados.</p></section>
    <p class="foot">MY Skin AI · análise pelo Método MY Skin v1 · <a href="termos.html">Termos de Uso</a> · <a href="privacidade.html">Privacidade</a></p>`;
}

// ----- assinatura
const PLANOS = [
  { id: "mensal", nome: "Mensal", preco: "R$ 19,90", detalhe: "por mês" },
  { id: "anual", nome: "Anual", preco: "R$ 129,90", detalhe: "por ano · sai a R$ 10,83 por mês" },
];
// the store app (Capacitor + RevenueCat) provides window.MySkinCompras; the web version has no purchase
const compras = () => window.MySkinCompras || null;
function vAssinar() {
  const loja = compras();
  return `
    <section class="card"><h2>Assine o MY Skin</h2>
      <p class="lede">Análises sem limite, evolução, rotina e produtos. Cancele quando quiser, pela loja.</p>
      <div class="stack">${PLANOS.map((p) => `<button class="btn plano${p.id === "anual" ? " primary" : ""} block" data-act="assinar:${p.id}"${loja && !S.ocupado ? "" : " disabled"}>
        <b>${p.nome} · ${p.preco}</b><span class="small">${p.detalhe}</span></button>`).join("")}</div>
      ${loja ? `<button class="btn sm" data-act="assinar:restaurar">Já assinei: restaurar compra</button>` : aviso("info", "A assinatura é feita pelo app MY Skin da App Store ou do Google Play. Se você recebeu um código de convite, use em Ajustes.")}
      <p class="small muted">Renovação automática até o cancelamento. Veja os <a href="termos.html">Termos de Uso</a> e a <a href="privacidade.html">Política de Privacidade</a>.</p></section>`;
}
async function assinar(plano) {
  const loja = compras();
  if (!loja || S.ocupado) return;
  S.ocupado = true; render();
  try {
    const ativa = plano === "restaurar" ? await loja.restaurar(S.usuario) : await loja.comprar(plano, S.usuario);
    S.ocupado = false;
    if (ativa) { toast("Assinatura ativa. Boas análises!"); vai("analisar"); } else { render(); toast(plano === "restaurar" ? "Nenhuma assinatura encontrada nesta conta da loja." : "A compra não foi concluída."); }
  } catch (e) { S.ocupado = false; render(); toast(e?.message || "A compra não foi concluída."); }
}

// ---------- ações ----------
async function salvaPerfil(p) { S.perfil = { ...S.perfil, ...p }; await DB.set("perfil", S.perfil); }
async function salvaChecks() { await DB.set("checks", S.checks); }

async function verificaCodigo() {
  const v = $("#in-codigo")?.value.trim();
  if (!v) return toast("Digite o código.");
  S.ocupado = true; render();
  try {
    await chama("acesso", {}, v);
    S.codigo = v; await DB.set("codigo", v);
    S.ocupado = false; toast("Código confirmado."); vai(S.analises.length ? "inicio" : "analisar");
  } catch (e) { S.ocupado = false; render(); toast(e.status === 401 ? "Código incorreto." : e.message); }
}

async function exportar() {
  const para64 = (b) => new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(b); });
  const analises = await Promise.all(S.analises.map(async (a) => ({ ...a, foto: a.foto ? await para64(a.foto) : null })));
  const dados = { app: "myskin", versao: 1, exportadoEm: new Date().toISOString(), perfil: S.perfil, checks: S.checks, eventos: S.eventos, rotinaInicio: S.rotinaInicio, analises };
  const blob = new Blob([JSON.stringify(dados)], { type: "application/json" });
  const nome = `myskin-copia-${hoje()}.json`;
  const file = new File([blob], nome, { type: "application/json" });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: "Cópia do MY Skin" }); return; } catch (e) { if (e.name === "AbortError") return; }
  }
  const u = URL.createObjectURL(blob), l = document.createElement("a");
  l.href = u; l.download = nome; document.body.append(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000);
}
async function importar(file) {
  if (!file) return;
  let d;
  try { d = JSON.parse(await file.text()); } catch { return toast("Arquivo inválido."); }
  if (d?.app !== "myskin" || !Array.isArray(d.analises)) return toast("Este arquivo não é uma cópia do MY Skin.");
  if (!confirm(`Restaurar ${d.analises.length} análises de ${d.exportadoEm ? fmt(ymd(new Date(d.exportadoEm))) : "data desconhecida"}? Os dados atuais deste aparelho serão substituídos.`)) return;
  const deB64 = async (u) => u ? (await fetch(u)).blob() : null;
  const analises = await Promise.all(d.analises.map(async (a) => ({ ...a, foto: await deB64(a.foto) })));
  const { codigo, usuario } = S;
  await DB.limpa();
  await DB.set("codigo", codigo); await DB.set("usuario", usuario);
  await DB.set("perfil", d.perfil); await DB.set("checks", d.checks || {}); await DB.set("eventos", d.eventos || []);
  if (d.rotinaInicio) await DB.set("rotinaInicio", d.rotinaInicio);
  for (const a of analises) await DB.salva(a);
  Object.values(urls).forEach(URL.revokeObjectURL); for (const k in urls) delete urls[k];
  await carrega(); toast("Cópia restaurada."); vai("inicio");
}

async function acao(act, el) {
  const [k, v] = [act.split(":")[0], act.slice(act.indexOf(":") + 1)];
  switch (k) {
    case "tela": return vai(v);
    case "ver": S.detalhe = v; render(); window.scrollTo(0, 0); return;
    case "onb": {
      if (v === "1") {
        if (!$("#ok-termos").checked || !$("#ok-dados").checked) return toast("Para usar o app, marque as duas autorizações.");
        S.onb = 1; S.perfil = { ...(S.perfil || {}), _aceite: new Date().toISOString() }; return render();
      }
      const p = lePerfil();
      await salvaPerfil({ ...p, consentimento: S.perfil._aceite || new Date().toISOString() });
      delete S.perfil._aceite; await DB.set("perfil", S.perfil);
      S.onb = 2; return render();
    }
    case "codigo": return verificaCodigo();
    case "sem-codigo": await salvaPerfil({ semCodigo: true }); return vai(S.analises.length ? "inicio" : "analisar");
    case "assinar": return assinar(v);
    case "camera": return $("#in-camera").click();
    case "galeria": return $("#in-galeria").click();
    case "descartar": if (S.rascunho?.url) URL.revokeObjectURL(S.rascunho.url); S.rascunho = null; return render();
    case "analisar": return analisar();
    case "check": {
      const t = hoje(), set = new Set(S.checks[t] || []);
      set.has(v) ? set.delete(v) : set.add(v);
      S.checks[t] = [...set];
      const corte = soma(t, -60); for (const d of Object.keys(S.checks)) if (d < corte) delete S.checks[d];
      await salvaChecks(); return render();
    }
    case "proc-form": S.procForm = !S.procForm; return render();
    case "salva-proc": {
      const sel = $("#proc-tipo"), data = $("#proc-data").value || hoje();
      S.eventos.push({ id: novoId(), tipo: sel.value, dias: Number(sel.selectedOptions[0].dataset.dias), data });
      await DB.set("eventos", S.eventos); S.procForm = false; toast("Procedimento registrado."); return render();
    }
    case "apagar-proc": S.eventos = S.eventos.filter((e) => e.id !== v); await DB.set("eventos", S.eventos); return render();
    case "catf": S.catFiltro = v; return render();
    case "editar": S.editando = !S.editando; return render();
    case "salva-perfil": await salvaPerfil(lePerfil()); S.editando = false; toast("Perfil salvo."); return render();
    case "apagar-analise":
      if (!confirm("Apagar esta análise e a foto? Não dá para desfazer.")) return;
      await DB.apaga(v); S.analises = S.analises.filter((a) => a.id !== v);
      if (urls[v]) { URL.revokeObjectURL(urls[v]); delete urls[v]; }
      return vai("evolucao");
    case "exportar": return exportar();
    case "importar": return $("#in-backup").click();
    case "apagar-tudo":
      if (!confirm("Apagar perfil, fotos, análises e rotina deste aparelho? Não dá para desfazer. Exporte uma cópia antes, se quiser guardar.")) return;
      await DB.limpa(); location.reload(); return;
    case "instalar": if (S.instalar) { S.instalar.prompt(); const r = await S.instalar.userChoice; S.instalar = null; if (r.outcome === "accepted") lsSet("myskin-instalar-ok", "1"); render(); } return;
    case "instalar-ok": lsSet("myskin-instalar-ok", "1"); return render();
  }
}

function depois() {
  const c = $(".compare");
  if (c) {
    let arrastando = false;
    const move = (e) => { const r = c.getBoundingClientRect(); S.cmp.corte = Math.round(Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100))); c.style.setProperty("--cut", S.cmp.corte + "%"); const rg = $('[data-act-input="corte"]'); if (rg) rg.value = S.cmp.corte; };
    c.addEventListener("pointerdown", (e) => { arrastando = true; c.setPointerCapture(e.pointerId); move(e); });
    c.addEventListener("pointermove", (e) => { if (arrastando) move(e); });
    c.addEventListener("pointerup", () => { arrastando = false; });
  }
}

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-act]");
  if (!el || el.disabled) return;
  if (el.type === "checkbox") return; // tratado no change
  e.preventDefault();
  acao(el.dataset.act, el).catch((err) => { console.error(err); toast("Algo deu errado. Tente de novo."); });
});
document.addEventListener("change", (e) => {
  const t = e.target;
  if (t.type === "checkbox" && t.dataset.act) acao(t.dataset.act, t);
  if (t.dataset.cmp) { S.cmp[t.dataset.cmp] = t.value; render(); }
  if (t.id === "in-camera" || t.id === "in-galeria") { escolheuFoto(t.files[0]); t.value = ""; }
  if (t.id === "in-backup") { importar(t.files[0]); t.value = ""; }
});
document.addEventListener("input", (e) => {
  if (e.target.dataset.actInput === "corte") { S.cmp.corte = Number(e.target.value); $(".compare")?.style.setProperty("--cut", S.cmp.corte + "%"); }
});
document.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.id === "in-codigo") verificaCodigo(); });
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); S.instalar = e; if (S.tela === "inicio") render(); });

// ---------- início ----------
(async () => {
  try {
    await carrega();
    if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
  } catch (e) {
    console.error(e);
    $("#main").innerHTML = aviso("bad", "Não foi possível abrir os dados deste aparelho. Se estiver em uma aba anônima, abra o app numa aba normal.");
    return;
  }
  if (S.perfil?.consentimento && !S.codigo && !S.perfil.semCodigo) S.onb = 2;
  render();
  if ("serviceWorker" in navigator && !NATIVO) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
