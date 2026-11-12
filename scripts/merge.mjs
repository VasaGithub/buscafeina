// Combina los datos nuevos con los anteriores: conserva "primera vez visto" y descarta lo caducado.
import { isoDay } from './util.mjs';

const DAY = 86400000;
const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / DAY);

export function mergeItems(previous, fresh, okSources, today = isoDay(Date.now())) {
  const prevById = new Map(previous.map((i) => [i.id, i]));
  const merged = new Map();

  for (const it of fresh) {
    const old = prevById.get(it.id);
    merged.set(it.id, { ...it, firstSeen: old?.firstSeen || today });
  }
  // Si una fuente falló hoy, conservamos lo que teníamos de ella.
  for (const old of previous) {
    if (!okSources.has(old.source) && !merged.has(old.id)) merged.set(old.id, old);
  }
  return [...merged.values()].filter((i) => {
    if (i.deadline) return i.deadline >= today; // con plazo: hasta que termine
    if (i.type === 'curso') return !i.date || daysBetween(i.date, today) <= 120;
    return daysBetween(i.firstSeen || i.date || today, today) <= 30; // sin plazo: 30 días
  });
}
