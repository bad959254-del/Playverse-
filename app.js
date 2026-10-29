/* ========================================================
   PlayVerse Portal Main Logic (app.js)
   Renders game directory, search, and category filters
   ======================================================== */

// Game metadata catalog
const PLAYVERSE_GAMES = [
  {
    id: "snake",
    title: "Neon Snake",
    category: "arcade",
    icon: "🐍",
    desc: "Navigate the cyber grid, eat glowing orbs, and avoid colliding with walls or your own tail."
  },
  {
    id: "memory",
    title: "Memory Match",
    category: "puzzle",
    icon: "🧠",
    desc: "Flip cards and find all hidden pairs using the fewest moves and fastest time."
  },
  {
    id: "ttt",
    title: "Tic-Tac-Toe",
    category: "classic",
    icon: "❌",
    desc: "Classic 3x3 showdown. Battle a friend locally or challenge the computer AI."
  },
  {
    id: "rps",
    title: "Rock Paper Scissors",
    category: "classic",
    icon: "✊",
    desc: "Test your luck and strategy against the AI engine across multiple rounds."
  },
  {
    id: "2048",
    title: "2048 Puzzle",
    category: "puzzle",
    icon: "🔢",
    desc: "Slide matching numbers together to merge them and reach the coveted 2048 tile."
  },
  {
    id: "breaker",
    title: "Brick Breaker",
    category: "arcade",
    icon: "🧱",
    desc: "Deflect the energy ball with your paddle and shatter all cyber bricks without dying."
  },
  {
    id: "hangman",
    title: "Hangman",
    category: "puzzle",
    icon: "🔤",
    desc: "Guess the hidden gaming-themed word one letter at a time before attempts run out."
  },
  {
    id: "mole",
    title: "Whack-a-Mole",
    category: "reflex",
    icon: "🔨",
    desc: "Tap sneaky robotic moles as quickly as they emerge in a 30-second speed frenzy."
  },
  {
    id: "reaction",
    title: "Reaction Test",
    category: "reflex",
    icon: "⚡",
    desc: "Wait for the danger red to switch to green, then tap immediately to gauge your reaction speed."
  },
  {
    id: "math",
    title: "Math Sprint",
    category: "reflex",
    icon: "⏱️",
    desc: "Solve arithmetic equations as fast as possible before the countdown timer hits zero."
  }
];

document.addEventListener("DOMContentLoaded", () => {
  const gamesGrid = document.getElementById("gamesGrid");
  const gameSearch = document.getElementById("gameSearch");
  const clearSearch = document.getElementById("clearSearch");
  const categoryFilters = document.getElementById("categoryFilters");
  const gameCount = document.getElementById("gameCount");
  const noResults = document.getElementById("noResults");

  let activeCategory = "all";
  let searchQuery = "";

  // Render cards
  function renderGames() {
    const filtered = PLAYVERSE_GAMES.filter(game => {
      const matchCat = activeCategory === "all" || game.category === activeCategory;
      const matchSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          game.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          game.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });

    gamesGrid.innerHTML = "";
    gameCount.textContent = `Showing ${filtered.length} of ${PLAYVERSE_GAMES.length} Games`;

    if (filtered.length === 0) {
      noResults.style.display = "block";
    } else {
      noResults.style.display = "none";
      filtered.forEach(game => {
        const card = document.createElement("a");
        card.className = "game-card";
        // Use relative URL to support GitHub Pages subpaths
        card.href = `game.html?game=${encodeURIComponent(game.id)}`;
        
        card.innerHTML = `
          <div class="card-top">
            <div class="card-icon-wrap">${game.icon}</div>
            <span class="card-badge">${game.category}</span>
          </div>
          <h3 class="card-title">${game.title}</h3>
          <p class="card-desc">${game.desc}</p>
          <div class="card-action">
            <span>Play Now</span>
            <span class="arrow">→</span>
          </div>
        `;
        gamesGrid.appendChild(card);
      });
    }
  }

  // Handle Search Input
  if (gameSearch) {
    gameSearch.addEventListener("input", (e) => {
      searchQuery = e.target.value.trim();
      clearSearch.style.display = searchQuery ? "block" : "none";
      renderGames();
    });

    clearSearch.addEventListener("click", () => {
      gameSearch.value = "";
      searchQuery = "";
      clearSearch.style.display = "none";
      renderGames();
      gameSearch.focus();
    });
  }

  // Handle Category Filter Clicks
  if (categoryFilters) {
    categoryFilters.addEventListener("click", (e) => {
      const btn = e.target.closest(".pill-btn");
      if (!btn) return;
      categoryFilters.querySelectorAll(".pill-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeCategory = btn.dataset.category;
      renderGames();
    });
  }

  // Initial load
  renderGames();
});
