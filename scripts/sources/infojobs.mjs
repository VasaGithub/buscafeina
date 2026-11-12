// InfoJobs: SOLO se activa si defines INFOJOBS_CLIENT_ID e INFOJOBS_CLIENT_SECRET
// (claves gratuitas de developer.infojobs.net). Lee antes sus condiciones de uso.
// AVISO: escrito según la documentación pública; NO probado contra la API real.
import { getBuffer, isoDay, zonesFromText } from '../util.mjs';

export function infojobsEnabled(env = process.env) {
  return Boolean(env.INFOJOBS_CLIENT_ID && env.INFOJOBS_CLIENT_SECRET);
}

export function normalizeInfojobs(json) {
  return (json.items || json.offers || [])
    .map((o) => ({
      id: `ij-${o.id}`,
      type: 'oferta',
      source: 'infojobs',
      title: o.title,
      org: o.author?.name || 'Empresa (InfoJobs)',
      place: o.city || o.province?.value || '',
      zones: zonesFromText(`${o.city || ''} ${o.province?.value || ''}`),
      date: isoDay(o.published || o.updated || Date.now()),
      deadline: null,
      url: o.link,
    }))
    .filter((o) => o.id && o.title && o.url);
}

export async function fetchInfojobs(env = process.env, keywords = ['administrativo', 'contable', 'compras', 'facturacion', 'proveedores', 'nominas']) {
  const auth = Buffer.from(`${env.INFOJOBS_CLIENT_ID}:${env.INFOJOBS_CLIENT_SECRET}`).toString('base64');
  const all = [];
  for (const q of keywords) {
    const params = new URLSearchParams({ q, province: 'barcelona', maxResults: '30', order: 'updated-desc' });
    const buf = await getBuffer(`https://api.infojobs.net/api/9/offer?${params}`, { headers: { Authorization: `Basic ${auth}` } });
    all.push(...normalizeInfojobs(JSON.parse(buf.toString('utf8'))));
  }
  return [...new Map(all.map((o) => [o.id, o])).values()];
}
