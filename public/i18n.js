export const T = {
  es: {
    appName: 'Mi búsqueda de trabajo',
    tabs: { oferta: 'Ofertas', oposicion: 'Oposiciones', curso: 'Cursos' },
    saved: 'Guardados', filters: 'Filtros', back: 'Volver',
    openOriginal: 'Ver en la web original',
    newTag: 'Nuevo',
    summary: (c) => {
      const p = [];
      if (c.oferta) p.push(`${c.oferta} ${c.oferta === 1 ? 'oferta nueva' : 'ofertas nuevas'}`);
      if (c.oposicion) p.push(`${c.oposicion} ${c.oposicion === 1 ? 'oposición' : 'oposiciones'}`);
      if (c.curso) p.push(`${c.curso} ${c.curso === 1 ? 'curso' : 'cursos'}`);
      if (!p.length) return 'Hoy no hay novedades. Mañana volvemos a mirar.';
      const last = p.pop();
      return `Hoy hay ${p.length ? p.join(', ') + ' y ' + last : last}`;
    },
    updated: (d) => `Datos actualizados: ${d}`,
    deadline: 'Fecha límite', daysLeft: (n) => (n === 0 ? '¡Último día: hoy!' : n === 1 ? 'Queda 1 día' : `Quedan ${n} días`),
    noDeadline: 'Plazo: consúltalo en la convocatoria',
    published: 'Publicado', starts: 'Empieza', hours: (h) => `${h} horas`, enrolling: 'Inscripción abierta',
    zone: 'Zona', zones: { todas: 'Todas', igualada: 'Igualada', anoia: 'Anoia', barcelona: 'Barcelona', teletrabajo: 'Teletrabajo' },
    keywords: 'Palabras clave', useKw: 'Buscar solo estas palabras', addKw: 'Añadir palabra', addPlaceholder: 'Escribe una palabra',
    add: 'Añadir', reset: 'Volver a lo de siempre', language: 'Idioma',
    empty: 'No hay nada con estos filtros.', emptyHint: 'Prueba a quitar «Buscar solo estas palabras» en Filtros.',
    emptySaved: 'Aún no has guardado nada. Toca el corazón ♡ de una tarjeta.',
    emptyOfertas: 'Todavía no hay ofertas automáticas. Usa estos botones para ver las ofertas en cada web.',
    moreSites: 'Otras webs útiles', more: 'Ver más', fav: 'Guardar', unfav: 'Quitar de guardados',
    loadError: 'No se pudieron cargar los datos. Comprueba la conexión.', retry: 'Reintentar', offline: 'Sin conexión: se muestran los últimos datos guardados.',
  },
  ca: {
    appName: 'La meva cerca de feina',
    tabs: { oferta: 'Ofertes', oposicion: 'Oposicions', curso: 'Cursos' },
    saved: 'Desats', filters: 'Filtres', back: 'Tornar',
    openOriginal: 'Veure a la web original',
    newTag: 'Nou',
    summary: (c) => {
      const p = [];
      if (c.oferta) p.push(`${c.oferta} ${c.oferta === 1 ? 'oferta nova' : 'ofertes noves'}`);
      if (c.oposicion) p.push(`${c.oposicion} ${c.oposicion === 1 ? 'oposició' : 'oposicions'}`);
      if (c.curso) p.push(`${c.curso} ${c.curso === 1 ? 'curs' : 'cursos'}`);
      if (!p.length) return 'Avui no hi ha novetats. Demà tornem a mirar.';
      const last = p.pop();
      return `Avui hi ha ${p.length ? p.join(', ') + ' i ' + last : last}`;
    },
    updated: (d) => `Dades actualitzades: ${d}`,
    deadline: 'Data límit', daysLeft: (n) => (n === 0 ? 'Últim dia: avui!' : n === 1 ? 'Queda 1 dia' : `Queden ${n} dies`),
    noDeadline: 'Termini: consulta la convocatòria',
    published: 'Publicat', starts: 'Comença', hours: (h) => `${h} hores`, enrolling: 'Inscripció oberta',
    zone: 'Zona', zones: { todas: 'Totes', igualada: 'Igualada', anoia: 'Anoia', barcelona: 'Barcelona', teletrabajo: 'Teletreball' },
    keywords: 'Paraules clau', useKw: 'Cerca només aquestes paraules', addKw: 'Afegir paraula', addPlaceholder: 'Escriu una paraula',
    add: 'Afegir', reset: 'Tornar al de sempre', language: 'Idioma',
    empty: 'No hi ha res amb aquests filtres.', emptyHint: 'Prova de treure «Cerca només aquestes paraules» a Filtres.',
    emptySaved: 'Encara no has desat res. Toca el cor ♡ d\'una targeta.',
    emptyOfertas: 'Encara no hi ha ofertes automàtiques. Fes servir aquests botons per veure les ofertes a cada web.',
    moreSites: 'Altres webs útils', more: 'Veure\'n més', fav: 'Desar', unfav: 'Treure de desats',
    loadError: 'No s\'han pogut carregar les dades. Comprova la connexió.', retry: 'Tornar a provar', offline: 'Sense connexió: es mostren les últimes dades desades.',
  },
};

export const LINKS = {
  oferta: [
    { es: 'Feina Activa (Generalitat)', ca: 'Feina Activa (Generalitat)', url: 'https://feinaactiva.gencat.cat/' },
    { es: 'InfoJobs', ca: 'InfoJobs', url: 'https://www.infojobs.net/' },
    { es: 'SEPE – Servicio de Empleo', ca: 'SEPE – Servei d\'Ocupació', url: 'https://www.sepe.es/' },
    { es: 'Consell Comarcal de l\'Anoia', ca: 'Consell Comarcal de l\'Anoia', url: 'https://www.anoia.cat/' },
    { es: 'Ajuntament d\'Igualada', ca: 'Ajuntament d\'Igualada', url: 'https://www.igualada.cat/' },
  ],
  oposicion: [
    { es: 'BOE: oposiciones de hoy', ca: 'BOE: oposicions d\'avui', url: 'https://www.boe.es/diario_boe/' },
    { es: 'DOGC (Generalitat)', ca: 'DOGC (Generalitat)', url: 'https://dogc.gencat.cat/ca/' },
    { es: 'Diputació de Barcelona (CIDO)', ca: 'Diputació de Barcelona (CIDO)', url: 'https://cido.diba.cat/oposicions' },
    { es: 'Ajuntament d\'Igualada', ca: 'Ajuntament d\'Igualada', url: 'https://www.igualada.cat/' },
    { es: 'Consell Comarcal de l\'Anoia', ca: 'Consell Comarcal de l\'Anoia', url: 'https://www.anoia.cat/' },
  ],
  curso: [
    { es: 'Cursos del SOC', ca: 'Cursos del SOC', url: 'https://serveiocupacio.gencat.cat/ca/inici/' },
    { es: 'Fundae', ca: 'Fundae', url: 'https://www.fundae.es/' },
    { es: 'SEPE – Formación', ca: 'SEPE – Formació', url: 'https://www.sepe.es/' },
  ],
};
