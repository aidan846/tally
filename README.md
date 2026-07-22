<div align="center">

<img src="src/assets/icon.svg" alt="Tally icon" width="96" height="96">

### A small calculator for big, messy questions.

Type the way you think. Tally handles the arithmetic, units, dates, and context.

![Platform](https://img.shields.io/badge/desktop-macOS%20%7C%20Windows%20%7C%20Linux-25283d?style=flat-square)
![License](https://img.shields.io/badge/license-GPL--3.0-25283d?style=flat-square)
![Release](https://img.shields.io/badge/release-v2.0.0-6c63ff?style=flat-square)

</div>

## Think it. Type it. Tally it.

Tally is a clean, fast calculator that understands traditional expressions and everyday language. It stays out of the way until you need it, then turns a rough question into a useful answer.

<div align="center">

<img src="https://aidan846.github.io/tally/Tally-Example.png" alt="Tally example calculations" width="720">

</div>

## What Tally understands

| Feature | Examples |
| --- | --- |
| Natural-language math | `5 times 3`, `20% off 85`, `sqrt4` |
| Unit conversions | `60 mph to km/h`, `5 feet to cm`, `2 cups to ml` |
| Dates and time zones | `10 days ago`, `June 12 2026 + 3 workdays`, `Tokyo time` |
| Currency | `$25 to EUR`, `price = $24.99` |
| Statistics | `average 10 20 30`, `median 1 8 3 4 5` |
| Stocks and weather | `AAPL`, `MSFT 10 days ago`, `weather in Sydney` |

Each calculation has its own row. Press **Enter** for another row, double-click an answer to copy it, and use the appearance and precision settings to make Tally yours.

| Shortcut | Action |
| --- | --- |
| `Enter` | Add the next calculation row |
| `C C` | Clear all calculations (press quickly) |
| `X X` | Delete the current row (press quickly) |
| `Ctrl C` / `Cmd C` | Copy the current line |
| `Backspace` at the start of a row | Delete the row and return to the previous one |

## Desktop development

Install [Node.js](https://nodejs.org/), Rust, and the [Tauri platform prerequisites](https://v2.tauri.app/start/prerequisites/), then run:

```sh
npm ci
npm run tauri:dev
```

For a browser-only frontend session, use `npm run dev`. Run the calculator and provider regression suite with `npm test`.

## Desktop builds

Build the current platform with:

```sh
npm run tauri:build
```

Desktop bundles must be produced on their native operating system. The tagged-build workflow creates and uploads these GitHub Release assets:

- Windows x64 NSIS installer
- Windows x86 NSIS installer
- macOS Intel DMG
- macOS Apple Silicon DMG
- Linux x64 AppImage and Debian package

Push a `v*` tag to run the release workflow. MSIX is not required or generated.

### Windows x86 support

Tauri 2 currently documents `i686-pc-windows-msvc` as its supported 32-bit Windows target. It requires the 32-bit Rust target (`rustup target add i686-pc-windows-msvc`) and the x86 WebView2 Runtime. WebView2 supports current Windows 10 and Windows 11 releases, not legacy Windows versions that Microsoft Edge no longer supports. The CI x86 job is a required release build so a future upstream compatibility break is visible instead of being ignored.

## PWA builds

The default base path is `/`, which is also what normal Tauri desktop builds use:

```sh
npm run build:pwa
```

Set `TALLY_WEB_BASE` when the PWA is hosted below another path:

```sh
TALLY_WEB_BASE=/tally/online/ npm run build:pwa
```

PowerShell equivalent:

```powershell
$env:TALLY_WEB_BASE = "/tally/online/"
npm run build:pwa
```

The deployable output is written to `dist/`. Its generated manifest and service worker are scoped to the configured base path.

## Website syncing

With `Tally-Tauri` and `Tally-Site` as sibling folders, run this from `Tally-Site`:

```sh
npm run sync:tally-pwa
```

The sync script builds this project with `/tally/online/` as its base and replaces `Tally-Site/public/online` with the generated `dist` contents. `npm run build` in the website runs that sync automatically. CI can override the source checkout with `TALLY_TAURI_DIR`.

The website's manual deploy workflow checks out both repositories and performs the same build. Because it publishes to the `gh-pages` branch of `aidan846/tally` from the separate `Tally-Site` repository, configure a `TALLY_DEPLOY_TOKEN` repository secret with contents write access to `aidan846/tally` before running it.

## Project structure

- `src/` — shared desktop/PWA frontend, parser, settings, and providers
- `src/platform-api.js` — native/browser capability adapter
- `src-tauri/` — Tauri shell, permissions, icons, and bundle configuration
- `test/` — parser, formatting, stock, weather, and module regression tests
- `.github/workflows/build.yml` — cross-platform desktop, PWA, and tagged-release builds

## Releases

Download packaged desktop releases from [GitHub Releases](https://github.com/aidan846/tally/releases/latest), or use [Tally online](https://aidan846.github.io/tally/online/).

<div align="center">

Made for the little calculations that add up.

</div>
