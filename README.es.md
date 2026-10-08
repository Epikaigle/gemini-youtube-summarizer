# Resumen de YouTube con Gemini

[English](README.md) · [Français](README.fr.md) · [Español](README.es.md)

Una extensión ligera de Firefox que añade la acción **Resumir** a YouTube.

## Enlaces oficiales

- [Sitio web](https://epikaigle.github.io/gemini-youtube-summarizer/)
- [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/gemini-youtube-summarizer/)
- [Código fuente](https://github.com/Epikaigle/gemini-youtube-summarizer)

## Cómo funciona

Resumir aparece en los menús de tres puntos de las tarjetas de video y junto a las acciones en las páginas de reproducción. Al pulsarlo, la extensión abre Gemini con la URL normalizada del video y tus instrucciones. Rellena el campo de Gemini y envía el mensaje, o lo deja listo para enviar si el envío automático está desactivado.

Desde el icono de la barra de herramientas de Firefox o las preferencias en `about:addons`, puedes:

- Elegir francés, inglés, español o detección automática del idioma del navegador.
- Activar o desactivar el envío automático. Al desactivarlo, puedes elegir el modelo de Gemini o editar el mensaje antes de enviarlo.
- Escribir instrucciones propias o utilizar una plantilla: resumen clásico, cinco ideas clave, esquema detallado, explicación simple o solo enlace.

El botón superior derecho de la ventana emergente abre una página de preferencias más amplia, con un campo de texto mayor y la vista previa completa del mensaje. Pulsa **Guardar** para aplicar todos los ajustes juntos. Un campo vacío mantiene el modo «solo enlace», incluso después de cambiar el idioma.

## Cargar localmente en Firefox

1. Abre `about:debugging#/runtime/this-firefox`.
2. Pulsa **Cargar complemento temporal**.
3. Selecciona `manifest.json`.
4. Recarga YouTube con `Ctrl+Shift+R`.

## Estructura y sitio web

- `manifest.json`: configuración de la extensión (Manifest V3).
- `popup.html`: preferencias rápidas desde la barra de herramientas de Firefox.
- `content.js`: menús de YouTube, extracción de URL, botón de reproducción y acciones traducidas.
- `gemini_auto_submit.js`: inserción de instrucciones y envío automático o manual en Gemini.
- `options.html`, `options.css`, `options.js`: interfaz completa de preferencias.
- `_locales/`: catálogos de traducción de la extensión (`fr`, `en`, `es`).
- `icons/`: iconos de la extensión.
- `docs/`: sitio adaptable de GitHub Pages con demostración visual, vista previa de instrucciones, enlaces de instalación y política de privacidad.

GitHub Pages publica `docs/` desde `main`. La extensión y la documentación de usuario ofrecen francés, inglés y español; el sitio también incluye chino. Las guías técnicas permanecen en francés. Las traducciones de la ficha de AMO se introducen por separado; subir el archivo de la extensión no las actualiza.

## Verificaciones y publicación en Firefox Add-ons

Ejecuta `python3 tests/extension-firefox.py` con Firefox y geckodriver instalados. Las correcciones de la versión 3.8.1 y los límites de las verificaciones se detallan en [EXTENSION_AUDIT.md](EXTENSION_AUDIT.md) (francés).

Genera un archivo limpio:

```sh
npx --yes web-ext lint --source-dir . --ignore-files "*.md" "docs/**" "tests/**" "scripts/**" "artifacts/**" ".github/**" .gitignore
npx --yes web-ext build --source-dir . --overwrite-dest --ignore-files "*.md" "docs/**" "tests/**" "scripts/**" "artifacts/**" ".github/**" .gitignore
```

Sube el archivo de la versión 3.8.1 como una nueva versión del complemento existente en AMO. Consulta la [política de privacidad](PRIVACY_POLICY.es.md), la [ficha y las notas de versión traducidas](AMO_LISTING.md) y las [notas para los revisores](AMO_REVIEW_NOTES.md) (francés).

Para una instalación permanente se necesita la firma de Mozilla. `META-INF/` se genera al firmar; el sitio debe excluirse del archivo de la extensión. Google puede bloquear el inicio de sesión en navegadores automatizados: comprueba el flujo real de Gemini en Firefox normal.

Los controles de GitHub verifican el sitio, las traducciones y el paquete de la extensión. El flujo **Extension checks** también ofrece un archivo sin firmar en el artefacto `unsigned-firefox-extension`.

## Páginas de YouTube cubiertas

Inicio, Suscripciones, páginas de reproducción (incluidas las listas), páginas de canales y pestañas Videos y Directos. Los cambios en las interfaces de YouTube y Gemini pueden requerir ajustes en la extensión.

## Licencia

Este proyecto utiliza **The Unlicense**. Consulta `LICENSE`.
