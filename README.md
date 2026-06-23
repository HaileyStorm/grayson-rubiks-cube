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
