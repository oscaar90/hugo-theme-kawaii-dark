# Pendiente

## 1. Paginación rota — caracteres apilados verticalmente

En todas las páginas que tienen paginación, los controles se muestran
con cada carácter en una línea distinta en lugar de en línea horizontal:

```
««
«
1
2
»
»»
```

Afecta a: `/blog`, `/tags/<term>` y cualquier sección con más entradas
que el `pageSize` configurado.

Causa probable: el template interno `_internal/pagination.html` de Hugo
genera HTML que no hereda los estilos de Tailwind. Hay que reemplazarlo
por un partial propio con las clases correctas.

---

## 2. Links externos — abrir en ventana nueva

Cualquier enlace que apunte fuera del dominio del blog debe abrirse en
una pestaña nueva (`target="_blank" rel="noopener noreferrer"`).

Afecta a: contenido Markdown de los posts (links en prosa) y cualquier
link en partials (footer, header).

Solución: render hook de Hugo para links.
Crear `layouts/_default/_markup/render-link.html` con lógica que detecte
si el href es externo y añada los atributos correspondientes.

---

## 3. Imágenes de posts — lightbox al hacer click

Las imágenes dentro de los posts deben poder ampliarse al hacer click,
mostrándose en tamaño real o mayor sobre un fondo oscuro (lightbox).

Afecta a: imágenes en Markdown (`![alt](url)`) y shortcode `{{< figure >}}`.

Opciones a valorar:
- Implementación propia con CSS + JS mínimo (sin dependencias)
- Librería ligera tipo [GLightbox](https://biati-digital.github.io/glightbox/)
  o [PhotoSwipe](https://photoswipe.com/)

Solución: render hook para imágenes en
`layouts/_default/_markup/render-image.html` que envuelva cada imagen
en un `<a>` con el href a la imagen original, más el JS del lightbox
cargado una sola vez en `baseof.html`.
