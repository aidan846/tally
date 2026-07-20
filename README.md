# Tally

Tally is a lightweight desktop calculator that accepts regular math, natural-language math, unit conversions, and date arithmetic.

## Features

- Math: `5 + 5`, `6*2`, `5 times 3`, `5 and 2`, `5 minus 4`
- Unit conversions with compact or spaced input: `5ft to cm`, `5 feet in cm`, `6F to C`, `5lb to kg`
- Temperature, length, mass, time, volume, area, speed, pressure, and data conversions
- Date arithmetic: `06/29/2026 - 20 days`, `date plus 1 year`
- One calculation per row; press Enter to add another row
- Double-click an answer to copy it
- Press `C` three times quickly to clear all calculations

## Development

Install dependencies and run the app:

```bash
npm install
npm run start
```

Run the calculator regression tests:

```bash
npm test
```

## Icons

Active application icons live in `src/assets/`:

- `icon.svg` — website/favicon
- `icon.png` — Windows build icon and web fallback
- `icon.ico` — Windows icon format
- `icon.icns` — macOS app icon

## Packaging

```bash
npm run build:mac
npm run build:win
```

Each platform build is organized under `build/mac/` or `build/win/`:

- `installer/` contains the shareable installer (`.dmg` on macOS, NSIS `.exe` on Windows).
- `extra/` contains the unpacked application and build metadata used for local testing or updates.

For a normal macOS release, distribute only the `.dmg` from `build/mac/installer/`.
