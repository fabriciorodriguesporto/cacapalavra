"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { createServer, pruneGames } = require("../server");

async function withServer(run) {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
}

test("game API hides the answer until a correct guess", async () => {
  await withServer(async (baseUrl) => {
    const started = await fetch(`${baseUrl}/api/games`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    const game = await started.json();

    assert.equal(started.status, 201);
    assert.equal(Object.hasOwn(game, "answer"), false);

    const stateResponse = await fetch(`${baseUrl}/api/games/${game.gameId}`);
    const state = await stateResponse.json();
    assert.equal(state.status, "in_progress");
    assert.equal(Object.hasOwn(state, "answer"), false);

    const invalidResponse = await fetch(`${baseUrl}/api/games/${game.gameId}/guesses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guess: "palavra inexistente" })
    });
    assert.equal(invalidResponse.status, 422);
    assert.equal((await invalidResponse.json()).error, "UNKNOWN_WORD");
  });
});

test("API returns explicit errors for malformed JSON and missing games", async () => {
  await withServer(async (baseUrl) => {
    const malformed = await fetch(`${baseUrl}/api/games`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{"
    });
    assert.equal(malformed.status, 400);

    const primitiveBody = await fetch(`${baseUrl}/api/games`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "null"
    });
    assert.equal(primitiveBody.status, 400);

    const missing = await fetch(`${baseUrl}/api/games/00000000-0000-0000-0000-000000000000`);
    assert.equal(missing.status, 404);
    assert.equal((await missing.json()).error, "GAME_NOT_FOUND");
  });
});

test("static app is served with security headers", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(baseUrl);
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.match(html, /CaçaPalavra/);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.match(response.headers.get("content-security-policy"), /default-src 'self'/);
  });
});

test("old game sessions are expired and retained sessions are bounded", () => {
  const games = new Map();
  const now = 31 * 24 * 60 * 60 * 1000;
  games.set("expired-game", { createdAt: 0 });
  for (let index = 0; index < 1001; index += 1) {
    games.set(`game-${index}`, { createdAt: now - index });
  }

  pruneGames(games, now, true);

  assert.equal(games.size, 999);
  assert.equal(games.has("expired-game"), false);
  assert.equal(games.has("game-0"), true);
  assert.equal(games.has("game-1000"), false);
});
