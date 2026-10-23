import test from "node:test";
import assert from "node:assert/strict";
import {
  buildShareText,
  createGame,
  createStore,
  getCurrentStreak,
  getDailyAnswer,
  getDailyGame,
  getDateKey,
  loadStore,
  normalizeWord,
  recordDailyWin,
  saveStore,
  startFreeGame,
  submitGuess
} from "../public/game.js";
import { getRank, targetWords } from "../public/catalog.js";

function makeStorage(initial = null) {
  let value = initial;
  return {
    getItem(key) {
      assert.equal(key, "palavra-perto:v1");
      return value;
    },
    setItem(key, nextValue) {
      assert.equal(key, "palavra-perto:v1");
      value = nextValue;
    },
    get value() {
      return value;
    }
  };
}

test("normalizes Portuguese case and diacritics, rejects malformed guesses", () => {
  assert.equal(normalizeWord("  ÁRVORE  "), "arvore");
  assert.equal(normalizeWord("ac\u0327a\u0303o"), "acao");
  assert.equal(normalizeWord("arco-íris"), "arco-iris");
  assert.equal(normalizeWord("   "), null);
  assert.equal(normalizeWord("palavra123"), null);
  assert.equal(normalizeWord("rio azul"), null);
  assert.equal(normalizeWord("palavra".repeat(8)), null);
  assert.equal(normalizeWord(42), null);
});

test("ranks are stable, exact matches are first, and related words beat unrelated ones", () => {
  assert.equal(getRank("mar", "mar"), 1);
  for (const target of targetWords) assert.equal(getRank(target, target), 1);
  assert.ok(getRank("mar", "oceano") < getRank("mar", "livro"));
  assert.equal(getRank("mar", "nao-cadastrada"), null);
});

test("rejects unknown, duplicate, and malformed guesses without mutating the game", () => {
  const game = createGame({ mode: "daily", date: new Date("2026-10-22T15:00:00Z") });
  const unknown = submitGuess(game, "palavraquenaoexiste");
  const malformed = submitGuess(game, "nuvem!");
  assert.equal(unknown.error, "UNKNOWN_WORD");
  assert.equal(malformed.error, "INVALID_GUESS");
  assert.equal(game.guesses.length, 0);

  const accepted = submitGuess(game, "mar");
  const duplicate = submitGuess(game, " MAR ");
  assert.equal(accepted.ok, true);
  assert.equal(duplicate.error, "DUPLICATE_GUESS");
  assert.equal(game.guesses.length, 1);
});

test("the daily answer is stable by Sao Paulo calendar date across device time zones", () => {
  const beforeMidnightUtc = new Date("2026-10-23T02:59:00Z");
  const afterMidnightUtc = new Date("2026-10-23T03:01:00Z");
  assert.equal(getDateKey(beforeMidnightUtc), "2026-10-22");
  assert.equal(getDateKey(afterMidnightUtc), "2026-10-23");
  assert.equal(getDailyAnswer(beforeMidnightUtc), getDailyAnswer(new Date("2026-10-22T12:00:00-03:00")));
  assert.notEqual(getDailyAnswer(beforeMidnightUtc), getDailyAnswer(afterMidnightUtc));
  assert.equal(new Set(targetWords).size, targetWords.length);
  assert.ok(targetWords.length > 300);
});

test("daily and free games have independent deterministic selection", () => {
  const store = createStore();
  const day = new Date("2026-10-22T12:00:00-03:00");
  const daily = getDailyGame(store, day);
  const again = getDailyGame(store, day);
  assert.equal(daily, again);

  const free = startFreeGame(store, () => 0, day);
  assert.equal(free.answerKey, targetWords[0]);
  assert.equal(store.dailyGames[daily.dateKey], daily);
  assert.throws(() => startFreeGame(store, () => 1, day), RangeError);
});

test("a correct guess completes the game, exposes the answer only on success, and locks further guesses", () => {
  const game = createGame({ mode: "free", date: new Date("2026-10-22T15:00:00Z"), answerKey: "mar" });
  const wrong = submitGuess(game, "livro");
  assert.equal(Object.hasOwn(wrong, "answer"), false);
  const correct = submitGuess(game, "MAR");
  assert.equal(correct.status, "won");
  assert.equal(correct.guess.rank, 1);
  assert.equal(correct.answer, "mar");
  assert.equal(submitGuess(game, "oceano").error, "GAME_FINISHED");
});

test("daily statistics update once and count consecutive Sao Paulo dates", () => {
  const store = createStore();
  const first = createGame({ mode: "daily", date: new Date("2026-10-22T15:00:00Z") });
  submitGuess(first, first.answerKey);
  assert.equal(recordDailyWin(store, first), true);
  assert.equal(recordDailyWin(store, first), false);
  assert.equal(store.stats.played, 1);
  assert.equal(store.stats.distribution["1"], 1);

  const secondDate = new Date("2026-10-24T02:00:00Z");
  const second = createGame({ mode: "daily", date: secondDate });
  submitGuess(second, second.answerKey);
  recordDailyWin(store, second);
  assert.equal(store.stats.currentStreak, 2);
  assert.equal(store.stats.bestStreak, 2);
  assert.equal(getCurrentStreak(store.stats, new Date("2026-10-24T02:00:00Z")), 2);
  assert.equal(getCurrentStreak(store.stats, new Date("2026-10-25T12:00:00Z")), 0);
});

test("local storage reports unavailable and corrupt state explicitly and restores valid state", () => {
  assert.equal(loadStore(undefined).error, "STORAGE_UNAVAILABLE");
  assert.equal(loadStore(makeStorage("{")).error, "CORRUPT_DATA");

  const storage = makeStorage();
  const store = createStore();
  getDailyGame(store, new Date("2026-10-22T15:00:00Z"));
  assert.equal(saveStore(store, storage).ok, true);
  const loaded = loadStore(storage);
  assert.equal(loaded.error, null);
  assert.equal(loaded.store.dailyGames["2026-10-22"].mode, "daily");
});

test("local storage recovery keeps valid games and statistics when a single record is corrupt", () => {
  const date = new Date("2026-10-22T15:00:00Z");
  const store = createStore();
  const daily = getDailyGame(store, date);
  submitGuess(daily, "mar");
  startFreeGame(store, () => 0, date);
  store.stats = {
    played: 1,
    wins: 1,
    currentStreak: 1,
    bestStreak: 1,
    lastWinDateKey: "2026-10-22",
    distribution: { "2": 1 }
  };
  store.dailyGames["2026-10-23"] = { ...daily, dateKey: "2026-10-23", answerKey: "fora-do-vocabulario" };

  const loaded = loadStore(makeStorage(JSON.stringify(store)));
  assert.equal(loaded.error, "CORRUPT_DATA");
  assert.equal(loaded.store.dailyGames["2026-10-22"].guesses.length, 1);
  assert.equal(loaded.store.dailyGames["2026-10-23"], undefined);
  assert.equal(loaded.store.freeGame.answerKey, targetWords[0]);
  assert.equal(loaded.store.stats.wins, 1);
});

test("share text omits the answer and guessed words", () => {
  const game = createGame({ mode: "free", date: new Date("2026-10-22T15:00:00Z"), answerKey: "mar" });
  submitGuess(game, "livro");
  submitGuess(game, "mar");
  const summary = buildShareText(game);
  assert.match(summary, /2 palpites/u);
  assert.doesNotMatch(summary, /livro|mar/u);
  assert.throws(() => buildShareText(createGame({ mode: "free", answerKey: "mar" })), /concluída/u);
});
