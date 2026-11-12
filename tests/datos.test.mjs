// Pruebas del script de datos (sin red: usan ejemplos reales recortados).
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseBoeRss } from '../scripts/sources/boe.mjs';
import { normalizeGeneralitat } from '../scripts/sources/generalitat.mjs';
import { normalizeCursos, courseUrl, SOC_FALLBACK } from '../scripts/sources/soc-cursos.mjs';
import { normalizeInfojobs, infojobsEnabled } from '../scripts/sources/infojobs.mjs';
import { mergeItems } from '../scripts/merge.mjs';
import { fixPlace, usDateToIso, zonesFromText } from '../scripts/util.mjs';

const BOE_XML = `<?xml version="1.0" encoding="ISO-8859-1"?><rss><channel>
<item><title>Sumario</title><link>https://www.boe.es/boe/dias/2026/11/12/</link><description>Sumario del diario núm. 282 - Referencia: BOE-S-2026-282</description><pubDate>Thu, 12 Nov 2026 00:00:00 +0100</pubDate></item>
<item><title>Resolución de 5 de noviembre, del Ayuntamiento de Igualada (Barcelona), por la que se convoca plaza de Administrativo &amp; Auxiliar.</title>
<link>https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-23700</link>
<description>II. Autoridades y personal. - B. Oposiciones y concursos - ADMINISTRACIÓN LOCAL - Personal funcionario - Referencia: BOE-A-2026-23700 - KBytes: 217</description>
<pubDate>Thu, 12 Nov 2026 00:00:00 +0100</pubDate></item></channel></rss>`;

test('BOE: ignora el "Sumario" y normaliza la convocatoria', () => {
  const items = parseBoeRss(BOE_XML);
  assert.equal(items.length, 1);
  const [it] = items;
  assert.equal(it.id, 'boe-BOE-A-2026-23700');
  assert.equal(it.type, 'oposicion');
  assert.match(it.title, /Administrativo & Auxiliar/);
  assert.equal(it.date, '2026-11-12'); // no debe retroceder un día por la zona horaria
  assert.ok(it.zones.includes('igualada') && it.zones.includes('anoia') && it.zones.includes('barcelona'));
  assert.equal(it.url, 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-23700');
});

const GEN_ROWS = [
  { departament: 'INTERIOR I SEGURETAT PÚBLICA', ambit_territorial: 'Comarques de Barcelona', codi: 'ISP548-26', categoria: 'Administració', descripcio_lloc: "Responsable d'Estudis, A1?24.4", organisme: 'Gabinet', data_inici_publicacio: '2026-11-12T00:00:00.000', data_fi_publicacio: '2026-11-23T00:00:00.000', oferta: { url: 'https://x/1.pdf' } },
  { departament: 'CULTURA', ambit_territorial: 'Ponent', codi: 'CLT1', descripcio_lloc: 'Lleida', data_fi_publicacio: '2026-11-23T00:00:00.000', oferta: { url: 'https://x/2.pdf' } },
  { departament: 'SALUT', ambit_territorial: 'Comarques Centrals', codi: 'SLT2', descripcio_lloc: 'Administratiu', data_fi_publicacio: '2026-11-01T00:00:00.000', oferta: { url: 'https://x/3.pdf' } },
  { departament: 'SALUT', ambit_territorial: 'Comarques Centrals', codi: 'SLT3', descripcio_lloc: 'Administratiu/iva', data_fi_publicacio: '2026-11-20T00:00:00.000', oferta: { url: 'https://x/4.pdf' } },
];

test('Generalitat: filtra por zona y caducadas, conserva la fecha límite', () => {
  const items = normalizeGeneralitat(GEN_ROWS, '2026-11-12');
  assert.deepEqual(items.map((i) => i.id), ['gen-ISP548-26', 'gen-SLT3']);
  assert.equal(items[0].deadline, '2026-11-23');
  assert.ok(items[0].zones.includes('barcelona'));
  assert.ok(items[1].zones.includes('anoia'), 'Comarques Centrals incluye la Anoia');
  assert.ok(!items[0].title.includes('?'));
});

const CURSOS = [
  { curs: '1', especialitat_formativa: 'ACTIVITATS ADMINISTRATIVES EN LA RELACIÓ AMB EL CLIENT.', municipi_especialitat: 'IGUALADA', provincia_especialitat: 'BARCELONA', modalitat: 'PRESENCIAL', data_inici: '11/17/2026', data_fi: '05/28/2027', hores: '330', estat_curs: "Curs en període d'inscripcio", nom_centre: 'CENTRE FORMACIO', web_centre: 'www.centre.cat' },
  { curs: '1', especialitat_formativa: 'DUPLICADO', municipi_especialitat: 'IGUALADA', provincia_especialitat: 'BARCELONA', modalitat: 'PRESENCIAL', data_inici: '11/17/2026', data_fi: '05/28/2027' },
  { curs: '2', especialitat_formativa: 'Girona', municipi_especialitat: 'GIRONA', provincia_especialitat: 'GIRONA', modalitat: 'PRESENCIAL', data_inici: '11/17/2026', data_fi: '05/28/2027' },
  { curs: '3', especialitat_formativa: 'Online', municipi_especialitat: 'SALT', provincia_especialitat: 'GIRONA', modalitat: 'TELEFORMACIÓ', data_inici: '12/01/2026', data_fi: '06/01/2027', web_centre: 'a@b.cat' },
  { curs: '4', especialitat_formativa: 'Acabado', municipi_especialitat: 'IGUALADA', provincia_especialitat: 'BARCELONA', modalitat: 'PRESENCIAL', data_inici: '01/01/2026', data_fi: '02/01/2026' },
  { curs: '5', especialitat_formativa: 'Hospitalet', municipi_especialitat: "HOSPITALET DE LLOBREGAT, L'", provincia_especialitat: 'BARCELONA', modalitat: 'PRESENCIAL', data_inici: '11/30/2026', data_fi: '05/28/2027' },
];

test('Cursos SOC: fechas, duplicados, caducados, teleformación y nombres de lugar', () => {
  const items = normalizeCursos(CURSOS, '2026-11-12');
  assert.deepEqual(items.map((i) => i.id), ['soc-1', 'soc-3', 'soc-5']);
  assert.equal(items[0].date, '2026-11-17');
  assert.equal(items[0].title, 'Activitats administratives en la relació amb el client');
  assert.equal(items[0].place, 'Igualada');
  assert.ok(items[0].zones.includes('igualada'));
  assert.equal(items[0].open, true);
  assert.equal(items[0].url, 'https://www.centre.cat');
  assert.ok(items[1].zones.includes('teletrabajo'));
  assert.equal(items[1].url, SOC_FALLBACK, 'un correo no es un enlace web');
  assert.equal(items[2].place, "L'Hospitalet de Llobregat");
});

test('utilidades', () => {
  assert.equal(usDateToIso('3/4/2026'), '2026-03-04');
  assert.equal(usDateToIso('basura'), null);
  assert.equal(fixPlace("HOSPITALET DE LLOBREGAT, L'"), "L'Hospitalet de Llobregat");
  assert.equal(courseUrl(''), SOC_FALLBACK);
  assert.deepEqual(zonesFromText('Ajuntament de Santa Margarida de Montbui').sort(), ['anoia', 'barcelona']);
  assert.deepEqual(zonesFromText('Madrid'), []);
});

test('InfoJobs: solo se activa con claves y normaliza ofertas', () => {
  assert.equal(infojobsEnabled({}), false);
  assert.equal(infojobsEnabled({ INFOJOBS_CLIENT_ID: 'a', INFOJOBS_CLIENT_SECRET: 'b' }), true);
  const items = normalizeInfojobs({ items: [{ id: 'z9', title: 'Administrativa contable', city: 'Igualada', author: { name: 'Metal SL' }, published: '2026-11-10T08:00:00Z', link: 'https://infojobs.net/z9' }, { id: 'x' }] });
  assert.equal(items.length, 1);
  assert.equal(items[0].id, 'ij-z9');
  assert.ok(items[0].zones.includes('igualada'));
});

test('merge: conserva "primera vez visto", quita caducados y respeta fuentes caídas', () => {
  const prev = [
    { id: 'a', source: 'boe', type: 'oposicion', date: '2026-11-01', firstSeen: '2026-11-01', deadline: null },
    { id: 'old', source: 'boe', type: 'oposicion', date: '2026-09-01', firstSeen: '2026-09-01', deadline: null },
    { id: 'g1', source: 'generalitat', type: 'oposicion', date: '2026-11-01', firstSeen: '2026-11-02', deadline: '2026-11-30' },
    { id: 'gX', source: 'generalitat', type: 'oposicion', date: '2026-11-01', firstSeen: '2026-11-02', deadline: '2026-11-05' },
  ];
  const fresh = [{ id: 'a', source: 'boe', type: 'oposicion', date: '2026-11-01', deadline: null }, { id: 'n', source: 'boe', type: 'oposicion', date: '2026-11-12', deadline: null }];
  const out = mergeItems(prev, fresh, new Set(['boe']), '2026-11-12'); // Generalitat falló hoy
  const ids = out.map((i) => i.id).sort();
  assert.deepEqual(ids, ['a', 'g1', 'n']); // old caducó; gX venció; g1 se conserva aunque la fuente falló
  assert.equal(out.find((i) => i.id === 'a').firstSeen, '2026-11-01');
  assert.equal(out.find((i) => i.id === 'n').firstSeen, '2026-11-12');
});
