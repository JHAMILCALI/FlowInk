# Decisiones de arquitectura

## DEC-001 — Excalidraw es upstream

**Estado:** aceptada.

FlowInk parte del fork completo de Excalidraw y mantiene el remoto `upstream`. Las extensiones se implementan fuera del core cuando sea posible.

## DEC-002 — React, TypeScript, Vite y Yarn

**Estado:** aceptada.

El MVP conserva el stack y el package manager del upstream. No se usa Next.js ni se migra el monorepo.

## DEC-003 — Local-first

**Estado:** aceptada.

IndexedDB guarda proyectos y recuperación. No se necesita backend para el MVP.

## DEC-004 — Animaciones deterministas

**Estado:** aceptada.

Una función pura muestrea el proyecto en un tiempo dado. Preview, player y export usan el mismo cálculo.

## DEC-005 — Sin tipos propios de Excalidraw en el MVP

**Estado:** aceptada.

Code Card, Terminal, Browser, Sticky Note y Tech Card se componen con primitivas agrupadas.

## DEC-006 — Identidad conceptual persistente

**Estado:** aceptada.

Los elementos animables guardan `flowinkId` y `sourceId` fuera del core para conservar correspondencias al duplicar slides y habilitar Smart Transition.

## DEC-007 — Player separado

**Estado:** aceptada.

El reproductor no carga herramientas de edición. Comparte dominio y render runtime, no la shell React completa.

## DEC-008 — Historiales delimitados

**Estado:** aceptada.

Excalidraw conserva su historial de escena. FlowInk administra snapshots de operaciones estructurales; la shell decide a cuál delegar `Ctrl/Cmd+Z` según el foco y el modo.
