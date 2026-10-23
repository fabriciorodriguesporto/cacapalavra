import {
  buildShareText,
  createStore,
  getCurrentStreak,
  getDailyGame,
  loadStore,
  recordDailyWin,
  saveStore,
  startFreeGame,
  submitGuess
} from "./game.js";

const element = (id) => document.getElementById(id);
const dailyButton = element("daily-mode");
const freeButton = element("free-mode");
const guessInput = element("guess-input");
const feedback = element("feedback");
const storageNote = element("storage-note");
const historyList = element("guess-list");
const sortOrder = element("sort-order");
const helpDialog = element("help-dialog");
const statsDialog = element("stats-dialog");
const shareDialog = element("share-dialog");
const shareText = element("share-text");

let browserStorage = null;
try {
  browserStorage = window.localStorage;
} catch {
  browserStorage = null;
}
const loaded = loadStore(browserStorage);
let store = loaded.store ?? createStore();
let currentGame = getDailyGame(store);
let storageWarning = loaded.error;

function announceStorageWarning() {
  if (!storageWarning) {
    storageNote.hidden = true;
    element("reset-corrupt").hidden = true;
    return;
  }
  storageNote.hidden = false;
  storageNote.textContent = storageWarning === "CORRUPT_DATA"
    ? "Há dados locais inválidos. O que pôde ser recuperado continua disponível nesta sessão; salve para substituir somente os registros inválidos."
    : "O navegador não permite salvar dados localmente. Seu progresso fica disponível apenas enquanto esta página estiver aberta.";
  element("reset-corrupt").hidden = storageWarning !== "CORRUPT_DATA";
}

function persist() {
  if (storageWarning === "CORRUPT_DATA") {
    announceStorageWarning();
    return;
  }
  const result = saveStore(store, browserStorage);
  if (!result.ok) storageWarning = result.error;
  else if (storageWarning !== "CORRUPT_DATA") storageWarning = null;
  announceStorageWarning();
}

function setFeedback(message, isError = false) {
  feedback.textContent = message;
  feedback.classList.toggle("error", isError);
}

function rankLabel(rank) {
  if (rank === 1) return "Encontrada";
  if (rank <= 5) return "Muito perto";
  if (rank <= 25) return "Bem perto";
  if (rank <= 75) return "No caminho";
  return "Mais distante";
}

function rankClass(rank) {
  if (rank <= 5) return "hot";
  if (rank <= 25) return "warm";
  return "cool";
}

function renderHistory() {
  const guesses = [...currentGame.guesses];
  if (sortOrder.value === "nearest") guesses.sort((left, right) => left.rank - right.rank || left.order - right.order);
  else guesses.sort((left, right) => left.order - right.order);

  const fragment = document.createDocumentFragment();
  for (const guess of guesses) {
    const item = document.createElement("li");
    item.className = `guess-item ${rankClass(guess.rank)}`;

    const word = document.createElement("span");
    word.className = "guess-word";
    word.textContent = guess.word;

    const meter = document.createElement("span");
    meter.className = "rank-track";
    meter.setAttribute("aria-hidden", "true");
    const fill = document.createElement("span");
    fill.style.width = `${Math.max(5, 100 - Math.log10(guess.rank) * 24)}%`;
    meter.append(fill);

    const label = document.createElement("span");
    label.className = "rank-label";
    label.setAttribute("aria-label", `${guess.rank}º lugar, ${rankLabel(guess.rank)}`);
    const position = document.createElement("strong");
    position.textContent = `${guess.rank}º`;
    const description = document.createElement("span");
    description.textContent = rankLabel(guess.rank);
    label.append(position, description);

    item.append(word, meter, label);
    fragment.append(item);
  }
  historyList.replaceChildren(fragment);
  element("history-count").textContent = `${guesses.length} ${guesses.length === 1 ? "palavra" : "palavras"}`;
  element("empty-state").hidden = guesses.length > 0;
  element("hint").hidden = guesses.length === 0 || currentGame.status === "won";
}

function formatDate(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "short"
  }).format(date);
}

function renderGame() {
  const isDaily = currentGame.mode === "daily";
  dailyButton.setAttribute("aria-pressed", String(isDaily));
  freeButton.setAttribute("aria-pressed", String(!isDaily));
  element("round-label").textContent = isDaily
    ? `${formatDate(currentGame.dateKey)} · desafio diário`
    : "Partida livre";
  element("guess-count").textContent = String(currentGame.guesses.length);
  const bestRank = currentGame.guesses.reduce((best, guess) => Math.min(best, guess.rank), Infinity);
  element("best-rank").textContent = Number.isFinite(bestRank) ? `${bestRank}º` : "—";
  element("progress-fill").style.width = Number.isFinite(bestRank)
    ? `${Math.max(6, 100 - Math.log10(bestRank) * 22)}%`
    : "4%";

  const won = currentGame.status === "won";
  guessInput.disabled = won;
  element("guess-submit").disabled = won;
  element("win-panel").hidden = !won;
  element("restart-free").hidden = isDaily;
  if (won) {
    const answer = currentGame.guesses.find((guess) => guess.key === currentGame.answerKey);
    element("answer-word").textContent = answer?.word ?? "";
  }
  renderHistory();
  announceStorageWarning();
}

function renderStats() {
  element("stat-played").textContent = String(store.stats.played);
  element("stat-wins").textContent = String(store.stats.wins);
  element("stat-current-streak").textContent = String(getCurrentStreak(store.stats));
  element("stat-best-streak").textContent = String(store.stats.bestStreak);
  const list = element("distribution-list");
  const fragment = document.createDocumentFragment();
  const entries = Object.entries(store.stats.distribution).sort((left, right) => Number(left[0]) - Number(right[0]));
  if (entries.length === 0) {
    const empty = document.createElement("li");
    empty.textContent = "Suas vitórias aparecerão aqui.";
    fragment.append(empty);
  } else {
    for (const [guesses, count] of entries) {
      const row = document.createElement("li");
      const label = document.createElement("span");
      label.textContent = `${guesses} ${Number(guesses) === 1 ? "palpite" : "palpites"}`;
      const value = document.createElement("strong");
      value.textContent = String(count);
      row.append(label, value);
      fragment.append(row);
    }
  }
  list.replaceChildren(fragment);
}

function errorMessage(code) {
  const messages = {
    INVALID_GUESS: "Digite uma palavra usando letras; hífen interno é permitido.",
    UNKNOWN_WORD: "Essa palavra ainda não faz parte do vocabulário do jogo. Tente outra palavra conhecida.",
    DUPLICATE_GUESS: "Você já tentou essa palavra nesta partida.",
    GAME_FINISHED: "Esta partida já foi concluída."
  };
  return messages[code] ?? "Não foi possível registrar o palpite.";
}

element("guess-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const result = submitGuess(currentGame, guessInput.value);
  if (!result.ok) {
    guessInput.setAttribute("aria-invalid", "true");
    setFeedback(errorMessage(result.error), true);
    guessInput.focus();
    return;
  }

  guessInput.value = "";
  guessInput.removeAttribute("aria-invalid");
  if (result.status === "won") {
    if (currentGame.mode === "daily") recordDailyWin(store, currentGame);
    setFeedback(`Você encontrou a palavra: ${result.answer}. Parabéns!`);
  } else {
    setFeedback(`Palpite registrado na posição ${result.guess.rank}º: ${rankLabel(result.guess.rank)}.`);
  }
  persist();
  renderGame();
});

guessInput.addEventListener("input", () => {
  guessInput.removeAttribute("aria-invalid");
  if (feedback.classList.contains("error")) setFeedback("");
});

dailyButton.addEventListener("click", () => {
  currentGame = getDailyGame(store);
  setFeedback(currentGame.status === "won" ? "Você já concluiu o desafio de hoje." : "Desafio do dia selecionado.");
  renderGame();
});

freeButton.addEventListener("click", () => {
  currentGame = store.freeGame ?? startFreeGame(store);
  setFeedback("Partida livre selecionada. Pode começar quando quiser.");
  persist();
  renderGame();
});

element("restart-free").addEventListener("click", () => {
  currentGame = startFreeGame(store);
  setFeedback("Nova partida livre iniciada.");
  persist();
  renderGame();
  guessInput.focus();
});

sortOrder.addEventListener("change", renderHistory);

element("help-open").addEventListener("click", () => helpDialog.showModal());
element("stats-open").addEventListener("click", () => {
  renderStats();
  statsDialog.showModal();
});

for (const button of document.querySelectorAll("[data-close-dialog]")) {
  button.addEventListener("click", () => button.closest("dialog").close());
}

element("share-button").addEventListener("click", async () => {
  const text = buildShareText(currentGame);
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      setFeedback("Resumo copiado. A palavra secreta não foi incluída.");
      return;
    } catch {
      shareText.value = text;
      shareDialog.showModal();
      shareText.select();
      setFeedback("A cópia automática não foi permitida. O resumo está selecionado para cópia manual.");
      return;
    }
  }
  shareText.value = text;
  shareDialog.showModal();
  shareText.select();
  setFeedback("Selecione e copie o resumo para compartilhar sem revelar a resposta.");
});

element("select-share-text").addEventListener("click", () => {
  shareText.select();
  setFeedback("Texto selecionado. Use o atalho de copiar do seu dispositivo.");
});

element("reset-corrupt").addEventListener("click", () => {
  storageWarning = null;
  persist();
  renderGame();
  setFeedback("O progresso recuperado foi salvo; os registros inválidos foram removidos.");
});

renderGame();
