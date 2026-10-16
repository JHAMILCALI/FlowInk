# Estrategia de pruebas

## Comandos base

```powershell
corepack yarn test:typecheck
corepack yarn test:app --watch=false
corepack yarn build
```

El entorno debe usar Yarn 1.22.22, fijado en `package.json`.

## Pirámide

- Unitarias: schema, migraciones, easing, sampler, cámara, Smart Transition y frame export.
- Integración: crear, duplicar, guardar, recargar, animar, presentar y exportar.
- E2E (Playwright): recorrido principal desde proyecto nuevo hasta recarga y continuación.
- Visuales: demos MCP, arquitectura, cámara, animación y Smart Transition.

## Línea base de FASE 0

Verificada el 16 de octubre de 2026 sobre el commit upstream `4c37956ba5f04ec342a9d9d5891a38f22c5b7b4e`:

- TypeScript: correcto.
- Vitest: 143 archivos; 2510 pruebas correctas, 47 omitidas y 1 pendiente.
- Build de producción: correcto con advertencias upstream de bundles grandes, sourcemaps y browserslist desactualizado.
- Vite de desarrollo: listo en `http://127.0.0.1:4173/`.

## Definition of Done

Una fase compila, tiene pruebas proporcionales al riesgo, no introduce errores graves de consola, conserva compatibilidad `.excalidraw`, actualiza documentación y no deja código crítico pendiente.
