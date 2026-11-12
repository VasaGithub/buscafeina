// Utilidades compartidas por las fuentes de datos.

export function decodeEntities(s = '') {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .trim();
}

export function plain(s = '') {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

const SMALL = new Set(['de', 'del', 'la', 'las', 'el', 'els', 'les', 'los', 'i', 'y', 'a', 'en', 'per', 'para', 'amb', 'd', 'l']);

export function titleCase(s = '') {
  const t = s.trim().replace(/\s+/g, ' ');
  return t.toLowerCase().replace(/(^|[\s(/-])(\p{L})([\p{L}']*)/gu, (m, pre, first, rest, offset) => {
    const word = first + rest;
    if (offset > 0 && SMALL.has(word)) return pre + word;
    return pre + first.toUpperCase() + rest;
  });
}

export function sentenceCase(s = '') {
  const t = s.trim().replace(/\s+/g, ' ').replace(/\.$/, '');
  if (!t) return t;
  const lower = t === t.toUpperCase() ? t.toLowerCase() : t;
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/** "HOSPITALET DE LLOBREGAT, L'" -> "L'Hospitalet de Llobregat" */
export function fixPlace(s = '') {
  const m = s.trim().match(/^(.*),\s*(L'|EL|LA|ELS|LES)$/i);
  let name = m ? (m[2].endsWith("'") ? m[2] : m[2] + ' ') + m[1] : s;
  name = titleCase(name);
  return name.replace(/^L'\s*(\p{L})/u, (_, c) => "L'" + c.toUpperCase());
}

// Municipios de la comarca de la Anoia (sin acentos, minúsculas).
const ANOIA = [
  'argencola', 'bellprat', "cabrera d'anoia", 'calaf', 'calonge de segarra', 'capellades', 'carme',
  'castellolí', 'copons', 'hostalets de pierola', 'igualada', 'jorba', 'llacuna', 'masquefa',
  'montmaneu', 'odena', 'orpi', 'piera', 'pobla de claramunt', 'prats de rei', 'sant marti de tous',
  'sant marti sesgueioles', 'sant pere sallavinera', 'santa margarida de montbui', 'montbui',
  'santa maria de miralles', "vallbona d'anoia", 'vilanova del cami', 'anoia',
].map(plain);

/** Zonas (anidadas: Igualada ⊂ Anoia ⊂ Barcelona) deducidas de un texto. */
export function zonesFromText(text = '') {
  const t = plain(text);
  const zones = new Set();
  if (/\bigualada\b/.test(t)) { zones.add('igualada'); zones.add('anoia'); zones.add('barcelona'); }
  else if (ANOIA.some((m) => new RegExp(`\\b${m}\\b`).test(t))) { zones.add('anoia'); zones.add('barcelona'); }
  if (/\bbarcelona\b/.test(t)) zones.add('barcelona');
  if (/\b(teletreball|teletrabajo|teleformacio|en linea|online)\b/.test(t)) zones.add('teletrabajo');
  return [...zones];
}

export function isoDay(d) {
  return new Date(d).toISOString().slice(0, 10);
}

/** "11/17/2026" (mes/día/año, formato del SOC) -> "2026-11-17" */
export function usDateToIso(s = '') {
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
}

export async function getBuffer(url, opts = {}) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'buscafeina/1.0 (app personal sin ánimo de lucro)', ...(opts.headers || {}) },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}`);
  return Buffer.from(await res.arrayBuffer());
}
