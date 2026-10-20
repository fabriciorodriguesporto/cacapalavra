"use strict";

(() => {
  const storageKey = "cacapalavra.active-game.v1";
  const form = document.querySelector("#guess-form");
  const input = document.querySelector("#guess-input");
  const submitButton = document.querySelector("#submit-button");
  const retryButton = document.querySelector("#retry-game");
  const note = document.querySelector("#input-note");
  const list = document.querySelector("#history-list");
  const emptyState = document.querySelector("#empty-state");
  const attemptCount = document.querySelector("#attempt-count");
  const victoryPanel = document.querySelector("#victory-panel");
  const victoryCount = document.querySelector("#victory-count");
  const revealedAnswer = document.querySelector("#revealed-answer");
  const liveMessage = document.querySelector("#live-message");
  const newGameButton = document.querySelector("#new-game");
  const exampleButtons = document.querySelectorAll(".example-chip");
  let currentGame = null;
  let busy = false;

  function announce(message, kind = "") {
    note.className = `form-note${kind ? ` ${kind}` : ""}`;
    note.textContent = message;
    liveMessage.textContent = "";
    window.requestAnimationFrame(() => {
      liveMessage.textContent = message;
    });
  }

  async function requestJson(path, options = {}) {
    let response;
    try {
      response = await fetch(path, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers
        }
      });
    } catch {
      throw new Error("Não foi possível conectar ao jogo. Verifique sua conexão e tente novamente.");
    }

    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const error = new Error(body?.message || "O jogo não conseguiu concluir essa ação.");
      error.status = response.status;
      error.code = body?.error;
      throw error;
    }
    if (!body) throw new Error("O jogo retornou uma resposta inválida. Tente novamente.");
    return body;
  }

  function persistGame() {
    if (!currentGame) return false;
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        gameId: currentGame.gameId,
        guesses: currentGame.guesses,
        status: currentGame.status,
        answer: currentGame.answer ?? null
      }));
      return true;
    } catch {
      return false;
    }
  }

  function clearSavedGame() {
    try {
      localStorage.removeItem(storageKey);
      return true;
    } catch {
      return false;
    }
  }

  function setBusy(value) {
    busy = value;
    const unavailable = !currentGame || currentGame.status === "won";
    submitButton.disabled = value || unavailable;
    input.disabled = value || unavailable;
    for (const button of exampleButtons) button.disabled = value || unavailable;
    retryButton.disabled = value;
    if (newGameButton) newGameButton.disabled = value;
  }

  function getMeterClass(guess) {
    if (guess.isCorrect) return "correct";
    if (guess.rank <= 5) return "hot";
    if (guess.rank <= 15) return "warm";
    if (guess.rank <= 30) return "mild";
    return "far";
  }

  function renderGuess(guess) {
    const item = document.createElement("li");
    item.className = "history-row";
    item.setAttribute("aria-label", `${guess.word}, posição ${new Intl.NumberFormat("pt-BR").format(guess.rank)}, ${guess.proximity.label}`);

    const word = document.createElement("span");
    word.className = "guess-word";
    word.textContent = guess.word;

    const meter = document.createElement("span");
    meter.className = "rank-meter";
    const dots = document.createElement("span");
    dots.className = "meter-dots";
    dots.setAttribute("aria-hidden", "true");
    for (let index = 0; index < 5; index += 1) {
      const dot = document.createElement("i");
      if (index < guess.proximity.dots) dot.className = "on";
      dots.append(dot);
    }
    const label = document.createElement("span");
    label.className = "rank-label";
    label.textContent = guess.proximity.label;
    meter.append(dots, label);

    const rank = document.createElement("span");
    rank.className = `rank-number ${getMeterClass(guess)}`;
    rank.textContent = `#${new Intl.NumberFormat("pt-BR").format(guess.rank)}`;
    rank.setAttribute("aria-label", `posição ${new Intl.NumberFormat("pt-BR").format(guess.rank)}`);
    item.append(word, meter, rank);
    return item;
  }

  function render() {
    list.replaceChildren(...[...(currentGame?.guesses ?? [])].reverse().map(renderGuess));
    const count = currentGame?.guesses.length ?? 0;
    attemptCount.textContent = `${count} ${count === 1 ? "palpite" : "palpites"}`;
    emptyState.hidden = count > 0;
    victoryPanel.hidden = currentGame?.status !== "won";
    retryButton.hidden = Boolean(currentGame);
    if (currentGame?.status === "won") {
      victoryCount.textContent = `Você encontrou em ${count} ${count === 1 ? "palpite" : "palpites"}.`;
      revealedAnswer.textContent = currentGame.answer || currentGame.guesses.find((guess) => guess.isCorrect)?.word || "";
    }
    setBusy(busy);
  }

  function saveCurrentGame() {
    if (!currentGame) return;
    const saved = persistGame();
    render();
    return saved;
  }

  async function startGame(previousGameId = null) {
    setBusy(true);
    announce("Preparando uma nova palavra…");
    try {
      const result = await requestJson("/api/games", {
        method: "POST",
        body: JSON.stringify({ previousGameId })
      });
      currentGame = {
        gameId: result.gameId,
        guesses: [],
        status: "in_progress",
        answer: null
      };
      const saved = persistGame();
      render();
      announce(saved
        ? "Nova palavra pronta. Qual será seu primeiro palpite?"
        : "Nova palavra pronta, mas o navegador não conseguiu salvar seu progresso.", saved ? "" : "error");
      input.focus();
    } catch (error) {
      currentGame = null;
      render();
      announce(error.message, "error");
    } finally {
      setBusy(false);
      render();
    }
  }

  async function restoreGame() {
    let saved = null;
    let storageIssue = false;
    try {
      const raw = localStorage.getItem(storageKey);
      saved = raw ? JSON.parse(raw) : null;
    } catch {
      storageIssue = true;
      clearSavedGame();
    }

    if (typeof saved?.gameId !== "string") {
      await startGame();
      if (storageIssue && currentGame) {
        announce("O progresso salvo não pôde ser lido. Uma nova partida foi iniciada.", "error");
      }
      return;
    }

    setBusy(true);
    try {
      const snapshot = await requestJson(`/api/games/${encodeURIComponent(saved.gameId)}`);
      currentGame = {
        gameId: snapshot.gameId,
        guesses: snapshot.guesses,
        status: snapshot.status,
        answer: snapshot.answer ?? null
      };
      render();
      announce(snapshot.status === "won" ? "Partida concluída restaurada." : "Sua partida foi restaurada.");
    } catch (error) {
      if (error.code === "GAME_NOT_FOUND") {
        const cleared = clearSavedGame();
        currentGame = null;
        await startGame();
        if (currentGame) {
          announce(cleared
            ? "A partida anterior expirou. Uma nova palavra está pronta."
            : "A partida anterior expirou, mas o navegador não conseguiu limpar o progresso local.", "error");
        }
      } else {
        currentGame = {
          gameId: saved.gameId,
          guesses: Array.isArray(saved.guesses) ? saved.guesses : [],
          status: saved.status === "won" ? "won" : "in_progress",
          answer: typeof saved.answer === "string" ? saved.answer : null
        };
        render();
        announce(`${error.message} O histórico salvo continua visível; tente recarregar a página.`, "error");
      }
    } finally {
      setBusy(false);
      render();
    }
  }

  async function submitGuess(rawGuess) {
    if (busy || !currentGame || currentGame.status === "won") return;
    setBusy(true);
    try {
      const result = await requestJson(`/api/games/${encodeURIComponent(currentGame.gameId)}/guesses`, {
        method: "POST",
        body: JSON.stringify({ guess: rawGuess })
      });
      if (result.duplicate) {
        announce(`Você já enviou “${result.guess.word}”. Experimente uma associação diferente.`, "error");
        return;
      }

      currentGame.guesses = result.game.guesses;
      currentGame.status = result.game.status;
      currentGame.answer = result.game.answer ?? null;
      const saved = saveCurrentGame();
      input.value = "";

      if (result.guess.isCorrect) {
        announce(saved
          ? `“${result.guess.word}” está na posição 1. Palavra encontrada!`
          : `“${result.guess.word}” está na posição 1. Palavra encontrada! O navegador não salvou o progresso.`,
        saved ? "success" : "error");
        newGameButton.focus();
      } else {
        const message = `“${result.guess.word}” ficou na posição ${new Intl.NumberFormat("pt-BR").format(result.guess.rank)}: ${result.guess.proximity.label.toLocaleLowerCase("pt-BR")}.`;
        announce(saved ? message : `${message} O navegador não salvou o progresso.`, saved ? "success" : "error");
        input.focus();
      }
    } catch (error) {
      if (error.code === "GAME_NOT_FOUND") {
        const previousGameId = currentGame.gameId;
        const cleared = clearSavedGame();
        currentGame = null;
        render();
        await startGame(previousGameId);
        if (currentGame) {
          const storageMessage = cleared ? "" : " O navegador não conseguiu limpar o estado local anterior.";
          announce(`A partida anterior expirou e não pôde ser recuperada; uma nova partida foi criada.${storageMessage}`, "error");
        }
        return;
      }
      announce(error.message, "error");
      input.focus();
    } finally {
      setBusy(false);
      render();
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submitGuess(input.value);
  });

  for (const button of exampleButtons) {
    button.addEventListener("click", () => submitGuess(button.dataset.guess));
  }

  newGameButton.addEventListener("click", () => {
    const previousGameId = currentGame?.gameId ?? null;
    startGame(previousGameId);
  });

  retryButton.addEventListener("click", () => startGame());

  restoreGame();
})();
