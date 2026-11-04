> ARCHIVED: animation production and Higgsfield jobs are stopped at the user’s direction. The prior30+clip request is superseded. This record is not an approval gate for current gameplay tuning.

# Supported Higgsfield production handoff

User authorizes Higgsfield credits as needed or appropriate free models. The encounter timing / critical-pose / hit-area gate remains in force. No generation job has been submitted in this implementation session; reserved credits0, billed credits0, completed production clips0. Authorization is not a claim that a quotation or completed asset exists.

## Verified route (read-only discovery 2026-11-04)

Higgsfield is available here. The current model catalog exposes **autosprite**, AutoSprite Animation, an **image-output** model that creates a game sprite-sheet PNG with optional atlas/audio metadata. Use `models_get(model_id:"autosprite")` to refresh constraints, then `estimate_image_cost` and `generate_image` after approval. Do not send this model to the video generation tool merely because it animates.

Required input: exactly one confirmed image reference, role `image`. Composite machine/operator references should use the approved pose image with the pilot visibly inside the cabin. Current parameters: `kind:"custom"`, unique clip `name`, action `prompt`, `video_tier:"turbo"|"pro"|"max"`, `frame_count:2..64`, `frame_size:32..512`, `remove_bg:"default"|"ultra"`, `with_sound:false` for visual-only packs, and `is_humanoid:false` for the rig composite. The catalog's default25frames describes one clip; it does not satisfy25 distinct animation requirements. Exact observed constraints are in higgsfield-autosprite-model.json.

No exact credit quote is retained: it requires the selected approved reference and final parameters. Existing free allowances returned by discovery were Genjutsu motion-transfer/object-replacement and AI character-sheet workflows; that does not establish free AutoSprite coverage. Unlimited trial was not spendable at inspection. Obtain the supported estimate instead of assuming a free model or sufficient budget for the whole campaign.

For an alternative video-to-atlas pipeline, the catalog recommended `seedance_2_5` (image/start/end references,4..30seconds,480p/720p/1080p). This is a fallback requiring extraction and event alignment, not a verified finished sprite pipeline. Free motion transfer requires an actual approved driving video; none has been submitted.

## Asset references and production batches

- Every encounter's simulation source and cue timeline: stages/<stage-id>/stage.js and timing.md.
- Required per-boss motion IDs, purpose and phase: art/rework/bosses/<stage-id>/manifest.js `plannedClips`.
- Initial visual reference boards: bosses/01-marina,07-moonkeep,11-rooftop/reference.svg and gameplay-scale.svg, linked from art-review.html.
- The other nine bosses now have both-phase gameplay reference guides with pilot/target overlays in their pack folders. They still require concept/look development and critical-pose approval before final clips; a gameplay guide is not final character artwork.
- Existing identity sprites: assets.js resolves each stage.operatorSprite; runtime/sprite-bounds.js records visible alpha bounds. Preserve those identities and the machine component specified in the handoff.
- Highest-priority Codebreak36clip list: stages/12-codebreak/timing.md. Current placeholder articulation is smooth but is not production sprite footage.

For each approved clip, rasterize the approved reference at the agreed scale, transfer through supported `media_upload` → bytes transfer → `media_confirm`, and retain returned media_id. The attachment-only upload helper is reserved for actual user-provided ChatGPT attachments, not generated local files. Read current upload tool schemas before transferring. Then quote and submit one distinct motion using its exact inventory ID; retain job IDs and reconcile uncertain submissions before retrying. Use supported wait/status tools and actual returned media.

First batch remains Dave, Big Swole and Goldie for visual continuity, with Codebreak summit motion prioritized for quality review. Proceed by per-encounter approvals and bounded batches. Record the actual quote, credits reserved/billed, status, source job, selected output and rejection/retry reason for every clip. No broad production-spend total can be inferred from this read-only discovery.

## Clip acceptance and integration

Review the rendered result before counting it. Verify actual frame count, alpha/background cleanup, scale, pilot identity, pivot, muzzle/weakpoint anchors, windup/action/recovery markers and continuity at the join. Reject duplicate motion; frames, renamed copies and alternate playback speeds do not increase distinct coverage. Map positive frame durations to the approved fixed-tick cue/release/recovery timeline. Export offline atlases and register manifests through the integration owner; load only appropriate stage packs. Re-run collision/visual and offline playback checks after integration.

Keep `clips` limited to delivered verified assets. Keep `plannedClips` for requests and `productionApproved:false` until the relevant human approval. No final sprite animation has been generated or integrated here.

## Incremental review scope

Final production signoff can cover one named boss/phase or the four-stage slice (Marina, Mudline, Rooftop, Codebreak). Both phases and transformation endpoints should be reviewed for a complete encounter approval. Other encounters remain pending. The initial style-study trio is a separate grouping. See review-start.html and LOCAL-REVIEW.md. No new credit authorization is required for the already-authorized task scope.
