# Stake Engine Upload Export

This is an integration-test export for VARCHAS Games' STACKS. It is not a
production-approved release. No dashboard upload or real-money play was used
to develop or test it.

## Build The Actual Files

Use Node.js 24 or newer (for built-in Zstandard support) and the `zip`/`unzip`
commands. From the repository root:

```sh
node scripts/build-stake-upload.mjs
```

The build creates a new timestamped folder under `output/`, preserving previous
releases. It exports the current working files, including uncommitted changes.
Generated upload directories are ignored by Git.

| Output | Purpose |
| --- | --- |
| `frontend/` and `frontend.zip` | Static game, engine adapter, fonts, audio, icons, and vendored libraries |
| `math/` and `math.zip` | `index.json` and all target-specific outcome books/lookup tables |
| `branding/` | Transparent publisher PNG, SVG master, STACKS logo |
| `MODE-STATISTICS.csv` | Every target's probability, RTP, and example win/loss replay event IDs |
| `MATH-REPORT.json` | Generated verification results and remaining limitations |
| `SHA256SUMS.txt` | File checksums |
| `UPLOAD-INSTRUCTIONS.md` | Which extracted files belong in each dashboard upload |
| `all-files.zip` | Delivery container with both upload ZIPs, branding, and reports |

ZIPs are delivery containers. If the dashboard requests files or a directory,
extract them and select their contents. The frontend upload root must contain
`index.html`; the math upload root must contain `index.json`. Do not mix the
frontend, math, or supporting reports into the wrong upload category.

The format follows the [official math publication format](https://stake-engine.com/docs/math/math-file-format):
an index referencing each mode's compressed JSON-lines outcomes and weighted
CSV table. Each book contains an ID, events, and an integer payout multiplier.

## Supported Target Modes

The Engine package contains nine validated targets: **1.50x, 2x, 2.50x, 3x,
5x, 7x, 10x, 25x, and 39x**. The 1.50x floor satisfies the platform's
per-mode volatility requirement, while the 39x ceiling keeps non-zero win hit
rate and 40x tail liability within the validation limits.

Each target is a separate mode named `target_N`, where `N` is the multiplier in
hundredths. For example, 2.50x uses `target_250`. Mode cost is always 1, so the
selected play amount is not changed by a target-dependent cost factor. Each
mode pays zero or its selected target. The complete math directory contains
**19 files**: one index and two files for each target.

## Math Representation

[`engine-contract.mjs`](../../stacks-3d-home/engine-contract.mjs) partitions the
original 32-bit entropy space into weighted intervals. The partitions include
every target boundary, the 1x boundary, bonus-stage thresholds, and the 1000x
cap. Each interval uses its midpoint sample to define a representative reveal
value. This is a compact static approximation to the numeric reveal
distribution, not enumeration of every original result number.

The total weight is exactly `2^32` for every mode. Winning weight is exactly
`floor(965 * 2^32 / (10 * targetUnits))`, matching the demo probability helper.
The target's win probability, return, and milestone-crossing probabilities are
preserved. Visual effects do not add payout factors. Generation validates each
book/CSV payout, positive weights, total weight, and Zstandard round trip.

This model has only loss or target payout within an individual mode. Version 3
passes the dashboard's statistics validation, including RTP consistency, base
volatility, non-zero win hit rate, and tail-liability checks.

## Frontend Integration

[`engine-session.mjs`](../../stacks-3d-home/engine-session.mjs) uses the dynamic
`rgs_url` and `sessionID` launch parameters. It authenticates before play,
honors server amount limits and increments, resumes active rounds, and requests
settlement only for active rounds. Amounts sent to the server are integers in
millionths. The client never generates a financial outcome for an Engine round
or adds a locally calculated payout to the wallet.

The Engine build inserts a runtime marker into `index.html`. Without launch
parameters, its controls remain locked with a launch message, rather than
silently using demo credits. The original local source remains available in
demo mode. The integration is based on the [wallet API](https://stake-engine.com/docs/rgs/wallet).

A failed or ambiguous play request is never automatically retried. Reconnect
authenticates again and resumes an active round if the server returns one.
Autoplay is stopped on connection errors. A failed settlement blocks new rounds
until reconnect, preventing a new play on an uncertain wallet state.

Public replay launch parameters fetch the saved book without authenticating or
placing a play. The replay retains the selected target, supplied play amount,
server result, and visual seed; replay controls cannot transition into live
play. This implements the [public replay flow](https://stake-engine.com/docs/approval-guidelines/game-replay-requirements).

## Verification

```sh
node --test stacks-3d-home/*.test.mjs
node scripts/build-stake-upload.mjs --frontend-only --output output/engine-qa
node scripts/verify-stake-upload.cjs output/engine-qa/frontend
```

The browser verifier starts and closes its own temporary static server and uses
a mock RGS, never a real wallet. It checks request contracts, prediction
controls, win/loss balances, no automatic mutation retries, resume, public
replay isolation, required launch parameters, desktop/mobile canvas pixels,
and missing assets. It saves screenshots and a JSON report beside the tested
frontend directory.

The browser verifier defaults to the original development machine's bundled
Playwright path. Set `PLAYWRIGHT_MODULE` to another installed Playwright module
path when testing elsewhere.

## Still Required Before Submission

- Upload matched frontend/math versions and exercise an actual dashboard test session.
- Confirm actual session, currency, amount, resume, and public replay responses.
- Complete jurisdiction/social-mode terminology and reviewer-specific checks.
- Prepare the platform's required final game tile; the included logo is not a tile.
- Review licensed audio and other assets for the intended distribution.

Do not present the package as published or production approved until reviewer
approval is complete.
