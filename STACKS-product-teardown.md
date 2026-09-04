# STACKS Product Teardown And Blueprint

Research date: 2026-09-04  
Benchmark inspected: https://stake.ac/casino/home  
Mode: logged out only, per user instruction.

## 1. Executive Summary

This teardown studies Stake's public casino experience as a benchmark for designing an original gaming platform and game called STACKS. It intentionally avoids copying brand, artwork, proprietary mechanics, exact UI, or text. The goal is to extract transferable product structure, information architecture, UX patterns, game-category patterns, player flows, and risk controls.

Key observed pattern: Stake uses a dense casino lobby with persistent account CTAs, searchable category rails, public player-count/social activity signals, public game detail pages, and modal-based authentication. Game pages expose a visible game shell even when logged out: play area, bet panel, manual/auto mode, fairness access, game metadata, recommended games, and public bet feeds. Private account, wallet, deposit, withdrawal, transaction, profile, notifications, and KYC flows were not accessed because the user requested continuing without an account.

Recommended STACKS direction: build an original, transparent "stack-building" game around visible risk stages, voluntary cash-out, clear odds/rules, session controls, demo mode, and an account/wallet architecture that treats responsible play as first-class infrastructure rather than buried compliance text.

## 2. Evidence Limits

Observed directly:

- Public casino home: https://stake.ac/casino/home
- Public game pages: Dice, Mines, Plinko, Crash, Keno, Limbo, Chicken.
- Public category pages: Stake Originals, Slots, Burst Games, Live Casino, Game Shows.
- Public auth modals: register, login, forgot-password entry.
- Public footer/support/responsible-gambling/payment/VIP copy.
- Mobile responsive layout using a 390 x 844 viewport.

Login-gated or not completed:

- Account creation, email verification, KYC, passkey login, social login.
- Wallet balance, deposit, withdrawal, transaction history, bonus wallet, private bet history.
- Profile, private settings, notification center, account security settings.
- Live wagering, actual money movement, real post-bet history.

Confidence labels:

- High: directly visible in DOM/screenshot.
- Medium: visible in public explanatory text but not exercised in a live logged-in flow.
- Low: inferred from common casino UX or from inaccessible surfaces.

## 3. Website Architecture

### Header / Top Navigation

Observed: public header includes logo/home link, Login button, Register button, and a collapsible/sidebar toggle on some category pages. On logged-out pages the money/account controls are replaced by authentication CTAs.

Purpose: keep acquisition actions always available while the user browses games.

Access: top of every public casino and game page.

Important components: home/logo link, login CTA, register CTA, sidebar/menu toggle.

User actions: go home, open login modal, open register modal, open navigation/sidebar.

After click: auth actions open modals over the current page and preserve page context with modal URL parameters.

Why effective: users can inspect games first, then convert without losing context.

STACKS decision: keep persistent auth/account area, but use an original visual system and clear "Demo" / "Real" distinction.

### Main Navigation And Sidebar

Observed: category navigation includes Casino Home, My Casino, Only on Stake, New Releases, Stake Originals, Slots, Live Casino. Category pages expose Casino/Sports/Home links and a sidebar toggle. Mobile adds bottom navigation: Browse, Casino, For You, Sports, Chat.

Purpose: separate broad product areas from casino discovery rails.

Access: top rail, sidebar, footer, mobile bottom nav.

Important components: category pills, active state, horizontal scroll on mobile, bottom nav.

User actions: switch section, browse category, access personalized "My Casino" / "For You" surfaces.

Why effective: casino inventory is too large for a single menu; category rails reduce choice overload.

STACKS decision: use Home, Games, STACKS, Rewards, Wallet, Activity, Help. Avoid sports unless it is truly part of the product.

### Casino Homepage / Lobby

Observed: the lobby starts with promotional hero cards, then a search field, category pills, game rails, publishers, live casino, game shows, only-on-platform, burst games, top picks, new releases, live bet feed, SEO/informational content, and footer.

Purpose: acquisition, discovery, retention, education, trust-building, and social proof.

Important components:

- Hero promotion carousel/cards.
- Search field with keyboard hint.
- Category chips.
- Game cards with title, provider, art, and live player count.
- "Load More" buttons per rail.
- Public bet feed tabs: My Bets, All Bets, High Rollers, Race Leaderboard.
- Footer with support, policy, social, certification, language, currency note.

What happens after clicking:

- Category title or chip navigates to category page.
- Game card navigates to game detail/launch page.
- Open-in-widget buttons appear in category pages for quick launch.
- My Bets requires account context.

Why effective: it combines entertainment browsing with live proof that activity is happening now.

STACKS decision: build a lobby around "Play STACKS", "Learn risk stages", "Demo mode", "Recent public rounds", and "Responsible session setup" before scaling to a broad game library.

### Search And Filters

Observed: search field appears on homepage and category pages. Category pages show filters/sort such as Publishers, Popular, Featured.

Purpose: solve the "large catalog" problem and support intent-based discovery.

Actions: search by game/provider/theme; filter by publisher/category; sort by popularity/featured/new.

STACKS decision: MVP search can cover game name, mechanic, volatility, provider, and demo availability. Add filters for volatility, round duration, max multiplier, bonus type, and "learnable in under 60 seconds."

### Game Cards

Observed card fields:

- Game image/art.
- Game name.
- Provider label.
- Live playing count with green indicator.
- Category placement.
- Quick widget/open control on category pages.
- "Load More" expands rails.

Not observed in logged-out card view: RTP, volatility, max win, favorite icon state, jackpot badge on most cards, real personalized recommendations.

Why effective: high visual density with minimal text supports fast scanning.

STACKS decision: use original art and add optional transparency badges: Demo, Fast Round, Adjustable Risk, Fairness, Bonus Stage, Volatility. Do not overload the card face; expose details on hover/tap sheet.

## 4. Complete Screen Inventory

### A. Authentication

Register modal: collects email, username, password, optional referral code, age/terms checkbox. Primary CTA: Register. Secondary: Google, Facebook, Kick, switch to login. Mobile: full-screen modal. Desktop: centered/overlay modal. Observed high confidence.

Login modal: email/username, password, forgot password, Sign In, passkey, Google, "Sign in another way", switch to register. Observed high confidence.

Forgot password: entry point observed from login. Full reset flow not completed. Confidence medium.

Verification/KYC/2FA/session/logout: not accessible without account. Confidence low for implementation details.

STACKS requirement: registration, login, password reset, passkey/social optional, email verification, KYC only where legally required, session timeout, logout, device management, account security settings.

### B. Homepage / Lobby

Casino Home: public catalog surface with hero promotions, search, nav chips, game rails, live feed, footer. Primary CTA: play/open game or register. Secondary CTAs: search, load more, category navigation. Observed high.

My Casino / For You: personalized surfaces visible as navigation labels but login-gated or not populated. Confidence medium.

Loading state: Stake-branded loading screen observed before game page resolves. Confidence high.

### C. Game Discovery

Category page: H1 category title, search, publisher/sort buttons, cards, load more, live public bet table, SEO/help copy, footer. Observed high.

Provider collection: linked from lobby and category pages; not fully inspected. Confidence medium.

Search modal/results: search field observed; full typed search result flow not completed. Confidence medium.

### D. Individual Game

Original game page: play area, bet panel, manual/auto tabs, game controls, fairness button, follow/save, game title, game statistics/description/challenges, RTP, tags, explanatory content, recommended games, bet feed. Observed high.

Slot game page: directly sampled from links; public category inventory confirmed. Detailed provider iframe gameplay not fully exercised. Confidence medium.

Live/table game page: live category inventory confirmed; actual live table interaction not exercised logged out. Confidence medium.

### E. Wallet

Logged-out public copy describes crypto deposits, fiat/local currencies, Swap Crypto, Stake Vault, and account funding. Actual wallet UI is login-gated. Confidence medium for concepts, low for screen details.

STACKS wallet screens: balance overview, deposit, withdraw, transfer/swap if supported, transaction history, pending/failed status, limits, bonus/cash separation, audit trail.

### F. Payments

Public copy mentions BTC, ETH, USDT, EOS, Doge, LTC, SOL, TRX, local currency options including CAD, TRY, VND, ARS, CLP, MXN, USD in Ecuador, INR, PHP, GHS, NGN, Moonpay, Swapped.com, Swap Connect, Mesh, and Swap Crypto. Actual payment providers and availability are jurisdiction/account-dependent and not verified in a logged-in flow.

STACKS should not invent providers before licensing/payment diligence.

### G. Promotions

Observed promotion surfaces: hero promo cards, Daily Races, Weekly Raffle, Stake vs Eddie, Conquer the Casino, JAQKpot, All in or Fold Jackpot, Bad Beat Jackpot, 2x VIP Progress. Promotions category page sampled publicly. Actual eligibility/redemption was not exercised.

### H. VIP

Public text states VIP tier requirements: Bronze $10k, Silver $50k, Gold $100k, Platinum I $250k, Platinum II $500k, Platinum III $1M, Platinum IV $2.5M. Perks described publicly include rakeback, reload offers, and VIP host at high ranks. Observed from public page/home copy.

STACKS should use loyalty carefully: reward learning, healthy session boundaries, and non-wager-only achievements where legally and ethically appropriate.

### I. Leaderboards / Social

Observed public tabs: My Bets, All Bets, High Rollers, Race Leaderboard. Bet feed columns on game/category pages include Game, User, Time, Bet Amount, Multiplier, Payout. Some users shown as "Hidden." Observed high.

### J. Account

Account profile, avatars, private history, security, notifications, preferences: login-gated. Public user names in bet feed are visible where not hidden. Confidence high for public/private split.

### K. Settings

Game-level controls observed: manual/auto mode, bet amount, half/double, profit on win, risk/parameter controls, fairness, dropdown/settings icons. Full account settings inaccessible.

### L. Fairness

Game-level Fairness button observed on original game pages. Public copy describes client seed, server-side systems, hashing, result verification, and third-party verification at a high level. Exact verification UI not fully exercised. Confidence medium.

### M. Support

Live Support button observed. Footer links include Blog, Forum, social links, support contact copy. Detailed support flow not exercised. Confidence medium.

### N. Responsible Gaming

Public copy lists loss limits, wager limits, deposit limits, cooling-off periods, break in play, self-exclusion. Links point to Stake Smart and budgeting calculator. Actual account-limit screens are login-gated. Confidence medium.

### O. Error / Empty / Loading

Observed loading screen and "No Games" placeholder on a recommendation dropdown in one game state. Authentication-blocked/private states inferred from logged-out CTAs. Payment errors not observed.

## 5. Game Category Analysis

### Stake Originals

Observed games include Mines, Dice, Limbo, Blackjack, Plinko, Keno, Crash, Chicken, Hilo, Dragon Tower, Moles, Flip, Wheel, Snakes, Pump, Roulette, Baccarat, Tome of Life, Diamonds, Rock Paper Scissors, Packs, Slide, Darts, Drill, Primedice, Cases, Scarab Spin, Video Poker, Blue Samurai, Tarot, Bars.

Core gameplay: fast, native digital games with simple decisions and transparent controls. Round duration ranges from instant to under a minute. Decision-making is usually high relative to slots: choose risk, odds, picks, cash-out, or path. Visual style: compact dark UI with colorful game visualization. Bet controls: manual/auto, bet amount, half/double, game-specific risk parameters. Fairness: positioned as provably fair. Attractive because they are fast, learnable, and differentiated. Difficult to build because math, fairness, animation, responsible controls, and abuse-resistant automation all need rigor.

### Crash

Core gameplay: multiplier rises until it crashes; player cashes out before crash. Typical round: seconds. Decision-making: timing/risk. Volatility: adjustable by strategy but inherently high suspense. Payout: cash-out multiplier. Social: often works well with live feed and leaderboards. Build difficulty: real-time state synchronization, fairness, latency, and responsible-play pacing.

### Dice

Observed details: 100-sided virtual die, Roll Over/Roll Under, win chance, multiplier, 99.00% RTP, up to 49.50x in public Dice page. Typical round: instant. Decision-making: odds threshold and bet sizing. Auto features: public copy lists number of bets, on-win adjustment, on-loss adjustment, stop on profit, stop on loss. Build difficulty: fairness clarity and preventing confusing odds manipulation.

### Mines

Observed details: grid-based Mines game, number of mines selection, manual/auto, Random Pick, volatility switch tags. Core loop: reveal safe tiles, avoid hidden mines, cash out. Round duration: seconds to a minute. Decision-making: choose mine count and reveal/cash-out timing. Attractive because it blends skill-feeling suspense with simple rules. Build difficulty: fair round generation, explainable probability, tactile tile feedback.

### Plinko

Observed details: ball/pin pyramid, risk/rows concept, payout table by risk level and rows, max multipliers referenced publicly up to 10,000x from home/game copy. Core loop: choose rows/risk, drop ball, watch path. Decision-making: risk setup, not active during drop. Attractive because visual suspense maps directly to outcome. Build difficulty: deterministic animation that matches server result and remains fair.

### Keno

Core gameplay: choose numbers/spots, draw numbers, payout by matches. Round duration: fast. Decision-making: number selection and risk. Build difficulty: clear paytable and fast readable result animation.

### Chicken / Path Games

Core gameplay: choose how far to advance before cashing out; avoid failure state. Round duration: short. Decision-making: press-on vs cash-out. Build difficulty: compelling tension without copying existing art/characters.

### Slots

Observed category includes Gates of Olympus Super Scatter, Odins Vault, Gates of Olympus 1000, Big Duck Splash 1000, Candy Dash 2, Sweet Bonanza 1000, Sugar Rush 1000, Waylanders Forge, Decay, Wanted Dead or a Wild, Big Bass Rock and Roll, Ganja Snail, Minted Mike, High Elf, Witch Blood Megaways, Sweet Bonanza 2500, Duck Hunters, Le Bandit, LIT City, Rage Kitchen, and more.

Core gameplay: set bet, spin reels/grid, resolve symbols/features. Typical round: seconds; bonus rounds longer. Decision-making: bet size, paylines/features, buy bonus where available, autoplay. Volatility: varies by title. Payout: paylines, ways, cluster pays, multipliers, free spins, jackpot features. Build difficulty: art/content volume, math certification, provider integration, jurisdiction controls.

### Live Casino

Observed games include Blackjack, Roulette Lobby, Baccarat Lobby, Dragon Tiger, Extreme Texas Hold'em, Red Door Roulette, Bac Bo, Casino Hold'em, Stock Market, Crazy Time, Crazy Pachinko, MONOPOLY Live, Football Studio, Mega Ball, Funky Time, Lightning variants, Sic Bo, Teen Patti, and others.

Core gameplay: live dealer/table or hosted format. Round duration: medium. Decision-making: table selection, bet placement, side bets. Social features: live dealer/chat/table occupancy. Build difficulty: video infrastructure, provider integration, latency, compliance.

### Game Shows

Observed games include Crazy Time, Ice Fishing, Lightning Roulette, Red Door Roulette, XXXtreme Lightning Roulette, Lightning Storm, MONOPOLY Live, Stock Market, Crazy Balls, MONOPOLY Big Baller, Funky Time, Crazy Coin Flip, Mega Ball, Lightning Dice, Crazy Pachinko, Football Studio, and more.

Core gameplay: host-led betting rounds with multiplier/bonus moments. Attractive because spectacle and anticipation are high. Build difficulty: licensing, live production, bonus math, visual complexity.

### Burst / Instant Games

Observed games include Minedrop 2, Aviator, Keno Xtreme, JetX, Chicken Road 2, Aviamasters, Drop The Boss, Limbo Xtreme, Minedrop, Angry Balls, MegaBlock, Plinko 100000, Golden Goal, Blackjack 100, Football Legend Flip 100000, Aviajet, Chicken Road, Crash variants, Tower Rush, Turbo Mines, and more.

Core gameplay: fast specialty games outside standard reels/table formats. Typical duration: seconds. Decision-making: varies from cash-out timing to pick/reveal to quick prediction. Build difficulty: each title needs its own polished micro-loop and risk explanation.

### Poker / Table / Scratch / Jackpot

Observed from public homepage copy and category links: poker, RNG table games, scratch cards, blackjack, roulette, baccarat, card games, jackpots. Full category pages were not all inspected. STACKS should treat these as phase-two-or-later unless the platform strategy requires multiple verticals.

## 6. Representative Game Analysis

Fields marked "not observed" were not visible in the logged-out public run.

| Game | Category | Provider | Game Type | RTP | Volatility | Max Win | Core Loop | Bonus / Special | Autoplay | Buy Bonus | UI Structure | What Makes It Different |
|---|---|---:|---|---:|---|---:|---|---|---|---|---|---|
| Dice | Stake Originals | Stake Originals | Adjustable odds | 99.00% observed | User-adjusted risk | 49.50x observed | Set roll over/under and bet | Odds slider, win chance, multiplier | Yes, public copy | No observed | Slider, multiplier, roll target, bet panel | Pure probability tuning, instant result |
| Mines | Stake Originals | Stake Originals | Grid reveal | Not observed | Depends on mine count | Not observed | Reveal tiles or cash out | Mine count, random pick | Yes observed | No observed | Grid + bet panel | Active press-your-luck decisions |
| Plinko | Stake Originals | Stake Originals | Drop/physics-style | Not observed | Risk/rows | 10,000x referenced | Drop ball through pins | Risk/row payout table | Yes observed | No observed | Pin board + bet panel | Outcome shown as suspenseful path |
| Crash | Stake Originals | Stake Originals | Cash-out multiplier | Not observed | High | Not observed | Cash out before crash | Live multiplier curve | Likely; not fully inspected | No observed | Multiplier graph + bet/cashout | Real-time timing tension |
| Keno | Stake Originals | Stake Originals | Number draw | Not observed | Spot/risk based | Not observed | Pick numbers, draw result | Random pick | Likely; not fully inspected | No observed | Number grid + bet panel | Fast lottery-like reveal |
| Limbo | Stake Originals | Stake Originals | Target multiplier | Not observed | Player-selected | Not observed | Choose multiplier target | Simple instant reveal | Likely; not fully inspected | No observed | Target + bet panel | Minimal, high-speed multiplier bet |
| Chicken | Stake Originals | Stake Originals | Path/cash-out | Not observed | Stage-based | Not observed | Advance or cash out | Stage progression | Not observed | No observed | Path visualization + bet panel | Character/path pressure |
| Hilo | Stake Originals | Stake Originals | Card prediction | Not observed | Decision-dependent | Not observed | Guess higher/lower | Card sequence | Not observed | No observed | Cards + bet panel | Repeated micro-decisions |
| Dragon Tower | Stake Originals | Stake Originals | Tower pick | Not observed | Difficulty-dependent | Not observed | Pick safe tiles by row | Difficulty ladder | Not observed | No observed | Tower/grid + bet panel | Vertical progression suspense |
| Wheel | Stake Originals | Stake Originals | Wheel spin | Not observed | Risk/segments | Not observed | Choose risk, spin wheel | Risk settings | Not observed | No observed | Wheel + bet panel | Familiar wheel anticipation |
| Gates of Olympus 1000 | Slots | Pragmatic Play | Cascading slot | Not observed here | Not observed | Not observed | Bet/spin, cascade wins | Multipliers/free spins likely, not verified here | Not observed | Not observed | Provider slot frame | High-recognition slot franchise |
| Gates of Olympus Super Scatter | Slots | Pragmatic Play | Slot | Not observed | Not observed | Not observed | Spin reels/grid | Super scatter theme inferred from title | Not observed | Not observed | Card + game page link | Popular/high player count |
| Sweet Bonanza 1000 | Slots | Pragmatic Play | Candy/cascade slot | Not observed | Not observed | Not observed | Spin/cascade | Bonus mechanics not verified here | Not observed | Not observed | Provider slot frame | Theme-led, mass-market visual clarity |
| Sweet Bonanza 2500 | Slots | Pragmatic Play | Slot | Not observed | Not observed | Not observed | Spin/cascade | Bonus mechanics not verified here | Not observed | Not observed | Provider slot frame | Higher-number variant suggests larger potential |
| Wanted Dead or a Wild | Slots | Hacksaw Gaming | Slot | Not observed | Not observed | Not observed | Spin | Bonus mechanics not verified here | Not observed | Not observed | Provider slot frame | Distinct western outlaw theme |
| Le Bandit | Slots | Hacksaw Gaming | Slot | Not observed | Not observed | Not observed | Spin | Bonus mechanics not verified here | Not observed | Not observed | Provider slot frame | Strong character-series identity |
| Waylanders Forge | Slots | Valkyrie | Slot | Not observed | Not observed | Not observed | Spin | Not observed | Not observed | Not observed | Provider slot frame | High fantasy crafting theme |
| Minedrop 2 | Burst | Paperclip Gaming | Instant/specialty | Not observed | Not observed | Not observed | Fast specialty loop | Not observed | Not observed | Not observed | Burst game frame | Mines-adjacent arcade presentation |
| Aviator | Burst | Spribe | Crash-style | Not observed | Cash-out risk | Not observed | Cash out before plane leaves | Social crash mechanic inferred by genre | Not observed | No observed | Real-time crash frame | Multiplayer timing spectacle |
| Chicken Road 2 | Burst | InOut | Path/cash-out | Not observed | Stage-based | Not observed | Advance/cash out | Not observed | Not observed | Not observed | Path frame | Simple "one more step" tension |
| Drop The Boss | Burst | Mirror Image Gaming | Arcade drop | Not observed | Not observed | Not observed | Drop/impact win loop | Not observed | Not observed | Not observed | Arcade frame | Novel physics/comedy style |
| Blackjack | Live Casino | Evolution | Live table | Not observed | Table-game | Table dependent | Place hand bets, play against dealer | Side bets possible but not verified | Not observed | No | Live table lobby/frame | Known casino rules, live dealer trust |
| Roulette Lobby | Live Casino | Evolution | Live table lobby | Not observed | Bet-dependent | Table dependent | Select table/place bets | Lightning variants nearby | No | No | Lobby/table selector | Many bet types, table choice |
| Baccarat Lobby | Live Casino | Evolution | Live table lobby | Not observed | Bet-dependent | Table dependent | Bet Banker/Player/Tie | Side bets possible but not verified | No | No | Lobby/table selector | Low decision complexity |
| Crazy Time | Game Shows | Evolution | Live game show | Not observed | Bonus/multiplier | Not observed | Bet on wheel outcomes | Bonus rounds | No | No | Live host/game-show frame | Spectacle-heavy bonus play |
| Lightning Roulette | Game Shows / Live | Evolution | Roulette variant | Not observed | Bet-dependent | Not observed | Roulette with lightning multipliers | Random multipliers | No | No | Live roulette frame | Traditional roulette plus multiplier drama |

## 7. Gameplay Screenshot / Visual Analysis

Screenshots were viewed in the browser during this run but not saved as local files due to the in-app browser export limitation. Visual findings are based on captured browser screenshots and accessibility snapshots.

### Casino Home Visual

Visible: dark background, logo/header, Login/Register, horizontal hero promo cards, search field, category chips, game rails, game cards, player counts, bottom mobile nav. Clickable: auth buttons, hero cards, search, category chips, game cards, load more, bottom nav. Hierarchy: acquisition CTAs top, discovery next, game content below. Color: dark base with saturated game art and blue primary CTAs. Why it works: content art carries visual energy while the shell stays dense and navigable.

### Dice Loading

Visible: centered brand loader on dark background. Purpose: masks app/game initialization. STACKS should use a branded but original loader with progress/error fallback and avoid indefinite spinners.

### Dice Gameplay Idle

Visible: number scale 0-100, central slider, red/green win/loss zones, multiplier, roll-over, win chance, blue Bet button, bet amount, half/double controls, profit-on-win preview, Manual/Auto tabs, fairness button, bottom mobile nav. Clickable: bet fields, slider, roll direction, manual/auto, fairness, dropdown/settings icons, login/register. Why it works: the player sees risk and reward before committing.

### Register Modal

Visible: full-screen overlay on mobile, title, fields, referral disclosure, terms/age checkbox, register CTA, social auth, login switch. Why it works: keeps the game visible underneath while prioritizing conversion.

### Login Modal

Visible: email/username, password, reveal icon, forgot password, sign-in CTA, passkey, Google, another way, register switch. Why it works: multiple sign-in paths reduce friction.

### Category Page

Visible: H1 category, search, publisher/popular/featured filters, dense grid, open-in-widget buttons, live public bet table, educational content. Why it works: supports both fast action and long-tail SEO/education.

### Mobile Home

Visible: header shrinks, hero cards become horizontally scrollable, category chips scroll horizontally, four-column card rows at 390px, persistent bottom nav. Risk: at narrow widths some hero content is clipped; bottom nav can compete with game controls. STACKS should preserve touch targets and keep the primary game action above or integrated with the bottom control safe area.

## 8. Top Bar / Game HUD Analysis

Observed always visible logged out:

- Logo/home.
- Login.
- Register.
- Game play area.
- Bet button.
- Bet amount.
- Half/double bet controls.
- Manual/Auto.
- Game-specific controls.
- Fairness button on original games.
- Mobile bottom nav.

Observed contextual:

- Save game/follow.
- Game statistics, description, challenges tabs.
- Recommended games.
- Public bet feed.
- Open-in-widget controls on category pages.
- Loading screen.
- Auth modal overlay.

Likely inside settings/menu, not fully observed:

- Sound/music.
- Game info/rules.
- Hotkeys.
- Animation speed/turbo.
- Currency preferences.
- Account/profile/security.
- Responsible gaming controls.

STACKS HUD recommendation:

- Top bar: STACKS logo, back/lobby, demo/real toggle, balance, deposit/wallet, profile, help.
- Game status strip: current multiplier, current stage, next-risk indicator, round timer only if needed.
- Main area: stack visualization, stage markers, active risk lane, win/loss feedback.
- Bet panel: bet amount, quick adjust, max/clear where appropriate, potential payout, cash-out CTA, start CTA.
- Secondary tray: fairness, rules, history, sound/music, autoplay, limits.
- Safety: session spend/time indicator and quick break link accessible from game screen.

## 9. Menu & Settings

Observed menu hierarchy from public surfaces:

CASINO
- Casino Home
- My Casino
- Only on Stake
- New Releases
- Stake Originals
- Slots
- Live Casino
- Game Shows
- Burst Games
- Publishers
- Promotions
- VIP Club
- Provably Fair
- Responsible Gambling / Stake Smart
- Blog / Forum / Support

Recommended STACKS hierarchy:

STACKS PLATFORM
- Home
- Play STACKS
- Games
- Demo Mode
- Rewards
- Leaderboards
- Wallet
- Activity
- Fairness
- Help
- Responsible Play
- Settings

STACKS SETTINGS
- Account
- Security
- Verification
- Wallet Preferences
- Sound
- Music
- Motion
- Language
- Notifications
- Gameplay
- Autoplay
- Responsible Play Limits
- Privacy / Public Profile

## 10. Login / Register Journey

Observed:

LANDING or GAME -> Register modal -> account details -> terms/age confirmation -> Register. Social options: Google, Facebook, Kick.  
LANDING or GAME -> Login modal -> email/username + password -> Sign In. Alternatives: passkey, Google, another way. Forgot password exists as entry point.

Not observed:

Email verification, OTP, KYC, 2FA, logout, session handling.

STACKS full journey:

1. Landing/lobby.
2. Choose Demo or Create Account.
3. Register with email/username/password or passkey/social.
4. Confirm age/terms and jurisdiction eligibility.
5. Verify email.
6. Complete required KYC only when legally required before deposits/withdrawals.
7. Land in guided home with demo balance or verified wallet.
8. Open wallet.
9. Deposit.
10. Play.
11. Access activity/fairness/responsible controls at any time.

## 11. Wallet / Money Flow

Observed public concepts:

- Account funding via crypto and local currencies.
- Crypto examples: BTC, ETH, USDT, EOS, Doge, LTC, SOL, TRX.
- Fiat/local currency examples: CAD, TRY, VND, ARS, CLP, MXN, USD in Ecuador, INR, PHP, GHS, NGN.
- Swap Crypto in wallet.
- Vault for fund storage.
- Moonpay, Swapped.com, Swap Connect, Mesh mentioned publicly.

Not observed:

- Actual deposit/withdrawal UI.
- Payment method eligibility.
- Transaction history.
- Failed/pending states.
- Limits UI.
- Bonus/cash balance split.

STACKS money-flow UX:

HOME -> WALLET -> BALANCE OVERVIEW -> ADD FUNDS -> METHOD SELECTION -> AMOUNT -> REVIEW -> SUBMIT -> PENDING/SUCCESS/FAILED -> RECEIPT -> ACTIVITY HISTORY.

WITHDRAW:

WALLET -> WITHDRAW -> METHOD/ADDRESS/BANK -> AMOUNT -> SECURITY CHECK -> REVIEW -> SUBMIT -> PENDING -> COMPLETED/FAILED -> RECEIPT.

Rules for STACKS:

- Never hide fees, limits, lockups, wagering requirements, or withdrawal restrictions.
- Show cash balance, bonus balance, locked rewards, and withdrawable balance separately.
- Put transaction history and responsible limits in the same wallet area.

## 12. Promotions / Bonus System

Observed promotion types/surfaces:

- Hero cards on casino home.
- Daily Races.
- Weekly Raffle.
- Stake vs Eddie.
- Conquer the Casino.
- JAQKpot.
- All in or Fold Jackpot.
- Bad Beat Jackpot.
- 2x VIP Progress.
- Casino promotions category links.
- Game detail "Challenges" tab.

Observed flow pattern:

Promotion surface -> promotion detail page -> eligibility/rules -> play qualifying games -> progress/leaderboard/reward.

Not observed:

Actual opt-in, redemption, expiry countdowns, private bonus wallet.

STACKS promotion architecture:

- Welcome: demo-first onboarding reward, not deposit pressure.
- Daily challenge: bounded, low-risk, transparent eligibility.
- Weekly leaderboard: opt-in, budget-aware.
- Game mastery: learn rules, complete demo milestones.
- Cashback/rakeback: only where legal and clearly explained.
- Expiry: always visible.
- Redemption: single screen with terms, progress, and "what can I withdraw?"

## 13. VIP / Loyalty

Observed:

- VIP Club publicly described.
- Wager requirements table from Bronze to Platinum IV.
- Perks: rakeback, reload offers, VIP host at top ranks.
- 2x VIP progress promotion surfaced in hero and "Only on Stake" rail.

Psychological/product pattern:

- Visible long-term progression.
- Status tiers.
- Reward anticipation.
- Personalized treatment at high tiers.

Responsible design caution:

Do not use loyalty to push loss-chasing or excessive play. STACKS should include cooling-off-friendly loyalty, transparent reward value, and progress that can include non-wager actions such as learning, responsible limit setup, account security, and fair-play education.

## 14. Leaderboards / Social Features

Observed:

- Public bet feed on lobby and game pages.
- Tabs: My Bets, All Bets, High Rollers, Race Leaderboard.
- Columns observed on game/category pages: Game, User, Time, Bet Amount, Multiplier, Payout.
- Some users are listed as Hidden.
- Feed updates frequently.

Public vs private:

- Public: game, displayed username or Hidden, time, amount, multiplier, payout for visible feed items.
- Private/login-gated: "My Bets" and account-specific history.

STACKS decision:

- Make public visibility opt-in.
- Default sensitive account history to private.
- Let users mask name, amount bands, or all activity.
- Use social proof carefully: show educational public rounds and fairness proofs, not only giant wins.

## 15. Provably Fair / Fairness

Observed:

- Fairness button on original game pages.
- Public copy describes provably fair gameplay, result checking, hashing, and third-party verification.
- Dice/Mines/Plinko pages link to provably fair content.

Not fully observed:

- Exact seed-management UI.
- Exact verifier fields.
- Post-round seed history.

STACKS fairness journey:

GAME -> Fairness -> Current Round Inputs -> Client Seed / Server Seed Hash / Nonce -> Round Result -> Verify -> Result History.

High-level architecture:

- Before round: show server seed hash and client seed.
- During round: lock outcome server-side before animation.
- After round: expose nonce, result, and verification path.
- Rotation: allow seed rotation with clear explanation.
- Do not claim security properties unless cryptographic implementation is independently reviewed.

## 16. Responsible Gaming

Observed public controls listed:

- Loss limits.
- Wager limits.
- Deposit limits.
- Cooling-off periods.
- Break in play.
- Self-exclusion.
- Responsible-gambling information and budgeting calculator links.

STACKS placement:

- Onboarding: set optional budget/session reminders.
- Wallet: deposit/loss/wager limits next to money movement.
- Game HUD: quick break, session time/spend summary.
- Settings: full responsible-play dashboard.
- Promotions: eligibility should respect limits and exclusions.
- Support: clear self-exclusion and help links.

## 17. Mobile UX

Observed:

- Mobile header with logo and auth CTAs.
- Horizontally scrollable hero cards.
- Search near top.
- Category chips in horizontal row.
- Four-column game card grid at 390px.
- Persistent bottom nav: Browse, Casino, For You, Sports, Chat.
- Game page moves bet controls below the play visualization.

Risks:

- Dense rails can create small touch targets.
- Bottom nav and game controls may compete for vertical space.
- Hero card content can clip on narrow screens.

STACKS mobile recommendation:

- Primary game CTA must remain thumb-reachable.
- Use bottom sheet for advanced controls.
- Keep cash-out CTA sticky during active STACKS rounds.
- Use a single bottom nav with no more than five items.
- Landscape gameplay should prioritize game canvas + compressed controls.
- Portrait gameplay should stack: stage display, play area, action controls, history.

## 18. UX Patterns

| Pattern | Where Used | Why It Works | Advantage | Possible Problem | STACKS Original Version |
|---|---|---|---|---|---|
| Modal auth over current context | Login/register from game/lobby | Preserves intent | Less navigation loss | Can feel interruptive | Keep context, add demo-first option |
| Category rails | Lobby | Reduces catalog overload | Fast browsing | Can bury filters | Fewer MVP rails, clearer filters |
| Live player counts | Game cards | Social proof | Signals activity | Can pressure users | Use "active demo/real rounds" carefully |
| Public bet feed | Lobby/game pages | Makes platform feel alive | Trust/activity signal | Privacy and harm risk | Opt-in masked feed with responsible defaults |
| Game-specific controls | Original games | Makes math tactile | User agency | Can confuse beginners | Progressive disclosure with plain rules |
| Manual/Auto tabs | Game pages | Supports different play styles | Power-user retention | Autoplay harm risk | Autoplay gated behind limits and reminders |
| Fairness button in HUD | Original games | Trust at moment of play | Transparency | Hard to understand | Plain-language verifier + advanced details |
| SEO/help copy below products | Category pages | Educates and ranks | Supports novices | Page can feel long | Help center articles linked from UI |
| Bottom mobile nav | Mobile | Thumb navigation | Fast switching | Steals vertical space | Context-aware bottom nav, hide during active round |
| Load More per rail | Lobby/category | Controls density | Lightweight pagination | Repetitive browsing | Infinite grid only after filters |

## 19. Information Architecture

Recommended STACKS sitemap:

HOME
- Play STACKS
  - Demo
  - Real Play
  - Rules
  - Fairness
  - Round History
- Games
  - STACKS Originals
  - Fast Rounds
  - Strategy / Choice
  - Slots / Partner Games, phase 2 if applicable
  - Live / Table, phase 3 if applicable
  - Providers
- Discover
  - New
  - Popular
  - Low Volatility
  - High Multiplier
  - Beginner Friendly
  - Bonus Features
- Rewards
  - Promotions
  - Challenges
  - Leaderboards
  - Loyalty
- Wallet
  - Balance
  - Deposit
  - Withdraw
  - Transactions
  - Limits
  - Bonus Terms
- Activity
  - My Bets
  - Game History
  - Public Rounds
  - Fairness Verifications
- Account
  - Profile
  - Security
  - Verification
  - Privacy
  - Notifications
- Responsible Play
  - Limits
  - Reality Checks
  - Break
  - Cool-off
  - Self-exclusion
  - Help Resources
- Support
  - Help Center
  - Live Support
  - Policies
  - Contact

## 20. STACKS Product Recommendation

### Keep

1. Public browsing before account creation.
2. Search near the top of the lobby.
3. Category rails for discovery.
4. Game cards with provider/type/activity metadata.
5. Modal auth that preserves game context.
6. Visible game controls before play.
7. Demo/fun play.
8. Fairness access from game screen.
9. Public game descriptions and rules.
10. Recent activity/history surfaces.
11. Mobile bottom navigation.
12. Responsible-gaming content and controls.
13. Live support entry.
14. Load-more/pagination for large catalogs.
15. Game recommendations below a game page.
16. Clear RTP/math area where applicable.
17. Manual vs advanced play modes.
18. Promotion landing/detail pages.
19. VIP/loyalty dashboard, with safeguards.
20. Footer trust, policy, support, language links.

### Modify

1. Make responsible controls visible earlier.
2. Make demo/real state unmistakable.
3. Replace wager-only VIP progress with healthier progression.
4. Use opt-in social visibility.
5. Add beginner-friendly explanations beside advanced controls.
6. Make mobile controls less vertically crowded.
7. Use game cards that reveal volatility/RTP on demand.
8. Make fairness understandable for non-technical users.
9. Keep promotions transparent and bounded.
10. Reduce homepage rail sprawl for MVP.

### Remove

1. Any copied brand identity, art, logos, typography, or names.
2. Any exact game clone.
3. Hidden wagering requirements.
4. Aggressive default autoplay.
5. Social pressure around high losses/wins.
6. Ambiguous bonus terms.
7. Unclear balance types.
8. Infinite spinners without fallback.
9. Login walls before learning the product.
10. Confusing private/public bet visibility.

### Add

1. STACKS risk-stage preview.
2. Stage-by-stage cash-out education.
3. Built-in session budget setup.
4. Post-round fairness receipt.
5. Practice missions in demo mode.
6. "Explain this result" drawer.
7. Volatility simulator in rules.
8. Accessibility-first reduced motion.
9. Transparent round timeline.
10. Privacy controls for public activity.

## 21. STACKS Game Screen Architecture

### Top Bar

- STACKS logo/back to lobby.
- Demo/Real toggle.
- Balance or demo balance.
- Wallet.
- Profile.
- Help.
- Responsible play quick link.

### Game Area

- Central stack visualization.
- Current stage label.
- Current multiplier.
- Next-stage risk indicator.
- Cash-out value.
- Bonus indicators.
- Round timeline.

### Bet Panel

- Bet amount.
- Quick amount controls.
- Potential payout.
- Start Stack CTA.
- Cash Out CTA during active round.
- Manual/Auto tabs.
- Autoplay settings.
- Stop on profit/loss.
- Number of rounds.

### Secondary Controls

- Sound.
- Music.
- Reduced motion.
- Turbo/quick reveal if suitable.
- Rules.
- Paytable.
- Fairness.
- History.
- Settings.

### States

IDLE: player can set bet and risk.  
BETTING: inputs active, potential payout updates.  
STARTING: bet locked, seed/round initialized.  
STACKING: stack grows, multiplier updates.  
1X REACHED: safe base stage confirmed.  
BONUS 1: first bonus possibility appears.  
MID STAGE: meaningful cash-out tension.  
BONUS 2: higher-risk bonus branch.  
HIGH STAGE: strong warning and potential payout.  
BONUS 3: rare bonus sequence.  
10X+: celebratory but readable high multiplier state.  
25X+: major-win state, avoid blocking cash-out.  
JACKPOT: rare top event with clear result receipt.  
CASHED OUT: payout credited, receipt shown.  
STACK BROKEN: loss state, show reason and replay/retry.  
ROUND COMPLETE: history, fairness receipt, next action.

## 22. STACKS Screens, Components, States, Features

### STACKS Home

Components: header, hero play module, demo CTA, featured games, recent public rounds, rewards preview, responsible play link, footer. Primary CTA: Play Demo / Play STACKS. Secondary: Create account, Learn rules.

### STACKS Game Lobby

Components: search, filters, game cards, category tabs, recent/favorite games, recommended games. Primary CTA: open game. Secondary: favorite, info, demo.

### STACKS Game Screen

Components: HUD, stack visualization, bet panel, cash-out, round history, fairness, settings, rules. Primary CTA: Start Stack / Cash Out. Secondary: change bet, autoplay, rules, fairness.

### STACKS Login

Components: email/username, password, passkey/social optional, forgot password, register switch. Primary CTA: Sign In.

### STACKS Register

Components: email, username, password, age/terms, jurisdiction notice, optional referral. Primary CTA: Create Account.

### STACKS Intro / Splash

Components: branded loader, progress indicator, retry/error state, "continue in demo" when real mode fails.

### STACKS Wallet

Components: total balance, cash balance, bonus balance, withdrawable amount, deposit, withdraw, transaction history, limits, security reminders.

### STACKS Promotions

Components: active offers, eligibility, progress, expiry, reward, terms, opt-in/out. Primary CTA: Opt in / View details.

### STACKS Leaderboard

Components: daily/weekly/monthly, opt-in privacy, prize pool, rank, score definition, filters.

### STACKS VIP

Components: tier, progress, reward history, clear value, responsible caveats, non-wager achievements.

### STACKS Settings

Components: account, security, privacy, notifications, gameplay, audio, motion, language, limits.

### STACKS Fairness

Components: current seeds, server seed hash, client seed, nonce, result, verifier, history.

### STACKS Game Rules

Components: simple explanation, advanced math, examples, payout table, demo simulator.

### STACKS Help

Components: help search, live support, FAQs, payment help, fairness help, responsible play resources.

### STACKS Responsible Gaming

Components: deposit limit, loss limit, wager limit, session limit, reality checks, break, cool-off, self-exclusion, support links.

## 23. Screenshot / Evidence Table

| Screen / Game | Observation | Source URL | Screenshot Available? | Confidence | Why It Matters | STACKS Decision |
|---|---|---|---|---|---|---|
| Casino home | Header, auth CTAs, hero promos, search, category rails, game cards, player counts, bet feed, footer | https://stake.ac/casino/home | Browser screenshot viewed | High | Defines lobby structure | Build original dense lobby |
| Mobile casino home | Horizontal cards, bottom nav, four-column card grid | https://stake.ac/casino/home | Browser screenshot viewed | High | Mobile is primary casino surface | Thumb-safe STACKS mobile HUD |
| Register modal | Email, username, password, referral, age/terms, social auth | Dice page auth modal | Browser screenshot viewed | High | Conversion without losing context | Use contextual auth modal |
| Login modal | Email/user, password, forgot, passkey, Google, alternate login | Dice page auth modal | Browser screenshot viewed | High | Supports returning users | Add passkey/social optionally |
| Dice | Slider odds, roll over, multiplier, win chance, 99% RTP | https://stake.ac/casino/games/dice | Browser screenshot viewed | High | Template for transparent controls | Show risk/reward before bet |
| Mines | Grid, manual/auto, random pick, save/follow, tabs | https://stake.ac/casino/games/mines | Browser state viewed | High | Press-your-luck layout | Use clear cash-out stages |
| Plinko | Risk/rows/payout concept, fairness, game page tabs | https://stake.ac/casino/games/plinko | Browser state viewed | High | Visual suspense mechanic | Use deterministic result animation |
| Slots | Publisher/popular filters, large inventory, provider cards | https://stake.ac/casino/group/slots | Browser state viewed | High | Catalog scaling pattern | Add filters after MVP |
| Burst Games | Fast specialty games, early access/new releases framing | https://stake.ac/casino/group/burst-games | Browser state viewed | High | Category for STACKS-adjacent loops | Position STACKS as original specialty game |
| Live Casino | Dealer/table categories, live game list | https://stake.ac/casino/group/live-casino | Browser state viewed | High | Separate UX model | Phase 3 only if needed |
| Game Shows | Bonus/multiplier live shows | https://stake.ac/casino/group/game-shows | Browser state viewed | High | Spectacle category | Borrow pacing principles, not format |
| VIP | Tier requirements and perks publicly described | https://stake.ac/vip-club | Browser state viewed | Medium | Loyalty architecture | Ethical loyalty design |
| Fairness | Public fairness button/copy, links to verification pages | https://stake.ac/provably-fair | Browser state viewed | Medium | Trust architecture | Build plain verifier |
| Responsible gaming | Loss/wager/deposit limits, cooling-off, breaks, self-exclusion listed | https://stake.ac/responsible-gambling/stake-smart | Browser state viewed | Medium | Safety architecture | Put limits in wallet and HUD |
| Wallet | Public copy describes currencies/swap/vault but UI gated | Homepage/payment copy | No private wallet screenshot | Medium/Low | Money flow is core | Design from principles; verify later |

## 24. Competitive Matrix

| Game | Category | Core Mechanic | RTP | Volatility | Max Win | Bonus | Autoplay | Buy Feature | Duration | Visual Complexity | Decision Complexity | Social | USP |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Dice | Original | Predict over/under | 99% observed | Adjustable | 49.5x observed | No observed | Yes | No | Instant | Low | Medium | Feed | Odds control |
| Mines | Original | Reveal safe tiles | Not observed | Adjustable | Not observed | No observed | Yes | No | Short | Medium | High | Feed | Cash-out tension |
| Plinko | Original | Drop ball | Not observed | Adjustable | 10,000x referenced | No observed | Yes | No | Short | Medium | Low | Feed | Visual suspense |
| Crash | Original | Cash out before crash | Not observed | High | Not observed | No observed | Not verified | No | Short | Medium | High | Feed | Timing pressure |
| Keno | Original | Number matching | Not observed | Adjustable | Not observed | No observed | Not verified | No | Short | Low | Medium | Feed | Quick draw |
| Limbo | Original | Target multiplier | Not observed | Adjustable | Not observed | No observed | Not verified | No | Instant | Low | Low | Feed | Ultra-fast multiplier |
| Chicken | Original | Advance/cash out | Not observed | Stage-based | Not observed | Not observed | Not observed | No | Short | Medium | High | Feed | Path pressure |
| Hilo | Original | Higher/lower cards | Not observed | Decision-based | Not observed | No observed | Not observed | No | Short | Medium | High | Feed | Repeated decisions |
| Dragon Tower | Original | Tower pick | Not observed | Difficulty | Not observed | No observed | Not observed | No | Short | Medium | High | Feed | Ladder progression |
| Wheel | Original | Spin segments | Not observed | Adjustable | Not observed | No observed | Not observed | No | Short | Medium | Low | Feed | Familiar spectacle |
| Gates of Olympus 1000 | Slot | Cascading slot | Not observed | Not observed | Not observed | Likely; not verified | Not observed | Not observed | Short/bonus | High | Low | Feed | Recognizable franchise |
| Sweet Bonanza 1000 | Slot | Cascading slot | Not observed | Not observed | Not observed | Likely; not verified | Not observed | Not observed | Short/bonus | High | Low | Feed | Candy mass appeal |
| Wanted Dead or a Wild | Slot | Reels | Not observed | Not observed | Not observed | Not verified | Not observed | Not observed | Short/bonus | High | Low | Feed | Distinct theme |
| Le Bandit | Slot | Reels | Not observed | Not observed | Not observed | Not verified | Not observed | Not observed | Short/bonus | High | Low | Feed | Character series |
| Waylanders Forge | Slot | Reels | Not observed | Not observed | Not observed | Not verified | Not observed | Not observed | Short/bonus | High | Low | Feed | Fantasy forge theme |
| Minedrop 2 | Burst | Specialty mines/drop | Not observed | Not observed | Not observed | Not verified | Not observed | Not observed | Short | Medium | Medium | Feed | Arcade mines twist |
| Aviator | Burst | Crash cash-out | Not observed | High | Not observed | Not verified | Not observed | No | Short | Medium | High | Feed | Multiplayer crash |
| Chicken Road 2 | Burst | Path/crossing | Not observed | Stage-based | Not observed | Not verified | Not observed | No | Short | Medium | High | Feed | Simple progression |
| Drop The Boss | Burst | Drop/arcade | Not observed | Not observed | Not observed | Not verified | Not observed | Not observed | Short | High | Medium | Feed | Novel arcade scene |
| JetX | Burst | Crash/flight | Not observed | High | Not observed | Not verified | Not observed | No | Short | Medium | High | Feed | Flight multiplier |
| Blackjack | Live/Table | Dealer card play | Not observed | Rule-based | Table dependent | Side bets not verified | No | No | Medium | High | High | Live | Classic decisions |
| Roulette Lobby | Live/Table | Wheel/table bets | Not observed | Bet-dependent | Table dependent | Lightning variants nearby | No | No | Medium | High | Medium | Live | Many bet types |
| Baccarat Lobby | Live/Table | Banker/player/tie | Not observed | Bet-dependent | Table dependent | Not verified | No | No | Medium | High | Low | Live | Low complexity |
| Crazy Time | Game Show | Wheel + bonuses | Not observed | Bonus-heavy | Not observed | Yes concept | No | No | Medium | Very high | Low | Live | Spectacle bonuses |
| Lightning Roulette | Game Show/Live | Roulette + multipliers | Not observed | Bet-dependent | Not observed | Multipliers | No | No | Medium | High | Medium | Live | Classic plus multiplier |

## 25. Final Product Decision Report

### A. Top 20 Things To Learn

1. Let players browse before registering.
2. Keep search close to the top.
3. Use game rails for fast scanning.
4. Show game activity, but respect privacy.
5. Make game controls visible before play.
6. Separate manual and advanced/auto modes.
7. Expose fairness at the point of play.
8. Keep rules near the game.
9. Use demo mode as onboarding.
10. Put social proof in context.
11. Give each category a distinct browsing path.
12. Use game metadata to educate.
13. Preserve context through auth modals.
14. Keep mobile bottom navigation simple.
15. Design loading and empty states.
16. Make promotions discoverable but explainable.
17. Treat VIP as a dashboard, not just a badge.
18. Use public bet history to build trust carefully.
19. Put responsible-play tools in account and game contexts.
20. Add footer trust/support/policy links.

### B. Top 20 Things Not To Copy

1. Brand name, logo, typography, colors.
2. Game artwork.
3. Exact copy.
4. Exact original game mechanics.
5. Proprietary category naming where unique.
6. Promotion names.
7. VIP tier structure.
8. Provider-specific game framing.
9. Specific iconography.
10. Exact card layout.
11. Exact bet-feed presentation.
12. Exact fairness wording.
13. Exact modal visual design.
14. Exact game HUD arrangement.
15. Any hidden or ambiguous bonus mechanics.
16. Any account-gated flow without your own compliance review.
17. Any autoplay behavior without safeguards.
18. Any irresponsible urgency pattern.
19. Any copied payment claims.
20. Any implied licensing/security claim not verified for STACKS.

### C. Top 20 Features Worth Implementing

1. STACKS demo mode.
2. Real-play mode after verification.
3. Persistent game HUD.
4. Transparent stage multiplier.
5. Cash-out CTA.
6. Bet amount with quick adjust.
7. Profit preview.
8. Game rules drawer.
9. Fairness verifier.
10. Round history.
11. Public activity feed with privacy controls.
12. Lobby search.
13. Game cards.
14. Category filters.
15. Promotions center.
16. Loyalty dashboard.
17. Wallet overview.
18. Transaction history.
19. Responsible-play limits.
20. Mobile bottom nav.

### D. Top 10 Features To Create Differently

1. Loyalty that rewards safe setup and learning.
2. Public feed that defaults to privacy.
3. Promotions with plain-language reward math.
4. Autoplay with strong stop conditions.
5. Fairness shown as a receipt, not a technical maze.
6. Mobile HUD optimized for cash-out reachability.
7. Demo mode as a true learning space.
8. STACKS mechanics based on stack stages, not copied crash/mines.
9. Game cards that reveal risk without visual clutter.
10. Account settings that surface limits, privacy, and security together.

### E. Recommended STACKS MVP

- One original STACKS game.
- Demo and real-mode architecture.
- Login/register/password reset.
- Wallet balance and transaction shell.
- Game rules, fairness receipt, round history.
- Responsible-play limits.
- Lobby with search and game card.
- Public activity feed with opt-in privacy.
- Mobile-first game screen.

### F. Recommended Phase 2

- More original games or variants.
- Promotions/challenges.
- Loyalty dashboard.
- Provider/game catalog expansion if strategically needed.
- Advanced filters and favorites.
- Rich analytics/admin tools.

### G. Recommended Phase 3

- Live/table integrations if licensed and necessary.
- Multi-game tournaments.
- Advanced social features.
- Broader payment rails.
- Native/PWA install polish.
- Localization.

## 26. STACKS Product Blueprint

Core entities:

- User.
- Wallet.
- Balance.
- Transaction.
- Game.
- Round.
- Bet.
- Result.
- Fairness proof.
- Promotion.
- Reward.
- Limit.
- Session.
- Public activity item.

Core components:

- Header.
- Bottom nav.
- Search.
- Category tabs.
- Game card.
- Promotion card.
- STACKS game canvas.
- Bet panel.
- Cash-out control.
- Multiplier display.
- Stage timeline.
- Bonus indicator.
- Round receipt.
- Fairness verifier.
- Rules drawer.
- Activity table.
- Wallet panel.
- Responsible limits panel.
- Auth modal.
- Support launcher.

Critical engineering flows:

- Create user.
- Verify user.
- Start demo round.
- Start real round.
- Lock bet.
- Generate/commit fair result.
- Animate stack progression.
- Cash out.
- Resolve loss.
- Credit/debit wallet.
- Write transaction ledger.
- Write round history.
- Create fairness receipt.
- Apply responsible limits.
- Publish opt-in activity.
- Evaluate promotion eligibility.

Critical UX states:

- Loading.
- Empty.
- Error.
- Logged out.
- Logged in unverified.
- Verified with no balance.
- Insufficient balance.
- Deposit pending.
- Withdrawal pending.
- Limit reached.
- Cool-off active.
- Self-excluded.
- Demo active.
- Real round active.
- Network reconnect.
- Result verification unavailable.

Decision: STACKS should launch as an original, transparent, mobile-first specialty game platform with one polished game loop, not as a broad casino clone. The benchmark's strongest lesson is structural: browse freely, explain clearly, keep controls close to play, make trust visible, and give users a reason to return without burying risk controls.
