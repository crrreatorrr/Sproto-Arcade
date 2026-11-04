# Production animation acceptance

The user's additional requirement is **at least 30 distinct animations for each boss**. Frames inside a clip do not count as distinct animations. Alternate filenames, playback-speed changes, duplicate holds and duplicate rendered motion do not increase coverage. Every accepted clip needs a different observable action or purposeful machine articulation, plus its own cue/action/recovery intent and verified event/anchor metadata.

The pre-production manifests separate `plannedClips` from delivered `clips`. A planned inventory is a production brief, not evidence of finished animation. Minimum campaign scope is 12 ×30 =360 distinct boss clips, before the three pickup powers. A 32-clip inventory for each boss would be384 planned clips. For scale only, twelve frames per clip at that inventory would mean4,608 frame placements; actual lengths must follow approved encounter timing, not an arbitrary frame quota.

Every boss pack must cover both phases: machine/locomotion or articulation transitions, pilot actions, readable anticipation, active release, recovery, shield/dash/objective reactions where applicable, the bespoke transformation, and defeat/escape. Fixed machines should articulate their actual rig, lens, relays or cockpit rather than invent walking cycles. Shared footage may be reused for efficiency, but duplicate motion cannot be counted toward each boss's30 unique clips.

A clip counts as delivered only after its actual offline asset exists, has a source/generation record, parses with positive frame timings, declares pivot/dimensions and critical event markers, and has been reviewed at gameplay scale against its collision bounds. Hash-identical content and visually duplicate motions must be rejected or explicitly excluded from the distinct count. Atlas frames and generated previews are evidence for a clip, not additional clips.

## Codebreak priority

The preserved baseline's `codebreak.js` switches directly between four poses for each of five summit attack image sets (20 PNGs). Those are not20 animations and do not demonstrate30 distinct motions. The draw path uses a fixed body anchor with abrupt pose selection based on attack age. The new placeholder summit initially also had a fixed body and simple sine arm, which is insufficient motion for the requested production quality.

Codebreak Phase2 receives priority for a smooth fixed-tick placeholder articulation pass: landing settle, brace deployment, scanner anticipation/extension, locked release, controlled retraction and recovery, recoil and damage response. Visual movement must preserve the already-tested attack timing and true exposed core bounds. This pass does not count as30 delivered sprite clips; the production manifest must still provide30+ genuinely distinct animations after approval.

## Required approval

The handoff says: “Get signoff on timing, critical poses, and hit area before generating final assets.” The user reinforced the gameplay-first gate when adding the30-animation requirement. Therefore production generation and final animation integration remain gated. Reference candidates are available through `art-review.html`; all production approval flags remain false. No Higgsfield generation or final atlas completion is claimed.

## Boss-specific terminal sequences

Every boss pack must identify a unique terminal clip and intended outcome. A machine defeat may show its mechanism shutting down and its operator escaping; an escape encounter must preserve the story outcome. Goldie's terminal sequence is a failed interception and glider bank-away as the player reaches extraction. Death is only appropriate where the story explicitly calls for it. Renaming the same explosion for twelve bosses does not pass.

The final normal-play acceptance check must trigger the correct terminal sequence through actual defeat/escape progression, clear attack hazards, preserve the recognizable machine/operator component, play the authored terminal event and only then show the clear overlay. The current placeholder runtime clears immediately; final clip integration therefore needs a presentation-only terminal lifecycle before the clear overlay. It must preserve stage-clear accounting and immediate retry while preventing stale attacks from continuing. No terminal production sequence is currently delivered or counted.

Each manifest must track `terminalOutcome` and `terminalClipId`, with the latter resolving to its own distinct request and later verified asset. Include that check in the per-boss30+delivered-clip gate and the normal start-to-clear browser matrix. A planned terminal request is not evidence that the defeat animation has been rendered or played.
