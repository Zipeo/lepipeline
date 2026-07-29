# Le Pipeline v1 — Guía de despliegue (10 minutos de tu parte)

## Qué contiene esta carpeta
- `index.html` — el home completo (partículas, scrollytelling, calculadora, día/noche)
- `articles/965-milliards.html` — el primer artículo publicado (estilo fusionado)
- `a-propos.html` — bio + método + contacto (con schema.org Person para GEO)
- `robots.txt` y `sitemap.xml` — listos para lepipeline.ca

## Pasos (los únicos que requieren TUS cuentas)

### Opción A — GitHub + Vercel (recomendada: cada cambio futuro se publica solo)
1. Crea un repositorio en github.com (privado o público), llamado por ej. `lepipeline`.
2. Sube el CONTENIDO de esta carpeta (no la carpeta) al repo — se puede arrastrar en github.com → "uploading an existing file".
3. En vercel.com → Add New → Project → Import el repo `lepipeline`. Framework preset: "Other". Deploy.
4. En el proyecto Vercel → Settings → Domains → Add `lepipeline.ca` (y `www.lepipeline.ca`).
5. Vercel te muestra 1-2 registros DNS (un A record 76.76.21.21 y/o un CNAME). Cópialos en el panel DNS del registrar donde compraste el dominio. Propaga en minutos-horas.

### Opción B — Vercel CLI (sin GitHub)
1. En tu computador: instala Node, luego `npm i -g vercel`.
2. Desde dentro de esta carpeta: `vercel --prod` (te abre el login en el navegador la primera vez).
3. Mismo paso de Domains que arriba.

## Verificación post-lanzamiento (5 min)
- Abrir lepipeline.ca en el teléfono y en desktop; probar modo día/noche y el scrollytelling.
- Google Search Console → añadir propiedad lepipeline.ca → enviar sitemap.xml.
- Probar el link del artículo: lepipeline.ca/articles/965-milliards.html

## Cuándo migrar a Sanity
Cuando haya 6-8 piezas publicadas y editar HTML se vuelva fricción. La migración a Next.js + Sanity conserva diseño y URLs (Claude puede generar el proyecto completo ese día).

## Recordatorios de reglas del proyecto
- lepipeline.ca entra al CV y a LinkedIn cuando haya 2-3 artículos publicados (regla 12).
- El post de LinkedIn de lanzamiento ya está redactado (derivado "965 milliards", estilo fusionado) — link en el primer comentario.
