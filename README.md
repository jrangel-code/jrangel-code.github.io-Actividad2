# Vértice | Portal de Servicios Tecnológicos

Portal corporativo de una empresa **ficticia** de servicios de TI, construido con HTML5 semántico, CSS3 (Grid, Flexbox y Custom Properties), Bootstrap 5.3 y JavaScript nativo.

## Desarrollo

Nombre: Jonathan Rangel
Cedula: 24214520

## Estructura

```
portal-ti/
├── index.html              # Marcado semántico, metadatos OpenGraph y ARIA
├── css/styles.css          # Tokens de diseño, layout Grid/Flexbox, estilos propios
├── js/main.js              # Menú, validación del formulario (API nativa + Bootstrap)
├── js/canvas.js            # Gráfico de latencia en <canvas> a 60 FPS
├── vendor/                 # Bootstrap 5.3.9 (CSS y bundle JS, sin jQuery)
├── media/                  # Video (WebM + MP4), póster y subtítulos WebVTT
└── img/                    # Favicon SVG e imagen OpenGraph
```

## Ver el sitio en local

```bash
python -m http.server 8000
# luego abrir http://localhost:8000
```

## Resultados de Lighthouse (local)

| Categoría | Móvil | Escritorio |
|---|---|---|
| Rendimiento | 93 | 100 |
| Accesibilidad | 100 | 100 |
| Buenas prácticas | 96 | 96 |
| SEO | 100 | 100 |
