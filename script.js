/* ============================================================
   ARABIC WORD GAME — script.js
   ============================================================
   HOW TO CHANGE THE WORD:
   Edit ONLY the `gameData` object below.

   template    : The word pattern using real letters and "_" for blanks.
                 Separate each character with a space.
                 Example: "ن _ _ س"  →  ن  [_]  [_]  س
                 Example: "_ ر _ س _ _"  →  all blanks + ر + س

   correctWord : The complete word (all letters, no spaces, no underscores).
                 Used to validate answers.

   clue        : The description/hint shown to the player.
   ============================================================ */

const gameData = {
  template:    "ن _ _ س",
  correctWord: "نرجس",
  clue:        "زهرةٌ بيضاء أو صفراء ذات عطرٍ فوّاح، تُعدّ رمزاً للجمال والنقاء في الشعر العربي القديم."
};

/* ============================================================
   GOOGLE ANALYTICS 4 — EVENT TRACKING
   ============================================================
   To activate:
   1. Add your GA4 gtag.js snippet to <head> in index.html.
   2. Uncomment the `gtag(...)` call inside the win block below.

   gtag('event', 'word_guessed_correctly', {
     event_category: 'game',
     event_label:    gameData.correctWord,
     value:          1
   });
   ============================================================ */

/* ── State ────────────────────────────────────────────── */
let inputEls  = [];   // ordered array of <input> elements
let hasWon    = false;

/* ── Boot ─────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  buildGame();
});

/* ── Build the Letter Grid ─────────────────────────────
   Parses `gameData.template` character by character.
   A space ( ) is just a separator — ignored.
   "_" creates an <input> box.
   Any other character creates a static <span>.
─────────────────────────────────────────────────────── */
function buildGame() {
  const grid    = document.getElementById("letter-grid");
  const clueEl  = document.getElementById("clue-text");

  clueEl.textContent = gameData.clue;
  grid.innerHTML     = "";
  inputEls           = [];
  hasWon             = false;

  hideFeedback();
  document.getElementById("check-btn").disabled  = false;
  document.getElementById("reset-btn").disabled  = false;
  document.querySelector(".game-card").classList.remove("won");

  /* Split on single spaces between tokens */
  const tokens = gameData.template.trim().split(/\s+/);

  tokens.forEach((token) => {
    if (token === "_") {
      /* ── Input cell ── */
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
      /* ── Static letter ── */
      const cell       = document.createElement("div");
      cell.className   = "letter-cell";
      cell.textContent = token;
      cell.setAttribute("aria-label", `الحرف ${token}`);
      grid.appendChild(cell);
    }
  });

  /* Focus first input after a short delay */
  if (inputEls.length > 0) {
    setTimeout(() => inputEls[0].focus(), 120);
  }
}

/* ── Input Handler ─────────────────────────────────────
   Auto-advance cursor to next box when a character is typed.
─────────────────────────────────────────────────────── */
function onInput(e) {
  const input = e.target;
  const val   = input.value;

  /* Keep only the last character typed */
  if (val.length > 1) {
    input.value = val.slice(-1);
  }

  /* Clear state classes on edit */
  input.classList.remove("correct", "incorrect");
  const dot = input.nextElementSibling;
  if (dot) dot.style.background = "";

  /* Advance to next input if a character was entered */
  if (input.value.length === 1) {
    const idx = inputEls.indexOf(input);
    if (idx < inputEls.length - 1) {
      inputEls[idx + 1].focus();
    }
  }
}

/* ── Keydown Handler ───────────────────────────────────
   • Enter  → check answer
   • Backspace on empty → move to previous input
─────────────────────────────────────────────────────── */
function onKeydown(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    checkAnswer();
    return;
  }

  if (e.key === "Backspace") {
    const input = e.target;
    if (input.value === "") {
      const idx = inputEls.indexOf(input);
      if (idx > 0) {
        e.preventDefault();
        const prev = inputEls[idx - 1];
        prev.value = "";
        prev.focus();
        prev.classList.remove("correct", "incorrect");
      }
    }
  }
}

/* ── Check Answer ──────────────────────────────────────
   Reconstructs the attempted word by walking the template
   and filling in user-typed letters for "_" positions.
─────────────────────────────────────────────────────── */
function checkAnswer() {
  if (hasWon) return;

  const tokens = gameData.template.trim().split(/\s+/);
  let inputIdx = 0;
  let attempt  = "";

  tokens.forEach((token) => {
    if (token === "_") {
      attempt += (inputEls[inputIdx]?.value.trim() || "");
      inputIdx++;
    } else {
      attempt += token;
    }
  });

  /* Check all inputs are filled */
  const allFilled = inputEls.every(inp => inp.value.trim() !== "");
  if (!allFilled) {
    showFeedback("يبدو أنّ بعض الخانات لا تزال فارغة. أكمل جميع الحروف!", "error");
    /* Highlight empty inputs */
    inputEls.forEach(inp => {
      if (inp.value.trim() === "") {
        inp.classList.add("incorrect");
        inp.focus();
      }
    });
    return;
  }

  /* Compare attempt to correct word */
  const correct = gameData.correctWord.trim();
  if (attempt === correct) {
    handleWin();
  } else {
    handleWrong(attempt);
  }
}

/* ── Win ──────────────────────────────────────────────── */
function handleWin() {
  hasWon = true;

  inputEls.forEach(inp => {
    inp.classList.remove("incorrect");
    inp.classList.add("correct");
    inp.disabled = true;
  });

  document.getElementById("check-btn").disabled = true;
  document.querySelector(".game-card").classList.add("won");

  showFeedback(
    `🌸 أحسنت! الكلمة الصحيحة هي «${gameData.correctWord}». رائع جداً!`,
    "success"
  );

  /* ── GA4 Event (uncomment when gtag is loaded) ──────
  gtag('event', 'word_guessed_correctly', {
    event_category: 'game',
    event_label:    gameData.correctWord,
    value:          1
  });
  ────────────────────────────────────────────────────── */
}

/* ── Wrong Answer ─────────────────────────────────────── */
function handleWrong(attempt) {
  inputEls.forEach(inp => {
    inp.classList.add("incorrect");
  });

  showFeedback(
    `حاول مرة أخرى! الكلمة المُدخَلة «${attempt}» غير صحيحة.`,
    "error"
  );

  /* Remove error class after animation */
  setTimeout(() => {
    inputEls.forEach(inp => inp.classList.remove("incorrect"));
  }, 800);
}

/* ── Reset ─────────────────────────────────────────────── */
function resetGame() {
  buildGame();
}

/* ── Feedback Helpers ─────────────────────────────────── */
function showFeedback(message, type) {
  const el = document.getElementById("feedback");
  el.textContent = message;
  el.className   = `feedback visible ${type}`;
}

function hideFeedback() {
  const el = document.getElementById("feedback");
  el.className   = "feedback";
  el.textContent = "";
}
