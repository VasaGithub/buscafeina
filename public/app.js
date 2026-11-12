import { T, LINKS } from './i18n.js';
import { DEFAULT_KEYWORDS, customKeyword, visibleItems, newCounts, isNew, daysLeft } from './lib.js';

const PAGE = 40;
const TYPES = ['oferta', 'oposicion', 'curso'];
const ICONS = { oferta: '💼', oposicion: '🏛️', curso: '🎓' };

// ---------- almacenamiento local (en el propio móvil) ----------
const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem('bf:' + key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  },
  set(key, value) { try { localStorage.setItem('bf:' + key, JSON.stringify(value)); } catch { /* sin almacenamiento */ } },
};

const state = {
  data: { items: [], today: new Date().toISOString().slice(0, 10), generatedAt: null },
  view: store.get('view', 'oferta'),
  lang: store.get('lang', (navigator.language || 'es').startsWith('ca') ? 'ca' : 'es'),
  zone: store.get('zone', 'todas'),
  useKeywords: store.get('useKw', true),
  keywords: store.get('kw', DEFAULT_KEYWORDS.map((k) => ({ ...k, on: true }))),
  seen: store.get('seen', {}),
  favs: store.get('favs', {}),
  filtersOpen: false,
  shown: PAGE,
  error: false,
  offline: false,
};

const $ = (s) => document.querySelector(s);
const t = () => T[state.lang];
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const today = () => state.data.today;
const filters = () => ({ zone: state.zone, keywords: state.keywords, useKeywords: state.useKeywords });
const fmtDate = (iso) => (iso ? new Intl.DateTimeFormat(state.lang === 'ca' ? 'ca-ES' : 'es-ES', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso)) : '');

// ---------- datos ----------
async function load() {
  try {
    const res = await fetch('data/items.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(res.status);
    state.data = await res.json();
    state.error = false;
  } catch {
    state.error = true;
  }
  render();
}

// ---------- tarjetas ----------
function cardHtml(it) {
  const tr = t();
  const isFav = Boolean(state.favs[it.id]);
  const nuevo = isNew(it, state.seen, today());
  let when = '';
  if (it.type === 'oposicion') {
    const n = daysLeft(it.deadline, today());
    when = it.deadline
      ? `<p class="deadline ${n <= 3 ? 'soon' : ''}">${tr.deadline}: ${fmtDate(it.deadline)} · ${tr.daysLeft(n)}</p>`
      : `<p class="deadline">${tr.noDeadline}</p><p class="meta">${tr.published}: ${fmtDate(it.date)}</p>`;
  } else if (it.type === 'curso') {
    when = `<p class="meta">${tr.starts}: ${fmtDate(it.date)}${it.hours ? ' · ' + tr.hours(it.hours) : ''}</p>${it.open ? `<span class="tag-open">✔ ${tr.enrolling}</span>` : ''}`;
  } else {
    when = `<p class="meta">${tr.published}: ${fmtDate(it.date)}</p>`;
  }
  return `<article class="card" data-id="${esc(it.id)}">
    <div class="card-head">
      <div>${nuevo ? `<span class="tag-new">${tr.newTag}</span>` : ''}
        <h3>${esc(it.title)}</h3></div>
      <button class="heart" type="button" data-fav="${esc(it.id)}" aria-pressed="${isFav}" aria-label="${isFav ? tr.unfav : tr.fav}">${isFav ? '♥' : '♡'}</button>
    </div>
    <p class="org">${esc(it.org)}</p>
    ${it.place ? `<p class="meta">📍 ${esc(it.place)}</p>` : ''}
    ${when}
    <a class="btn btn-primary" href="${esc(it.url)}" target="_blank" rel="noopener" data-open="${esc(it.id)}">${tr.openOriginal} ↗</a>
  </article>`;
}

function filtersHtml() {
  const tr = t();
  const zones = ['todas', 'igualada', 'anoia', 'barcelona', 'teletrabajo'];
  return `<section class="panel" id="filters" aria-label="${tr.filters}">
    <h2>${tr.zone}</h2>
    <div class="chips">${zones.map((z) => `<button class="chip" type="button" data-zone="${z}" aria-pressed="${state.zone === z}">${tr.zones[z]}</button>`).join('')}</div>
    <h2>${tr.keywords}</h2>
    <label class="switch"><input type="checkbox" id="useKw" ${state.useKeywords ? 'checked' : ''}> ${tr.useKw}</label>
    <div class="chips">${state.keywords.map((k, i) => `<button class="chip" type="button" data-kw="${i}" aria-pressed="${k.on !== false}">${esc(k.label)}${k.custom ? ' <span class="x" data-del="' + i + '" aria-label="✕">✕</span>' : ''}</button>`).join('')}</div>
    <form class="row" id="kwForm"><input type="text" id="kwInput" placeholder="${tr.addPlaceholder}" aria-label="${tr.addKw}" autocomplete="off"><button class="btn btn-primary" style="width:auto" type="submit">${tr.add}</button></form>
    <h2>${tr.language}</h2>
    <div class="chips"><button class="chip" type="button" data-lang="es" aria-pressed="${state.lang === 'es'}">Castellano</button><button class="chip" type="button" data-lang="ca" aria-pressed="${state.lang === 'ca'}">Català</button></div>
    <div class="row"><button class="btn btn-link" type="button" id="resetFilters">${tr.reset}</button></div>
  </section>`;
}

function linksHtml(type) {
  const tr = t();
  return `<h2 class="section-title">${tr.moreSites}</h2><div class="links">${LINKS[type]
    .map((l) => `<a class="btn btn-link" href="${esc(l.url)}" target="_blank" rel="noopener">🔗 ${esc(l[state.lang])}</a>`).join('')}</div>`;
}

function render() {
  const tr = t();
  document.documentElement.lang = state.lang;
  $('#appName').textContent = tr.appName;
  const savedBtn = $('#btnSaved');
  const favCount = Object.keys(state.favs).length;
  savedBtn.textContent = `♥ ${tr.saved}${favCount ? ' (' + favCount + ')' : ''}`;
  $('#btnFilters').textContent = `⚙ ${tr.filters}`;
  $('#btnFilters').setAttribute('aria-expanded', String(state.filtersOpen));

  const counts = newCounts(state.data.items, filters(), state.seen, today());
  $('#tabs').innerHTML = TYPES.map((ty) => `<button class="tab" type="button" data-tab="${ty}" ${state.view === ty ? 'aria-current="page"' : ''}>
      <span class="ico" aria-hidden="true">${ICONS[ty]}</span>${tr.tabs[ty]}${counts[ty] ? `<span class="badge" aria-label="${counts[ty]} ${tr.newTag}">${counts[ty]}</span>` : ''}</button>`).join('');

  let html = '';
  if (state.error && !state.data.items.length) {
    html += `<div class="notice">${tr.loadError} <button class="btn btn-link" id="retry" type="button">${tr.retry}</button></div>`;
  }
  if (state.filtersOpen) html += filtersHtml();

  if (state.view === 'saved') {
    const saved = Object.values(state.favs);
    html += `<h2 class="section-title">♥ ${tr.saved}</h2>`;
    html += saved.length ? saved.map(cardHtml).join('') : `<p class="empty">${tr.emptySaved}</p>`;
  } else {
    html += `<div class="summary" role="status">${tr.summary(counts)}</div>`;
    if (state.data.generatedAt) html += `<p class="updated">${tr.updated(fmtDate(state.data.generatedAt.slice(0, 10)))}</p>`;
    const list = visibleItems(state.data.items, state.view, filters(), today());
    if (!list.length) {
      html += state.view === 'oferta' && !state.data.items.some((i) => i.type === 'oferta')
        ? `<p class="empty">${tr.emptyOfertas}</p>`
        : `<p class="empty">${tr.empty}<br>${tr.emptyHint}</p>`;
    } else {
      html += list.slice(0, state.shown).map(cardHtml).join('');
      if (list.length > state.shown) html += `<button class="btn btn-link" type="button" id="more">${tr.more} (${list.length - state.shown})</button>`;
    }
    html += linksHtml(state.view);
  }
  $('#main').innerHTML = html;
}

// ---------- acciones ----------
function markSeen(id) {
  if (state.seen[id]) return;
  state.seen[id] = state.data.today;
  store.set('seen', state.seen);
}

function toggleFav(id) {
  if (state.favs[id]) delete state.favs[id];
  else {
    const it = state.data.items.find((i) => i.id === id);
    if (it) state.favs[id] = it;
  }
  store.set('favs', state.favs);
}

function go(view) {
  state.view = view; state.shown = PAGE;
  if (view !== 'saved') store.set('view', view);
  render();
  window.scrollTo(0, 0);
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-tab],[data-fav],[data-open],[data-zone],[data-kw],[data-lang],#more,#retry,#resetFilters,#btnSaved,#btnFilters,.card');
  if (!el) return;
  if (el.dataset.tab) return go(el.dataset.tab);
  if (el.id === 'btnSaved') return go(state.view === 'saved' ? store.get('view', 'oferta') : 'saved');
  if (el.id === 'btnFilters') { state.filtersOpen = !state.filtersOpen; return render(); }
  if (el.dataset.fav) { toggleFav(el.dataset.fav); return render(); }
  if (el.dataset.open) { markSeen(el.dataset.open); setTimeout(render, 0); return; } // el enlace se abre y la etiqueta desaparece
  if (el.dataset.zone) { state.zone = el.dataset.zone; store.set('zone', state.zone); state.shown = PAGE; return render(); }
  if (el.dataset.kw !== undefined) {
    const del = e.target.closest('[data-del]');
    if (del) state.keywords.splice(+del.dataset.del, 1);
    else state.keywords[+el.dataset.kw].on = state.keywords[+el.dataset.kw].on === false;
    store.set('kw', state.keywords); state.shown = PAGE; return render();
  }
  if (el.dataset.lang) { state.lang = el.dataset.lang; store.set('lang', state.lang); return render(); }
  if (el.id === 'more') { state.shown += PAGE; return render(); }
  if (el.id === 'retry') return load();
  if (el.id === 'resetFilters') {
    state.zone = 'todas'; state.useKeywords = true; state.keywords = DEFAULT_KEYWORDS.map((k) => ({ ...k, on: true }));
    store.set('zone', state.zone); store.set('useKw', true); store.set('kw', state.keywords); return render();
  }
  if (el.classList.contains('card')) { markSeen(el.dataset.id); render(); } // tocar la tarjeta también la marca como vista
});

document.addEventListener('change', (e) => {
  if (e.target.id === 'useKw') { state.useKeywords = e.target.checked; store.set('useKw', state.useKeywords); state.shown = PAGE; render(); }
});

document.addEventListener('submit', (e) => {
  if (e.target.id !== 'kwForm') return;
  e.preventDefault();
  const v = $('#kwInput').value.trim();
  if (v && !state.keywords.some((k) => k.label.toLowerCase() === v.toLowerCase())) {
    state.keywords.push({ ...customKeyword(v), on: true });
    store.set('kw', state.keywords);
  }
  render();
});

window.addEventListener('online', () => { state.offline = false; load(); });

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
load();
