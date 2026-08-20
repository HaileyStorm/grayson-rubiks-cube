# Cherry Cube

A portable Three.js Rubik's cube game and interactive simulation with physical 3x3 layer rotations, standard notation controls, keyboard shortcuts, legal scrambles, solver presets, algorithm buttons, orbit camera controls, and a subtle cherry blossom scene.

## Run Locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://127.0.0.1:5173/`.

## Build

```bash
npm run build
```

The static production build is written to `dist/`.

## Package For Distribution

```bash
npm run dist:zip
```

This creates `release/cherry-cube-static.zip`. On Windows, recipients can unzip it and double-click `cherry-cube/start-cherry-cube.cmd`, which starts a tiny local server and opens the app. The same folder can also be served with any static web server.

## Verify

```bash
npx playwright install chromium
npm run verify
```

Verification captures desktop and mobile screenshots in `verification-screenshots/`.

## Features

- 27 rounded cubies with dark plastic bodies, colored stickers, lighting, shadows, gaps, and cherry blossom background.
- Animated physical slice turns for `U`, `D`, `L`, `R`, `F`, `B`, inverse moves, and double moves.
- FIFO move queue with visible move log, undo/redo for face turns, solved reset, legal random scramble, daisy preset, and white-cross preset.
- Algorithm library grouped by novice, intermediate, and expert face-turn sequences.
- Mouse/touch orbit and zoom through OrbitControls, camera preset buttons, and keyboard shortcuts.

## Support

This project is free. Donations are optional and never affect access or support. They support continued maintainer work; see [donation options](docs/DONATIONS.md) for crypto, Vast.ai, or Buy Me a Coffee. No method is preferred; verify recipients because transfers may be irreversible.
