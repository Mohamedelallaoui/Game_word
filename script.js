/* ============================================================
   ARABIC WORD GAME — script.js
   ============================================================
   HOW TO CHANGE THE WORD LIST:
   Edit words.json — or change STATIC_WORDS below for
   single-word static mode (no JSON needed).

   SCORING:
   • Correct on first try  → +10 pts
   • Correct on second try → +5  pts
   • Correct after that    → +2  pts
   ============================================================ */

/* ── Static fallback (used when NOT loading from words.json) ─
   Remove or comment out if you load from words.json.          */
const STATIC_WORDS = [
  {
    id: 1, difficulty: 2, category: "طبيعة",
    template: "ن _ _ س", correctWord: "نرجس",
    clue: "زهرةٌ بيضاء أو صفراء ذات عطرٍ فوّاح، رمزٌ للجمال في الشعر العربي."
  },
  {
    id: 2, difficulty: 1, category: "طبيعة",
    template: "_ م _ ", correctWord: "قمر",
    clue: "يُضيء الليلَ ويمرّ بأطوار من الهلال إلى البدر."
  },
  {
    id: 3, difficulty: 3, category: "أدب",
    template: "_ _ ي _ ة", correctWord: "قصيدة",
    clue: "عملٌ شعري متكامل له وزنٌ وقافية، يُعبّر فيه الشاعر عن مشاعره."
  }
];

/* ── Game State ───────────────────────────────────────────── */
let wordList   = [];
let currentIdx = 0;
let gameData   = {};
let inputEls   = [];
let hasWon     = false;
let attempts   = 0;
let totalScore = 0;

const POINTS = { 1: 10, 2: 5, default: 2 };

/* ── Boot ─────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  fetch('words.json')
    .then(r => r.json())
    .then(data => {
      wordList = Object.values(data.words).flat();
      initGame();
    })
    .catch(() => {
      wordList = STATIC_WORDS;
      initGame();
    });
});

function initGame() {
  currentIdx = 0;
  totalScore = 0;
  loadWord(0);
}

/* ── Load Word ────────────────────────────────────────────── */
function loadWord(idx) {
  gameData = wordList[idx];
  attempts = 0;
  hasWon   = false;
  updateScoreUI(false);
  buildGame();
}

/* ── Build Letter Grid ────────────────────────────────────── */
function buildGame() {
  const grid   = document.getElementById("letter-grid");
  const clueEl = document.getElementById("clue-text");

  clueEl.textContent = gameData.clue;
  grid.innerHTML     = "";
  inputEls           = [];

  hideFeedback();
  document.getElementById("check-btn").style.display = "flex";
  document.getElementById("next-btn").style.display  = "none";
  document.getElementById("reset-btn").disabled      = false;
  document.querySelector(".game-card").classList.remove("won");

  const tokens = gameData.template.trim().split(/\s+/);

  tokens.forEach((token) => {
    if (token === "_") {
      const wrapper = document.createElement("div");
      wrapper.className = "input-wrapper";

      const input = document.createElement("input");
      input.type         = "text";
      input.maxLength    = 1;
      input.className    = "letter-input";
      input.autocomplete = "off";
      input.autocorrect  = "off";
      input.spellcheck   = false;
      input.inputMode    = "text";
      input.setAttribute("aria-label", `حرف ${inputEls.length + 1}`);

      const dot = document.createElement("span");
      dot.className = "input-dot";

      input.addEventListener("input",   onInput);
      input.addEventListener("keydown", onKeydown);

      wrapper.appendChild(input);
      wrapper.appendChild(dot);
      grid.appendChild(wrapper);
      inputEls.push(input);

    } else {
      const cell       = document.createElement("div");
      cell.className   = "letter-cell";
      cell.textContent = token;
      grid.appendChild(cell);
    }
  });

  if (inputEls.length > 0) setTimeout(() => inputEls[0].focus(), 120);
}

/* ── Score UI ─────────────────────────────────────────────── */
function updateScoreUI(bump) {
  const scoreEl   = document.getElementById("score-value");
  const counterEl = document.getElementById("word-counter");
  const levelEl   = document.getElementById("level-badge");

  scoreEl.textContent  = totalScore;
  counterEl.innerHTML  = `${currentIdx + 1} / <span id="total-words">${wordList.length}</span>`;

  const lvlNames = { 1: "سهل جداً", 2: "سهل", 3: "متوسط", 4: "صعب", 5: "صعب جداً" };
  levelEl.textContent  = lvlNames[gameData.difficulty] || "—";

  if (bump) {
    scoreEl.classList.remove("bump");
    void scoreEl.offsetWidth;
    scoreEl.classList.add("bump");
    setTimeout(() => scoreEl.classList.remove("bump"), 400);
  }
}

/* ── Input & Keydown ──────────────────────────────────────── */
function onInput(e) {
  const input = e.target;
  if (input.value.length > 1) input.value = input.value.slice(-1);
  input.classList.remove("correct", "incorrect");
  const dot = input.nextElementSibling;
  if (dot) dot.style.background = "";
  if (input.value.length === 1) {
    const idx = inputEls.indexOf(input);
    if (idx < inputEls.length - 1) inputEls[idx + 1].focus();
  }
}

function onKeydown(e) {
  if (e.key === "Enter") { e.preventDefault(); checkAnswer(); return; }
  if (e.key === "Backspace" && e.target.value === "") {
    const idx = inputEls.indexOf(e.target);
    if (idx > 0) {
      e.preventDefault();
      const prev = inputEls[idx - 1];
      prev.value = "";
      prev.focus();
      prev.classList.remove("correct", "incorrect");
    }
  }
}

/* ── Check Answer ─────────────────────────────────────────── */
function checkAnswer() {
  if (hasWon) return;

  const allFilled = inputEls.every(inp => inp.value.trim() !== "");
  if (!allFilled) {
    showFeedback("يبدو أنّ بعض الخانات لا تزال فارغة!", "error");
    inputEls.forEach(inp => { if (!inp.value.trim()) inp.classList.add("incorrect"); });
    return;
  }

  attempts++;

  const tokens = gameData.template.trim().split(/\s+/);
  let inputIdx = 0, attempt = "";
  tokens.forEach(t => attempt += (t === "_") ? (inputEls[inputIdx++]?.value.trim() || "") : t);

  if (attempt === gameData.correctWord.trim()) handleWin();
  else handleWrong(attempt);
}

/* ── Win ──────────────────────────────────────────────────── */
function handleWin() {
  hasWon = true;
  const pts = POINTS[attempts] ?? POINTS.default;
  totalScore += pts;

  inputEls.forEach(inp => {
    inp.classList.remove("incorrect");
    inp.classList.add("correct");
    inp.disabled = true;
  });

  document.getElementById("check-btn").style.display = "none";
  document.querySelector(".game-card").classList.add("won");

  const isLast = currentIdx >= wordList.length - 1;

  if (isLast) {
    showFeedback(`🏆 أنهيت جميع الكلمات! +${pts} نقاط`, "success");
    updateScoreUI(true);
    showGameOver();
  } else {
    document.getElementById("next-btn").style.display = "flex";
    showFeedback(`✅ صحيح! +${pts} نقاط — الكلمة: «${gameData.correctWord}»`, "success");
    updateScoreUI(true);
  }

  /* ── GA4 (uncomment when gtag is active) ───────────────
  gtag('event', 'word_guessed_correctly', {
    event_category: 'game',
    event_label:    gameData.correctWord,
    value:          pts
  });
  ─────────────────────────────────────────────────────── */
}

/* ── Wrong ────────────────────────────────────────────────── */
function handleWrong(attempt) {
  inputEls.forEach(inp => inp.classList.add("incorrect"));
  showFeedback(`حاول مرة أخرى! «${attempt}» غير صحيحة.`, "error");
  setTimeout(() => inputEls.forEach(inp => inp.classList.remove("incorrect")), 800);
}

/* ── Next Word ────────────────────────────────────────────── */
function nextWord() {
  if (currentIdx < wordList.length - 1) {
    currentIdx++;
    loadWord(currentIdx);
  }
}

/* ── Reset (retry same word) ──────────────────────────────── */
function resetGame() {
  loadWord(currentIdx);
}

/* ── Game Over Screen ─────────────────────────────────────── */
function showGameOver() {
  const card = document.querySelector(".game-card");
  setTimeout(() => {
    card.innerHTML = `
      <div class="game-over">
        <p class="game-over-label">انتهت اللعبة</p>
        <h2 class="game-over-title">أحسنت! 🎉</h2>
        <p class="game-over-label">مجموع نقاطك</p>
        <span class="game-over-score">${totalScore}</span>
        <p class="game-over-label">من أصل ${wordList.length * 10} نقطة ممكنة</p>
        <button class="btn-restart" onclick="location.reload()">العب مجدداً</button>
      </div>
    `;
  }, 1800);
}

/* ── Feedback Helpers ─────────────────────────────────────── */
function showFeedback(msg, type) {
  const el = document.getElementById("feedback");
  el.textContent = msg;
  el.className   = `feedback visible ${type}`;
}

function hideFeedback() {
  const el = document.getElementById("feedback");
  el.className = "feedback";
  el.textContent = "";
}
