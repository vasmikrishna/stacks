# stacks

STACKS is a 3D multiplier-prediction game prototype with demo credits.

## Run the Game

The playable game is in `stacks-3d-home/`. Serve it with any static HTTP server:

```sh
python3 -m http.server 4174 --directory stacks-3d-home
```

Open http://localhost:4174. Choose a stake and prediction, then start the round.
The tower reveals the full result; a winning round pays the selected multiplier.

The demo includes cube physics, live multiplier tracking, win celebrations,
background music, sound effects, and bounded autoplay. Outcomes are generated
locally with a theoretical 96.5% RTP before payout rounding. Stake is not connected.

## Project Layout

- `stacks-3d-home/`: active playable prototype and vendored browser libraries.
- `stacks-game/`: earlier React application and UI components.
- `stacks-visuals/` and `shared-game-images/`: visual references.
- `STACKS-*.md`: planning documents.

## Verification

```sh
node stacks-3d-home/math.test.mjs
node --check stacks-3d-home/main.js
```

`stacks-3d-home/verify.cjs` contains Playwright gameplay and rendering checks.
It currently uses the original development machine's Playwright runtime path.
Set `STACKS_URL` to test a server other than http://127.0.0.1:4174.
