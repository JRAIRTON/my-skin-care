// Entrada do Worker: exporta só o servidor. O runtime da Cloudflare trata cada export nomeado do
// arquivo principal como um ponto de entrada e recusa constantes, então elas ficam em index.js.
import { criaApp } from "./index.js";

export default criaApp();
