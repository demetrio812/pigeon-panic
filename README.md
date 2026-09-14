# Pigeon Panic: Express Mess

The version with polished characters, pickups, and illustrated discovery cards was published on 14 September 2026 at https://pigeon-panic-express.novaware.chatgpt.site. The next local preview adds close-shave rewards, the final frenzy, keyboard discovery controls, visible bomb splats, and a dedicated results card. These additions have not been published.

The game includes animated pigeon heads and tails, victory celebrations, target reactions and splash particles, striped shop awnings, drains, crossings, and parked bikes. The HUD separates player colours around a centred timer and hides the control reminder after six seconds. One aiming ring per pigeon turns green when it is time to drop. Steering accelerates and brakes smoothly; traffic and effects reuse pooled objects.

Open index.html in a modern WebGL browser. Everything is bundled locally.

Choose a character before starting: Crumbs (street strut), Duchess (crown and royal bow), Spikes (mohawk and headbang), or Captain (goggles, scarf, and victory spin). Each player chooses independently, including the same character if desired. Player one keeps coral wing tips and player two blue. Characters have identical gameplay stats, individual head/tail animation rhythms, and matching victory portraits. Character choices remain selected between rounds in the current session.

A fast vertical scrolling road game: pigeons stay near the bottom while cars, motorcycles, bicycles, pedestrians, and scenery rush downward. Bicycles stay inside the kerbs on both road edges and travel more slowly than cars. Steer onto the pavement for pedestrian targets. Each drop takes 0.24 seconds to land. The aiming marker turns green for a predicted bullseye and amber for a glancing hit.

- Solo: A/D or left/right arrows to steer; tap Space to drop.
- Two pigeons on one shared road: coral uses A/D + Space; blue uses left/right arrows + Enter. Keyboard required for two-player mode.
- P pauses; music-note button toggles sound. Touch buttons support solo play.
- Dodge hawks: after a seven-second opening grace period, an orange lane warns of a swoop. The hawk locks its lane before entering, giving you time to steer away. Contact costs up to 100 points, resets your combo, and grants 1.2 seconds of recovery; one hawk can hit each player only once. Scores never go below zero. Hawks also target either player in two-player mode.
- Close shave: safely pass within 1.2 world units of the hawk's collision boundary for +75 points and a quick wink. The bonus is awarded only after the hawk has passed, once per hawk per player. Distant passes, collisions, and invulnerable passes do not qualify.
- Final frenzy: the last 10 seconds bring about 43% more target spawns and double splat points, including target points from bombs. Pickup bonuses and close-shave bonuses keep their usual values. A short arcade melody builds when sound is enabled. Slow motion still slows the road while the round clock continues normally; pause and discovery cards freeze both. The frenzy ends with the round, and respects reduced motion.
- Choose Cruising, Fast, or Unhinged. Speed rises throughout each 60-second round.
- Cars: 50; motorcycles: 150; bicycles: 80; pedestrians: 100. Drops within the central 60% of a target's width and length earn full points; outer hits earn half. Both maintain combos: chain hits within 2 seconds for up to 5× points. Each target can only score once, including partial hits, so players compete for hits.
- One press per drop, with a short cooldown. Holding the key does not fire repeatedly.

Fly into floating pickups to collect +50 points and activate their power immediately:

- Blue clock: slow motion for 10 seconds. Street traffic and hawks run at 45% speed; steering, drops, and the 60-second round clock stay at normal speed. In two-player mode it affects the shared road.
- Orange burst: an instant splat bomb hits all visible, unsplatted street targets for their base points. Those points belong to the collector; bomb hits do not change shooting accuracy or score an already hit target again.
- Purple drop: super splat widens the collector's drops for 10 seconds and can hit several targets at once. A drop keeps its size if the power expires while it is falling.

Active powers have countdown bars. Different powers can overlap; collecting the same timed power refreshes it to 10 seconds. Pausing freezes the powers, and a new round clears them. Pickups appear roughly every 6–8 seconds, starting a few seconds into the round. Unchecking Visual cues hides aiming circles and the orange hawk lane, including while a power is active.

The first time you collect each power, the entire game pauses for an animated discovery card with an original generated 3D illustration, explanation, duration, and bonus details. Continue flight activates the collected power, so none of its duration is spent reading. In two-player mode both players pause and the card names the collector. Acknowledged introductions are remembered in browser storage across rounds and visits; if storage is unavailable they are remembered for the current page session. Card animation respects reduced motion. Artwork and generation prompts are documented in `DISCOVERY-ART.md`.

Press Space or Enter to dismiss a discovery card without firing a drop; held-key repeats do not dismiss it. Bombs work during slow motion, leave visible marks above car roofs, and show the number of fresh targets splatted (or explain when none are on screen).

At the end of each round, a dedicated scorecard shows large scores, accuracy, best combo, drops landed, close shaves, bomb targets, and hawk clips, for both players when playing together. Race again (also Space/Enter) returns to character selection with the previous choices preserved. Hit the road then starts a fresh countdown and resets the round statistics.

Browser integration checks are in `tests/pickups.js`: open the local game with `?test=1`, load that script, and call `runPickupTests()` in the browser console.

Discovery integration checks are in `tests/discovery.js`; run `runDiscoveryTests()` on a fresh `?test=1` page. These reset the discovery history in that test browser.

Near-miss and frenzy checks are in `tests/arcade.js`; run `runArcadeTests()` on a fresh `?test=1` page.

Bomb, keyboard, and results-flow regressions are in `tests/round-flow.js`; run `runRoundFlowTests()` on a fresh `?test=1` page.

MVP: one endless road, local multiplayer, simple hit boxes, no collision damage or online play. High scores persist when browser storage is available. Three.js license: vendor/THREE-LICENSE.txt.

Optional server: `python3 -m http.server 8765` from this folder.
