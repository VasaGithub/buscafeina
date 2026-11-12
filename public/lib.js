// Lógica pura de la app (sin DOM), para poder probarla con node --test.

export const plain = (s = '') => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Palabras clave iniciales. Cada una busca varias formas (castellano y catalán). */
export const DEFAULT_KEYWORDS = [
  { label: 'administrativo', terms: ['administrativ', 'administratiu'] },
  { label: 'contable', terms: ['contab', 'comptab'] },
  { label: 'compras', terms: ['compra', 'compres', 'comprador'] },
  { label: 'facturación', terms: ['factura'] },
  { label: 'proveedores', terms: ['proveedor', 'proveidor'] },
  { label: 'nóminas', terms: ['nomina'] },
];

/** Raíz sencilla para palabras que escriba ella: "contables" -> "contabl". */
export function stemOf(word) {
  const w = plain(word).trim();
  const stripped = w.replace(/(ciones|cion|es|as|os|a|o|e|s)$/, '');
  return stripped.length >= 4 ? stripped : w;
}

export function customKeyword(label) {
  const clean = label.trim();
  return { label: clean, terms: [stemOf(clean)], custom: true };
}

export function matchesKeywords(item, keywords) {
  const active = keywords.filter((k) => k.on !== false);
  if (!active.length) return true;
  const hay = plain(`${item.title} ${item.org} ${item.category || ''}`);
  return active.some((k) => k.terms.some((t) => t && hay.includes(t)));
}

export function matchesZone(item, zone) {
  return !zone || zone === 'todas' || (item.zones || []).includes(zone);
}

export function daysLeft(deadline, today) {
  if (!deadline) return null;
  return Math.round((Date.parse(deadline) - Date.parse(today)) / 86400000);
}

export function isNew(item, seen, today) {
  if (seen[item.id]) return false;
  const age = Math.round((Date.parse(today) - Date.parse(item.firstSeen || today)) / 86400000);
  return age <= 2;
}

const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

export function sortItems(type, items) {
  const list = [...items];
  if (type === 'oposicion') {
    // Por fecha límite (las que no tienen fecha, al final y más recientes primero)
    return list.sort((a, b) => {
      if (a.deadline && b.deadline) return cmp(a.deadline, b.deadline);
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return cmp(b.date || '', a.date || '');
    });
  }
  if (type === 'curso') return list.sort((a, b) => cmp(a.date || '9999', b.date || '9999'));
  return list.sort((a, b) => cmp(b.date || '', a.date || ''));
}

export function visibleItems(all, type, { zone, keywords, useKeywords }, today) {
  const filtered = all.filter(
    (i) =>
      i.type === type &&
      (!i.deadline || i.deadline >= today) &&
      matchesZone(i, zone) &&
      (!useKeywords || matchesKeywords(i, keywords)),
  );
  return sortItems(type, filtered);
}

export function newCounts(all, filters, seen, today) {
  const counts = {};
  for (const type of ['oferta', 'oposicion', 'curso']) {
    counts[type] = visibleItems(all, type, filters, today).filter((i) => isNew(i, seen, today)).length;
  }
  return counts;
}
