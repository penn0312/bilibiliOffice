# Repository Guidelines

## Project Structure & Module Organization

This repository builds the `bilioffice` browser userscript from TypeScript. Application code is under `src/`: `main.ts` owns the shell and route lifecycle, `adapters/` integrates Bilibili data and comments, `player/` contains the iframe bridge, `core/` stores settings, and `styles/` plus `themes.ts` define presentation. Shared models live in `src/types.ts`. `scripts/build.mjs` creates `dist/bilioffice.user.js`. Automated checks are in `tests/`, fixtures in `tests/fixtures/`, and validation evidence and notices in `docs/`.

## Build, Test, and Development Commands

Use Node.js 22, install dependencies with `npm ci`, and install Chromium with `npx playwright install chromium`.

- `npm run typecheck` runs strict TypeScript checking without emitting files.
- `npm run build` bundles `src/main.ts` into `dist/bilioffice.user.js`.
- `npm run check` performs a syntax check on the generated userscript.
- `npm run test:unit` checks adapters and the player bridge directly.
- `npm test` builds first, then runs the network-intercepted Playwright regression suite.
- `npm run test:live` builds first and exercises selected flows against real Bilibili pages; never automate social actions.
- `npm run format` applies Prettier to source, scripts, and tests.

## Coding Style & Naming Conventions

Use strict TypeScript, ES modules, two-space indentation, double quotes, and semicolons, matching Prettier. Keep filenames lowercase (for example, `comments.ts`); use PascalCase for classes, camelCase for functions and variables, and clear union types/interfaces for shared data. Keep browser behavior in `src/` and do not edit generated `dist/` output by hand.

## Testing Guidelines

Add focused unit assertions for adapter, URL, message-validation, or lifecycle edge cases. Extend `tests/browser-regression.mjs` and fixtures for user-visible behavior, preserving deterministic network interception. Run `npm run typecheck`, `npm run build`, `npm run check`, `npm run test:unit`, and `npm test` before submitting. Treat live-test output and screenshots as evidence, not a replacement for deterministic tests.

## Commit & Pull Request Guidelines

Use imperative Conventional Commit subjects such as `feat: ...`, `fix: ...`, or `docs: ...`; keep each commit focused. Pull requests should explain behavior changes and affected routes/themes, link an issue when one exists, list validation commands, and include screenshots or `docs/` evidence for UI changes. Call out Bilibili-specific limitations, permissions, or generated-output changes.

## Security & Configuration Notes

Preserve the userscript permission boundary and origin/token checks in the player bridge. Do not add cookie or token extraction, third-party video resolvers, downloads, or simulated social actions. Keep settings in the `bilioffice.settings` namespace and update `NOTICE.md` when introducing third-party material.
