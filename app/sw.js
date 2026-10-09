// Service worker: guarda os arquivos do app para abrir sem internet. A análise sempre vai à rede.
const VERSAO = "myskin-v14";
const ARQUIVOS = ["./", "index.html", "estilo.css", "visual-novo.css", "app.js", "recomenda.js", "nativo.js", "catalogo.json", "termos.html", "privacidade.html", "manifest.webmanifest", "icones/icone-192.png", "icones/icone-512.png", "icones/apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSAO).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin || /^\/(analise|acesso|saude)$/.test(u.pathname)) return;
  // rede primeiro, para receber atualizações; sem rede, a cópia guardada
  e.respondWith(
    fetch(e.request).then((r) => {
      if (r.ok) { const cp = r.clone(); caches.open(VERSAO).then((c) => c.put(e.request, cp)); }
      return r;
    }).catch(() => caches.match(e.request).then((r) => r || caches.match("index.html")))
  );
});
