// Botões das lojas da página inicial. Endereço vazio = "Em breve", e o botão leva à chamada final.
import { LOJAS } from "./lojas.js";
import { DEPOIMENTOS } from "./depoimentos.js";

for (const a of document.querySelectorAll("[data-loja]")) {
  const url = LOJAS[a.dataset.loja];
  if (url) {
    a.href = url;
    a.querySelector("small").textContent = a.dataset.loja === "ios" ? "Baixar na" : "Disponível no";
  } else {
    a.setAttribute("aria-disabled", "true");
  }
}
if (LOJAS.ios && LOJAS.android) document.querySelector("[data-lojas-aviso]")?.remove();

// Vídeo do app no topo: toca sozinho, sem som e em loop. Quem pediu menos movimento no aparelho vê só a imagem.
const demo = document.querySelector("[data-demo]");
if (demo && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  demo.autoplay = true;
  demo.play().catch(() => {});
}

// Depoimentos: a seção só aparece quando a lista de depoimentos.js tem algum
const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const caixa = document.querySelector("[data-depoimentos]");
if (caixa && DEPOIMENTOS.length) {
  caixa.innerHTML = DEPOIMENTOS.map((d) => `<figure class="depo"><blockquote>“${esc(d.texto)}”</blockquote>
    <figcaption><b>${esc(d.nome)}</b>${d.detalhe ? `<span>${esc(d.detalhe)}</span>` : ""}</figcaption></figure>`).join("");
  document.getElementById("depoimentos").hidden = false;
}
