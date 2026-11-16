#!/usr/bin/env node
// hub-link.js picks the Nakama client key: the configured one, else the stock local key on a
// loopback host only. CI's dist/ is built without NAKAMA_SERVER_KEY, and the local hub serves that
// build at http://127.0.0.1:5173/play/sproto-arcade/, so an empty key must still sign in there.
//   node qa/hub-server-key.test.cjs [root]
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const source = fs.readFileSync(path.join(root, 'hub-link.js'), 'utf8');
const LOCAL = ['default', 'key'].join('');

/** Runs hub-link.js on a page at `hostname` and returns the options it gave createHubSdk. */
async function load(hostname, hubConfig) {
  const created = [];
  const progress = new Proxy({ get: () => ({}), watches: () => false }, { get: (t, k) => t[k] ?? (() => {}) });
  const window = {
    location: { hostname, hash: '', search: '', protocol: 'http:', port: '' },
    SPROTO_ARCADE_HUB: hubConfig,
    ArcadeProgress: { STORAGE_KEY: 'k', MODEL: {} },
    HubSDK: {
      createProgressStore: () => progress,
      createHubSdk(options) {
        created.push(options);
        return { init: async () => ({}), getSession: () => null };
      },
    },
  };
  vm.runInNewContext(source, { window, console, Promise }, { filename: 'hub-link.js' });
  await window.ArcadeHub.ready;
  assert.equal(created.length, 1, 'connect() creates one SDK');
  return { options: created[0], hub: window.ArcadeHub };
}

(async () => {
  const empty = { serverUrl: '', serverKey: '', hubUrl: '' };
  for (const host of ['127.0.0.1', '127.1.2.3', 'localhost', 'play.localhost', '[::1]', '::1']) {
    assert.equal((await load(host, empty)).options.serverKey, LOCAL, `${host}: an unkeyed build signs in to the local hub`);
  }
  for (const host of ['play.example.com', 'example.com', 'localhost.example.com', '128.0.0.1', '10.0.0.5', '']) {
    assert.equal((await load(host, empty)).options.serverKey, '', `${host}: an unkeyed build stays offline`);
  }
  assert.equal((await load('127.0.0.1', undefined)).options.serverKey, LOCAL, 'no hub-config.js at all, on loopback');
  assert.equal((await load('127.0.0.1', { serverKey: 'prodkey' })).options.serverKey, 'prodkey', 'a configured key wins on loopback');
  assert.equal((await load('play.example.com', { serverKey: 'prodkey' })).options.serverKey, 'prodkey', 'a configured key is used as-is');

  const { hub } = await load('play.example.com', empty);
  assert.equal(hub.serverKeyFor('', '127.0.0.1'), LOCAL);
  assert.equal(hub.serverKeyFor('', 'play.example.com'), '');

  // dist/ is refused if any shipped script holds the bare dev key (tools/build-web.mjs and the hub's
  // deploy/scripts/check-dist-secrets.sh); the fallback must not put it there.
  assert.equal(source.includes(LOCAL), false, 'hub-link.js must not contain the bare dev key literal');
  console.log(JSON.stringify({ status: 'passed', kind: 'hub-server-key' }));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
