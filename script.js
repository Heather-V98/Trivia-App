// ==============================
// F1 Trivia - script.js (with per-question countdown)
// ==============================

// API for questions
const questions = [
  {
    question: "Who holds the record for the most Formula 1 World Championships?",
    answers: ["Michael Schumacher", "Lewis Hamilton", "Both are tied with 7", "Ayrton Senna"],
    correct: 2
  },
  {
    question: "Which team has the most Constructors' Championships?",
    answers: ["McLaren", "Ferrari", "Red Bull", "Mercedes"],
    correct: 1
  },
  {
    question: "Which circuit is known as 'The Temple of Speed'?",
    answers: ["Silverstone", "Monza", "Hungaroring", "Monaco"],
    correct: 1
  },
  {
    question: "In which year did the Formula 1 World Championship begin?",
    answers: ["1946", "1955", "1950", "1960"],
    correct: 2
  },
  {
    question: "Who has the most Grand Prix victories?",
    answers: ["Michael Schumacher", "Max Verstappen", "Sebastian Vettel", "Lewis Hamilton"],
    correct: 3
  },
  {
    question: "What is the minimum weight of an F1 car (including driver) for 2024?",
    answers: ["696 kg", "734 kg", "798 kg", "850 kg"],
    correct: 2
  },
  {
    question: "What is the shortest circuit on the F1 Calendar?",
    answers: ["Monaco", "Zandvoort", "Red Bull Ring", "Singapore"],
    correct: 0
  },
  {
    question: "Who was the youngest driver to win an F1 World Championship?",
    answers: ["Fernando Alonso", "Max Verstappen", "Niki Lauda", "Ayrton Senna"],
    correct: 1
  },
  {
    question: "How many points does the race winner receive?",
    answers: ["15", "20", "30", "25"],
    correct: 3
  },
  {
    question: "Which company supplies tires for all F1 teams?",
    answers: ["Goodyear", "Michelin", "Pirelli", "Bridgestone"],
    correct: 2
  }
];


const QUESTION_TIME_SECONDS = 15; // per-question time limit


let currentQuestion = 0;
let score = 0;

// Overall quiz timer (for stats)
let startTime = null;

// Per-question countdown state
let timerId = null;
let timeLeft = QUESTION_TIME_SECONDS;

// --- DOM ---
const questionText = document.getElementById("question-text");
const answersDiv = document.getElementById("answers");
const progress = document.getElementById("progress");
const scoreDisplay = document.getElementById("score");
const restartBtn = document.getElementById("restartBtn");
const logoutBtn = document.getElementById("logoutBtn");
const timerEl = document.getElementById("timer");

// --- Init ---
startQuiz();

// ==============================
// Core functions
// ==============================

function startQuiz() {
  currentQuestion = 0;
  score = 0;
  startTime = Date.now();
  restartBtn.classList.add("hidden");
  scoreDisplay.textContent = `Score: ${score}`;
  loadQuestion();
}

function loadQuestion() {
  const q = questions[currentQuestion];
  questionText.textContent = q.question;

  // Build answers
  answersDiv.innerHTML = "";
  q.answers.forEach((ans, i) => {
    const btn = document.createElement("button");
    btn.textContent = ans;
    btn.className = "answer-btn";
    btn.onclick = () => onAnswerClick(i);
    answersDiv.appendChild(btn);
  });

  // Progress
  progress.textContent = `Question ${currentQuestion + 1} of ${questions.length}`;

  // Reset and start per-question timer
  startCountdown();
}

function onAnswerClick(i) {
  // Prevent double answers if time is up or already answered
  if (!answersDiv.querySelector("button") || !answersDiv.querySelector("button").onclick) return;

  stopCountdown();
  checkAnswer(i);
}

function checkAnswer(i) {
  const isCorrect = i === questions[currentQuestion].correct;

  // Disable all buttons to prevent multiple clicks
  setAnswersDisabled(true);

  if (isCorrect) {
    score++;
    scoreDisplay.textContent = `Score: ${score}`;
    if (typeof Swal !== "undefined") {
      Swal.fire("Correct!", "Nice job!", "success");
    }
  } else {
    if (typeof Swal !== "undefined") {
      Swal.fire("Time's up!" , "Moving on...", "warning");
    }
  }

  currentQuestion++;

  if (currentQuestion < questions.length) {
    loadQuestion();
  } else {
    finishQuiz();
  }
}

function finishQuiz() {
  // Time taken in seconds for the whole quiz
  const timeTaken = Math.round((Date.now() - startTime) / 1000);

  // Save stats
  saveGameStats(score, timeTaken);

  // Optional per-user score history
  const user = localStorage.getItem("currentUser");
  if (user) {
    const scores = JSON.parse(localStorage.getItem(`${user}_scores`) || "[]");
    scores.push(score);
    localStorage.setItem(`${user}_scores`, JSON.stringify(scores));
  }

  // Show summary then go to stats
  if (typeof Swal !== "undefined") {
    Swal.fire({
      title: "Quiz Complete!",
      text: `Score: ${score}/${questions.length} • Time: ${timeTaken}s`,
      icon: "success",
      confirmButtonText: "View Stats"
    }).then(() => {
      window.location.href = "stats.html";
    });
  } else {
    alert(`Score: ${score}/${questions.length} • Time: ${timeTaken}s`);
    window.location.href = "stats.html";
  }
}

// ==============================
// Countdown helpers
// ==============================

function startCountdown() {
  stopCountdown(); // clear any previous interval
  timeLeft = QUESTION_TIME_SECONDS;
  updateTimerUI();

  timerId = setInterval(() => {
    timeLeft -= 1;
    updateTimerUI();

    if (timeLeft <= 0) {
      stopCountdown();
      // Auto-mark as incorrect on timeout
      setAnswersDisabled(true);
      // Pass an impossible index to force incorrect (or just call checkAnswer with wrong index)
      checkAnswer(-1);
    }
  }, 1000);
}

function stopCountdown() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}

function updateTimerUI() {
  if (!timerEl) return;
  const mm = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const ss = (timeLeft % 60).toString().padStart(2, "0");
  timerEl.textContent = `Time: ${mm}:${ss}`;
  // Add a low-time visual cue (under 5s)
  if (timeLeft <= 5) timerEl.classList.add("low");
  else timerEl.classList.remove("low");
}

function setAnswersDisabled(disabled) {
  const btns = answersDiv.querySelectorAll("button");
  btns.forEach(b => {
    b.disabled = disabled;
    if (disabled) b.onclick = null;
  });
}

// ==============================
// Persistence
// ==============================

function saveGameStats(score, timeTaken) {
  const KEY = "f1trivia_games";
  const games = JSON.parse(localStorage.getItem(KEY) || "[]");

  const newGame = {
    date: new Date().toLocaleDateString(),
    score,
    timeTaken
  };

  games.push(newGame);
  localStorage.setItem(KEY, JSON.stringify(games));
}

// ==============================
// UI actions
// ==============================

restartBtn.addEventListener("click", () => {
  stopCountdown();
  startQuiz();
});

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("currentUser");
    window.location.href = "index.html";
  });
}

