// MY Skin Care — índice UV calculado no próprio aparelho, sem servidor e sem custo.
// É o UV de céu aberto: depende só da altura do sol (latitude, longitude, data e hora) e de uma camada de
// ozônio típica do Brasil. Nuvens reduzem o UV real, então o valor é o máximo esperado para o dia, o que
// serve bem para lembrar do protetor. Fórmula de céu limpo: UV ≈ 12,5 · μ^2,42 · (Ω/300)^-1,23, em que μ
// é o cosseno do ângulo zenital do sol e Ω o ozônio em unidades Dobson (Madronich, 2007).
// Este arquivo não usa o navegador, para poder ser testado com `node --test`.

const OZONIO = 270; // Dobson; média típica das latitudes do Brasil
const rad = (g) => (g * Math.PI) / 180;

// cosine of the sun's zenith angle at a given instant and place (NOAA low-precision solar position)
export function cosZenite(data, lat, lon) {
  const n = data.getTime() / 864e5 + 2440587.5 - 2451545.0;
  const L = (280.46 + 0.9856474 * n) % 360, g = rad((357.528 + 0.9856003 * n) % 360);
  const lambda = rad(L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g));
  const eps = rad(23.439 - 0.0000004 * n);
  const decl = Math.asin(Math.sin(eps) * Math.sin(lambda));
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda));
  const gmst = ((18.697374558 + 24.06570982441908 * n) % 24 + 24) % 24;
  const h = rad(gmst * 15 + lon) - ra;
  return Math.sin(rad(lat)) * Math.sin(decl) + Math.cos(rad(lat)) * Math.cos(decl) * Math.cos(h);
}

export function uvCeuAberto(data, lat, lon) {
  const mu = cosZenite(data, lat, lon);
  return mu <= 0 ? 0 : 12.5 * mu ** 2.42 * (OZONIO / 300) ** -1.23;
}

// scale of the World Health Organization
export function nivelUV(uv) {
  if (uv >= 11) return { nivel: "extremo", cor: "bad" };
  if (uv >= 8) return { nivel: "muito alto", cor: "bad" };
  if (uv >= 6) return { nivel: "alto", cor: "warn" };
  if (uv >= 3) return { nivel: "moderado", cor: "gold" };
  return { nivel: "baixo", cor: "good" };
}

/**
 * UV of a day in the device's local time: the maximum, each hour from 6h to 18h (value at the half hour)
 * and the window when it is 8 or more ("muito alto").
 * @param {string} dia  "AAAA-MM-DD" in local time
 */
export function uvDoDia(dia, lat, lon) {
  const [y, m, d] = dia.split("-").map(Number);
  const horas = [];
  let max = 0;
  for (let h = 6; h <= 18; h++) {
    horas.push([h, Math.round(uvCeuAberto(new Date(y, m - 1, d, h, 30), lat, lon))]);
    for (let q = 0; q < 60; q += 15) max = Math.max(max, uvCeuAberto(new Date(y, m - 1, d, h, q), lat, lon));
  }
  const altas = horas.filter(([, v]) => v >= 8).map(([h]) => h);
  return { max: Math.round(max), horas, alto: altas.length ? [altas[0], altas.at(-1) + 1] : null };
}

// what to do, by level (cosmetic care and prevention; no medical promises)
export function conselhoUV(uv) {
  if (uv >= 8) return "Reaplique o protetor a cada 2 horas e evite o sol direto no horário de pico. Chapéu e óculos de sol ajudam.";
  if (uv >= 6) return "Use o protetor da rotina e reaplique se ficar ao ar livre.";
  if (uv >= 3) return "Use o protetor da rotina. Reaplique se ficar muito tempo ao ar livre.";
  return "UV baixo. O protetor da rotina já basta.";
}
