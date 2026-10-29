/* ========================================================
   PlayVerse Engine (game.js)
   Contains logic for all 10 games, HUDs, and controllers
   ======================================================== */

// Retrieve game ID from URL query parameters (?game=xyz)
const urlParams = new URLSearchParams(window.location.search);
const currentGameId = urlParams.get("game") || "snake";

// Game Specifications & Instructions
const GAME_SPECS = {
  snake: {
    title: "Neon Snake",
    desc: "Collect power pellets and expand your length without touching borders or your tail.",
    instructions: [
      "Desktop: Use Arrow Keys or W, A, S, D to navigate.",
      "Mobile: Tap the on-screen Directional Pad buttons below the grid.",
      "Collect yellow orbs to earn 10 points each.",
      "Game ends if you crash into the boundaries or yourself."
    ]
  },
  memory: {
    title: "Memory Match",
    desc: "Match all hidden pairs of cyber symbols in the fewest turns possible.",
    instructions: [
      "Click or tap any card to reveal its icon.",
      "Uncover two matching symbols back-to-back to lock them in.",
      "Clear all pairs to finish. Your total moves and time are saved."
    ]
  },
  ttt: {
    title: "Tic-Tac-Toe",
    desc: "Get 3 in a row horizontally, vertically, or diagonally.",
    instructions: [
      "Toggle between AI Opponent or 2-Player Pass & Play mode.",
      "Click any available cell to place your symbol (X or O).",
      "Scores persist across rounds until manually restarted."
    ]
  },
  rps: {
    title: "Rock Paper Scissors",
    desc: "Engage the computer AI in classic rapid-fire hand duels.",
    instructions: [
      "Choose Rock, Paper, or Scissors.",
      "Rock beats Scissors, Scissors beats Paper, Paper beats Rock.",
      "Check your win, loss, and tie streak in real-time."
    ]
  },
  2048: {
    title: "2048 Puzzle",
    desc: "Combine identical numbered tiles to reach 2048.",
    instructions: [
      "Desktop: Use Arrow keys to slide tiles across the board.",
      "Mobile: Swipe your finger Up, Down, Left, or Right on the board.",
      "When two tiles with the same number collide, they merge into one!"
    ]
  },
  breaker: {
    title: "Brick Breaker",
    desc: "Shatter cyber bricks with the laser ball before you run out of lives.",
    instructions: [
      "Desktop: Move mouse horizontally or use Left/Right Arrow keys.",
      "Mobile: Touch and drag your finger across the canvas or use the left/right buttons.",
      "Bounce the ball off the paddle and don't let it fall below."
    ]
  },
  hangman: {
    title: "Hangman",
    desc: "Decode the secret computer and gaming terms before running out of turns.",
    instructions: [
      "Tap any letter from the on-screen keyboard.",
      "You have 6 missed attempts before the game ends.",
      "Guess all letters correctly to secure victory!"
    ]
  },
  mole: {
    title: "Whack-a-Mole",
    desc: "Test your twitch reflexes! Whack emerging bots within 30 seconds.",
    instructions: [
      "Tap or click on any mole immediately as it emerges from its portal.",
      "Each successful hit adds +1 to your score.",
      "Rack up your highest score before the 30-second timer expires."
    ]
  },
  reaction: {
    title: "Reaction Test",
    desc: "Test your neurological reaction speed in milliseconds.",
    instructions: [
      "Tap the screen box to start the test.",
      "Wait patiently while the box is RED. Do NOT tap yet!",
      "The exact moment the box turns GREEN, tap it as fast as you can.",
      "Review your reaction time and aim for sub-250ms speeds."
    ]
  },
  math: {
    title: "Math Sprint",
    desc: "Solve fast-paced arithmetic calculations before the clock expires.",
    instructions: [
      "A mathematical formula will appear with multiple choices.",
      "Pick the correct solution immediately to gain +10 points.",
      "Each correct answer adds a slight time bonus to keep you in the sprint."
    ]
  }
};

// Global active loop or interval tracker to prevent memory leaks when switching
let activeIntervals = [];
function registerInterval(fn, ms) {
  const id = setInterval(fn, ms);
  activeIntervals.push(id);
  return id;
}
function clearAllIntervals() {
  activeIntervals.forEach(clearInterval);
  activeIntervals = [];
}

// Initial Setup on DOM Ready
document.addEventListener("DOMContentLoaded", () => {
  const spec = GAME_SPECS[currentGameId] || GAME_SPECS.snake;

  // Set Document Title & Text
  document.title = `${spec.title} | PlayVerse`;
  document.getElementById("gameTitle").textContent = spec.title;
  document.getElementById("gameDesc").textContent = spec.desc;

  const instructionsBody = document.getElementById("gameInstructionsBody");
  const ul = document.createElement("ul");
  spec.instructions.forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    ul.appendChild(li);
  });
  instructionsBody.innerHTML = "";
  instructionsBody.appendChild(ul);

  const restartBtn = document.getElementById("restartBtn");
  restartBtn.addEventListener("click", () => {
    launchGame(currentGameId);
  });

  launchGame(currentGameId);
});

function launchGame(gameId) {
  clearAllIntervals();
  const viewport = document.getElementById("gameViewport");
  viewport.innerHTML = "";

  switch (gameId) {
    case "snake": initSnake(viewport); break;
    case "memory": initMemory(viewport); break;
    case "ttt": initTicTacToe(viewport); break;
    case "rps": initRPS(viewport); break;
    case "2048": init2048(viewport); break;
    case "breaker": initBrickBreaker(viewport); break;
    case "hangman": initHangman(viewport); break;
    case "mole": initWhackAMole(viewport); break;
    case "reaction": initReaction(viewport); break;
    case "math": initMathSprint(viewport); break;
    default: initSnake(viewport); break;
  }
}

/* ========================================================
   GAME 1: NEON SNAKE
   ======================================================== */
function initSnake(container) {
  let score = 0;
  let best = parseInt(localStorage.getItem("pv_snake_best") || "0", 10);
  const gridSize = 20;
  const tileCount = 16; // 320x320 canvas
  let snake = [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }];
  let food = { x: 12, y: 8 };
  let dx = 1;
  let dy = 0;
  let nextDx = 1;
  let nextDy = 0;
  let gameOver = false;

  container.innerHTML = `
    <div class="hud-bar">
      <div class="hud-item"><span class="hud-label">SCORE</span><span class="hud-val" id="snakeScore">0</span></div>
      <div class="hud-item"><span class="hud-label">BEST</span><span class="hud-val" id="snakeBest">${best}</span></div>
    </div>
    <canvas id="snakeCanvas" class="game-canvas" width="320" height="320"></canvas>
    <div id="snakeMsg" class="game-status-msg">Use controls to start moving</div>
    <div class="dpad-container">
      <div class="dpad-row"><button class="dpad-btn" id="dpadUp">▲</button></div>
      <div class="dpad-row">
        <button class="dpad-btn" id="dpadLeft">◀</button>
        <button class="dpad-btn" id="dpadDown">▼</button>
        <button class="dpad-btn" id="dpadRight">▶</button>
      </div>
    </div>
  `;

  const canvas = document.getElementById("snakeCanvas");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("snakeScore");
  const bestEl = document.getElementById("snakeBest");
  const msgEl = document.getElementById("snakeMsg");

  function spawnFood() {
    let valid = false;
    while (!valid) {
      food.x = Math.floor(Math.random() * tileCount);
      food.y = Math.floor(Math.random() * tileCount);
      valid = !snake.some(seg => seg.x === food.x && seg.y === food.y);
    }
  }

  function setDirection(newDx, newDy) {
    if (gameOver) return;
    if (newDx !== -dx || newDy !== -dy) {
      nextDx = newDx;
      nextDy = newDy;
      msgEl.textContent = "Survive & Hunt";
    }
  }

  // Keyboard controls
  const keyHandler = (e) => {
    if (["ArrowUp", "KeyW"].includes(e.code) && dy === 0) setDirection(0, -1);
    else if (["ArrowDown", "KeyS"].includes(e.code) && dy === 0) setDirection(0, 1);
    else if (["ArrowLeft", "KeyA"].includes(e.code) && dx === 0) setDirection(-1, 0);
    else if (["ArrowRight", "KeyD"].includes(e.code) && dx === 0) setDirection(1, 0);
  };
  window.addEventListener("keydown", keyHandler);

  // Mobile D-Pad
  document.getElementById("dpadUp").onclick = () => { if (dy === 0) setDirection(0, -1); };
  document.getElementById("dpadDown").onclick = () => { if (dy === 0) setDirection(0, 1); };
  document.getElementById("dpadLeft").onclick = () => { if (dx === 0) setDirection(-1, 0); };
  document.getElementById("dpadRight").onclick = () => { if (dx === 0) setDirection(1, 0); };

  function step() {
    if (gameOver) return;

    dx = nextDx;
    dy = nextDy;

    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // Wall collision
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
      return triggerGameOver();
    }

    // Body collision
    if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
      return triggerGameOver();
    }

    snake.unshift(head);

    // Food collision
    if (head.x === food.x && head.y === food.y) {
      score += 10;
      scoreEl.textContent = score;
      if (score > best) {
        best = score;
        bestEl.textContent = best;
        localStorage.setItem("pv_snake_best", best);
      }
      spawnFood();
    } else {
      snake.pop();
    }

    // Render
    ctx.fillStyle = "#0c0d12";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Food
    ctx.fillStyle = "#ffc72c";
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#ffc72c";
    ctx.beginPath();
    ctx.arc(food.x * gridSize + gridSize/2, food.y * gridSize + gridSize/2, gridSize/2.3, 0, Math.PI * 2);
    ctx.fill();

    // Draw Snake
    snake.forEach((seg, idx) => {
      ctx.fillStyle = idx === 0 ? "#00e5ff" : "#00ff88";
      ctx.shadowBlur = idx === 0 ? 10 : 4;
      ctx.shadowColor = idx === 0 ? "#00e5ff" : "#00ff88";
      ctx.fillRect(seg.x * gridSize + 1, seg.y * gridSize + 1, gridSize - 2, gridSize - 2);
    });
    ctx.shadowBlur = 0;
  }

  function triggerGameOver() {
    gameOver = true;
    msgEl.innerHTML = `<span style="color:var(--neon-pink)">GAME OVER! Final Score: ${score}</span>`;
    window.removeEventListener("keydown", keyHandler);
  }

  registerInterval(step, 130);
}

/* ========================================================
   GAME 2: MEMORY MATCH
   ======================================================== */
function initMemory(container) {
  const icons = ["🚀", "👾", "⚡", "💎", "🛡️", "🔮", "🔥", "🕹️"];
  const deck = [...icons, ...icons].sort(() => Math.random() - 0.5);

  let flippedCards = [];
  let matchedCount = 0;
  let moves = 0;
  let seconds = 0;
  let timerActive = false;

  container.innerHTML = `
    <div class="hud-bar">
      <div class="hud-item"><span class="hud-label">MOVES</span><span class="hud-val" id="memMoves">0</span></div>
      <div class="hud-item"><span class="hud-label">TIME</span><span class="hud-val" id="memTimer">00:00</span></div>
    </div>
    <div class="memory-grid" id="memoryGrid"></div>
    <div id="memMsg" class="game-status-msg">Tap cards to find pairs</div>
  `;

  const grid = document.getElementById("memoryGrid");
  const movesEl = document.getElementById("memMoves");
  const timerEl = document.getElementById("memTimer");
  const msgEl = document.getElementById("memMsg");

  const timerInterval = registerInterval(() => {
    if (!timerActive) return;
    seconds++;
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    timerEl.textContent = `${m}:${s}`;
  }, 1000);

  deck.forEach((icon, index) => {
    const card = document.createElement("div");
    card.className = "memory-card";
    card.dataset.icon = icon;
    card.dataset.index = index;
    card.textContent = "❓";

    card.addEventListener("click", () => {
      if (!timerActive && matchedCount < 8) timerActive = true;
      if (card.classList.contains("flipped") || card.classList.contains("matched") || flippedCards.length === 2) return;

      card.classList.add("flipped");
      card.textContent = icon;
      flippedCards.push(card);

      if (flippedCards.length === 2) {
        moves++;
        movesEl.textContent = moves;
        const [c1, c2] = flippedCards;

        if (c1.dataset.icon === c2.dataset.icon) {
          c1.classList.add("matched");
          c2.classList.add("matched");
          matchedCount++;
          flippedCards = [];
          if (matchedCount === 8) {
            timerActive = false;
            msgEl.innerHTML = `<span style="color:var(--neon-green)">VICTORY! Cleared in ${moves} moves!</span>`;
          }
        } else {
          setTimeout(() => {
            c1.classList.remove("flipped");
            c2.classList.remove("flipped");
            c1.textContent = "❓";
            c2.textContent = "❓";
            flippedCards = [];
          }, 700);
        }
      }
    });

    grid.appendChild(card);
  });
}

/* ========================================================
   GAME 3: TIC-TAC-TOE
   ======================================================== */
function initTicTacToe(container) {
  let board = Array(9).fill(null);
  let isXNext = true;
  let againstAI = true;
  let active = true;
  let scores = { x: 0, o: 0, tie: 0 };

  container.innerHTML = `
    <div class="mode-toggle">
      <button class="btn-pill btn-pill-gold" id="tttAiMode">Play vs AI</button>
      <button class="btn-pill" id="ttt2pMode">2 Players</button>
    </div>
    <div class="hud-bar">
      <div class="hud-item"><span class="hud-label">PLAYER (X)</span><span class="hud-val" id="scoreX">0</span></div>
      <div class="hud-item"><span class="hud-label">TIES</span><span class="hud-val" id="scoreTie">0</span></div>
      <div class="hud-item"><span class="hud-label">OPPONENT (O)</span><span class="hud-val" id="scoreO">0</span></div>
    </div>
    <div class="ttt-grid" id="tttGrid"></div>
    <div id="tttMsg" class="game-status-msg">Your Turn (X)</div>
  `;

  const grid = document.getElementById("tttGrid");
  const msgEl = document.getElementById("tttMsg");
  const btnAi = document.getElementById("tttAiMode");
  const btn2p = document.getElementById("ttt2pMode");

  btnAi.onclick = () => { againstAI = true; btnAi.classList.add("btn-pill-gold"); btn2p.classList.remove("btn-pill-gold"); resetBoard(); };
  btn2p.onclick = () => { againstAI = false; btn2p.classList.add("btn-pill-gold"); btnAi.classList.remove("btn-pill-gold"); resetBoard(); };

  function checkWinner(squares) {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return squares.includes(null) ? null : "Tie";
  }

  function renderCells() {
    grid.innerHTML = "";
    board.forEach((val, i) => {
      const cell = document.createElement("div");
      cell.className = `ttt-cell ${val ? val.toLowerCase() : ""}`;
      cell.textContent = val || "";
      cell.addEventListener("click", () => handleCellClick(i));
      grid.appendChild(cell);
    });
  }

  function handleCellClick(index) {
    if (!active || board[index]) return;

    board[index] = isXNext ? "X" : "O";
    renderCells();
    const result = checkWinner(board);

    if (result) return processEnd(result);

    isXNext = !isXNext;
    msgEl.textContent = isXNext ? "Player X Turn" : (againstAI ? "AI Thinking..." : "Player O Turn");

    if (!isXNext && againstAI) {
      active = false;
      setTimeout(aiMove, 350);
    }
  }

  function aiMove() {
    // Basic AI with winning/blocking logic
    let emptyIndices = board.map((v, i) => v === null ? i : null).filter(v => v !== null);
    if (emptyIndices.length === 0) return;

    let move = null;
    // Check if AI can win
    for (let idx of emptyIndices) {
      board[idx] = "O";
      if (checkWinner(board) === "O") { move = idx; board[idx] = null; break; }
      board[idx] = null;
    }
    // Block opponent win
    if (move === null) {
      for (let idx of emptyIndices) {
        board[idx] = "X";
        if (checkWinner(board) === "X") { move = idx; board[idx] = null; break; }
        board[idx] = null;
      }
    }
    // Choose center or random
    if (move === null) {
      if (emptyIndices.includes(4)) move = 4;
      else move = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    }

    board[move] = "O";
    renderCells();
    const result = checkWinner(board);
    if (result) return processEnd(result);

    isXNext = true;
    active = true;
    msgEl.textContent = "Your Turn (X)";
  }

  function processEnd(winner) {
    active = false;
    if (winner === "Tie") {
      scores.tie++;
      document.getElementById("scoreTie").textContent = scores.tie;
      msgEl.innerHTML = `<span style="color:var(--text-dim)">Round Drawn!</span>`;
    } else {
      if (winner === "X") scores.x++; else scores.o++;
      document.getElementById("scoreX").textContent = scores.x;
      document.getElementById("scoreO").textContent = scores.o;
      msgEl.innerHTML = `<span style="color:var(--neon-green)">${winner} WINS THE MATCH!</span>`;
    }
  }

  function resetBoard() {
    board = Array(9).fill(null);
    isXNext = true;
    active = true;
    msgEl.textContent = "Your Turn (X)";
    renderCells();
  }

  renderCells();
}

/* ========================================================
   GAME 4: ROCK PAPER SCISSORS
   ======================================================== */
function initRPS(container) {
  let playerWins = 0;
  let aiWins = 0;
  let ties = 0;
  const choices = [
    { name: "rock", icon: "✊" },
    { name: "paper", icon: "✋" },
    { name: "scissors", icon: "✌️" }
  ];

  container.innerHTML = `
    <div class="hud-bar">
      <div class="hud-item"><span class="hud-label">YOU</span><span class="hud-val" id="rpsUserScore">0</span></div>
      <div class="hud-item"><span class="hud-label">TIES</span><span class="hud-val" id="rpsTies">0</span></div>
      <div class="hud-item"><span class="hud-label">AI</span><span class="hud-val" id="rpsAiScore">0</span></div>
    </div>

    <div class="rps-stage">
      <div class="rps-slot">
        <span class="hud-label">YOUR PICK</span>
        <span class="symbol" id="playerPick">❔</span>
      </div>
      <span style="font-family:var(--font-display); font-size:20px; color:var(--gold-primary);">VS</span>
      <div class="rps-slot">
        <span class="hud-label">AI PICK</span>
        <span class="symbol" id="aiPick">❔</span>
      </div>
    </div>

    <div id="rpsOutcome" class="rps-result">Select your move!</div>

    <div class="rps-options">
      <button class="rps-btn" data-choice="rock" title="Rock">✊</button>
      <button class="rps-btn" data-choice="paper" title="Paper">✋</button>
      <button class="rps-btn" data-choice="scissors" title="Scissors">✌️</button>
    </div>
  `;

  const userScoreEl = document.getElementById("rpsUserScore");
  const aiScoreEl = document.getElementById("rpsAiScore");
  const tiesEl = document.getElementById("rpsTies");
  const playerPickEl = document.getElementById("playerPick");
  const aiPickEl = document.getElementById("aiPick");
  const outcomeEl = document.getElementById("rpsOutcome");

  container.querySelectorAll(".rps-btn").forEach(btn => {
    btn.onclick = () => {
      const userChoice = btn.dataset.choice;
      const aiObj = choices[Math.floor(Math.random() * choices.length)];
      const userObj = choices.find(c => c.name === userChoice);

      playerPickEl.textContent = userObj.icon;
      aiPickEl.textContent = aiObj.icon;

      if (userChoice === aiObj.name) {
        ties/* ========================================================
   PlayVerse Engine (game.js)
   Contains logic for all 10 games, HUDs, and controllers
   ======================================================== */

// Retrieve game ID from URL query parameters (?game=xyz)
const urlParams = new URLSearchParams(window.location.search);
const currentGameId = urlParams.get("game") || "snake";

// Game Specifications & Instructions
const GAME_SPECS = {
  snake: {
    title: "Neon Snake",
    desc: "Collect power pellets and expand your length without touching borders or your tail.",
    instructions: [
      "Desktop: Use Arrow Keys or W, A, S, D to navigate.",
      "Mobile: Tap the on-screen Directional Pad buttons below the grid.",
      "Collect yellow orbs to earn 10 points each.",
      "Game ends if you crash into the boundaries or yourself."
    ]
  },
  memory: {
    title: "Memory Match",
    desc: "Match all hidden pairs of cyber symbols in the fewest turns possible.",
    instructions: [
      "Click or tap any card to reveal its icon.",
      "Uncover two matching symbols back-to-back to lock them in.",
      "Clear all pairs to finish. Your total moves and time are saved."
    ]
  },
  ttt: {
    title: "Tic-Tac-Toe",
    desc: "Get 3 in a row horizontally, vertically, or diagonally.",
    instructions: [
      "Toggle between AI Opponent or 2-Player Pass & Play mode.",
      "Click any available cell to place your symbol (X or O).",
      "Scores persist across rounds until manually restarted."
    ]
  },
  rps: {
    title: "Rock Paper Scissors",
    desc: "Engage the computer AI in classic rapid-fire hand duels.",
    instructions: [
      "Choose Rock, Paper, or Scissors.",
      "Rock beats Scissors, Scissors beats Paper, Paper beats Rock.",
      "Check your win, loss, and tie streak in real-time."
    ]
  },
  2048: {
    title: "2048 Puzzle",
    desc: "Combine identical numbered tiles to reach 2048.",
    instructions: [
      "Desktop: Use Arrow keys to slide tiles across the board.",
      "Mobile: Swipe your finger Up, Down, Left, or Right on the board.",
      "When two tiles with the same number collide, they merge into one!"
    ]
  },
  breaker: {
    title: "Brick Breaker",
    desc: "Shatter cyber bricks with the laser ball before you run out of lives.",
    instructions: [
      "Desktop: Move mouse horizontally or use Left/Right Arrow keys.",
      "Mobile: Touch and drag your finger across the canvas or use the left/right buttons.",
      "Bounce the ball off the paddle and don't let it fall below."
    ]
  },
  hangman: {
    title: "Hangman",
    desc: "Decode the secret computer and gaming terms before running out of turns.",
    instructions: [
      "Tap any letter from the on-screen keyboard.",
      "You have 6 missed attempts before the game ends.",
      "Guess all letters correctly to secure victory!"
    ]
  },
  mole: {
    title: "Whack-a-Mole",
    desc: "Test your twitch reflexes! Whack emerging bots within 30 seconds.",
    instructions: [
      "Tap or click on any mole immediately as it emerges from its portal.",
      "Each successful hit adds +1 to your score.",
      "Rack up your highest score before the 30-second timer expires."
    ]
  },
  reaction: {
    title: "Reaction Test",
    desc: "Test your neurological reaction speed in milliseconds.",
    instructions: [
      "Tap the screen box to start the test.",
      "Wait patiently while the box is RED. Do NOT tap yet!",
      "The exact moment the box turns GREEN, tap it as fast as you can.",
      "Review your reaction time and aim for sub-250ms speeds."
    ]
  },
  math: {
    title: "Math Sprint",
    desc: "Solve fast-paced arithmetic calculations before the clock expires.",
    instructions: [
      "A mathematical formula will appear with multiple choices.",
      "Pick the correct solution immediately to gain +10 points.",
      "Each correct answer adds a slight time bonus to keep you in the sprint."
    ]
  }
};

// Global active loop or interval tracker to prevent memory leaks when switching
let activeIntervals = [];
function registerInterval(fn, ms) {
  const id = setInterval(fn, ms);
  activeIntervals.push(id);
  return id;
}
function clearAllIntervals() {
  activeIntervals.forEach(clearInterval);
  activeIntervals = [];
}

// Initial Setup on DOM Ready
document.addEventListener("DOMContentLoaded", () => {
  const spec = GAME_SPECS[currentGameId] || GAME_SPECS.snake;

  // Set Document Title & Text
  document.title = `${spec.title} | PlayVerse`;
  document.getElementById("gameTitle").textContent = spec.title;
  document.getElementById("gameDesc").textContent = spec.desc;

  const instructionsBody = document.getElementById("gameInstructionsBody");
  const ul = document.createElement("ul");
  spec.instructions.forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    ul.appendChild(li);
  });
  instructionsBody.innerHTML = "";
  instructionsBody.appendChild(ul);

  const restartBtn = document.getElementById("restartBtn");
  restartBtn.addEventListener("click", () => {
    launchGame(currentGameId);
  });

  launchGame(currentGameId);
});

function launchGame(gameId) {
  clearAllIntervals();
  const viewport = document.getElementById("gameViewport");
  viewport.innerHTML = "";

  switch (gameId) {
    case "snake": initSnake(viewport); break;
    case "memory": initMemory(viewport); break;
    case "ttt": initTicTacToe(viewport); break;
    case "rps": initRPS(viewport); break;
    case "2048": init2048(viewport); break;
    case "breaker": initBrickBreaker(viewport); break;
    case "hangman": initHangman(viewport); break;
    case "mole": initWhackAMole(viewport); break;
    case "reaction": initReaction(viewport); break;
    case "math": initMathSprint(viewport); break;
    default: initSnake(viewport); break;
  }
}

/* ========================================================
   GAME 1: NEON SNAKE
   ======================================================== */
function initSnake(container) {
  let score = 0;
  let best = parseInt(localStorage.getItem("pv_snake_best") || "0", 10);
  const gridSize = 20;
  const tileCount = 16; // 320x320 canvas
  let snake = [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }];
  let food = { x: 12, y: 8 };
  let dx = 1;
  let dy = 0;
  let nextDx = 1;
  let nextDy = 0;
  let gameOver = false;

  container.innerHTML = `
    <div class="hud-bar">
      <div class="hud-item"><span class="hud-label">SCORE</span><span class="hud-val" id="snakeScore">0</span></div>
      <div class="hud-item"><span class="hud-label">BEST</span><span class="hud-val" id="snakeBest">${best}</span></div>
    </div>
    <canvas id="snakeCanvas" class="game-canvas" width="320" height="320"></canvas>
    <div id="snakeMsg" class="game-status-msg">Use controls to start moving</div>
    <div class="dpad-container">
      <div class="dpad-row"><button class="dpad-btn" id="dpadUp">▲</button></div>
      <div class="dpad-row">
        <button class="dpad-btn" id="dpadLeft">◀</button>
        <button class="dpad-btn" id="dpadDown">▼</button>
        <button class="dpad-btn" id="dpadRight">▶</button>
      </div>
    </div>
  `;

  const canvas = document.getElementById("snakeCanvas");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("snakeScore");
  const bestEl = document.getElementById("snakeBest");
  const msgEl = document.getElementById("snakeMsg");

  function spawnFood() {
    let valid = false;
    while (!valid) {
      food.x = Math.floor(Math.random() * tileCount);
      food.y = Math.floor(Math.random() * tileCount);
      valid = !snake.some(seg => seg.x === food.x && seg.y === food.y);
    }
  }

  function setDirection(newDx, newDy) {
    if (gameOver) return;
    if (newDx !== -dx || newDy !== -dy) {
      nextDx = newDx;
      nextDy = newDy;
      msgEl.textContent = "Survive & Hunt";
    }
  }

  // Keyboard controls
  const keyHandler = (e) => {
    if (["ArrowUp", "KeyW"].includes(e.code) && dy === 0) setDirection(0, -1);
    else if (["ArrowDown", "KeyS"].includes(e.code) && dy === 0) setDirection(0, 1);
    else if (["ArrowLeft", "KeyA"].includes(e.code) && dx === 0) setDirection(-1, 0);
    else if (["ArrowRight", "KeyD"].includes(e.code) && dx === 0) setDirection(1, 0);
  };
  window.addEventListener("keydown", keyHandler);

  // Mobile D-Pad
  document.getElementById("dpadUp").onclick = () => { if (dy === 0) setDirection(0, -1); };
  document.getElementById("dpadDown").onclick = () => { if (dy === 0) setDirection(0, 1); };
  document.getElementById("dpadLeft").onclick = () => { if (dx === 0) setDirection(-1, 0); };
  document.getElementById("dpadRight").onclick = () => { if (dx === 0) setDirection(1, 0); };

  function step() {
    if (gameOver) return;

    dx = nextDx;
    dy = nextDy;

    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // Wall collision
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
      return triggerGameOver();
    }

    // Body collision
    if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
      return triggerGameOver();
    }

    snake.unshift(head);

    // Food collision
    if (head.x === food.x && head.y === food.y) {
      score += 10;
      scoreEl.textContent = score;
      if (score > best) {
        best = score;
        bestEl.textContent = best;
        localStorage.setItem("pv_snake_best", best);
      }
      spawnFood();
    } else {
      snake.pop();
    }

    // Render
    ctx.fillStyle = "#0c0d12";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Food
    ctx.fillStyle = "#ffc72c";
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#ffc72c";
    ctx.beginPath();
    ctx.arc(food.x * gridSize + gridSize/2, food.y * gridSize + gridSize/2, gridSize/2.3, 0, Math.PI * 2);
    ctx.fill();

    // Draw Snake
    snake.forEach((seg, idx) => {
      ctx.fillStyle = idx === 0 ? "#00e5ff" : "#00ff88";
      ctx.shadowBlur = idx === 0 ? 10 : 4;
      ctx.shadowColor = idx === 0 ? "#00e5ff" : "#00ff88";
      ctx.fillRect(seg.x * gridSize + 1, seg.y * gridSize + 1, gridSize - 2, gridSize - 2);
    });
    ctx.shadowBlur = 0;
  }

  function triggerGameOver() {
    gameOver = true;
    msgEl.innerHTML = `<span style="color:var(--neon-pink)">GAME OVER! Final Score: ${score}</span>`;
    window.removeEventListener("keydown", keyHandler);
  }

  registerInterval(step, 130);
}

/* ========================================================
   GAME 2: MEMORY MATCH
   ======================================================== */
function initMemory(container) {
  const icons = ["🚀", "👾", "⚡", "💎", "🛡️", "🔮", "🔥", "🕹️"];
  const deck = [...icons, ...icons].sort(() => Math.random() - 0.5);

  let flippedCards = [];
  let matchedCount = 0;
  let moves = 0;
  let seconds = 0;
  let timerActive = false;

  container.innerHTML = `
    <div class="hud-bar">
      <div class="hud-item"><span class="hud-label">MOVES</span><span class="hud-val" id="memMoves">0</span></div>
      <div class="hud-item"><span class="hud-label">TIME</span><span class="hud-val" id="memTimer">00:00</span></div>
    </div>
    <div class="memory-grid" id="memoryGrid"></div>
    <div id="memMsg" class="game-status-msg">Tap cards to find pairs</div>
  `;

  const grid = document.getElementById("memoryGrid");
  const movesEl = document.getElementById("memMoves");
  const timerEl = document.getElementById("memTimer");
  const msgEl = document.getElementById("memMsg");

  const timerInterval = registerInterval(() => {
    if (!timerActive) return;
    seconds++;
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    timerEl.textContent = `${m}:${s}`;
  }, 1000);

  deck.forEach((icon, index) => {
    const card = document.createElement("div");
    card.className = "memory-card";
    card.dataset.icon = icon;
    card.dataset.index = index;
    card.textContent = "❓";

    card.addEventListener("click", () => {
      if (!timerActive && matchedCount < 8) timerActive = true;
      if (card.classList.contains("flipped") || card.classList.contains("matched") || flippedCards.length === 2) return;

      card.classList.add("flipped");
      card.textContent = icon;
      flippedCards.push(card);

      if (flippedCards.length === 2) {
        moves++;
        movesEl.textContent = moves;
        const [c1, c2] = flippedCards;

        if (c1.dataset.icon === c2.dataset.icon) {
          c1.classList.add("matched");
          c2.classList.add("matched");
          matchedCount++;
          flippedCards = [];
          if (matchedCount === 8) {
            timerActive = false;
            msgEl.innerHTML = `<span style="color:var(--neon-green)">VICTORY! Cleared in ${moves} moves!</span>`;
          }
        } else {
          setTimeout(() => {
            c1.classList.remove("flipped");
            c2.classList.remove("flipped");
            c1.textContent = "❓";
            c2.textContent = "❓";
            flippedCards = [];
          }, 700);
        }
      }
    });

    grid.appendChild(card);
  });
}

/* ========================================================
   GAME 3: TIC-TAC-TOE
   ======================================================== */
function initTicTacToe(container) {
  let board = Array(9).fill(null);
  let isXNext = true;
  let againstAI = true;
  let active = true;
  let scores = { x: 0, o: 0, tie: 0 };

  container.innerHTML = `
    <div class="mode-toggle">
      <button class="btn-pill btn-pill-gold" id="tttAiMode">Play vs AI</button>
      <button class="btn-pill" id="ttt2pMode">2 Players</button>
    </div>
    <div class="hud-bar">
      <div class="hud-item"><span class="hud-label">PLAYER (X)</span><span class="hud-val" id="scoreX">0</span></div>
      <div class="hud-item"><span class="hud-label">TIES</span><span class="hud-val" id="scoreTie">0</span></div>
      <div class="hud-item"><span class="hud-label">OPPONENT (O)</span><span class="hud-val" id="scoreO">0</span></div>
    </div>
    <div class="ttt-grid" id="tttGrid"></div>
    <div id="tttMsg" class="game-status-msg">Your Turn (X)</div>
  `;

  const grid = document.getElementById("tttGrid");
  const msgEl = document.getElementById("tttMsg");
  const btnAi = document.getElementById("tttAiMode");
  const btn2p = document.getElementById("ttt2pMode");

  btnAi.onclick = () => { againstAI = true; btnAi.classList.add("btn-pill-gold"); btn2p.classList.remove("btn-pill-gold"); resetBoard(); };
  btn2p.onclick = () => { againstAI = false; btn2p.classList.add("btn-pill-gold"); btnAi.classList.remove("btn-pill-gold"); resetBoard(); };

  function checkWinner(squares) {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return squares.includes(null) ? null : "Tie";
  }

  function renderCells() {
    grid.innerHTML = "";
    board.forEach((val, i) => {
      const cell = document.createElement("div");
      cell.className = `ttt-cell ${val ? val.toLowerCase() : ""}`;
      cell.textContent = val || "";
      cell.addEventListener("click", () => handleCellClick(i));
      grid.appendChild(cell);
    });
  }

  function handleCellClick(index) {
    if (!active || board[index]) return;

    board[index] = isXNext ? "X" : "O";
    renderCells();
    const result = checkWinner(board);

    if (result) return processEnd(result);

    isXNext = !isXNext;
    msgEl.textContent = isXNext ? "Player X Turn" : (againstAI ? "AI Thinking..." : "Player O Turn");

    if (!isXNext && againstAI) {
      active = false;
      setTimeout(aiMove, 350);
    }
  }

  function aiMove() {
    // Basic AI with winning/blocking logic
    let emptyIndices = board.map((v, i) => v === null ? i : null).filter(v => v !== null);
    if (emptyIndices.length === 0) return;

    let move = null;
    // Check if AI can win
    for (let idx of emptyIndices) {
      board[idx] = "O";
      if (checkWinner(board) === "O") { move = idx; board[idx] = null; break; }
      board[idx] = null;
    }
    // Block opponent win
    if (move === null) {
      for (let idx of emptyIndices) {
        board[idx] = "X";
        if (checkWinner(board) === "X") { move = idx; board[idx] = null; break; }
        board[idx] = null;
      }
    }
    // Choose center or random
    if (move === null) {
      if (emptyIndices.includes(4)) move = 4;
      else move = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    }

    board[move] = "O";
    renderCells();
    const result = checkWinner(board);
    if (result) return processEnd(result);

    isXNext = true;
    active = true;
    msgEl.textContent = "Your Turn (X)";
  }

  function processEnd(winner) {
    active = false;
    if (winner === "Tie") {
      scores.tie++;
      document.getElementById("scoreTie").textContent = scores.tie;
      msgEl.innerHTML = `<span style="color:var(--text-dim)">Round Drawn!</span>`;
    } else {
      if (winner === "X") scores.x++; else scores.o++;
      document.getElementById("scoreX").textContent = scores.x;
      document.getElementById("scoreO").textContent = scores.o;
      msgEl.innerHTML = `<span style="color:var(--neon-green)">${winner} WINS THE MATCH!</span>`;
    }
  }

  function resetBoard() {
    board = Array(9).fill(null);
    isXNext = true;
    active = true;
    msgEl.textContent = "Your Turn (X)";
    renderCells();
  }

  renderCells();
}

/* ========================================================
   GAME 4: ROCK PAPER SCISSORS
   ======================================================== */
function initRPS(container) {
  let playerWins = 0;
  let aiWins = 0;
  let ties = 0;
  const choices = [
    { name: "rock", icon: "✊" },
    { name: "paper", icon: "✋" },
    { name: "scissors", icon: "✌️" }
  ];

  container.innerHTML = `
    <div class="hud-bar">
      <div class="hud-item"><span class="hud-label">YOU</span><span class="hud-val" id="rpsUserScore">0</span></div>
      <div class="hud-item"><span class="hud-label">TIES</span><span class="hud-val" id="rpsTies">0</span></div>
      <div class="hud-item"><span class="hud-label">AI</span><span class="hud-val" id="rpsAiScore">0</span></div>
    </div>

    <div class="rps-stage">
      <div class="rps-slot">
        <span class="hud-label">YOUR PICK</span>
        <span class="symbol" id="playerPick">❔</span>
      </div>
      <span style="font-family:var(--font-display); font-size:20px; color:var(--gold-primary);">VS</span>
      <div class="rps-slot">
        <span class="hud-label">AI PICK</span>
        <span class="symbol" id="aiPick">❔</span>
      </div>
    </div>

    <div id="rpsOutcome" class="rps-result">Select your move!</div>

    <div class="rps-options">
      <button class="rps-btn" data-choice="rock" title="Rock">✊</button>
      <button class="rps-btn" data-choice="paper" title="Paper">✋</button>
      <button class="rps-btn" data-choice="scissors" title="Scissors">✌️</button>
    </div>
  `;

  const userScoreEl = document.getElementById("rpsUserScore");
  const aiScoreEl = document.getElementById("rpsAiScore");
  const tiesEl = document.getElementById("rpsTies");
  const playerPickEl = document.getElementById("playerPick");
  const aiPickEl = document.getElementById("aiPick");
  const outcomeEl = document.getElementById("rpsOutcome");

  container.querySelectorAll(".rps-btn").forEach(btn => {
    btn.onclick = () => {
      const userChoice = btn.dataset.choice;
      const aiObj = choices[Math.floor(Math.random() * choices.length)];
      const userObj = choices.find(c => c.name === userChoice);

      playerPickEl.textContent = userObj.icon;
      aiPickEl.textContent = aiObj.icon;

      if (userChoice === aiObj.name) {
        ties
