/* Hub connection for local play: the hub dev proxy and server/docker-compose.yml use the dev
 * server key. tools/build-web.mjs replaces this file in dist/ with the production key from
 * NAKAMA_SERVER_KEY (the only Nakama value that belongs in a client), so no build ships it. */
window.SPROTO_ARCADE_HUB = window.SPROTO_ARCADE_HUB || { serverUrl: '', serverKey: 'defaultkey', hubUrl: '' };
