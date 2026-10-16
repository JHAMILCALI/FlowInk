# FlowInk — Planificación Completa del Proyecto

## 1. Identidad del proyecto

**Nombre:** FlowInk

**Tipo:** Editor visual + creador de presentaciones técnicas animadas.

**Objetivo:** construir una herramienta basada en Excalidraw que permita crear diagramas, organizarlos en diapositivas, animar objetos, mover una cámara virtual, crear transiciones y presentar el resultado directamente en OBS o exportarlo como video.

FlowInk debe servir especialmente para:

```text
Programación
Arquitectura de software
IA
MCP
Cloud
AWS
Ciberseguridad
Redes
Bases de datos
Auditoría
Clases universitarias
Tutoriales técnicos
YouTube
Streaming
```

El producto NO debe sentirse como:

```text
"Excalidraw pintado de verde"
```

Debe sentirse como:

```text
Excalidraw
    +
PowerPoint
    +
Excalimate
    +
editor de diagramas técnicos
    +
herramienta para creadores
```

---

# 2. Base del proyecto

FlowInk usará:

```text
Excalidraw
    ↓
motor de dibujo

Excalimate
    ↓
referencia para animación

FlowInk
    ↓
producto final
```

## Excalidraw será el upstream principal

Se hará un **fork completo** de Excalidraw.

FlowInk reutilizará:

```text
Canvas
Selección
Formas
Flechas
Texto
Free draw
Imágenes
Zoom
Pan
Resize
Grouping
Undo/Redo
Clipboard
Export
.excalidraw
```

NO reconstruir estas cosas desde cero.

---

# 3. Excalimate

Excalimate será referencia para:

```text
keyframes
timeline
animation-core
camera animation
player
export
draw animation
transitions
MCP
```

Pero hay una regla fundamental:

> NO fusionar directamente el repositorio completo de Excalimate dentro de Excalidraw.

Se debe estudiar y portar únicamente lo que FlowInk necesite.

---

# 4. Regla arquitectónica principal

Modificar el core de Excalidraw **lo menos posible**.

Antes de tocar un archivo original de Excalidraw preguntarse:

```text
¿Puedo hacerlo desde FlowInk App?

        ↓ no

¿Puedo hacerlo con un wrapper?

        ↓ no

¿Puedo hacerlo como package FlowInk?

        ↓ no

Modificar core Excalidraw
```

Esto es necesario para poder seguir trayendo cambios futuros desde:

```text
upstream/excalidraw
```

sin tener cientos de conflictos.

---

# 5. Git

Remotos esperados:

```text
origin
    FlowInk

upstream
    Excalidraw original
```

Excalimate puede mantenerse solamente como referencia.

No hacer:

```text
git merge excalimate/main
```

dentro de FlowInk.

---

# 6. Si la carpeta FlowInk ya existe

El agente debe comenzar haciendo una auditoría.

Antes de ejecutar cualquier cambio:

```text
1. listar archivos
2. comprobar .git
3. comprobar branch
4. comprobar remotes
5. comprobar Node
6. comprobar Yarn
7. comprobar package.json
8. comprobar si existen archivos del usuario
```

No sobrescribir archivos existentes sin verificar qué contienen.

Si la carpeta está vacía:

```text
git init

agregar remote:
upstream = <EXCALIDRAW_UPSTREAM>

fetch upstream

crear main a partir de upstream/master

agregar:
origin = <REPOSITORIO_FLOWINK>
```

Después:

```text
main
develop
feature/*
fix/*
```

---

# 7. Package manager

Mantener el package manager de Excalidraw.

No migrar el proyecto completo a:

```text
pnpm
bun
npm workspaces
```

durante el MVP porque aumentaría innecesariamente la diferencia respecto al upstream.

---

# 8. Arquitectura del repositorio

Objetivo:

```text
FlowInk/
│
├── excalidraw-app/
│
├── packages/
│   │
│   ├── excalidraw/
│   ├── common/
│   ├── element/
│   ├── ...
│   │
│   ├── flowink-project-schema/
│   ├── flowink-animation-core/
│   ├── flowink-presentation-core/
│   ├── flowink-player-runtime/
│   ├── flowink-export-runtime/
│   └── flowink-ui/
│
├── flowink-app/
│   │
│   ├── src/
│   │   ├── editor/
│   │   ├── slides/
│   │   ├── sequence/
│   │   ├── timeline/
│   │   ├── animations/
│   │   ├── camera/
│   │   ├── transitions/
│   │   ├── presenter/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── stores/
│   │   ├── services/
│   │   └── hooks/
│   │
│   └── ...
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── ROADMAP.md
│   ├── DECISIONS.md
│   ├── PROJECT_FORMAT.md
│   └── TESTING.md
│
├── AGENTS.md
├── THIRD_PARTY_NOTICES.md
└── LICENSE
```

---

# 9. No reemplazar `excalidraw-app`

Crear:

```text
flowink-app/
```

como aplicación propia.

Esto permite mantener:

```text
excalidraw-app/
```

cerca del upstream original.

FlowInk importará el package local:

```text
@excalidraw/excalidraw
```

y construirá su propia experiencia alrededor del editor.

---

# 10. FlowInk Project Schema

Crear:

```text
packages/flowink-project-schema
```

Este package define el archivo:

```text
.flowink
```

El formato siempre debe tener versión.

Conceptualmente:

```ts
FlowInkProject {
    format
    version
    metadata

    theme

    slides[]

    assets{}

    settings
}
```

Configuración básica:

```text
title
description
createdAt
updatedAt

aspectRatio
width
height
fps
```

Default:

```text
1920 × 1080
16:9
30 FPS
```

---

# 11. Slides

Cada proyecto tendrá:

```text
FlowInk Project
│
├── Slide 1
├── Slide 2
├── Slide 3
├── Slide 4
└── Slide 5
```

Cada slide contiene:

```text
Excalidraw scene
+
steps
+
animations
+
camera
+
transitions
```

Debe ser posible:

```text
crear
duplicar
eliminar
renombrar
reordenar
copiar
pegar
```

---

# 12. Identidad persistente de elementos

Esto será muy importante.

Cada elemento animable debe tener una identidad FlowInk independiente.

Conceptualmente:

```ts
FlowInkElementMeta {
    flowinkId
    sourceId
}
```

Esto permitirá saber que:

```text
Claude Slide 1
```

y

```text
Claude Slide 2
```

son el mismo objeto conceptual.

Gracias a eso podremos hacer:

```text
Smart Transition
```

---

# 13. Duplicar slide

Cuando:

```text
Slide A
```

se duplique:

```text
Slide A → Slide B
```

los elementos correspondientes deben conservar su relación.

Ejemplo:

```text
Slide A

[Claude]        [Cursor]


Slide B

        [Claude]

        [Cursor]
```

FlowInk debe poder detectar:

```text
Claude A → Claude B
Cursor A → Cursor B
```

y animarlos automáticamente.

---

# 14. Editor FlowInk

Debe existir un modo:

# DRAW

Aquí aparecerán las herramientas principales.

Visualmente:

```text
┌─────────────────────────────────────────────┐
│                                             │
│  ✦                                          │
│  ─                                          │
│  □           CANVAS                         │
│  T                                          │
│  ✎                                          │
│  ↗                                          │
│  ▧                                          │
│                                             │
│                                             │
│                ● ● ● ● ●                    │
│              ←           →                  │
└─────────────────────────────────────────────┘
```

Toolbar vertical izquierda.

---

# 15. Tema FlowInk

Tema inicial:

```text
background:
#050805 aproximadamente

surface:
verde-negro

primary:
verde brillante

text:
blanco roto

muted:
gris

warning:
amarillo

danger:
rojo
```

No hardcodear colores en componentes.

Crear tokens:

```css
--fi-bg
--fi-surface
--fi-surface-secondary
--fi-border

--fi-text
--fi-muted

--fi-primary
--fi-primary-hover

--fi-danger
--fi-warning
```

---

# 16. Tipografía

Usar una combinación:

```text
hand drawn
+
monospace
+
sans-serif UI
```

Por ejemplo:

```text
diagrama → Excalifont
código   → monospace
UI       → sans-serif
```

---

# 17. Tres modos principales

FlowInk tendrá:

```text
DRAW
SEQUENCE
STUDIO
```

más:

```text
PRESENT
```

---

# 18. DRAW

Editor normal.

Para:

```text
dibujar
crear diagramas
escribir
añadir imágenes
mover
resize
agrupar
colorear
```

---

# 19. SEQUENCE

Modo de animación sencillo.

Debe poder configurarse sin timeline.

Ejemplo:

```text
STEP 1
Claude aparece

STEP 2
Cursor aparece

STEP 3
se dibuja flecha

STEP 4
aparece JSON

STEP 5
cámara hace zoom

STEP 6
aparece nota
```

Interfaz:

```text
Animation

Entry
[ Fade ▼ ]

Duration
[ 0.6s ]

Trigger
[ On next ▼ ]

Delay
[ 0.0s ]
```

---

# 20. STUDIO

Modo profesional.

Timeline:

```text
         0      2      4      6      8

Claude   ◆────────◆

Cursor       ◆────────◆

Arrow            ◆────────◆

JSON                 ◆────────◆

Camera   ◆──────────◆────────◆
```

Debe permitir:

```text
keyframes
drag
resize
copy
paste
delete
multi-select
scrub
play
pause
loop
zoom
snap
```

---

# 21. Animation Core

Crear:

```text
flowink-animation-core
```

No depender de React.

Debe funcionar como funciones puras.

Idealmente:

```ts
sample(project, time)
```

devuelve el estado exacto de un frame.

Así:

```text
EDITOR PREVIEW
       │
       ↓
animation-core

EXPORT
       │
       ↓
animation-core
```

Los dos usan el mismo motor.

---

# 22. Propiedades animables iniciales

MVP:

```text
opacity

x
y

scaleX
scaleY

rotation

drawProgress
```

No intentar animar todo desde el principio.

---

# 23. Animaciones

Inicialmente:

```text
Fade In
Fade Out

Slide Left
Slide Right
Slide Up
Slide Down

Scale In
Scale Out

Pop

Draw
```

Después:

```text
Bounce
Blur
Mask
Typewriter
```

---

# 24. Easing

Incluir:

```text
Linear

Ease In
Ease Out
Ease In Out

Spring Soft
Spring Snappy
```

---

# 25. Draw Animation

Muy importante para FlowInk.

Debe parecer que:

```text
──────────────→
```

se está dibujando.

Prioridad:

```text
Arrow
Line
Freedraw
Connector
```

La animación debe depender de:

```text
drawProgress = 0 → 1
```

---

# 26. Cámara

Crear un motor separado:

```text
Camera Engine
```

Properties:

```text
x
y
zoom
rotation
```

Ejemplo:

```text
Camera 1
Vista general

        ↓

Camera 2
Claude

        ↓

Camera 3
JSON

        ↓

Camera 4
Nota
```

---

# 27. Camera Frame

Agregar botón:

```text
+ Camera Frame
```

El usuario selecciona una zona.

FlowInk guarda:

```text
posición
zoom
rotación
duración
easing
```

---

# 28. Presenter

FlowInk tendrá un modo:

```text
PRESENT
```

En este modo debe desaparecer:

```text
toolbar
bounding boxes
handles
timeline
inspector
menus
selection
```

Solo queda la presentación.

---

# 29. Navegación durante una presentación

```text
SPACE
→ siguiente step

RIGHT
→ siguiente step

LEFT
→ anterior

F
→ fullscreen

ESC
→ salir fullscreen

HOME
→ principio

END
→ final
```

---

# 30. Comportamiento de SPACE

Dentro de un slide:

```text
Step 1
↓
SPACE

Step 2
↓
SPACE

Step 3
↓
SPACE

último Step
↓
SPACE

Slide siguiente
```

Esto es fundamental.

---

# 31. OBS Mode

Crear:

```text
OBS MODE
```

Pensado específicamente para grabación/streaming.

Debe tener:

```text
16:9

sin UI

sin bordes

sin controles

fullscreen

cursor opcional

FPS estable
```

OBS simplemente captura la ventana.

---

# 32. Player

Separar:

```text
Editor Runtime
```

de:

```text
Player Runtime
```

Rutas conceptuales:

```text
/editor
/present
/player
```

El Player NO debe cargar todo el editor si solamente va a reproducir.

---

# 33. Transiciones entre slides

Primera versión:

```text
Cut

Fade

Push Left

Push Right

Zoom

Camera
```

---

# 34. Smart Transition

Segunda etapa.

Ejemplo:

```text
SLIDE A

Claude        Cursor


        ↓


SLIDE B

        Claude
          ↓
        Cursor
          ↓
         MCP
```

FlowInk interpola automáticamente.

Inicialmente interpolar:

```text
x
y
width
height
rotation
opacity
```

---

# 35. Elementos sin pareja

Si existe solo en A:

```text
fade out
```

Si existe solo en B:

```text
fade in
```

Si no es posible hacer morph:

```text
cross fade
```

No intentar morphing SVG/path complejo para v1.

---

# 36. Code Card

FlowInk necesita componentes especiales para contenido técnico.

Pero NO crear nuevos tipos internos de Excalidraw inicialmente.

Crear grupos de primitivas.

Ejemplo:

```text
● ● ●   mcp.json
────────────────────────

{
   "mcpServers": {
      ...
   }
}
```

Internamente:

```text
rectangle
+
circles
+
text
+
code
```

agrupados.

---

# 37. Terminal

Preset:

```text
┌───────────────────────────┐
│ ● ● ●  Terminal           │
├───────────────────────────┤
│ $ npm run dev             │
│                           │
└───────────────────────────┘
```

---

# 38. Sticky Note

```text
┌────────────────────────┐
│ POR QUÉ ES IMPORTANTE  │
│                        │
│ explicación...         │
└────────────────────────┘
```

---

# 39. Tech Card

```text
┌──────────────────────┐
│ ◉ CLAUDE CODE        │
│ mcp config           │
└──────────────────────┘
```

---

# 40. Browser Frame

Preset:

```text
● ● ●
────────────────────────
https://localhost
────────────────────────

contenido
```

---

# 41. Assets

MVP:

```text
SVG
PNG
JPG
WEBP
```

Funciones:

```text
upload
drag & drop
recent
replace
resize
```

Después añadiremos:

```text
Tech Logo Library
```

---

# 42. Slides UI

En la parte inferior:

```text
←    ○ ○ ○ ● ○ ○    →
```

También debe existir un panel de miniaturas.

---

# 43. Persistencia

FlowInk será:

```text
LOCAL FIRST
```

Primero usar:

```text
IndexedDB
```

No necesitamos backend para MVP.

Funciones:

```text
autosave
recovery
import
export
recent projects
```

---

# 44. Formato `.flowink`

Debe poder descargarse:

```text
mcp-presentation.flowink
```

y volver a abrirse.

Nunca guardar proyectos sin:

```text
formatVersion
```

---

# 45. Migraciones

Ejemplo:

```text
FlowInk 1.0
       ↓
FlowInk 1.1
       ↓
FlowInk 2.0
```

Debe existir:

```text
migration pipeline
```

No cambiar estructuras antiguas silenciosamente.

---

# 46. Export

Orden:

## V0

```text
PNG
SVG
```

## V1

```text
WebM
```

## V1.x

```text
MP4
```

## Posteriormente

```text
GIF
Animated SVG
Lottie
```

---

# 47. Export Runtime

Crear:

```text
flowink-export-runtime
```

Responsabilidades:

```text
render frame
sample animation
encode
progress
cancel
```

No meter lógica del exportador dentro del componente React de la timeline.

---

# 48. Estado FlowInk

Usar Zustand para estado específico:

```text
project
slides
presentation
timeline
camera
animations
workspace
```

No reemplazar innecesariamente el state management interno de Excalidraw.

---

# 49. Undo/Redo

Tenemos dos mundos:

```text
Excalidraw History

FlowInk History
```

FlowInk necesita historial para:

```text
slides
animations
camera
timeline
transitions
```

Diseñar cuidadosamente para que:

```text
Cmd + Z
```

no produzca estados inconsistentes.

---

# 50. MCP e IA

NO comenzar por aquí.

Será una fase posterior.

Primero:

```text
FlowInk estable
↓
Schema estable
↓
Animation API estable
↓
MCP
```

Después crear:

```text
flowink-mcp-server
```

---

# 51. Herramientas MCP futuras

```text
create_project

create_slide

duplicate_slide

add_elements

update_element

remove_element

add_animation

add_camera_keyframe

set_transition

play

export
```

---

# 52. Flujo futuro con IA

Objetivo:

```text
Usuario:

"Explícame cómo funciona OAuth2"

            ↓

       FlowInk MCP

            ↓

genera diagramas

            ↓

genera slides

            ↓

genera animaciones

            ↓

genera cámara

            ↓

Presentación lista
```

---

# 53. Seguridad MCP

Por defecto:

```text
localhost
```

Si algún día se expone:

```text
authentication
HTTPS
CORS
rate limiting
```

---

# 54. FASE 0 — Bootstrap

Primera misión del agente.

No hacer diseño todavía.

Debe conseguir:

```text
Fork funcionando
Dependencies instaladas
Dev server funcionando
Build funcionando
Tests base funcionando
```

Checklist:

```text
[ ] inspeccionar FlowInk
[ ] comprobar Git
[ ] configurar upstream
[ ] instalar
[ ] ejecutar
[ ] build
[ ] tests
[ ] documentar
```

---

# 55. FASE 1 — FlowInk Shell

Crear:

```text
flowink-app
```

Resultado:

```text
┌────────────────────────────────┐
│           FlowInk              │
│                                │
│ toolbar       Canvas           │
│                                │
│                                │
│             ○ ○ ● ○            │
└────────────────────────────────┘
```

Requisitos:

```text
theme FlowInk
editor Excalidraw funcionando
canvas 16:9
toolbar propia
branding FlowInk
```

---

# 56. FASE 2 — Slides

Implementar:

```text
new slide
duplicate
delete
rename
reorder
thumbnails
navigation
save
load
```

Criterio:

> cerrar navegador, volver a abrir y conservar presentación.

---

# 57. FASE 3 — Presenter

Implementar:

```text
Present
Fullscreen
Keyboard
Dots
OBS mode
```

En este punto FlowInk ya debe poder utilizarse para dar una clase.

Aunque todavía no tenga animaciones.

---

# 58. FASE 4 — Sequence

Implementar:

```text
steps
fade
slide
scale
pop
draw
duration
delay
easing
```

Objetivo:

```text
SPACE
```

va construyendo la explicación.

---

# 59. FASE 5 — Cámara

Implementar:

```text
pan
zoom
camera keyframes
frame selection
easing
preview
```

---

# 60. FASE 6 — Studio

Implementar timeline.

```text
tracks
keyframes
playhead
scrubbing
drag
snap
copy
paste
play
pause
loop
```

---

# 61. FASE 7 — Smart Transition

Implementar correspondencia entre elementos.

```text
Slide A
   ↓
Slide B
```

Interpola posiciones automáticamente.

---

# 62. FASE 8 — Export

Construir runtime.

```text
frame sampler
PNG
SVG
WebM
MP4
```

---

# 63. FASE 9 — Componentes

Crear:

```text
Code Card
Terminal
Browser
Sticky Note
Tech Card
```

---

# 64. FASE 10 — Templates

Templates:

```text
MCP Explained

AWS Architecture

API Request

Database Architecture

Network

Cybersecurity

Authentication

Microservices
```

---

# 65. FASE 11 — IA/MCP

Solo después del MVP.

---

# 66. Qué NO desarrollar ahora

No hacer:

```text
login

usuarios

suscripciones

pagos

cloud database

multiplayer

marketplace

mobile app

Electron

backend complejo

plugins

AI completa
```

antes del núcleo.

---

# 67. Testing

## Unitarios

Especialmente:

```text
project schema
migrations
animation-core
easing
camera
Smart Transition
frame sampling
```

---

# 68. Integration

Probar:

```text
crear proyecto

crear slide

duplicar

guardar

recargar

animar

presentar

exportar
```

---

# 69. E2E

Usar Playwright.

Caso principal:

```text
Open FlowInk

→ New Project

→ Add rectangle

→ Add text

→ Add arrow

→ New Slide

→ Duplicate

→ Add animation

→ Present

→ Save

→ Reload

→ Continue editing
```

---

# 70. Visual Regression

Crear proyectos demo:

```text
demo-mcp

demo-software-architecture

demo-camera

demo-animation

demo-smart-transition
```

Guardar screenshots esperados.

---

# 71. Rendimiento

Objetivo:

```text
60 FPS
```

durante una presentación normal.

Evitar:

```text
React rerender por cada frame
```

si el Canvas puede actualizarse directamente.

---

# 72. Separar playback del editor

Muy importante.

No hacer:

```text
React Editor
   ↓
setState 60 veces/segundo
```

Preferir:

```text
Animation Runtime
       ↓
Canvas
```

---

# 73. Documentación obligatoria

Crear desde el inicio:

```text
docs/
```

con:

```text
ARCHITECTURE.md

ROADMAP.md

DECISIONS.md

PROJECT_FORMAT.md

TESTING.md
```

---

# 74. `DECISIONS.md`

Registrar decisiones.

Ejemplo:

```text
DEC-001
Excalidraw será upstream.

DEC-002
No utilizaremos Next.js para MVP.

DEC-003
FlowInk será local-first.

DEC-004
Las animaciones serán deterministas.

DEC-005
No añadiremos tipos propios de Excalidraw inicialmente.
```

---

# 75. Licencias

Crear:

```text
THIRD_PARTY_NOTICES.md
```

Registrar:

```text
Excalidraw
MIT

Excalimate
MIT
```

Cuando se reutilice código específico de Excalimate:

```text
origen
archivo
commit
modificaciones
licencia
```

---

# 76. Reglas del agente

El agente debe:

```text
1. Leer AGENTS.md antes de trabajar.

2. Inspeccionar antes de modificar.

3. Reutilizar antes de reescribir.

4. Evitar cambios masivos.

5. Mantener TypeScript limpio.

6. Evitar any innecesario.

7. Añadir tests a lógica compleja.

8. Ejecutar build después de milestones.

9. Ejecutar tests.

10. No romper .excalidraw.

11. No eliminar licencias.

12. No hacer merge directo de Excalimate.

13. Documentar arquitectura.

14. Evitar código muerto.

15. Evitar TODO críticos.

16. No declarar algo terminado si no funciona.

17. No realizar operaciones destructivas sin verificar.

18. Mantener compatibilidad upstream.

19. Entregar resumen de cambios.

20. Indicar pruebas realizadas.
```

---

# 77. Definition of Done

Una funcionalidad solo está terminada si:

```text
✓ funciona

✓ compila

✓ tests pasan

✓ no tiene errores graves de consola

✓ soporta teclado cuando corresponde

✓ persistencia funciona

✓ fullscreen funciona si aplica

✓ UI usa FlowInk theme

✓ documentación actualizada

✓ no rompe Excalidraw

✓ no deja código muerto evidente
```

---

# 78. Primera tarea EXACTA para el agente

Puedes darle este mensaje después de colocar `AGENTS.md`:

> **Comienza la FASE 0 de FlowInk. No implementes todavía animaciones ni rediseños. Primero audita la carpeta actual, Git, remotos, Node, Yarn y estructura del proyecto. Luego prepara correctamente el fork de Excalidraw manteniendo `upstream` apuntando al proyecto original y `origin` al proyecto FlowInk. Instala dependencias, ejecuta el proyecto original, verifica build y tests. Después crea la documentación inicial indicada en AGENTS.md. No modifiques el core de Excalidraw salvo que sea estrictamente necesario. Al terminar, dame un informe con estado del repositorio, comandos ejecutados, archivos creados, errores encontrados y siguiente tarea recomendada.**

Ese debería ser **el primer prompt**, no uno pidiendo que construya FlowInk completo de golpe.

---

# 79. Después de FASE 0

Segundo prompt:

> **Implementa la FASE 1 de FlowInk. Crea una aplicación `flowink-app` dentro del monorepo sin reemplazar `excalidraw-app`. Debe utilizar el package local de Excalidraw como motor, tener branding FlowInk, tema oscuro/verde, canvas de presentación 16:9 y una shell propia. Mantén intacto el core upstream siempre que sea posible. Todavía no implementes slides ni animaciones. Añade tests mínimos, verifica build y actualiza ARCHITECTURE.md y ROADMAP.md.**

---

# 80. Resultado de FASE 1

Queremos ver algo aproximadamente así:

```text
                 FLOWINK

┌──────────────────────────────────────────────┐
│                                              │
│ ✦                                            │
│ ─                                            │
│ □              CANVAS                       │
│ T                                            │
│ ✎                                            │
│ ↗                                            │
│                                              │
│                                              │
│                  ● ● ● ●                     │
│                ←       →                     │
└──────────────────────────────────────────────┘
```

---

# 81. Primer MVP completo

FlowInk MVP estará listo cuando podamos hacer esto:

```text
Abrir FlowInk

        ↓

crear proyecto

        ↓

crear diagrama

        ↓

crear slide

        ↓

duplicar slide

        ↓

crear steps

        ↓

animar flechas

        ↓

animar objetos

        ↓

crear movimientos de cámara

        ↓

Present

        ↓

Fullscreen

        ↓

SPACE para avanzar

        ↓

OBS captura FlowInk

        ↓

YouTube / Facebook
```

y además:

```text
Guardar
↓
Cerrar

Abrir
↓
Continuar
```

---

# 82. Decisión técnica final

No usar Next.js en el MVP.

La mejor estrategia es mantenernos cerca del ecosistema original de Excalidraw:

```text
React
TypeScript
Vite
Yarn
Monorepo
```

y crear:

```text
flowink-app
```

dentro del mismo repositorio.

---

# 83. Principio final

FlowInk debe priorizar, en este orden:

```text
1. estabilidad
2. experiencia de presentación
3. compatibilidad con Excalidraw
4. mantenibilidad
5. rendimiento
6. nuevas funciones
```

No debemos construir IA, colaboración o cloud antes de que el editor, las slides, las animaciones y el modo presentación sean excelentes.
