// Descarga las fuentes, normaliza y guarda JSON en public/data/. Uso: node scripts/fetch-data.mjs
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchBoe } from './sources/boe.mjs';
import { fetchGeneralitat } from './sources/generalitat.mjs';
import { fetchCursos } from './sources/soc-cursos.mjs';
import { fetchInfojobs, infojobsEnabled } from './sources/infojobs.mjs';
import { mergeItems } from './merge.mjs';
import { isoDay } from './util.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = join(root, 'public', 'data');
const today = isoDay(Date.now());

async function readJson(file, fallback) {
  try { return JSON.parse(await readFile(join(dataDir, file), 'utf8')); } catch { return fallback; }
}

const sources = [
  { id: 'boe', run: fetchBoe },
  { id: 'generalitat', run: () => fetchGeneralitat(today) },
  { id: 'soc', run: () => fetchCursos(today) },
];
if (infojobsEnabled()) sources.push({ id: 'infojobs', run: () => fetchInfojobs() });

await mkdir(dataDir, { recursive: true });
const previous = (await readJson('items.json', { items: [] })).items;

const report = [];
const fresh = [];
const ok = new Set();
for (const s of sources) {
  try {
    const items = await s.run();
    fresh.push(...items);
    ok.add(s.id);
    report.push({ id: s.id, ok: true, count: items.length });
    console.log(`OK  ${s.id}: ${items.length}`);
  } catch (e) {
    report.push({ id: s.id, ok: false, error: String(e.message || e) });
    console.error(`ERR ${s.id}: ${e.message}`);
  }
}

if (ok.size === 0) {
  console.error('Ninguna fuente respondió; no se toca nada.');
  process.exit(1);
}

const items = mergeItems(previous, fresh, ok, today);
await writeFile(
  join(dataDir, 'items.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), today, sources: report, items }),
);
const counts = items.reduce((a, i) => ((a[i.type] = (a[i.type] || 0) + 1), a), {});
console.log('Total guardado:', counts);
