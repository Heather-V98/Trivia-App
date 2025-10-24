// ==============================
// F1 Trivia - script.js (complete with OpenTDB API URLs)
// ==============================

(() => {
  'use strict';

  // -----------------------------
  // OpenTDB API endpoints
  // -----------------------------
  const API_CATEGORIES = 'https://opentdb.com/api_category.php';
  const API_BASE       = 'https://opentdb.com/api.php';

  // -----------------------------
  // Config
  // -----------------------------
  const QUESTION_TIME_SECONDS = 15;   // per-question countdown
  const GAMES_KEY = 'f1trivia_games'; // stats storage key

  // Defaults if no settings are provided
  const DEFAULT_SETTINGS = {
    amount: 10,          // number of questions
    category: '',        // OpenTDB category id or '' for any
    difficulty: '',      // 'easy' | 'medium' | 'hard' | '' for any
    type: ''             // 'multiple' | 'boolean' | '' for any
  };

  // -----------------------------
  // State (declared ONCE)
  // -----------------------------
  let questions = [];
  let currentQuestion = 0;
  let score = 0;

  // overall quiz timer (for stats)
  let startTime = null;

  // per-question countdown
  let timerId = null;
  let timeLeft = QUESTION_TIME_SECONDS;

  // -----------------------------
  // DOM
  // -----------------------------
  const questionText = document.getElementById('question-text');
  const answersDiv   = document.getElementById('answers');
  const progressEl   = document.getElementById('progress');
  const scoreEl      = document.getElementById('score');
  const restartBtn   = document.getElementById('restartBtn');
  const logoutBtn    = document.getElementById('logoutBtn');
  const timerEl      = document.getElementById('timer');

  // -----------------------------
  // Boot
  // -----------------------------
  loadQuestionsFromAPI();

  // =============================
  // Build settings & URL
  // =============================
  function getSettings() {
    // 1) URL query params
    const params = new URLSearchParams(window.location.search);
    const qp = {
      amount: params.get('amount') || '',
      category: params.get('category') || '',
      difficulty: params.get('difficulty') || '',
      type: params.get('type') || ''
    };

    // 2) localStorage (if present)
    let ls = {};
    try {
      ls = JSON.parse(localStorage.getItem('quizSettings') || '{}');
    } catch (_) {}

    // Merge priority: query params > localStorage > defaults
    const settings = {
      amount: Number(qp.amount || ls.amount || DEFAULT_SETTINGS.amount),
      category: (qp.category || ls.category || DEFAULT_SETTINGS.category).toString().trim(),
      difficulty: (qp.difficulty || ls.difficulty || DEFAULT_SETTINGS.difficulty).toString().trim(),
      type: (qp.type || ls.type || DEFAULT_SETTINGS.type).toString().trim()
    };

    // Clamp amount to [1..50] for safety
    if (!Number.isFinite(settings.amount) || settings.amount < 1) settings.amount = 10;
    if (settings.amount > 50) settings.amount = 50;

    return settings;
  }

  function buildOpenTdbUrl(settings) {
    const { amount, category, difficulty, type } = settings;
    const url = new URL(API_BASE);
    url.searchParams.set('amount', String(amount));
    if (category)   url.searchParams.set('category', category);
    if (difficulty) url.searchParams.set('difficulty', difficulty);
    if (type)       url.searchParams.set('type', type);
    return url.toString();
  }

  // =============================
  // Data loading (OpenTDB)
  // =============================
  async function loadQuestionsFromAPI() {
    const settings = getSettings();
    const apiUrl = buildOpenTdbUrl(settings);

    try {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error(`Network error: ${res.status}`);
      const data = await res.json();

      if (data.response_code !== 0 || !Array.isArray(data.results) || data.results.length === 0) {
        alert('No questions found for those options. Try different settings.');
        // Optional: bounce to setup if you have one.
        // window.location.href = 'setup.html';
        return;
      }

      questions = data.results.map(q => {
        const correct = decodeHtml(q.correct_answer);
        const options = [...q.incorrect_answers.map(decodeHtml), correct];
        const shuffled = shuffle(options);
        return {
          question: decodeHtml(q.question),
          answers: shuffled,
          correct: shuffled.indexOf(correct)
        };
      });

      startQuiz();
    } catch (err) {
      console.error('Fetch failed:', err);
      alert('Failed to load quiz. Please try again.');
    }
  }

  // =============================
  // Quiz flow
  // =============================
  function startQuiz() {
    currentQuestion = 0;
    score = 0;
    startTime = Date.now();

    if (restartBtn) restartBtn.classList.add('hidden');
    if (scoreEl) scoreEl.textContent = `Score: ${score}`;

    loadQuestion();
  }

  function loadQuestion() {
    const q = questions[currentQuestion];
    if (!q) return;

    // content
    questionText.textContent = q.question;

    // answers
    answersDiv.innerHTML = '';
    q.answers.forEach((ans, i) => {
      const btn = document.createElement('button');
      btn.textContent = ans;
      btn.className = 'answer-btn';
      btn.onclick = () => onAnswerClick(i);
      answersDiv.appendChild(btn);
    });

    // progress
    if (progressEl) progressEl.textContent = `Question ${currentQuestion + 1} of ${questions.length}`;

    // (re)start per-question countdown
    startCountdown();
  }

  function onAnswerClick(index) {
    // guard: ignore if already disabled (e.g., time up)
    const first = answersDiv.querySelector('button');
    if (!first || first.disabled) return;

    stopCountdown();
    checkAnswer(index);
  }

  function checkAnswer(index) {
    const isCorrect = index === questions[currentQuestion].correct;

    // prevent multiple clicks
    setAnswersDisabled(true);

    if (isCorrect) {
      score++;
      if (scoreEl) scoreEl.textContent = `Score: ${score}`;
      if (typeof Swal !== 'undefined') Swal.fire('Correct!', 'Nice job!', 'success');
    } else {
      if (typeof Swal !== 'undefined') Swal.fire('Incorrect / Time up', 'Moving on…', 'warning');
    }

    currentQuestion++;
    if (currentQuestion < questions.length) {
      loadQuestion();
    } else {
      finishQuiz();
    }
  }

  function finishQuiz() {
    stopCountdown();

    // total time (seconds)
    const timeTaken = Math.round((Date.now() - startTime) / 1000);

    // save stats
    saveGameStats(score, timeTaken);

    // optional per-user score history
    const user = localStorage.getItem('currentUser');
    if (user) {
      const scores = JSON.parse(localStorage.getItem(`${user}_scores`) || '[]');
      scores.push(score);
      localStorage.setItem(`${user}_scores`, JSON.stringify(scores));
    }

    // summary then redirect to stats page
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: 'Quiz Complete!',
        text: `Score: ${score}/${questions.length} • Time: ${timeTaken}s`,
        icon: 'success',
        confirmButtonText: 'View Stats'
      }).then(() => {
        window.location.href = 'stats.html';
      });
    } else {
      alert(`Score: ${score}/${questions.length} • Time: ${timeTaken}s`);
      window.location.href = 'stats.html';
    }
  }

  // =============================
  // Countdown
  // =============================
  function startCountdown() {
    stopCountdown();
    timeLeft = QUESTION_TIME_SECONDS;
    updateTimerUI();

    timerId = setInterval(() => {
      timeLeft -= 1;
      updateTimerUI();

      if (timeLeft <= 0) {
        stopCountdown();
        // auto-mark incorrect on timeout
        setAnswersDisabled(true);
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
    const mm = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const ss = (timeLeft % 60).toString().padStart(2, '0');
    timerEl.textContent = `Time: ${mm}:${ss}`;
    if (timeLeft <= 5) timerEl.classList.add('low');
    else timerEl.classList.remove('low');
  }

  function setAnswersDisabled(disabled) {
    answersDiv.querySelectorAll('button').forEach(b => {
      b.disabled = disabled;
      if (disabled) b.onclick = null;
    });
  }

  // =============================
  // Persistence helpers
  // =============================
  function saveGameStats(score, timeTaken) {
    const games = JSON.parse(localStorage.getItem(GAMES_KEY) || '[]');
    games.push({
      date: new Date().toLocaleDateString(),
      score,
      timeTaken
    });
    localStorage.setItem(GAMES_KEY, JSON.stringify(games));
  }

  // =============================
  // Utils
  // =============================
  function decodeHtml(html) {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  }

  function shuffle(arr) {
    // Fisher–Yates
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // =============================
  // UI actions
  // =============================
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      stopCountdown();
      startQuiz();
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('currentUser');
      window.location.href = 'index.html';
    });
  }

  // -----------------------------
  // (Optional) Expose endpoints for debugging
  // -----------------------------
  window.OpenTDB = { API_CATEGORIES, API_BASE, buildOpenTdbUrl, getSettings };
})();


