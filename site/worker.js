// Site do MY Skin Care (www.myskincareapp.com.br): serve os arquivos de ./public.
// O endereço sem "www" redireciona para o com "www", e toda resposta leva os cabeçalhos de segurança.
const DOMINIO = "www.myskincareapp.com.br";
const SEGURANCA = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), geolocation=(), microphone=()",
  "Content-Security-Policy": "default-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
};

// Arquivos de verificação do Google Search Console, respondidos direto: o servidor de arquivos
// redirecionaria o ".html" para o endereço sem extensão, e o Google não aceita redirecionamento.
const VERIFICACAO = ["google04d0a35e2af0efe8.html"];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === DOMINIO.replace(/^www\./, "")) {
      url.hostname = DOMINIO;
      return Response.redirect(url.toString(), 301);
    }
    const arquivo = url.pathname.slice(1);
    if (VERIFICACAO.includes(arquivo)) {
      return new Response(`google-site-verification: ${arquivo}`, { headers: { "Content-Type": "text/html; charset=utf-8", ...SEGURANCA } });
    }
    const r = await env.ASSETS.fetch(request);
    const h = new Headers(r.headers);
    for (const [k, v] of Object.entries(SEGURANCA)) h.set(k, v);
    if (url.pathname.startsWith("/img/") || url.pathname.startsWith("/icones/")) h.set("Cache-Control", "public, max-age=604800");
    return new Response(r.body, { status: r.status, statusText: r.statusText, headers: h });
  },
};
