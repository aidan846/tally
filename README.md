# Tally (Tauri)

Tally is a compact natural-language calculator for desktop and the web. This repository migrates the original Electron app in `tally/` to Tauri 2 while preserving its parser, visual identity, settings, shortcuts, window size, history, live stocks, weather, and currency conversions.

## Develop

Prerequisites: Node.js, Rust, and the [platform prerequisites for Tauri](https://v2.tauri.app/start/prerequisites/).

```sh
npm install
npm run tauri:dev
```

Run the parser/provider tests with `npm test`.

## Build

- Current desktop platform: `npm run tauri:build`
- Installable PWA/static site: `npm run build:pwa` (output: `dist/`)
- Frontend preview: `npm run preview`

Tauri desktop bundles must be compiled on their native operating system. The GitHub Actions workflow builds macOS Intel/Apple Silicon, Linux x64, and Windows x64/x86 artifacts. MSIX is intentionally not required; Tauri's standard Windows installer formats are prioritized.

The Windows x86 job depends on Tauri and WebView2 continuing to support the `i686-pc-windows-msvc` target. It is isolated from x64 in CI so an upstream x86 limitation will not block the priority builds.

To host the PWA, upload the contents of `dist/` to the web root (or a configured subdirectory) of your site over HTTPS. HTTPS is required for service workers and installation outside localhost.

## Architecture

- `src/` — shared Tauri/PWA frontend and the migrated Tally parser
- `src/platform-api.js` — small compatibility layer for native and browser capabilities
- `src-tauri/` — Tauri desktop shell, permissions, icons, and bundle configuration
- `test/` — migrated parser and data-provider tests
- `tally/` — untouched legacy Electron source retained for reference
