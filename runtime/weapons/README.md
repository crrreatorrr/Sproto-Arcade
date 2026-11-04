# Prototype powers — packet B

Load `runtime/contract.js` before `runtime/weapons/weapons.js` using classic scripts. Run `node runtime/weapons/test.cjs` from repository root.

| ID / asset pack | Charges | Ground modes | Flight / orbit | Direction / behavior |
| --- | --- | --- | --- | --- |
| `prism-rail` / `weapons/prism-rail` | 2 | Yes | Yes | Ground facing; flight explicit normalized `player.aim`, otherwise nearest open living target, otherwise facing. Committed piercing line, damage 8. |
| `ricochet-mine` / `weapons/ricochet-mine` | 2 | Yes | Only explicit stage eligibility and a reachable bounce surface | Forward low skip, two bounces, radius 90, damage 6. Runtime owns gravity and blast geometry. |
| `echo-decoy` / `weapons/echo-decoy` | 1 | Yes | Yes | Stationary at deployment. Redirects next explicitly eligible ordinary aimed volley. 240 tick lifetime. |

Asset clips requested after encounter signoff: `idle`, `windup`, `release`, `recovery`, `impact` for prism and mine; `assemble`, `hold`, `collapse` for decoy. Placeholder effect events are gameplay geometry requests, not animation assets.

The stage's eligible list is authoritative. Unknown/duplicate IDs are removed. Every valid authored opportunity drops one seeded bag item; there is no arbitrary failure roll. The `guaranteed` flag is accepted for teaching events and cannot suppress their reward. Bag shuffling uses only its own salted RNG. Each complete bag contains each eligible ID once, with repeats possible only across a bag reset. Opportunity IDs deduplicate across the whole stage and survive a phase transition. Retry resets IDs, charges, temporary decoy, bag, and seed. Full bag determinism is seed-dependent; teaching drops are fixed for a given seed and eligibility list.

Runtime must call `weapons.tick(world.tick)` each playing tick for decoy expiry and can also pass the current tick to `activate`. This additive method supplies the clock omitted from v1. `phase(mode)` clears the temporary decoy and preserves the slot and charge count. `redirect(volley)` preserves the original object for ineligible volleys and returns a clone for redirected volleys. Returned aim is available as both `target:{x,y}` and `targetX,targetY`; if the input has x/y/vx/vy, velocity is rotated without changing speed. Dash, shield, and fixed volleys never consume the decoy.

An effect receiver returning exactly `false` rejects activation without charge consumption. Exceptions propagate. Renderer/runtime must consume emitted effects; this module does not resolve collisions or render final art. `snapshot()` returns a copy. Occupied slots require deliberate `collect(pickup,true)` replacement. The runtime removes successfully collected pickups from the world; IDs additionally prevent collecting the same identified pickup twice.

Verification uses mocked effect receivers and fake clocks. Actual piercing collisions, mine bounces/blast, hazard destruction, and rendering require the runtime's integration checks. No human playtest or production art was performed by this packet.
