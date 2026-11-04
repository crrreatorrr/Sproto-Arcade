# Vendored @metaverse/hub-sdk

- repo: https://github.com/crrreatorrr/metaverse-hub
- branch: claude/kind-bardeen-h2fhj8
- sha: ee187cf
- package: packages/hub-sdk @ 0.6.0
- built with: `node tools/vendor-hub-sdk.mjs <path-to-metaverse-hub>`

Story mode (`legacy.html`) is classic scripts and also runs from `file://`, so the SDK is one
IIFE bundle, `hub-sdk.iife.js`, that sets `window.HubSdk`. It exports `createHubSdk`,
`HubEvent`, `HubSdkError`, `RELIC_IDS`, `GAME_IDS`, `SAVE_MAX_BYTES`, `encodeSave` and
`relicForEvent`. `hub-link.js` is the only caller.

Re-vendor whenever packages/hub-sdk changes, and after the hub PR merges re-vendor from hub main.
The SDK drops Relic ids it does not know, so an old bundle hides newer Relics.
