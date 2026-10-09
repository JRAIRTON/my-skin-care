// Página /baixar: leva cada aparelho à loja certa. Enquanto os endereços das lojas estiverem vazios,
// mostra o botão para abrir o app pelo navegador. Ao publicar nas lojas, basta preencher LOJAS.
const LOJAS = {
  ios: "",      // ex.: https://apps.apple.com/br/app/my-skin/id0000000000
  android: "",  // ex.: https://play.google.com/store/apps/details?id=br.com.myskin.app
};
const ua = navigator.userAgent;
const sistema = /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1) ? "ios" : /android/i.test(ua) ? "android" : null;
if (sistema && LOJAS[sistema]) location.replace(LOJAS[sistema]);
for (const [k, url] of Object.entries(LOJAS)) {
  const a = document.querySelector(`[data-loja="${k}"]`);
  if (a && url) { a.href = url; a.hidden = false; }
}
