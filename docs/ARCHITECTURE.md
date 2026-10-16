# Arquitectura de FlowInk

## Objetivo

FlowInk es una aplicación local-first para crear diagramas y presentaciones técnicas animadas. Excalidraw se mantiene como motor de dibujo; la experiencia de producto vive fuera de `excalidraw-app`.

## Capas

```text
flowink-app
  UI, composición del editor, stores y persistencia
        |
        +-- flowink-project-schema
        +-- flowink-animation-core
        +-- flowink-presentation-core
        +-- flowink-player-runtime
        +-- flowink-export-runtime
        +-- flowink-ui
        |
        +-- @excalidraw/excalidraw (upstream local)
```

### Reglas de dependencias

- Los paquetes de dominio `flowink-*` no dependen de React salvo `flowink-ui`.
- `flowink-app` puede depender de todos los paquetes FlowInk y del paquete local de Excalidraw.
- El editor y el exportador comparten el mismo sampler determinista.
- El player consume un proyecto ya normalizado y no importa la shell completa del editor.
- El core de Excalidraw solo se modifica si una extensión mediante API pública es imposible.

## Estado y render

- Zustand administra proyecto, slides, secuencia, timeline, cámara y workspace.
- El estado efímero interno del canvas continúa dentro de Excalidraw.
- Los frames se calculan con funciones puras. El playback actualiza el canvas mediante la API imperativa y evita un render React por frame.
- Excalidraw History y FlowInk History son límites separados. Las operaciones estructurales de FlowInk usan snapshots del proyecto.

## Persistencia

IndexedDB es el almacenamiento primario. Cada proyecto se guarda serializado con versión, fecha de actualización y assets. `localStorage` solo puede contener preferencias pequeñas o una señal de recuperación.

## Rutas

- `/editor`: shell completa.
- `/present`: presentación sin controles de edición.
- `/player`: runtime ligero de reproducción.
- `/obs`: variante sin UI pensada para captura de ventana.

## Upstream

`upstream` apunta a `https://github.com/excalidraw/excalidraw.git`. Los cambios FlowInk se aíslan para que una actualización desde `upstream/master` tenga conflictos mínimos.
