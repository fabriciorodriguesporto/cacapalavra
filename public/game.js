import { findVocabularyEntry, getRank, targetWords, vocabulary } from "./catalog.js";

export const STORAGE_KEY = "palavra-perto:v1";
export const SAO_PAULO_TIME_ZONE = "America/Sao_Paulo";
const dateAnchor = "2026-10-22";
const maxGuessLength = 40;

export function normalizeWord(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().replace(/\s+/gu, " ").toLocaleLowerCase("pt-BR");
  if (!trimmed || trimmed.length > maxGuessLength) return null;
  const normalized = trimmed.normalize("NFD").replace(/\p{M}/gu, "");
  return /^\p{L}+(?:-\p{L}+)*$/u.test(normalized) ? normalized : null;
}

export function getDateKey(date = new Date()) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new TypeError("A data do desafio precisa ser um objeto Date válido.");
  }
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: SAO_PAULO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function dayNumber(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

function modulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

export function getDailyAnswer(date = new Date()) {
  const dateKey = getDateKey(date);
  const index = modulo(dayNumber(dateKey) - dayNumber(dateAnchor), targetWords.length);
  return targetWords[index];
}

export function createGame({ mode, date = new Date(), answerKey, random = Math.random } = {}) {
  if (mode !== "daily" && mode !== "free") throw new RangeError("O modo precisa ser daily ou free.");
  const dateKey = getDateKey(date);
  let selectedAnswer = answerKey;

  if (mode === "daily") {
    const dailyAnswer = getDailyAnswer(date);
    if (selectedAnswer !== undefined && selectedAnswer !== dailyAnswer) {
      throw new Error("A palavra do desafio diário não pode ser substituída.");
    }
    selectedAnswer = dailyAnswer;
  } else if (selectedAnswer === undefined) {
    const randomValue = random();
    if (!Number.isFinite(randomValue) || randomValue < 0 || randomValue >= 1) {
      throw new RangeError("A função aleatória deve retornar um número entre 0 (inclusive) e 1 (exclusive).");
    }
    selectedAnswer = targetWords[Math.floor(randomValue * targetWords.length)];
  }

  if (!targetWords.includes(selectedAnswer)) throw new RangeError("A palavra-alvo não está habilitada para o jogo.");
  return {
    id: `${mode}-${dateKey}-${mode === "free" ? Math.random().toString(36).slice(2, 8) : "daily"}`,
    mode,
    dateKey,
    answerKey: selectedAnswer,
    guesses: [],
    status: "in_progress",
    statsRecorded: false
  };
}

export function submitGuess(game, value) {
  if (!game || typeof game !== "object") throw new TypeError("A partida é obrigatória.");
  if (game.status !== "in_progress") return { ok: false, error: "GAME_FINISHED" };

  const key = normalizeWord(value);
  if (!key) return { ok: false, error: "INVALID_GUESS" };
  const entry = findVocabularyEntry(key);
  if (!entry) return { ok: false, error: "UNKNOWN_WORD" };
  if (game.guesses.some((guess) => guess.key === key)) return { ok: false, error: "DUPLICATE_GUESS" };

  const rank = getRank(game.answerKey, key);
  if (rank === null) throw new Error("Não foi possível calcular a posição do palpite válido.");
  const guess = { key, word: entry.word, rank, order: game.guesses.length + 1 };
  game.guesses.push(guess);
  if (key === game.answerKey) game.status = "won";

  return { ok: true, guess, status: game.status, ...(game.status === "won" ? { answer: entry.word } : {}) };
}

export function createStore() {
  return {
    version: 1,
    dailyGames: {},
    freeGame: null,
    stats: {
      played: 0,
      wins: 0,
      currentStreak: 0,
      bestStreak: 0,
      lastWinDateKey: null,
      distribution: {}
    }
  };
}

function isValidGame(game, expectedMode) {
  return Boolean(
    game &&
    game.mode === expectedMode &&
    typeof game.dateKey === "string" &&
    targetWords.includes(game.answerKey) &&
    Array.isArray(game.guesses) &&
    (game.status === "in_progress" || game.status === "won") &&
    typeof game.statsRecorded === "boolean" &&
    game.guesses.every((guess, index) =>
      findVocabularyEntry(guess.key) &&
      guess.word === findVocabularyEntry(guess.key).word &&
      Number.isInteger(guess.rank) &&
      guess.rank > 0 &&
      guess.rank <= vocabulary.size &&
      guess.order === index + 1
    ) &&
    new Set(game.guesses.map((guess) => guess.key)).size === game.guesses.length &&
    (game.status !== "won" || game.guesses.at(-1)?.key === game.answerKey) &&
    (game.mode !== "daily" || game.statsRecorded === (game.status === "won"))
  );
}

function isValidStats(stats) {
  return Boolean(
    stats &&
    Number.isInteger(stats.played) && stats.played >= 0 &&
    Number.isInteger(stats.wins) && stats.wins >= 0 &&
    Number.isInteger(stats.currentStreak) && stats.currentStreak >= 0 &&
    Number.isInteger(stats.bestStreak) && stats.bestStreak >= stats.currentStreak &&
    (stats.lastWinDateKey === null || /^\d{4}-\d{2}-\d{2}$/u.test(stats.lastWinDateKey)) &&
    stats.distribution && typeof stats.distribution === "object" &&
    Object.entries(stats.distribution).every(([guessCount, count]) =>
      /^\d+$/u.test(guessCount) && Number(guessCount) > 0 && Number.isInteger(count) && count > 0
    ) &&
    stats.wins === stats.played
  );
}

function isValidStore(value) {
  return Boolean(
    value &&
    value.version === 1 &&
    value.dailyGames &&
    typeof value.dailyGames === "object" &&
    !Array.isArray(value.dailyGames) &&
    (value.freeGame === null || isValidGame(value.freeGame, "free")) &&
    isValidStats(value.stats) &&
    Object.entries(value.dailyGames).every(([dateKey, game]) =>
      /^\d{4}-\d{2}-\d{2}$/u.test(dateKey) && isValidGame(game, "daily") && game.dateKey === dateKey
    )
  );
}

export function loadStore(storage) {
  const empty = createStore();
  if (!storage) return { store: empty, persistent: false, error: "STORAGE_UNAVAILABLE" };

  let raw;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return { store: empty, persistent: false, error: "STORAGE_UNAVAILABLE" };
  }
  if (raw === null) return { store: empty, persistent: true, error: null };

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { store: empty, persistent: true, error: "CORRUPT_DATA" };
  }
  if (!parsed || parsed.version !== 1 || typeof parsed !== "object") {
    return { store: empty, persistent: true, error: "CORRUPT_DATA" };
  }

  const recovered = createStore();
  let hasCorruptData = false;
  if (parsed.dailyGames && typeof parsed.dailyGames === "object" && !Array.isArray(parsed.dailyGames)) {
    for (const [dateKey, game] of Object.entries(parsed.dailyGames)) {
      if (/^\d{4}-\d{2}-\d{2}$/u.test(dateKey) && isValidGame(game, "daily") && game.dateKey === dateKey) {
        recovered.dailyGames[dateKey] = game;
      } else {
        hasCorruptData = true;
      }
    }
  } else {
    hasCorruptData = true;
  }

  if (parsed.freeGame === null || isValidGame(parsed.freeGame, "free")) {
    recovered.freeGame = parsed.freeGame;
  } else {
    hasCorruptData = true;
  }
  if (isValidStats(parsed.stats)) {
    recovered.stats = parsed.stats;
  } else {
    hasCorruptData = true;
  }

  return { store: recovered, persistent: true, error: hasCorruptData ? "CORRUPT_DATA" : null };
}

export function saveStore(store, storage) {
  if (!storage) return { ok: false, error: "STORAGE_UNAVAILABLE" };
  if (!isValidStore(store)) throw new TypeError("O estado do jogo não está em um formato válido.");
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    return { ok: false, error: "STORAGE_UNAVAILABLE" };
  }
  return { ok: true, error: null };
}

export function getDailyGame(store, date = new Date()) {
  const dateKey = getDateKey(date);
  let game = store.dailyGames[dateKey];
  if (!game) {
    game = createGame({ mode: "daily", date });
    store.dailyGames[dateKey] = game;
    const oldKeys = Object.keys(store.dailyGames).sort();
    while (oldKeys.length > 60) {
      const oldestKey = oldKeys.shift();
      delete store.dailyGames[oldestKey];
    }
  }
  return game;
}

export function startFreeGame(store, random = Math.random, date = new Date()) {
  const game = createGame({ mode: "free", date, random });
  store.freeGame = game;
  return game;
}

export function recordDailyWin(store, game) {
  if (game.mode !== "daily" || game.status !== "won" || game.statsRecorded) return false;
  const stats = store.stats;
  const yesterday = new Date((dayNumber(game.dateKey) - 1) * 86_400_000).toISOString().slice(0, 10);

  stats.played += 1;
  stats.wins += 1;
  stats.distribution[String(game.guesses.length)] = (stats.distribution[String(game.guesses.length)] ?? 0) + 1;
  stats.currentStreak = stats.lastWinDateKey === yesterday
    ? stats.currentStreak + 1
    : stats.lastWinDateKey === game.dateKey
      ? stats.currentStreak
      : 1;
  stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
  stats.lastWinDateKey = game.dateKey;
  game.statsRecorded = true;
  return true;
}

export function getCurrentStreak(stats, date = new Date()) {
  if (!stats.lastWinDateKey) return 0;
  const today = getDateKey(date);
  const yesterday = new Date((dayNumber(today) - 1) * 86_400_000).toISOString().slice(0, 10);
  return stats.lastWinDateKey === today || stats.lastWinDateKey === yesterday
    ? stats.currentStreak
    : 0;
}

export function buildShareText(game) {
  if (!game || game.status !== "won") throw new Error("Só é possível compartilhar uma partida concluída.");
  const title = game.mode === "daily" ? `Desafio ${game.dateKey}` : "Partida livre";
  const ranks = game.guesses.map(({ rank }) => `${rank}º`).join(" → ");
  return `Palavra Perto · ${title}\nResolvi em ${game.guesses.length} ${game.guesses.length === 1 ? "palpite" : "palpites"}!\nPosições: ${ranks}`;
}
