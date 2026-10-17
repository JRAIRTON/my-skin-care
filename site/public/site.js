// Botões das lojas: preencha os endereços quando o app for publicado (os mesmos de app/baixar.js).
// Vazio = "Em breve", e o botão leva à chamada final da página.
const LOJAS = {
  ios: "",      // ex.: https://apps.apple.com/br/app/.../id000000000
  android: "",  // ex.: https://play.google.com/store/apps/details?id=br.com.myskin.app
};

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
