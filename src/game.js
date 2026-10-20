"use strict";

const { randomUUID } = require("node:crypto");
const { findVocabularyEntry, getRank, targetWords } = require("./catalog");

function getProximity(rank) {
  if (rank === 1) return { label: "Encontrada", level: "correct", dots: 5 };
  if (rank <= 5) return { label: "Muito perto", level: "hot", dots: 5 };
  if (rank <= 15) return { label: "Quente", level: "warm", dots: 4 };
  if (rank <= 30) return { label: "Morno", level: "mild", dots: 3 };
  return { label: "Distante", level: "far", dots: 1 };
}

function createGame({ random = Math.random, excludeAnswer = null } = {}) {
  const candidates = targetWords.filter((word) => word !== excludeAnswer);
  if (candidates.length === 0) {
    throw new Error("Não há palavras disponíveis para iniciar uma nova partida.");
  }

  const index = Math.min(candidates.length - 1, Math.floor(random() * candidates.length));
  return {
    id: randomUUID(),
    answer: candidates[index],
    status: "in_progress",
    guesses: [],
    guessKeys: new Set(),
    createdAt: Date.now()
  };
}

function submitGuess(game, rawGuess) {
  if (game.status !== "in_progress") {
    return {
      ok: false,
      statusCode: 409,
      error: "GAME_FINISHED",
      message: "Esta partida já foi concluída. Comece uma nova para continuar."
    };
  }

  const entry = findVocabularyEntry(rawGuess);
  if (!entry) {
    const hasText = typeof rawGuess === "string" && rawGuess.trim().length > 0;
    return {
      ok: false,
      statusCode: 422,
      error: hasText ? "UNKNOWN_WORD" : "INVALID_GUESS",
      message: hasText
        ? "Essa palavra ainda não está no vocabulário desta versão. Experimente uma palavra de exemplo."
        : "Digite uma palavra antes de enviar."
    };
  }

  if (game.guessKeys.has(entry.key)) {
    const previousGuess = game.guesses.find(({ key }) => key === entry.key);
    return { ok: true, duplicate: true, guess: publicGuess(previousGuess) };
  }

  const rank = getRank(game.answer, entry.key);
  if (rank === null) {
    throw new Error(`Classificação semântica ausente para "${entry.canonicalWord}".`);
  }

  const guess = {
    key: entry.key,
    word: entry.canonicalWord,
    rank,
    proximity: getProximity(rank),
    isCorrect: rank === 1
  };
  game.guesses.push(guess);
  game.guessKeys.add(entry.key);
  if (guess.isCorrect) game.status = "won";

  return { ok: true, duplicate: false, guess: publicGuess(guess) };
}

function publicGuess(guess) {
  return {
    word: guess.word,
    rank: guess.rank,
    proximity: guess.proximity,
    isCorrect: guess.isCorrect
  };
}

function gameSnapshot(game) {
  const snapshot = {
    gameId: game.id,
    status: game.status,
    guessCount: game.guesses.length,
    guesses: game.guesses.map(publicGuess)
  };
  if (game.status === "won") snapshot.answer = game.answer;
  return snapshot;
}

module.exports = {
  createGame,
  gameSnapshot,
  getProximity,
  submitGuess
};
