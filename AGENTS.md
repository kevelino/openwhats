# Repository Guidelines

## Project Structure & Module Organization

OpenWhats is a small Electron wrapper for WhatsApp Web. The app entry point is `main.js`, which creates the Electron window, sets the WhatsApp Web user agent, handles external links, tray behavior, window state, and update checks. Packaging and publish metadata live in `package.json` under the `build` key. Static application icons are in `build/`, with icon variants under `build/icons/`. Generated release artifacts are written to `dist/` and should not be edited by hand. Documentation files such as `README.md`, `FEATURES.md`, `CHANGELOG.md`, and this guide live at the repository root.

## Build, Test, and Development Commands

- `npm install`: Install Electron, electron-builder, and runtime dependencies from `package-lock.json`.
- `npm start`: Run the app locally with `electron . --no-sandbox`.
- `npm run build`: Build Linux packages locally with electron-builder; output goes to `dist/`.
- `npm run release`: Build and publish Linux packages through electron-builder. Requires `GH_TOKEN` in the environment.
- `npm test`: Currently a placeholder that exits with an error; do not treat it as a validation command until tests are added.

## Coding Style & Naming Conventions

Use CommonJS modules, matching the existing `require(...)` style in `main.js`. Keep JavaScript indentation at 4 spaces, use semicolons, and prefer `const` or `let` over `var`. Name functions in camelCase, for example `createWindow()` and `createTray()`. Keep packaging names consistent with the app identity: package name `openwhats`, product name `OpenWhats`, and app id `io.github.kevelino.openwhats`.

## Testing Guidelines

There is no automated test framework configured yet. For code changes, manually run `npm start` and verify that WhatsApp Web loads, external links open in the system browser, window size persists, and tray/update behavior does not regress. For packaging changes, run `npm run build` and inspect the generated Linux artifacts in `dist/`.

## Commit & Pull Request Guidelines

Recent commits use concise Conventional Commit prefixes such as `feat:`, `fix:`, and `chore:`. Follow that pattern, for example `fix: preserve window state after restart`. Pull requests should include a short summary, the reason for the change, manual verification steps, and screenshots or screen recordings for visible UI, tray, icon, or packaging changes. Link related issues when available.

## Security & Configuration Tips

Do not commit personal tokens, release credentials, or local build artifacts. Keep `GH_TOKEN` in the shell environment only when publishing. Preserve Electron security defaults in `webPreferences`, especially `nodeIntegration: false` and `contextIsolation: true`, unless a change has a clear security review.
