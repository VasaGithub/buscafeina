// BOE, sección II.B (oposiciones y concursos). RSS oficial del BOE.
import { decodeEntities, getBuffer, isoDay, sentenceCase, titleCase, zonesFromText } from '../util.mjs';

export const BOE_RSS = 'https://www.boe.es/rss/boe.php?s=2B';

const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

/** "Thu, 12 Nov 2026 00:00:00 +0100" -> "2026-11-12" (día tal como lo publica el BOE, sin cambios de zona horaria) */
export function rssDay(pub = '') {
  const m = pub.match(/(\d{1,2})\s+([A-Za-z]{3})\w*\s+(\d{4})/);
  if (!m || !MONTHS[m[2].toLowerCase()]) return isoDay(Date.now());
  return `${m[3]}-${String(MONTHS[m[2].toLowerCase()]).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

export function parseBoeRss(xml) {
  const out = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const block = m[1];
    const get = (tag) => decodeEntities((block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`)) || [])[1] || '');
    const title = get('title');
    const link = get('link');
    const desc = get('description');
    const pub = get('pubDate');
    if (!/BOE-A-/.test(link + desc)) continue; // se salta el "Sumario"
    // "II. Autoridades y personal. - B. Oposiciones y concursos - ORGANISMO - Subtipo - Referencia: ..."
    const parts = desc.split(' - ').map((p) => p.trim());
    const org = parts[2] && !parts[2].startsWith('Referencia') ? titleCase(parts[2]) : 'BOE';
    const ref = (desc.match(/BOE-A-\d{4}-\d+/) || [])[0] || link;
    const zones = zonesFromText(`${title} ${org}`);
    out.push({
      id: `boe-${ref}`,
      type: 'oposicion',
      source: 'boe',
      title: sentenceCase(title),
      org,
      place: zones.includes('barcelona') ? 'Barcelona' : 'España (estatal)',
      zones,
      date: rssDay(pub),
      deadline: null,
      url: link,
    });
  }
  return out;
}

export async function fetchBoe() {
  const buf = await getBuffer(BOE_RSS);
  const xml = new TextDecoder('latin1').decode(buf); // el feed viene en ISO-8859-1
  return parseBoeRss(xml);
}
