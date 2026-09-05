# STACKS

STACKS is a 3D multiplier-prediction game prototype by VARCHAS Games, using demo credits.

## Developer Guides

- [Game math](docs/math/README.md): outcome distribution, target selection, payouts,
  bonus behavior, and replay data.
- [Frontend](docs/frontend/README.md): local setup, source layout, gameplay flow,
  assets, and verification.
- [Stake Engine export](docs/stake-engine/README.md): actual upload files,
  nine validated target modes, RGS integration testing, and release notes.

These guides describe the current implementation. Earlier planning documents and
visual mockups may describe features that are not active in the game.

## Run the Game

The playable game is in `stacks-3d-home/`. Serve it with any static HTTP server:

```sh
python3 -m http.server 4174 --directory stacks-3d-home
```

Open http://localhost:4174. Choose a stake and prediction, then start the round.
The tower reveals the full result; a winning round pays the selected multiplier.

The demo includes cube physics, live multiplier tracking, win celebrations,
background music, sound effects, and bounded autoplay. Outcomes are generated
locally with approximately 96.5% theoretical RTP before cent rounding. Bonus
stages affect presentation, not the selected payout multiplier. Without Engine
launch parameters, this remains a local demo. The separate Engine export uses
RGS session, outcome, and wallet APIs; it still requires dashboard validation
and is not production approved.

## Project Layout

- `stacks-3d-home/`: active playable prototype and vendored browser libraries.
- `docs/math/` and `docs/frontend/`: implementation guides.
- `stacks-game/`: earlier React application and UI components.
- `stacks-visuals/` and `shared-game-images/`: visual references.
- `STACKS-*.md`: planning documents.

## Verification

```sh
node --test stacks-3d-home/*.test.mjs
node --check stacks-3d-home/main.js
```

`stacks-3d-home/verify.cjs` contains Playwright gameplay and rendering checks.
It currently uses the original development machine's Playwright runtime path.
Its default server is http://127.0.0.1:4175. To test the server above:

```sh
STACKS_URL=http://127.0.0.1:4174 node stacks-3d-home/verify.cjs
```
