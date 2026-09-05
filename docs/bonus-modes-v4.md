# STACKS Four Modes

This replaces Second Chance. Every round has one stack, one stake debit,
and one server-controlled result. There are no retries or extra lives.

| Mode | Payout boost | Visuals |
| --- | --- | --- |
| Classic | 1x | Original crystal stack |
| Prism | 2x | Mint/pink prism theme |
| Tesseract | 3x | Nested rotating cube frames |
| Reactor | 5x | Metal cages and luminous reactor cores |

Total payout on a win is stake times selected target times mode boost,
including the stake. A losing round pays zero. For example, a 100 stake
at a 2.5x target pays 250, 500, 750, or 1,250 depending on mode.
Boosts reduce the chance of reaching the target; they are not free extra RTP.
All modes cost 1x and have theoretical RTP approximately 96.5% after
integer-weight rounding. The UI quotes both total payout and win chance.

Engine targets are 1.5, 2, 2.5, 3, 5, 7, 10, 25, and 39.
New stack results stop at 39x; the payout can reach 195x in Reactor.
Turbo only speeds presentation by 2.5x and does not affect outcomes.
The same mode metadata is preserved for replay and active-round recovery.

## Release Status

This is an integration test build, not a production-approved release.
Higher boosted targets exceed the previous 40x tail-liability threshold;
some have a nonzero-win interval longer than 50 rounds. Passing local RTP
and settlement tests does not mean these modes pass platform compliance.
The new files require dashboard validation and real RGS testing before
publication. Do not replace the approved math with this build without review.

Build with Node 24:

```sh
node scripts/build-stake-upload.mjs --output output/stacks-four-modes-final
node scripts/verify-stake-upload.cjs output/stacks-four-modes-final/frontend
node --test stacks-3d-home/*.test.mjs
```

The builder preserves earlier releases and requires a new output directory.
