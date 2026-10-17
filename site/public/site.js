// Botões das lojas da página inicial. Endereço vazio = "Em breve", e o botão leva à chamada final.
import { LOJAS } from "./lojas.js";

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
