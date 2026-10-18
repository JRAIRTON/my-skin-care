// /convite?c=CODIGO: mostra o código da amiga e leva ao app já com ele (o app guarda e oferece o mês grátis)
const c = (new URLSearchParams(location.search).get("c") || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
if (c) {
  document.querySelector("[data-codigo]").textContent = c;
  document.querySelector("[data-tem]").hidden = false;
  document.querySelector("[data-usar]").href = `https://app.myskincareapp.com.br/?convite=${encodeURIComponent(c)}`;
}
