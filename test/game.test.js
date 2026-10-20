"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { createGame, gameSnapshot, getProximity, submitGuess } = require("../src/game");
const { normalizeWord } = require("../src/words");

test("normalizes case, spaces and Portuguese accents", () => {
  assert.equal(normalizeWord("  ÁGUA  "), "agua");
  assert.equal(normalizeWord("ac\u0327a\u0303o"), "acao");
  assert.equal(normalizeWord("rio azul"), "rio azul");
});

test("rejects empty, oversized and malformed guesses", () => {
  assert.equal(normalizeWord("   "), null);
  assert.equal(normalizeWord("palavra".repeat(8)), null);
  assert.equal(normalizeWord("palavra123"), null);
});

test("proximity labels include a distinct correct state and readable tiers", () => {
  assert.equal(getProximity(1).label, "Encontrada");
  assert.equal(getProximity(5).label, "Muito perto");
  assert.equal(getProximity(15).label, "Quente");
  assert.equal(getProximity(30).label, "Morno");
  assert.equal(getProximity(31).label, "Distante");
});

test("accepted guesses have stable ranks and duplicates do not count twice", () => {
  const game = createGame({ random: () => 0 });
  const first = submitGuess(game, "oceano");
  const duplicate = submitGuess(game, " OCEANO ");

  assert.equal(first.ok, true);
  assert.equal(first.guess.rank, 2);
  assert.equal(duplicate.duplicate, true);
  assert.equal(game.guesses.length, 1);
});

test("unknown words are rejected without consuming a guess", () => {
  const game = createGame({ random: () => 0 });
  const result = submitGuess(game, "abacaxi");

  assert.equal(result.ok, false);
  assert.equal(result.error, "UNKNOWN_WORD");
  assert.equal(game.guesses.length, 0);
});

test("non-string input is rejected as invalid without throwing", () => {
  const game = createGame({ random: () => 0 });
  const result = submitGuess(game, 42);

  assert.equal(result.ok, false);
  assert.equal(result.error, "INVALID_GUESS");
  assert.equal(game.guesses.length, 0);
});

test("a correct guess completes the game and only then reveals the answer", () => {
  const game = createGame({ random: () => 0 });
  assert.equal(Object.hasOwn(gameSnapshot(game), "answer"), false);

  const result = submitGuess(game, game.answer);
  assert.equal(result.guess.rank, 1);
  assert.equal(game.status, "won");
  assert.equal(gameSnapshot(game).answer, game.answer);

  const afterWin = submitGuess(game, "água");
  assert.equal(afterWin.error, "GAME_FINISHED");
});

test("a new game can avoid the previous answer", () => {
  const first = createGame({ random: () => 0 });
  const next = createGame({ random: () => 0, excludeAnswer: first.answer });
  assert.notEqual(next.answer, first.answer);
});
