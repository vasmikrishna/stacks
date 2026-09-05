# STACKS Frontend

The active VARCHAS Games prototype is
[`stacks-3d-home/`](../../stacks-3d-home/). It is a static HTML/CSS/JavaScript
application using ES modules, vendored Three.js rendering, and Rapier physics.
The separate `stacks-game/` directory is an earlier React implementation, not
the source of the currently developed game.

For actual Stake Engine upload artifacts and server-driven launches, use the
[Engine export guide](../stake-engine/README.md). This page primarily describes
local demo behavior.

## Run Locally

From the repository root, using an available port:

```sh
python3 -m http.server 4174 --directory stacks-3d-home
```

Open <http://localhost:4174>. No npm install or frontend build step is required
for this active app. Serve it over HTTP rather than opening `index.html` with
`file://`, because browser module and resource-loading restrictions can prevent
the game from starting. Use HTTPS when hosting it remotely.

The browser needs WebGL2, WebAssembly, ES modules, and Web Crypto. The default
wallet is 12,450.00 demo credits. No account, API key, or real-money wallet is
connected.

## Source Map

| Source | Responsibility |
| --- | --- |
| [`index.html`](../../stacks-3d-home/index.html) | Game shell, loading/intro screens, controls, information dialog |
| [`main.js`](../../stacks-3d-home/main.js) | State, DOM events, round lifecycle, autoplay, replay, audio, scene animation |
| [`math.mjs`](../../stacks-3d-home/math.mjs) | Pure outcome, probability, payout, and stage helpers |
| [`crystal-stage.js`](../../stacks-3d-home/crystal-stage.js) | Crystal materials, lighting, stage effects, landing recoil |
| [`prediction-scale.mjs`](../../stacks-3d-home/prediction-scale.mjs) | Target ruler mapping and 0.01x step adjustment |
| [`replay.mjs`](../../stacks-3d-home/replay.mjs) | Validated round snapshots and seeded visual values |
| [`recent-results.js`](../../stacks-3d-home/recent-results.js) | Latest five completed results |
| [`win-timing.mjs`](../../stacks-3d-home/win-timing.mjs) | Celebration tiers, payout count-up, particle trajectories |
| [`audio-design.mjs`](../../stacks-3d-home/audio-design.mjs) | Growth/landing audio cue parameters |
| `game.css` and feature CSS files | Scene layout, console, ruler, celebrations, dialogs, loading/intro styles |
| `vendor/` | Browser rendering/physics dependencies |
| `assets/` | Local logo, fonts, icons, and runtime audio |

See the [math guide](../math/README.md) before changing any payout or target logic.

## Screen And Controls

The top bar contains the STACKS logo and demo balance. The main stage keeps the
current multiplier at the upper left and recent results at the upper right,
with the 3D tower as the primary content. Recent results remain hidden until a
round finishes. The target ruler sits above the compact bottom play bar.

The bottom bar provides stake adjustment, Start Stack, Turbo, autoplay, and
settings. The autoplay icon opens only autoplay options; the gear opens general
settings. Starting a round closes open settings/information panels. The stop
autoplay action prevents the next round while allowing the current one to finish.

Rules, bonus information, and round history open in the game information dialog.
History can replay a completed round with its saved stake and target. Replaying
does not place another bet. The previous controls are restored on exiting replay.

## State And Rendering

The round phases are `idle`, `running`, `won`, and `broken`; replay and autoplay
are separate state flags. The normal path is:

```text
start -> validate controls -> debit demo stake -> sample outcome
      -> reveal tower/multiplier -> settle -> record history -> result display
```

`tick` derives reveal progress from elapsed time rather than counting frames.
`animate` drives the Three.js scene, stage motion, celebrations, and debris.
Rapier is used for falling-block physics; physics does not determine winnings.
The sampled outcome is independent of the separate visual seed.

The target ruler uses a piecewise logarithmic mapping across 1.50x-39x and
moves in 0.01x increments in the local demo.
Changing its visual calibration must not change the actual target or outcome
distribution. Win celebrations use five tiers selected by the target; amount
count-up finishes at the exact settled payout.

Operating-system reduced-motion preferences are supported even though there
is no Motion toggle in settings.

## Audio And Assets

Runtime tracks are in [`assets/audio/`](../../stacks-3d-home/assets/audio/).
Music 1 is `crystal-tension.mp3`. Gameplay effects cover block landing, multiplier
counting, reaching the prediction, wins, and stack break. Background music runs
during a round or replay, then fades out over 950 ms after a win or 1300 ms after
a loss. Mute and page visibility handling are separate from the settlement fade.

Browsers can block boot/splash audio until a user gesture. Asset presence alone
does not guarantee that a fresh page can autoplay sound. The sound and background
music controls remain separate, with a music-volume slider.

[`assets/audio/README.md`](../../stacks-3d-home/assets/audio/README.md) records
track sources and licensing links. Keep the relevant license files under
`vendor/` and `assets/arcade/` when distributing assets.

VARCHAS Games logo exports are stored in `assets/brand/`, including a transparent
PNG and a white SVG. Merely storing those files does not replace the in-game
STACKS logo.

## Persistence

Balance, round history, autoplay state, and replay snapshots are in memory and
reset on page reload. The introduction-completed flag is stored under
`stacks:intro-seen:v1` in local storage. Settings include Replay introduction;
no backend is required to revisit it.

## Verification

Run the dependency-free module tests and syntax check from the repository root:

```sh
node --test stacks-3d-home/*.test.mjs
node --check stacks-3d-home/main.js
```

With a local server running, the existing browser regression script can be run:

```sh
STACKS_URL=http://127.0.0.1:4174 node stacks-3d-home/verify.cjs
```

`verify.cjs` and `visual-check.cjs` currently import Playwright from an absolute
path on the original development machine. They need a local Playwright runtime
path adjustment on a different machine. `verify.cjs` defaults to port 4175 when
`STACKS_URL` is omitted. Browser tests inject deterministic demo outcomes for
testing; these overrides are not part of normal game startup.

After visual changes, check desktop and mobile framing, nonblank canvas pixels,
controls, dialogs, wins/losses, replay, autoplay stop, reduced motion, and audio
muting. Module tests alone do not verify browser rendering or audible quality.

## Static Deployment

The deployable frontend root is `stacks-3d-home/`, not the repository root or
`stacks-game/`. Preserve `index.html`, its JS/MJS and CSS dependencies, `vendor/`,
and all referenced runtime assets with their relative paths. Serve modules with
JavaScript MIME types. Preview/test scripts, generated screenshots, and audition
files are not required by the runtime.

Static hosting publishes a playable demo, not a backend or platform-ready
real-money game. Publishing to a Git remote also does not automatically deploy
the site unless a deployment workflow has been configured.
