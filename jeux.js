(() => {
  const canvas = document.getElementById("connect4Canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const statusEl = document.getElementById("gameStatus");
  const modeLabel = document.getElementById("gameModeLabel");
  const turnLabel = document.getElementById("gameTurnLabel");
  const orangeScoreEl = document.getElementById("gameOrangeScore");
  const tealScoreEl = document.getElementById("gameTealScore");
  const tealLabelEl = document.getElementById("gameTealLabel");
  const modeButtons = document.querySelectorAll("[data-mode]");
  const restartButton = document.querySelector("[data-restart]");

  const ROWS = 6;
  const COLS = 7;
  const EMPTY = 0;
  const ORANGE = 1;
  const TEAL = 2;
  const AI_DELAY = 420;
  const GRAVITY = 5600;
  const MAX_FALL_SPEED = 2400;
  const BOUNCE_DAMPING = 0.24;

  const state = {
    board: createBoard(),
    scores: {
      orange: 0,
      teal: 0,
    },
    mode: "solo",
    currentPlayer: ORANGE,
    winner: null,
    winningCells: [],
    hoverColumn: null,
    fallingPiece: null,
    animationFrame: null,
    lastFrameTime: 0,
    pendingAi: false,
    aiElapsed: 0,
    aiTimer: null,
    message: "À vous de jouer. Choisissez une colonne.",
  };

  function createBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));
  }

  function setMessage(message) {
    state.message = message;
    if (statusEl) statusEl.textContent = message;
  }

  function playerName(player) {
    if (player === ORANGE) return "Orange";
    return state.mode === "solo" ? "Ordinateur" : "Bleu-vert";
  }

  function updateUi() {
    modeButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.mode === state.mode);
      button.setAttribute("aria-pressed", String(button.dataset.mode === state.mode));
    });

    if (modeLabel) modeLabel.textContent = state.mode === "solo" ? "Solo" : "2 joueurs";
    if (turnLabel) {
      if (state.winner === "draw") {
        turnLabel.textContent = "Match nul";
      } else if (state.winner) {
        turnLabel.textContent = playerName(state.winner);
      } else if (state.fallingPiece) {
        turnLabel.textContent = playerName(state.fallingPiece.player);
      } else {
        turnLabel.textContent = playerName(state.currentPlayer);
      }
    }
    if (orangeScoreEl) orangeScoreEl.textContent = String(state.scores.orange);
    if (tealScoreEl) tealScoreEl.textContent = String(state.scores.teal);
    if (tealLabelEl) tealLabelEl.textContent = state.mode === "solo" ? "Ordinateur" : "Bleu-vert";
  }

  function resetGame(mode = state.mode) {
    if (state.aiTimer) window.clearTimeout(state.aiTimer);
    if (state.animationFrame) window.cancelAnimationFrame(state.animationFrame);
    state.board = createBoard();
    state.mode = mode;
    state.currentPlayer = ORANGE;
    state.winner = null;
    state.winningCells = [];
    state.hoverColumn = null;
    state.fallingPiece = null;
    state.animationFrame = null;
    state.lastFrameTime = 0;
    state.pendingAi = false;
    state.aiElapsed = 0;
    state.aiTimer = null;
    setMessage("À vous de jouer. Choisissez une colonne.");
    updateUi();
    render();
  }

  function getDropRow(column, board = state.board) {
    if (column < 0 || column >= COLS) return -1;
    for (let row = ROWS - 1; row >= 0; row -= 1) {
      if (board[row][column] === EMPTY) return row;
    }
    return -1;
  }

  function legalColumns(board = state.board) {
    return Array.from({ length: COLS }, (_, column) => column).filter((column) => getDropRow(column, board) !== -1);
  }

  function findWinningCells(board, player) {
    const directions = [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1],
    ];

    for (let row = 0; row < ROWS; row += 1) {
      for (let column = 0; column < COLS; column += 1) {
        if (board[row][column] !== player) continue;

        for (const [dr, dc] of directions) {
          const cells = [];
          for (let step = 0; step < 4; step += 1) {
            const rr = row + dr * step;
            const cc = column + dc * step;
            if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS || board[rr][cc] !== player) break;
            cells.push({ row: rr, column: cc });
          }
          if (cells.length === 4) return cells;
        }
      }
    }

    return [];
  }

  function wouldWin(column, player) {
    const row = getDropRow(column);
    if (row === -1) return false;
    state.board[row][column] = player;
    const wins = findWinningCells(state.board, player).length > 0;
    state.board[row][column] = EMPTY;
    return wins;
  }

  function chooseAiColumn() {
    const legal = legalColumns();
    if (!legal.length) return -1;

    const winningColumn = legal.find((column) => wouldWin(column, TEAL));
    if (winningColumn !== undefined) return winningColumn;

    const blockingColumn = legal.find((column) => wouldWin(column, ORANGE));
    if (blockingColumn !== undefined) return blockingColumn;

    const priority = [3, 2, 4, 1, 5, 0, 6];
    return priority.find((column) => legal.includes(column)) ?? legal[0];
  }

  function startRenderLoop() {
    if (state.animationFrame) return;
    state.lastFrameTime = 0;
    state.animationFrame = window.requestAnimationFrame(tick);
  }

  function tick(timestamp) {
    const dt = state.lastFrameTime ? Math.min(timestamp - state.lastFrameTime, 34) : 16.67;
    state.lastFrameTime = timestamp;
    update(dt);
    render();

    if (state.fallingPiece) {
      state.animationFrame = window.requestAnimationFrame(tick);
    } else {
      state.animationFrame = null;
      state.lastFrameTime = 0;
    }
  }

  function startDrop(column, player) {
    const row = getDropRow(column);
    if (row === -1) return false;

    const layout = boardLayout();
    const x = layout.x + layout.cell * (column + 0.5);
    const targetY = layout.y + layout.cell * (row + 0.5);

    state.fallingPiece = {
      row,
      column,
      player,
      x,
      y: layout.y - layout.cell * 0.52,
      targetY,
      velocity: 0,
      bounces: 0,
    };
    state.hoverColumn = column;
    setMessage(`Jeton ${playerName(player)} en chute...`);
    updateUi();
    startRenderLoop();
    render();
    return true;
  }

  function finalizeDrop() {
    const piece = state.fallingPiece;
    if (!piece) return;

    state.board[piece.row][piece.column] = piece.player;
    state.fallingPiece = null;
    commitPlacement(piece.player);
  }

  function commitPlacement(player) {
    const winningCells = findWinningCells(state.board, player);

    if (winningCells.length) {
      state.winner = player;
      state.winningCells = winningCells;
      state.pendingAi = false;
      if (player === ORANGE) state.scores.orange += 1;
      if (player === TEAL) state.scores.teal += 1;
      setMessage(`${playerName(player)} gagne la manche. Score ${state.scores.orange} - ${state.scores.teal}.`);
      updateUi();
      render();
      return;
    }

    if (legalColumns().length === 0) {
      state.winner = "draw";
      state.pendingAi = false;
      setMessage("Match nul. Le plateau est complet.");
      updateUi();
      render();
      return;
    }

    state.currentPlayer = player === ORANGE ? TEAL : ORANGE;
    updateUi();
    render();

    if (state.mode === "solo" && state.currentPlayer === TEAL) {
      queueAiMove();
    } else {
      setMessage(`Tour ${playerName(state.currentPlayer)}. Choisissez une colonne.`);
    }
  }

  function placePiece(column, player) {
    return startDrop(column, player);
  }

  function queueAiMove() {
    state.pendingAi = true;
    state.aiElapsed = 0;
    setMessage("L'ordinateur réfléchit...");
    if (state.aiTimer) window.clearTimeout(state.aiTimer);
    state.aiTimer = window.setTimeout(performAiMove, AI_DELAY);
  }

  function performAiMove() {
    if (!state.pendingAi || state.winner || state.mode !== "solo") return;
    if (state.aiTimer) window.clearTimeout(state.aiTimer);
    state.aiTimer = null;
    state.pendingAi = false;
    state.aiElapsed = 0;
    const column = chooseAiColumn();
    if (column !== -1) placePiece(column, TEAL);
  }

  function columnFromEvent(event) {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const layout = boardLayout();
    return Math.floor((x - layout.x) / layout.cell);
  }

  function handleColumn(column) {
    if (state.winner || state.pendingAi || state.fallingPiece) return;
    if (column < 0 || column >= COLS || getDropRow(column) === -1) {
      setMessage("Cette colonne est pleine. Choisissez une autre colonne.");
      return;
    }
    placePiece(column, state.currentPlayer);
  }

  function update(dtMs) {
    if (!state.fallingPiece) return;

    const piece = state.fallingPiece;
    const dt = Math.max(0.001, Math.min(dtMs / 1000, 0.05));
    piece.velocity = Math.min(piece.velocity + GRAVITY * dt, MAX_FALL_SPEED);
    piece.y += piece.velocity * dt;

    if (piece.y >= piece.targetY) {
      piece.y = piece.targetY;

      if (piece.velocity > 520 && piece.bounces < 1) {
        piece.velocity = -piece.velocity * BOUNCE_DAMPING;
        piece.bounces += 1;
        return;
      }

      finalizeDrop();
    }
  }

  function boardLayout() {
    const cell = Math.floor(Math.min((canvas.width - 88) / COLS, (canvas.height - 128) / ROWS));
    const width = cell * COLS;
    const height = cell * ROWS;
    return {
      cell,
      width,
      height,
      x: Math.round((canvas.width - width) / 2),
      y: 86,
    };
  }

  function drawRoundedRect(x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function drawPiece(x, y, radius, player, isWinning = false) {
    const gradient = ctx.createRadialGradient(x - radius * 0.32, y - radius * 0.36, radius * 0.1, x, y, radius);
    if (player === ORANGE) {
      gradient.addColorStop(0, "#ffd2bf");
      gradient.addColorStop(0.22, "#ff8a5a");
      gradient.addColorStop(1, "#ff4c1c");
    } else {
      gradient.addColorStop(0, "#d7fbff");
      gradient.addColorStop(0.24, "#62cad7");
      gradient.addColorStop(1, "#11798a");
    }

    ctx.save();
    ctx.shadowColor = player === ORANGE ? "rgba(255, 106, 46, 0.42)" : "rgba(28, 143, 163, 0.42)";
    ctx.shadowBlur = isWinning ? 28 : 16;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = isWinning ? 5 : 2;
    ctx.strokeStyle = isWinning ? "#f7f9fc" : "rgba(247, 249, 252, 0.26)";
    ctx.stroke();
    ctx.restore();
  }

  function render() {
    const { width, height } = canvas;
    const layout = boardLayout();

    ctx.clearRect(0, 0, width, height);

    const background = ctx.createLinearGradient(0, 0, width, height);
    background.addColorStop(0, "#07131c");
    background.addColorStop(0.55, "#0f2230");
    background.addColorStop(1, "#143447");
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    const glow = ctx.createRadialGradient(width * 0.72, height * 0.08, 20, width * 0.72, height * 0.08, width * 0.62);
    glow.addColorStop(0, "rgba(255, 106, 46, 0.2)");
    glow.addColorStop(0.45, "rgba(28, 143, 163, 0.14)");
    glow.addColorStop(1, "rgba(28, 143, 163, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.globalAlpha = 0.13;
    ctx.strokeStyle = "#f7f9fc";
    for (let x = 0; x < width; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 48) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();

    ctx.fillStyle = "#f7f9fc";
    ctx.font = "900 28px Inter, system-ui, sans-serif";
    ctx.fillText("Puissance 4", 42, 44);
    ctx.font = "800 14px Inter, system-ui, sans-serif";
    ctx.fillStyle = "rgba(247, 249, 252, 0.7)";
    ctx.fillText(state.mode === "solo" ? "Solo vs ordinateur" : "Mode 2 joueurs", 42, 66);

    if (state.hoverColumn !== null && !state.winner && !state.pendingAi && !state.fallingPiece && getDropRow(state.hoverColumn) !== -1) {
      const hx = layout.x + layout.cell * (state.hoverColumn + 0.5);
      drawPiece(hx, layout.y - layout.cell * 0.42, layout.cell * 0.32, state.currentPlayer, false);
    }

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.34)";
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 18;
    drawRoundedRect(layout.x - 12, layout.y - 12, layout.width + 24, layout.height + 24, 8);
    const boardGradient = ctx.createLinearGradient(layout.x, layout.y, layout.x + layout.width, layout.y + layout.height);
    boardGradient.addColorStop(0, "#1c8fa3");
    boardGradient.addColorStop(1, "#0f6174");
    ctx.fillStyle = boardGradient;
    ctx.fill();
    ctx.restore();

    for (let row = 0; row < ROWS; row += 1) {
      for (let column = 0; column < COLS; column += 1) {
        const x = layout.x + layout.cell * (column + 0.5);
        const y = layout.y + layout.cell * (row + 0.5);
        const radius = layout.cell * 0.36;
        const value = state.board[row][column];
        const isWinning = state.winningCells.some((cell) => cell.row === row && cell.column === column);

        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = "#07131c";
        ctx.fill();
        ctx.shadowColor = "rgba(0, 0, 0, 0.28)";
        ctx.shadowBlur = 10;
        ctx.strokeStyle = "rgba(247, 249, 252, 0.16)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        if (value !== EMPTY) drawPiece(x, y, radius * 0.92, value, isWinning);
      }
    }

    if (state.fallingPiece) {
      const piece = state.fallingPiece;
      drawPiece(piece.x, piece.y, layout.cell * 0.33, piece.player, false);
    }
  }

  canvas.addEventListener("pointermove", (event) => {
    const column = columnFromEvent(event);
    state.hoverColumn = column >= 0 && column < COLS ? column : null;
    render();
  });

  canvas.addEventListener("pointerleave", () => {
    state.hoverColumn = null;
    render();
  });

  canvas.addEventListener("click", (event) => {
    handleColumn(columnFromEvent(event));
  });

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => resetGame(button.dataset.mode || "solo"));
  });

  restartButton?.addEventListener("click", () => resetGame());

  document.addEventListener("keydown", (event) => {
    if (/^[1-7]$/.test(event.key)) {
      handleColumn(Number(event.key) - 1);
      return;
    }

    if (event.key.toLowerCase() === "r") {
      resetGame();
      return;
    }

    if (event.key.toLowerCase() === "s") {
      resetGame("solo");
      return;
    }

    if (event.key.toLowerCase() === "d") {
      resetGame("duo");
      return;
    }

    if (event.key.toLowerCase() === "f") {
      const target = canvas.closest(".game-panel") || canvas;
      if (document.fullscreenElement) {
        document.exitFullscreen?.();
      } else {
        target.requestFullscreen?.();
      }
    }
  });

  window.addEventListener("resize", render, { passive: true });

  window.advanceTime = (ms = 16) => {
    const steps = Math.max(1, Math.ceil(ms / (1000 / 60)));
    const stepMs = ms / steps;
    for (let i = 0; i < steps; i += 1) {
      update(stepMs);
    }
    if (state.pendingAi) {
      state.aiElapsed += ms;
      if (state.aiElapsed >= AI_DELAY) performAiMove();
    }
    render();
    return window.render_game_to_text();
  };

  window.render_game_to_text = () => {
    const payload = {
      coordinateSystem: "board rows top-to-bottom 0-5, columns left-to-right 0-6",
      mode: state.mode,
      currentPlayer: state.winner ? null : playerName(state.currentPlayer),
      winner: state.winner === "draw" ? "draw" : state.winner ? playerName(state.winner) : null,
      scores: { ...state.scores },
      fallingPiece: state.fallingPiece
        ? {
            player: playerName(state.fallingPiece.player),
            row: state.fallingPiece.row,
            column: state.fallingPiece.column,
            y: Math.round(state.fallingPiece.y),
            targetY: Math.round(state.fallingPiece.targetY),
            velocity: Math.round(state.fallingPiece.velocity),
          }
        : null,
      pendingAi: state.pendingAi,
      hoverColumn: state.hoverColumn,
      legalColumns: legalColumns(),
      winningCells: state.winningCells,
      message: state.message,
      board: state.board.map((row) => row.map((cell) => (cell === ORANGE ? "Orange" : cell === TEAL ? "Teal" : "."))),
    };
    return JSON.stringify(payload);
  };

  const initialMode = new URLSearchParams(window.location.search).get("mode") === "duo" ? "duo" : "solo";
  resetGame(initialMode);
})();
