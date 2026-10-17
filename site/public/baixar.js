// /baixar: o link que vai na imagem de evolução compartilhada pelo app.
// iPhone ou Android com o app publicado vão direto à loja; o resto vai à página inicial do site.
import { LOJAS } from "./lojas.js";

const ua = navigator.userAgent;
const sistema = /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1) ? "ios" : /android/i.test(ua) ? "android" : null;
location.replace((sistema && LOJAS[sistema]) || "/");
