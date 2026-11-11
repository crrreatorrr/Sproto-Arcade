#!/usr/bin/env node
// Vendor @metaverse/hub-sdk into Sproto Arcade as one classic script.
//   node tools/vendor-hub-sdk.mjs <path-to-metaverse-hub>
// Story mode is classic scripts that also run from file://. This writes the hub's own
// IIFE (global HubSDK) from scripts/build-sdk-iife.mjs, byte for byte, and checks it
// against packages/hub-sdk/SOURCE.pin.json. VENDOR.md records the source.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '..');
const hub = resolve(process.argv[2] ?? '../metaverse-hub');
const pkgDir = join(hub, 'packages/hub-sdk');
const pinPath = join(pkgDir, 'SOURCE.pin.json');
const builder = join(hub, 'scripts/build-sdk-iife.mjs');
if (!existsSync(join(pkgDir, 'package.json')) || !existsSync(pinPath) || !existsSync(builder)) {
  console.error(`usage: node tools/vendor-hub-sdk.mjs <path-to-metaverse-hub> (need packages/hub-sdk and scripts/build-sdk-iife.mjs in ${hub})`);
  process.exit(2);
}
if (!existsSync(join(hub, 'node_modules/esbuild/package.json'))) {
  console.error('run `npm ci` in metaverse-hub first (esbuild builds the IIFE)');
  process.exit(2);
}

const git = (...a) => execFileSync('git', ['-C', hub, ...a], { encoding: 'utf8' }).trim();
let branch = git('rev-parse', '--abbrev-ref', 'HEAD');
const sha = git('rev-parse', 'HEAD');
if (branch === 'HEAD') {
  try {
    if (git('rev-parse', 'origin/main') === sha) branch = 'main';
  } catch {
    /* detached checkout with no origin/main */
  }
}
const pkg = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'));
const pin = JSON.parse(readFileSync(pinPath, 'utf8'));
if (pin.version !== pkg.version) {
  console.error(`SOURCE.pin.json version ${pin.version} != package ${pkg.version}`);
  process.exit(1);
}
if (pin.global !== 'HubSDK') {
  console.error(`SOURCE.pin.json global is ${pin.global}, expected HubSDK`);
  process.exit(1);
}

const outDir = join(repo, 'vendor/hub-sdk');
mkdirSync(outDir, { recursive: true });
const out = join(outDir, 'hub-sdk.iife.js');
execFileSync(process.execPath, [builder, '--out', out], { cwd: hub, stdio: 'inherit' });
const bytes = readFileSync(out);
const hash = createHash('sha256').update(bytes).digest('hex');
if (hash !== pin.iifeSha256) {
  console.error(`iife sha256 ${hash} != SOURCE.pin.json ${pin.iifeSha256}`);
  process.exit(1);
}
if (!bytes.toString('utf8').includes('var HubSDK')) {
  console.error('IIFE does not set global HubSDK');
  process.exit(1);
}

const sourceLines = Object.entries(pin.sources).map(([file, sourceHash]) => `- source ${file}: ${sourceHash}`);
const header = [
  '# Vendored @metaverse/hub-sdk',
  '',
  '- repo: https://github.com/crrreatorrr/metaverse-hub',
  `- branch: ${branch}`,
  `- sha: ${sha}`,
  `- package: packages/hub-sdk @ ${pkg.version}`,
  '- built with: `node tools/vendor-hub-sdk.mjs <path-to-metaverse-hub>`',
  '- iife: hub-sdk.iife.js (global HubSDK; classic script, not a CDN import)',
  `- iife sha256: ${hash}`,
  ...sourceLines,
].join('\n');
const rest = `Story mode (\`legacy.html\`) is classic scripts and also runs from \`file://\`, so the SDK is one
IIFE, \`hub-sdk.iife.js\`, that sets \`window.HubSDK\`. The bytes are the hub build from
\`scripts/build-sdk-iife.mjs\`; this tool does not rewrite them, and the sha256 must match
\`packages/hub-sdk/SOURCE.pin.json\`. \`hub-link.js\` calls \`HubSDK.createHubSdk\`, and
\`feedback-link.js\` calls \`HubSDK.installFeedback\` (SDK 0.7.0 and later). \`legacy.html\` and
\`index.html\` pin the file with \`?v=\` set to the first 12 hex digits of that sha256.

${branch === 'main' ? '' : `This copy comes from the hub branch \`${branch}\`, which is not merged to hub main yet.\n`}Re-vendor whenever packages/hub-sdk changes, and after the hub PR merges re-vendor from hub main.
The SDK drops Relic ids it does not know, so an old bundle hides newer Relics.
`;
writeFileSync(join(outDir, 'VENDOR.md'), `${header}\n\n${rest}`);
console.log(`wrote ${out} (${bytes.length} bytes) sha256 ${hash} from ${branch} ${sha}`);
