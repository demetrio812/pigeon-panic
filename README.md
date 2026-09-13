# Pigeon Panic: Express Mess

Open index.html in a modern WebGL browser. Everything is bundled locally.

A fast vertical scrolling road game: pigeons stay near the bottom while cars, motorcycles, pedestrians, and scenery rush downward. Steer onto the pavement for pedestrian targets. Aim ahead: each drop takes 0.24 seconds to land. The dotted line is an approximate release cue for cars; motorcycles travel faster and pedestrians slower.

- Solo: A/D or left/right arrows to steer; tap Space to drop.
- Two pigeons on one shared road: coral uses A/D + Space; blue uses left/right arrows + Enter. Keyboard required for two-player mode.
- P pauses; music-note button toggles sound. Touch buttons support solo play.
- Choose Cruising, Fast, or Unhinged. Speed rises throughout each 60-second round.
- Cars: 50; motorcycles: 150; pedestrians: 100. Chain hits within 2 seconds for up to 5× points. Each target can only score once, so players compete for hits.
- One press per drop, with a short cooldown. Holding the key does not fire repeatedly.

MVP: one endless road, local multiplayer, simple hit boxes, no collision damage or online play. High scores persist when browser storage is available. Three.js license: vendor/THREE-LICENSE.txt.

Optional server: `python3 -m http.server 8765` from this folder.
