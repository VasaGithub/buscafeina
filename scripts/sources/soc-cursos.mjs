// Cursos de formación ocupacional del SOC (datos abiertos de la Generalitat).
import { getBuffer, usDateToIso, titleCase, sentenceCase, fixPlace, zonesFromText, isoDay } from '../util.mjs';

export const CURSOS_URL = 'https://oficinadetreball.gencat.cat/opendata/recursos/ofertaCursos.json';
export const SOC_FALLBACK = 'https://serveiocupacio.gencat.cat/ca/inici/';

export function courseUrl(web) {
  const w = (web || '').trim();
  if (/^https?:\/\//i.test(w)) return w;
  if (/^www\./i.test(w)) return `https://${w}`;
  return SOC_FALLBACK; // muchos centros solo dan un correo: no lo usamos como enlace web
}

export function normalizeCursos(rows, today = isoDay(Date.now())) {
  const seen = new Set();
  const out = [];
  for (const r of rows) {
    const tele = /teleformaci/i.test(r.modalitat || '');
    const inBcn = /barcelona/i.test(r.provincia_especialitat || '');
    if (!inBcn && !tele) continue;
    const start = usDateToIso(r.data_inici);
    const end = usDateToIso(r.data_fi);
    if (end && end < today) continue;
    const id = `soc-${r.curs}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const place = fixPlace(r.municipi_especialitat || r.municipi_centre || '');
    const zones = new Set(zonesFromText(`${place} ${r.municipi_centre || ''}`));
    if (inBcn) zones.add('barcelona');
    if (tele) zones.add('teletrabajo');
    out.push({
      id,
      type: 'curso',
      source: 'soc',
      title: sentenceCase(r.especialitat_formativa || 'Curso'),
      org: titleCase(r.nom_centre || 'SOC'),
      place: tele ? `${place} (a distancia)` : place,
      zones: [...zones],
      date: start, // fecha de inicio
      deadline: null,
      hours: Number(r.hores) || null,
      mode: (r.modalitat || '').toLowerCase(),
      open: /inscripcio/i.test(r.estat_curs || ''),
      url: courseUrl(r.web_centre),
    });
  }
  return out;
}

export async function fetchCursos(today = isoDay(Date.now())) {
  const buf = await getBuffer(CURSOS_URL);
  const text = new TextDecoder('latin1').decode(buf); // el fichero del SOC viene en ISO-8859-1
  return normalizeCursos(JSON.parse(text), today);
}
