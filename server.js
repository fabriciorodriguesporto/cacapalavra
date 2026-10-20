"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { createGame, gameSnapshot, submitGuess } = require("./src/game");

const publicDirectory = path.join(__dirname, "public");
const maxRetainedGames = 1000;
const gameRetentionMs = 30 * 24 * 60 * 60 * 1000;
const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"]
]);

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff"
  });
  response.end(JSON.stringify(body));
}

function pruneGames(games, now = Date.now(), reserveSlot = false) {
  for (const [gameId, game] of games) {
    if (now - game.createdAt > gameRetentionMs) games.delete(gameId);
  }

  const targetSize = maxRetainedGames - Number(reserveSlot);
  if (games.size <= targetSize) return;

  const oldestFirst = [...games.entries()].sort((left, right) => left[1].createdAt - right[1].createdAt);
  for (const [gameId] of oldestFirst) {
    if (games.size <= targetSize) break;
    games.delete(gameId);
  }
}

async function readJson(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > 4096) {
      const error = new Error("O corpo da solicitação excede o tamanho permitido.");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  if (size === 0) return {};
  let body;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("O corpo da solicitação deve conter JSON válido.");
    error.statusCode = 400;
    throw error;
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    const error = new Error("O corpo da solicitação deve ser um objeto JSON.");
    error.statusCode = 400;
    throw error;
  }
  return body;
}

async function serveStatic(request, response, pathname) {
  const requestedPath = pathname === "/" ? "index.html" : pathname.slice(1);
  const filePath = path.resolve(publicDirectory, requestedPath);
  const relativePath = path.relative(publicDirectory, filePath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    sendJson(response, 404, { error: "NOT_FOUND", message: "Página não encontrada." });
    return;
  }

  try {
    const file = await fs.promises.readFile(filePath);
    const contentType = mimeTypes.get(path.extname(filePath).toLowerCase());
    if (!contentType) {
      sendJson(response, 404, { error: "NOT_FOUND", message: "Arquivo não encontrado." });
      return;
    }
    response.writeHead(200, {
      "Cache-Control": "no-cache",
      "Content-Security-Policy": "default-src 'self'; style-src 'self'; script-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
      "Content-Type": contentType,
      "Referrer-Policy": "same-origin",
      "X-Content-Type-Options": "nosniff"
    });
    response.end(file);
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "EISDIR") {
      sendJson(response, 404, { error: "NOT_FOUND", message: "Página não encontrada." });
      return;
    }
    throw error;
  }
}

function createServer() {
  const games = new Map();

  return http.createServer(async (request, response) => {
    try {
      pruneGames(games);
      const url = new URL(request.url, "http://localhost");
      const pathname = decodeURIComponent(url.pathname);

      if (pathname === "/api/health" && request.method === "GET") {
        sendJson(response, 200, { status: "ok" });
        return;
      }

      if (pathname === "/api/games" && request.method === "POST") {
        const body = await readJson(request);
        const previousGame = typeof body.previousGameId === "string"
          ? games.get(body.previousGameId)
          : null;
        pruneGames(games, Date.now(), true);
        const game = createGame({ excludeAnswer: previousGame?.answer ?? null });
        games.set(game.id, game);
        sendJson(response, 201, {
          gameId: game.id,
          language: "pt-BR",
          rulesVersion: 1
        });
        return;
      }

      const gameRoute = pathname.match(/^\/api\/games\/([0-9a-f-]+)(?:\/(guesses))?$/iu);
      if (gameRoute) {
        const game = games.get(gameRoute[1]);
        if (!game) {
          sendJson(response, 404, { error: "GAME_NOT_FOUND", message: "Esta partida não está mais disponível." });
          return;
        }

        if (gameRoute[2] === "guesses" && request.method === "POST") {
          const body = await readJson(request);
          const result = submitGuess(game, body.guess);
          if (!result.ok) {
            sendJson(response, result.statusCode, {
              error: result.error,
              message: result.message
            });
            return;
          }
          sendJson(response, 200, {
            duplicate: result.duplicate,
            guess: result.guess,
            game: gameSnapshot(game)
          });
          return;
        }

        if (!gameRoute[2] && request.method === "GET") {
          sendJson(response, 200, gameSnapshot(game));
          return;
        }
      }

      if (pathname.startsWith("/api/")) {
        sendJson(response, 404, { error: "NOT_FOUND", message: "Recurso não encontrado." });
        return;
      }
      if (request.method !== "GET" && request.method !== "HEAD") {
        sendJson(response, 405, { error: "METHOD_NOT_ALLOWED", message: "Método não permitido." });
        return;
      }
      await serveStatic(request, response, pathname);
    } catch (error) {
      if (error.statusCode) {
        sendJson(response, error.statusCode, { error: "INVALID_REQUEST", message: error.message });
        return;
      }
      console.error("Falha ao processar solicitação:", error);
      sendJson(response, 500, { error: "INTERNAL_ERROR", message: "Não foi possível concluir a solicitação." });
    }
  });
}

if (require.main === module) {
  const server = createServer();
  const port = Number(process.env.PORT || 4173);
  server.listen(port, "127.0.0.1", () => {
    console.log(`CaçaPalavra disponível em http://127.0.0.1:${port}`);
  });
}

module.exports = { createServer, pruneGames };
