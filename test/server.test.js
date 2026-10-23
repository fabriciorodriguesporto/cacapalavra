import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "../server.js";

test("serves the game with a restrictive same-origin policy", async (context) => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  context.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));

  const address = server.address();
  const response = await fetch(`http://127.0.0.1:${address.port}/`);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /Palavra perto/u);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.match(response.headers.get("content-security-policy"), /default-src 'self'/u);
});

test("serves prototypes without exposing files outside the public roots", async (context) => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  context.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  const prototype = await fetch(`${baseUrl}/prototypes/index.html`);
  assert.equal(prototype.status, 200);
  assert.match(await prototype.text(), /Três caminhos/u);
  assert.match(prototype.headers.get("content-security-policy"), /style-src 'self' 'unsafe-inline'/u);

  const hiddenFile = await fetch(`${baseUrl}/SPECS.md`);
  assert.equal(hiddenFile.status, 404);
  const method = await fetch(baseUrl, { method: "POST" });
  assert.equal(method.status, 405);
});

test("returns an explicit server error when a static file cannot be read", async (context) => {
  const server = createServer({
    readFileImplementation: async () => {
      const error = new Error("Simulated read failure.");
      error.code = "EACCES";
      throw error;
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  context.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));

  const originalConsoleError = console.error;
  const loggedErrors = [];
  console.error = (...arguments_) => loggedErrors.push(arguments_);
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/`);
    assert.equal(response.status, 500);
    assert.match(await response.text(), /Não foi possível carregar/u);
    assert.equal(server.listening, true);
    assert.equal(loggedErrors.length, 1);
  } finally {
    console.error = originalConsoleError;
  }
});
