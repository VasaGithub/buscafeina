// Ofertas de trabajo temporales de los departamentos de la Generalitat (datos abiertos, Socrata).
import { isoDay, getBuffer, zonesFromText, titleCase, sentenceCase } from '../util.mjs';

const BASE = 'https://analisi.transparenciacatalunya.cat/resource/qwjc-9xp7.json';
const KEEP = /barcelona|centrals|pened|diversos/i; // Igualada cae en "Comarques Centrals"

export function normalizeGeneralitat(rows, today = isoDay(Date.now())) {
  const out = [];
  for (const r of rows) {
    const ambit = r.ambit_territorial || '';
    if (!KEEP.test(ambit)) continue;
    const deadline = r.data_fi_publicacio ? r.data_fi_publicacio.slice(0, 10) : null;
    if (deadline && deadline < today) continue;
    const url = r.oferta && r.oferta.url;
    if (!url || !r.codi) continue;
    const zones = new Set(zonesFromText(`${r.descripcio_lloc} ${r.organisme}`));
    if (/barcelona/i.test(ambit)) zones.add('barcelona');
    if (/centrals/i.test(ambit)) { zones.add('anoia'); zones.add('barcelona'); } // aprox.: la Anoia está en Comarques Centrals
    out.push({
      id: `gen-${r.codi}`,
      type: 'oposicion',
      source: 'generalitat',
      title: sentenceCase(r.descripcio_lloc || 'Oferta de la Generalitat').replace(/\?/g, '–'),
      org: titleCase(r.departament || 'Generalitat de Catalunya'),
      place: ambit,
      zones: [...zones],
      category: r.categoria || null,
      date: r.data_inici_publicacio ? r.data_inici_publicacio.slice(0, 10) : today,
      deadline,
      url,
    });
  }
  return out;
}

export async function fetchGeneralitat(today = isoDay(Date.now())) {
  const q = new URLSearchParams({
    $where: `data_fi_publicacio >= '${today}'`,
    $order: 'data_fi_publicacio ASC',
    $limit: '1000',
  });
  const buf = await getBuffer(`${BASE}?${q}`);
  return normalizeGeneralitat(JSON.parse(buf.toString('utf8')), today);
}
