# Guidelines

- For new DOM/browser API usage, use `app.ownerDocument` and `app.ownerWindow` instead of globals; without `app`, derive them from the mounted node's `ownerDocument` and its `defaultView`.
- When overriding properties of an existing type, prefer `Merge<Base, Overrides>` from `@excalidraw/common/utility-types` over `Omit<Base, keyof Overrides> & Overrides`.

## FlowInk

- Keep `excalidraw-app` and upstream packages as close to upstream as possible.
- Add product behavior in `flowink-app` or a `packages/flowink-*` package before changing Excalidraw core.
- Keep animation, camera, transition, persistence, and export logic deterministic and independent from React where practical.
- Every `.flowink` document must carry `format` and `formatVersion`; migrate old data explicitly instead of mutating it silently.
- Add unit tests for schema migrations, sampling, easing, camera, transitions, and export behavior.
- Run the relevant typecheck, tests, and production build after each milestone.
- Do not merge Excalimate history. If code is ported later, record its source commit and modifications in `THIRD_PARTY_NOTICES.md`.
