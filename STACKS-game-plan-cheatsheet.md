# STACKS Game Plan Cheat Sheet

Source images extracted from shared ChatGPT link:

- `shared-game-images/stacks-multiplier-flow.png`
- `shared-game-images/neon-stacks-casino-dashboard.png`
- `shared-game-images/minted-mike-neon-game-ui-spec.png`

## 1. What We Have

The images define a strong original direction for a multiplier/cash-out game:

- Name: STACKS.
- Core promise: "Build higher. Cash out smarter."
- Core action: place a bet, start stacking, watch multiplier rise, cash out before the stack breaks.
- Visual metaphor: glowing stacked cubes/blocks.
- Risk arc: early safe/profit stage, mid stage, bonus stages, high stage, final stage, jackpot, break.
- Public product shell: home/lobby, game modes, live game preview, recent wins, leaderboard, promotions, wallet, VIP, fairness, support.

Important cleanup: one image uses "Minted Mike" branding. Treat that only as a layout/menu reference. Do not carry that name, graffiti mark, mascot, or exact art direction into STACKS unless you intentionally rebrand the whole product.

## 2. Core Game Loop

1. Player selects Demo or Real Play.
2. Player chooses bet amount.
3. Player chooses risk profile: Classic, Bonus, High Stage, Jackpot, or custom.
4. Player taps Start Stack.
5. Stack builds upward in stages.
6. Multiplier increases with each successful stage.
7. Bonus events may modify the round.
8. Player can cash out after eligible stages.
9. If stack breaks first, bet is lost.
10. Round ends with payout/loss, history row, and fairness receipt.

## 3. Game Modes

Classic:
- Simple stack growth.
- Best for new players.
- Lower visual noise.
- Clear cash-out moments.

Bonus Mode 1:
- Appears around 1x-2x.
- Adds extra blocks, slower break chance, or small multiplier boost.
- Good early excitement.

Mid Stage:
- 2x-5x zone.
- Faster multiplier movement.
- Clear risk warning.

Bonus Mode 2:
- Appears around 2x-5x.
- "Double Stack" style boost.
- Adds extra blocks per step or higher multiplier acceleration.

High Stage:
- 5x-10x.
- Stronger color shift and tension.
- Cash-out should remain very prominent.

Bonus Mode 3:
- Appears around 5x-10x.
- Rare high-upside bonus.
- Should be visually distinct but not obscure the controls.

Final Stage:
- 10x-25x.
- Major-win territory.
- Needs clear "continue risk" feedback.

Jackpot:
- 25x+.
- Rare event.
- Use major celebration, then show exact receipt.

Stack Breaks:
- Loss state.
- Show final multiplier/result.
- Avoid shame language.
- Offer replay, change bet, view fairness.

## 4. HUD Architecture

Always visible:

- STACKS logo or back-to-lobby.
- Demo/Real mode.
- Balance.
- Wallet/deposit.
- Current multiplier.
- Current stage.
- Bet amount.
- Start Stack / Cash Out.
- Game history shortcut.
- Fairness shortcut.

Contextual:

- Bonus active indicator.
- Next-stage warning.
- Cash-out value.
- Jackpot meter.
- Auto cash-out status.
- Insufficient balance message.
- Round receipt.

Inside settings:

- Sound.
- Music.
- Reduced motion.
- Animation speed.
- Turbo/quick reveal.
- Autoplay defaults.
- Language.
- Notifications.
- Responsible gaming controls.

Inside info/rules:

- How to play.
- Paytable.
- RTP information.
- Volatility explanation.
- Bonus mode rules.
- Fairness explanation.
- FAQ.

## 5. Screens We Need

MVP screens:

- Intro / splash screen.
- Home / lobby.
- STACKS game screen.
- Login / sign up.
- Wallet / balance.
- Game rules / info.
- Fairness / verify result.
- Round history.
- Settings.
- Help/support.
- Responsible play.

Phase 2 screens:

- Promotions / bonuses.
- Leaderboard.
- VIP club.
- Profile.
- Notifications.
- Transaction history.
- Game mode detail pages.

Phase 3 screens:

- Tournaments.
- Multi-game lobby.
- Provider games if needed.
- Advanced analytics.
- Community/social profile.

## 6. Visual Direction

Keep:

- Glowing stack blocks.
- Blue/cyan/purple core palette.
- Green CTA for positive action.
- Gold jackpot/bonus treatment.
- Red break/loss state.
- Stage cards with distinct colors.
- Large readable multiplier.

Change:

- Remove "Minted Mike" naming/art unless this becomes a separate game.
- Reduce overuse of neon so key CTAs stand out.
- Make mobile controls less crowded.
- Replace generic "recent big wins" with privacy-safe, opt-in activity.
- Ensure game result animations never hide Cash Out.

Avoid:

- Copying any Stake UI, logo, game names, or exact mechanics.
- Making autoplay prominent before limits are configured.
- Making loss states feel punitive.
- Using only giant win imagery; show normal rounds too.

## 7. Product Navigation

Recommended STACKS top nav:

- Home
- Play STACKS
- Fairness
- Leaderboard
- Rewards
- Help

Logged-in right side:

- Balance
- Wallet / Deposit
- Profile menu

Logged-out right side:

- Login
- Sign Up
- Demo Play

Mobile bottom nav:

- Home
- Games
- Play
- Rewards
- Account

## 8. Round State Machine

IDLE:
- Bet controls unlocked.
- Show Start Stack.

BETTING:
- Player edits stake, risk, auto cash-out.

STARTING:
- Bet locked.
- Round seed committed.
- Short anticipation animation.

STACKING:
- Blocks animate upward.
- Multiplier updates.
- Cash Out active.

BONUS_ACTIVE:
- Bonus modifier displayed.
- Explain effect in one short label.

CASHED_OUT:
- Show payout.
- Credit balance.
- Save receipt/history.

STACK_BROKEN:
- Show break result.
- Debit already locked bet.
- Save receipt/history.

ROUND_COMPLETE:
- Replay, change bet, view fairness, view history.

## 9. MVP Build Scope

Build first:

- One playable STACKS game.
- Demo balance.
- Bet amount controls.
- Manual play.
- Cash-out.
- Stage multiplier curve.
- Break probability simulation.
- Three visual outcomes: normal cash-out, bonus win, stack break.
- Round history.
- Rules modal.
- Fairness receipt placeholder with client seed/server hash/nonce/result fields.
- Responsive mobile-first layout.

Do later:

- Real wallet integration.
- KYC.
- Deposit/withdrawal.
- Promotions.
- VIP.
- Public leaderboards.
- Autoplay.
- Real provably fair cryptographic implementation review.

## 10. Core Design Decision

STACKS should be a stage-based cash-out multiplier game. The player is not spinning reels or copying a crash game directly; they are building a visible stack where each added block represents a decision point. The product should feel fast, clear, and mobile-first, with fairness and responsible-play controls treated as part of the main game architecture.
