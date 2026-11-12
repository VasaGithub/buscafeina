import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_KEYWORDS, customKeyword, matchesKeywords, visibleItems, newCounts, daysLeft, isNew, stemOf } from '../public/lib.js';
import { T } from '../public/i18n.js';

const kws = DEFAULT_KEYWORDS.map((k) => ({ ...k, on: true }));
const today = '2026-11-12';
const it = (o) => ({ firstSeen: today, zones: [], org: '', deadline: null, date: today, ...o });

test('palabras clave: castellano, catalán y sin acentos', () => {
  assert.ok(matchesKeywords(it({ title: 'Auxiliar Administrativo/a' }), kws));
  assert.ok(matchesKeywords(it({ title: "Administratiu/iva d'oficina" }), kws));
  assert.ok(matchesKeywords(it({ title: 'Técnico de nóminas' }), kws));
  assert.ok(matchesKeywords(it({ title: 'Comptable' }), kws));
  assert.ok(!matchesKeywords(it({ title: 'Peón de jardinería' }), kws));
  assert.ok(matchesKeywords(it({ title: 'Peón de jardinería' }), []), 'sin palabras = todo');
  assert.ok(matchesKeywords(it({ title: 'Cocinero de sala' }), [...kws, { ...customKeyword('cocinero'), on: true }]));
  assert.equal(stemOf('contables'), 'contabl');
});

test('oposiciones ordenadas por fecha límite, caducadas fuera, zona anidada', () => {
  const all = [
    it({ id: '1', type: 'oposicion', title: 'Administrativo B', deadline: '2026-12-01', zones: ['barcelona'] }),
    it({ id: '2', type: 'oposicion', title: 'Administrativo A', deadline: '2026-11-15', zones: ['igualada', 'anoia', 'barcelona'] }),
    it({ id: '3', type: 'oposicion', title: 'Administrativo C', deadline: '2026-11-01', zones: ['barcelona'] }),
    it({ id: '4', type: 'oposicion', title: 'Administrativo sin plazo' }),
  ];
  const f = { zone: 'todas', keywords: kws, useKeywords: true };
  assert.deepEqual(visibleItems(all, 'oposicion', f, today).map((i) => i.id), ['2', '1', '4']);
  assert.deepEqual(visibleItems(all, 'oposicion', { ...f, zone: 'igualada' }, today).map((i) => i.id), ['2']);
  assert.deepEqual(visibleItems(all, 'oposicion', { ...f, zone: 'barcelona' }, today).map((i) => i.id), ['2', '1']);
});

test('días que quedan, "Nuevo" y resumen', () => {
  assert.equal(daysLeft('2026-11-15', today), 3);
  assert.equal(daysLeft(null, today), null);
  const a = it({ id: 'a', type: 'oferta', title: 'Contable' });
  const b = it({ id: 'b', type: 'curso', title: 'Administrativa', firstSeen: '2026-11-01' });
  assert.ok(isNew(a, {}, today));
  assert.ok(!isNew(a, { a: today }, today), 'al abrirla deja de ser nueva');
  assert.ok(!isNew(b, {}, today), 'más de 2 días ya no es nueva');
  const counts = newCounts([a, b], { zone: 'todas', keywords: kws, useKeywords: true }, {}, today);
  assert.deepEqual(counts, { oferta: 1, oposicion: 0, curso: 0 });
  assert.equal(T.es.summary({ oferta: 5, oposicion: 1, curso: 2 }), 'Hoy hay 5 ofertas nuevas, 1 oposición y 2 cursos');
  assert.equal(T.es.summary({ oferta: 0, oposicion: 0, curso: 0 }), 'Hoy no hay novedades. Mañana volvemos a mirar.');
  assert.equal(T.ca.summary({ oferta: 1, oposicion: 0, curso: 0 }), 'Avui hi ha 1 oferta nova');
});
