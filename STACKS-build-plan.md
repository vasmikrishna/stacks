# STACKS Build Plan

## Visual Assets Created

- `stacks-visuals/stacks-intro-splash-concept.png`
- `stacks-visuals/stacks-lobby-home-concept.png`
- `stacks-visuals/stacks-game-screen-concept.png`

## Product Rule

STACKS should be original. Use the reference only for planning the structure:

- Do use: stack-building, multiplier stages, cash-out, bonus stages, fairness, history, responsible-play controls.
- Do not use: Stake branding, Stake text, Stake logo, exact layout, proprietary game mechanics, or copied art.

## Core Game

STACKS is a stage-based cash-out multiplier game.

Player goal:

- Build the stack higher.
- Watch the multiplier increase.
- Cash out before the stack breaks.

Core loop:

1. Choose Demo or Real Play.
2. Set bet amount.
3. Choose game mode/risk.
4. Start Stack.
5. Stack grows by stage.
6. Player can Cash Out at safe points.
7. Bonus stages can modify the round.
8. Stack either reaches jackpot territory, cashes out, or breaks.
9. Show result, history, and fairness receipt.

## MVP Screens

1. Intro / Splash
   - STACKS logo.
   - Tagline.
   - RTP / bonus / max multiplier highlights.
   - Play Demo.
   - Start.

2. Lobby / Home
   - Top nav.
   - Demo balance.
   - Start Stacking CTA.
   - Game mode cards.
   - Live round preview.
   - Recent wins.
   - Leaderboard preview.
   - How to Play.
   - Play Smart / responsible gaming footer.

3. Game Screen
   - Top HUD.
   - Demo/Real state.
   - Balance.
   - Current multiplier.
   - Current stage.
   - Stack visualization.
   - Cash-out value.
   - Bet controls.
   - Auto cash-out.
   - Cash Out CTA.
   - Rules.
   - Fairness.
   - History.
   - Sound.

4. Rules Modal
   - How to play.
   - Stage explanation.
   - Bonus explanation.
   - RTP/volatility notes.
   - Responsible-play note.

5. Fairness Modal
   - Client seed.
   - Server seed hash.
   - Nonce.
   - Round result.
   - Verify result action.

6. History Drawer
   - Round time.
   - Bet.
   - Cash-out multiplier.
   - Payout.
   - Result state.
   - Fairness receipt link.

## Game Modes

Classic:

- Clean base mode.
- Lower volatility.
- Good for first-time players.

Bonus Stage:

- Bonus can trigger between early/mid stages.
- Adds extra blocks or multiplier boosts.

High Stage:

- Faster growth.
- Higher break risk.
- Bigger cash-out potential.

Jackpot:

- Rare 25x+ target.
- Highest risk.
- Strong visual payoff.

## Round States

- `idle`
- `betting`
- `starting`
- `stacking`
- `safe_stage`
- `bonus_1`
- `mid_stage`
- `bonus_2`
- `high_stage`
- `bonus_3`
- `final_stage`
- `jackpot`
- `cashed_out`
- `stack_broken`
- `round_complete`
- `insufficient_balance`
- `limit_reached`
- `network_reconnect`

## Required Controls

Always visible:

- Bet amount.
- Start Stack / Cash Out.
- Current multiplier.
- Current win value.
- Balance.
- Demo/Real mode.

Secondary:

- Auto cash-out.
- Half/double bet.
- Risk mode.
- Rules.
- Fairness.
- History.
- Sound.
- Responsible play.

## Responsible-Play Rules

Build from the start:

- Demo mode available before account.
- Session timer.
- Loss/spend reminder.
- Deposit/loss/wager limit architecture.
- Autoplay only with stop-on-profit and stop-on-loss.
- No guaranteed-win text.
- Loss state should be clear, not shaming.

## Fairness Rules

MVP can include placeholder fields, but architecture should support:

- Server seed hash before round.
- Client seed.
- Nonce.
- Final result.
- Verification receipt after round.

Do not claim cryptographic security until the implementation is reviewed.

## First Implementation Slice

Build this first:

1. Static responsive shell from the lobby visual.
2. Intro screen.
3. Playable demo game screen.
4. Demo balance.
5. Bet amount changes.
6. Start Stack.
7. Simulated multiplier progression.
8. Cash Out.
9. Stack Break.
10. Round history.
11. Rules modal.
12. Fairness receipt modal.

## Later

- Real auth.
- Real wallet.
- Deposits/withdrawals.
- KYC.
- Real fairness implementation.
- Promotions.
- VIP.
- Leaderboards.
- Multiple games.
