# Mi búsqueda de trabajo

Una app para el iPhone que reúne en un solo sitio **ofertas, oposiciones y cursos gratuitos**. Es gratis, no pide registro ni contraseñas, y se actualiza sola cada día.

- Tres pestañas grandes abajo: **Ofertas**, **Oposiciones**, **Cursos**.
- Etiqueta **Nuevo** en las novedades (desaparece al abrirlas) y resumen arriba: «Hoy hay 5 ofertas nuevas, 1 oposición y 2 cursos».
- Oposiciones ordenadas por **fecha límite**, con los días que quedan.
- Corazón ♡ para guardar y pantalla **Guardados**.
- Filtros por zona (Igualada, Anoia, Barcelona, teletrabajo) y palabras clave (administrativo, contable, compras, facturación, proveedores, nóminas; se pueden añadir más).
- Castellano y catalán (botón en Filtros).
- Lo que guarda cada persona (favoritos, «ya visto», filtros) se queda **solo en su móvil**.

---

## Parte 1. Publicarla gratis (una sola vez, unos 15 minutos)

Necesitas una cuenta gratuita en GitHub. No hace falta instalar nada en el ordenador.

1. Entra en <https://github.com> y pulsa **Sign up** para crear tu cuenta (correo y contraseña).
2. Arriba a la derecha pulsa **+** y luego **New repository**.
   - En *Repository name* escribe `buscafeina`.
   - Marca **Public** (es necesario para el alojamiento gratuito).
   - Pulsa **Create repository**.
3. En la página nueva pulsa el enlace **uploading an existing file**.
4. Arrastra **todo el contenido de esta carpeta** (las carpetas `public`, `scripts`, `tests`, `.github` y los archivos `package.json` y `README.md`). Importante: la carpeta `.github` empieza por un punto; si tu ordenador la oculta, actívala en «Mostrar archivos ocultos».
5. Abajo pulsa **Commit changes**.
6. Activa la publicación: **Settings** → **Pages** (menú de la izquierda) → en *Source* elige **GitHub Actions**.
7. Lanza la primera actualización: pestaña **Actions** → **Actualizar datos y publicar** → **Run workflow** → **Run workflow**. Tarda 1–2 minutos; cuando salga una marca verde ✔, ya está.
8. Tu dirección será: `https://TU-USUARIO.github.io/buscafeina/`. Ábrela en el móvil para comprobarlo.

A partir de ahora el sistema se ejecuta solo **cada día** y actualiza los datos. Si un día falla una web de origen, la app conserva los datos anteriores.

> Si el paso 7 da error rojo en «Guardar datos en el repositorio»: en **Settings → Actions → General → Workflow permissions** elige **Read and write permissions** y repítelo.

## Parte 2. Añadirla a la pantalla de inicio del iPhone

Hay que hacerlo con **Safari** (no vale desde otras apps).

1. Abre Safari y entra en la dirección de tu app.
2. Toca el botón **Compartir** (el cuadrado con una flecha hacia arriba, abajo en el centro).
3. Desliza hacia arriba y toca **Añadir a pantalla de inicio**.
4. Deja el nombre «Trabajo» (o cámbialo) y toca **Añadir**.

Ya aparece un icono azul con un maletín. Al tocarlo se abre a pantalla completa, como una app normal, y también muestra lo último descargado si no hay internet.

## Parte 3. Opcional: ofertas de InfoJobs

Sin esto, la pestaña **Ofertas** muestra botones directos a Feina Activa, InfoJobs, SEPE, etc. (ver «Pendientes»). Si InfoJobs te da claves y sus condiciones permiten este uso:

1. Regístrate en <https://developer.infojobs.net/> y crea una aplicación para obtener *Client ID* y *Client Secret*. **Lee sus condiciones de uso.**
2. En GitHub: **Settings → Secrets and variables → Actions → New repository secret**. Crea `INFOJOBS_CLIENT_ID` y `INFOJOBS_CLIENT_SECRET`.
3. Vuelve a lanzar «Actualizar datos y publicar».

> Esta parte está escrita según la documentación pública y **no se ha podido probar con la API real**. Si algo falla, el resto de la app sigue funcionando.

## De dónde salen los datos

| Pestaña | Fuente | Cómo |
|---|---|---|
| Oposiciones | BOE, sección II.B | RSS oficial |
| Oposiciones | Ofertas de la Generalitat (con fecha límite) | Datos abiertos |
| Cursos | Cursos de formación del SOC | Fichero de datos abiertos |
| Ofertas | InfoJobs (opcional) | API oficial con clave |
| Todas | Feina Activa, SEPE, Fundae, DOGC, CIDO, Igualada, Anoia | Solo enlaces |

No se hace scraping de ninguna web.

## Para quien toque el código

```bash
npm run iconos   # regenera los iconos
npm run datos    # descarga las fuentes y crea public/data/items.json
npm test         # pruebas (9)
npm run servir   # http://localhost:8080 (cambia el puerto con PORT=8765)
```

Solo hace falta Node 20 o superior; no hay dependencias. La app es HTML, CSS y JavaScript sin compilar (carpeta `public`), así que no hay que construir nada.

Estructura: `scripts/sources/*` (una fuente por archivo), `scripts/merge.mjs` (novedades y caducados), `public/lib.js` (filtros y orden), `public/app.js` (pantalla), `public/sw.js` (funcionamiento sin conexión).

## Pendientes y limitaciones

- **Ofertas privadas**: sin claves de InfoJobs no hay ofertas automáticas. Feina Activa, SEPE, Consell Comarcal de l'Anoia e Igualada no tienen API que haya encontrado; van como botones.
- **Fecha límite del BOE**: el feed no la da como dato. Esas tarjetas dicen «consúltalo en la convocatoria» y salen después de las que sí tienen fecha. Las de la Generalitat sí traen fecha límite.
- **Zona «Igualada/Anoia»**: se deduce del texto del título y, en la Generalitat, de «Comarques Centrals» (aproximado, incluye otras comarcas). La Generalitat no indica el municipio.
- **Cursos**: muchos centros solo dan un correo; en ese caso el botón lleva a la web general del SOC, no a la ficha del curso. Los cursos del SOC salen en catalán, tal cual vienen de origen. Los nuevos en la Anoia son pocos o ninguno en este momento.
- **«Nuevo»**: se marca lo visto por primera vez en los últimos 2 días; la primera vez que se instala, casi todo aparece como nuevo.
- **Comprobar condiciones**: no he leído las condiciones de reutilización del BOE ni las de la Generalitat; se citan como fuente oficial y la app enlaza siempre al original.
- **Notificaciones**: no incluidas en esta primera versión (ver abajo).
- **No probado en un iPhone real**: probado en un navegador a 390×844 y con las pruebas automáticas. Hay que comprobar el icono y «Añadir a pantalla de inicio» en el iPhone.

## Notificación diaria (siguiente paso, no incluida)

La opción más sencilla y gratuita es **ntfy.sh**: la app gratuita *ntfy* del App Store recibe avisos sin cuentas. Habría que añadir un paso al final del proceso diario que envíe un mensaje tipo «Hoy hay 3 oposiciones nuevas» a un tema con nombre secreto. Para activarlo en el iPhone: instalar *ntfy*, tocar **+**, escribir el nombre del tema y permitir las notificaciones. Si quieres, lo añado.
