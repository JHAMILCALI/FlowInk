# Formato de proyecto `.flowink`

## Identificación

Todo archivo usa:

```json
{
  "format": "flowink",
  "formatVersion": 1
}
```

`formatVersion` controla migraciones del documento. La versión de la aplicación no sustituye la versión del formato.

## Estructura v1

```text
FlowInkProject
├── format
├── formatVersion
├── metadata
├── theme
├── settings
├── slides[]
└── assets{}
```

Valores predeterminados: 1920 × 1080, relación 16:9 y 30 FPS.

Cada slide contiene una escena Excalidraw, metadatos persistentes de elementos, steps, tracks de animación, keyframes de cámara y transición de salida.

## Identidad

- `element.id`: identidad interna de una instancia Excalidraw.
- `flowinkId`: identidad conceptual compartida entre slides relacionados.
- `sourceId`: identidad de la instancia desde la que nació una duplicación.

## Migraciones

Los datos se validan y migran de forma secuencial (`v1 -> v2 -> ...`). Una versión futura desconocida se rechaza con un error explícito. El documento original no se muta durante la migración.

## Assets

Los assets usan un mapa por identificador estable e incluyen MIME type, nombre, tamaño y datos o referencia local serializable. El MVP acepta SVG, PNG, JPG y WebP.
