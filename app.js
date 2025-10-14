// F1 Trivia - main app JS
// Uses Chart.js and uuidv4 (from CDN)
// LocalStorage keys:
const LS_USERS = 'f1_trivia_users';
const LS_SESSION = 'f1_trivia_session';
const LS_QUESTIONS = 'f1_trivia_questions';
const LS_STATS = 'f1_trivia_stats';

document.addEventListener('DOMContentLoaded', () => {
  // elements
  const authSection = el('#auth-section');
  const quizSection = el('#quiz-section');
  const managerSection = el('#manager-section');
  const authUserEl = el('#auth-user');
  const btnLogout = el('#btn-logout');

  // auth forms
  const loginForm = el('#login-form');
  const registerForm = el('#register-form');

  // quiz UI
  const qIndexEl = el('#q-index');
  const scoreEl = el('#score');
  const progressBar = el('#progress-bar');
  const questionText = el('#question-text');
  const optionsList = el('#options');
  const btnNext = el('#btn-next');
  const btnPrev = el('#btn-prev');
  const btnRestart = el('#btn-restart');
  const btnExport = el('#btn-export');
  const btnOpenManager = el('#btn-open-manager');

  // manager UI
  const createForm = el('#create-question-form');
  const qTitle = el('#q-title');
  const opt1 = el('#opt-1');
  const opt2 = el('#opt-2');
  const opt3 = el('#opt-3');
  const opt4 = el('#opt-4');
  const correctIndex = el('#correct-index');
  const questionList = el('#question-list');
  const btnClear = el('#btn-clear');
  const btnBackToQuiz = el('#btn-back-to-quiz');
  const btnExportAll = el('#btn-export-all');
  const filterText = el('#filter-text');
  const sortBy = el('#sort-by');

  // Chart
  let scoreChart;
  initChart();

  // app state
  let questions = loadQuestions();
  let currentUser = loadSession();
  let currentQuiz = {
    index: 0,
    score: 0,
    answers: {} // qid -> chosenIndex
  };

  // wire up auth
  updateAuthUI();
  loginForm.addEventListener('submit', loginHandler);
  registerForm.addEventListener('submit', registerHandler);
  btnLogout.addEventListener('click', () => {
    clearSession();
    currentUser = null;
    updateAuthUI();
  });

  // quiz handlers
  btnNext.addEventListener('click', () => {
    goToQuestion(currentQuiz.index + 1);
  });
  btnPrev.addEventListener('click', () => {
    goToQuestion(currentQuiz.index - 1);
  });
  btnRestart.addEventListener('click', () => resetQuiz());
  btnExport.addEventListener('click', exportCurrentQuiz);
  btnOpenManager.addEventListener('click', () => {
    showSection('manager');
    renderManagerList();
  });

  // manager
  createForm.addEventListener('submit', handleCreateQuestion);
  btnClear.addEventListener('click', () => {
    if (!confirm('Clear all stored questions?')) return;
    questions = [];
    saveQuestions();
    renderManagerList();
    showSection('quiz');
    resetQuiz();
  });
  btnBackToQuiz.addEventListener('click', () => {
    showSection('quiz');
  });
  btnExportAll.addEventListener('click', exportAllQuestions);
  filterText.addEventListener('input', renderManagerList);
  sortBy.addEventListener('change', renderManagerList);

  // initial render
  if (currentUser) {
    showSection('quiz');
    updateAuthUI();
    if (!questions || questions.length === 0) seedDefaultQuestions();
    startQuiz();
  } else {
    showSection('auth');
  }

  // --- Functions ---

  function el(q) { return document.querySelector(q); }
  function els(q) { return Array.from(document.querySelectorAll(q)); }

  function loadQuestions() {
    try {
      const raw = localStorage.getItem(LS_QUESTIONS);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('loadQuestions parse', e);
      return [];
    }
  }
  function saveQuestions() {
    localStorage.setItem(LS_QUESTIONS, JSON.stringify(questions));
  }

  function loadSession() {
    try {
      const raw = localStorage.getItem(LS_SESSION);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function saveSession(user) {
    localStorage.setItem(LS_SESSION, JSON.stringify(user));
  }
  function clearSession() {
    localStorage.removeItem(LS_SESSION);
  }

  function seedDefaultQuestions() {
    const defaults = [
      {
        id: uuidv4(),
        text: 'Who holds the record for the most Formula 1 World Championships?',
        options: ['Michael Schumacher','Lewis Hamilton','Both are tied with 7','Ayrton Senna'],
        correctIndex: 3, // 1-based in UI
        created: Date.now()
      },
      {
        id: uuidv4(),
        text: 'Which team was dominant in the early 2010s with Sebastian Vettel?',
        options: ['McLaren','Red Bull Racing','Ferrari','Williams'],
        correctIndex: 2,
        created: Date.now()
      }
    ];
    questions = defaults;
    saveQuestions();
  }

  function updateAuthUI() {
    if (currentUser) {
      authSection.classList.add('hidden');
      quizSection.classList.remove('hidden');
      authUserEl.textContent = currentUser.username;
      btnLogout.classList.remove('hidden');
      showSection('quiz');
    } else {
      authSection.classList.remove('hidden');
      quizSection.classList.add('hidden');
      managerSection.classList.add('hidden');
      authUserEl.textContent = '';
      btnLogout.classList.add('hidden');
    }
  }

  // Simple local storage auth (demo only)
  function usersFromLS() {
    try {
      const raw = localStorage.getItem(LS_USERS);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }
  function saveUsers(u) {
    localStorage.setItem(LS_USERS, JSON.stringify(u));
  }

  async function registerHandler(e){
    e.preventDefault();
    const u = document.getElementById('reg-username').value.trim();
    const p = document.getElementById('reg-password').value;
    if (!u || !p) return alert('enter username & password');

    const all = usersFromLS();
    if (all[u]) return alert('username exists');

    // store hashed password for minimal safety using subtleCrypto
    const hash = await hashPassword(p);
    all[u] = { passwordHash: hash };
    saveUsers(all);
    alert('Registered. You can sign in now.');
    registerForm.reset();
  }

  async function loginHandler(e){
    e.preventDefault();
    const u = document.getElementById('login-username').value.trim();
    const p = document.getElementById('login-password').value;
    const all = usersFromLS();
    if (!all[u]) return alert('no such user');
    const h = await hashPassword(p);
    if (h !== all[u].passwordHash) return alert('invalid credentials');
    currentUser = { username: u, loggedAt: Date.now() };
    saveSession(currentUser);
    updateAuthUI();
    if (!questions || questions.length === 0) seedDefaultQuestions();
    startQuiz();
  }

  async function hashPassword(password) {
    if (!window.crypto || !crypto.subtle) {
      // fallback - do not use in production
      return btoa(password);
    }
    const enc = new TextEncoder();
    const buf = enc.encode(password);
    const hashBuf = await crypto.subtle.digest('SHA-256', buf);
    const hashArray = Array.from(new Uint8Array(hashBuf));
    return hashArray.map(b => b.toString(16).padStart(2,'0')).join('');
  }

  function showSection(name) {
    if (name === 'auth') {
      authSection.classList.remove('hidden');
      quizSection.classList.add('hidden');
      managerSection.classList.add('hidden');
    } else if (name === 'quiz') {
      authSection.classList.add('hidden');
      quizSection.classList.remove('hidden');
      managerSection.classList.add('hidden');
    } else if (name === 'manager') {
      authSection.classList.add('hidden');
      quizSection.classList.add('hidden');
      managerSection.classList.remove('hidden');
    }
  }

  function startQuiz() {
    currentQuiz = { index: 0, score: 0, answers: {} };
    renderQuestion();
    updateScoreChart();
  }

  function resetQuiz() {
    startQuiz();
  }

  function goToQuestion(idx) {
    const max = questions.length - 1;
    if (idx < 0) idx = 0;
    if (idx > max) idx = max;
    currentQuiz.index = idx;
    renderQuestion();
  }

  function renderQuestion() {
    if (!questions || questions.length === 0) {
      questionText.textContent = 'No questions yet — open the manager to add some.';
      optionsList.innerHTML = '';
      qIndexEl.textContent = 'Question 0 of 0';
      scoreEl.textContent = `Score: ${currentQuiz.score}`;
      progressBar.style.width = '0%';
      return;
    }
    const q = questions[currentQuiz.index];
    questionText.textContent = q.text;
    qIndexEl.textContent = `Question ${currentQuiz.index + 1} of ${questions.length}`;
    scoreEl.textContent = `Score: ${currentQuiz.score}`;

    const pct = Math.round(((currentQuiz.index) / Math.max(1, questions.length - 1)) * 100);
    progressBar.style.width = `${pct}%`;

    optionsList.innerHTML = '';
    q.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'option btn option-btn';
      btn.textContent = opt;
      btn.dataset.index = i+1; // 1-based
      btn.addEventListener('click', () => handleAnswer(q.id, i+1, btn));
      optionsList.appendChild(btn);

      // mark previously chosen
      if (currentQuiz.answers[q.id] === (i+1)) {
        btn.classList.add('selected');
      }
    });
  }

  function handleAnswer(qid, chosenIndex, btn) {
    // Prevent repeated scoring: if answer previously chosen, ignore
    const q = questions.find(x => x.id === qid);
    if (!q) return;
    const prev = currentQuiz.answers[qid];
    const correctIdx = q.correctIndex;
    if (prev) {
      // change answer — update score if switching from wrong to right or vice versa
      if (prev === correctIdx && chosenIndex !== correctIdx) currentQuiz.score--;
      else if (prev !== correctIdx && chosenIndex === correctIdx) currentQuiz.score++;
    } else {
      if (chosenIndex === correctIdx) currentQuiz.score++;
    }
    currentQuiz.answers[qid] = chosenIndex;
    // visual feedback
    Array.from(optionsList.children).forEach(b => {
      b.classList.remove('correct','incorrect');
      const idx = parseInt(b.dataset.index, 10);
      if (idx === q.correctIndex) b.classList.add('correct');
      if (currentQuiz.answers[qid] === idx && idx !== q.correctIndex) b.classList.add('incorrect');
    });

    scoreEl.textContent = `Score: ${currentQuiz.score}`;
    updateStats(currentUser.username, currentQuiz.score);
    updateScoreChart();
  }

  function updateStats(username, score) {
    const raw = localStorage.getItem(LS_STATS);
    const stats = raw ? JSON.parse(raw) : {};
    if (!stats[username]) stats[username] = { attempts: [] };
    stats[username].attempts.push({ time: Date.now(), score });
    localStorage.setItem(LS_STATS, JSON.stringify(stats));
  }

  function initChart() {
    const ctx = document.getElementById('scoreChart').getContext('2d');
    scoreChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Your last score'],
        datasets: [{ label:'Score', data:[0] }]
      },
      options: {
        responsive:true,
        maintainAspectRatio:false,
        scales: {
          y: { beginAtZero:true, max: 10 }
        }
      }
    });
  }

  function updateScoreChart() {
    const raw = localStorage.getItem(LS_STATS);
    const stats = raw ? JSON.parse(raw) : {};
    const user = currentUser && stats[currentUser.username];
    const last = user && user.attempts.length ? user.attempts[user.attempts.length-1].score : 0;
    scoreChart.data.datasets[0].data = [last];
    scoreChart.data.labels = ['Last attempt'];
    scoreChart.update();
  }

  // Manager CRUD
  function renderManagerList() {
    const filter = filterText.value.trim().toLowerCase();
    const sort = sortBy.value;
    let list = [...questions];
    if (filter) {
      list = list.filter(q => q.text.toLowerCase().includes(filter));
    }
    if (sort === 'text') list.sort((a,b) => a.text.localeCompare(b.text));
    else list.sort((a,b) => b.created - a.created);
    questionList.innerHTML = '';
    list.forEach(q => {
      const li = document.createElement('li');
      li.className = 'question-item';
      li.innerHTML = `
        <div>
          <strong>${escapeHtml(q.text)}</strong>
          <div class="muted">${q.options.map((o,i)=> `${i+1}) ${escapeHtml(o)}`).join(' • ')}</div>
        </div>
        <div class="mgr-actions">
          <button class="btn small" data-id="${q.id}" data-action="edit">Edit</button>
          <button class="btn small outline" data-id="${q.id}" data-action="delete">Delete</button>
        </div>
      `;
      questionList.appendChild(li);
    });

    // attach manager actions
    questionList.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.dataset.id;
        const action = btn.dataset.action;
        if (action === 'delete') {
          questions = questions.filter(q => q.id !== id);
          saveQuestions();
          renderManagerList();
          return;
        } else if (action === 'edit') {
          const q = questions.find(x => x.id === id);
          if (!q) return;
          // populate form to edit (simple approach: delete & prefill)
          questions = questions.filter(x => x.id !== id);
          saveQuestions();
          qTitle.value = q.text;
          opt1.value = q.options[0] || '';
          opt2.value = q.options[1] || '';
          opt3.value = q.options[2] || '';
          opt4.value = q.options[3] || '';
          correctIndex.value = q.correctIndex;
          window.scrollTo({top:0,behavior:'smooth'});
        }
      });
    });
  }

  function handleCreateQuestion(e) {
    e.preventDefault();
    const text = qTitle.value.trim();
    const options = [opt1.value, opt2.value, opt3.value, opt4.value].map(v => v ? v.trim() : null).filter(Boolean);
    const corr = parseInt(correctIndex.value,10);
    if (!text || options.length < 2) return alert('Provide question text and at least 2 options');
    if (corr < 1 || corr > options.length) return alert('correct index invalid');

    const q = {
      id: uuidv4(),
      text,
      options,
      correctIndex: corr,
      created: Date.now()
    };
    questions.unshift(q); // newest first
    saveQuestions();
    createForm.reset();
    renderManagerList();
    showSection('quiz');
    if (!currentUser) return;
    startQuiz();
  }

  // Export
  function exportAllQuestions() {
    const data = JSON.stringify(questions, null, 2);
    downloadFile(data, `f1_quiz_all_${Date.now()}.json`);
  }
  function exportCurrentQuiz() {
    const quiz = {
      createdBy: currentUser?.username || 'guest',
      questions,
      takenAt: Date.now(),
      answers: currentQuiz.answers,
      score: currentQuiz.score
    };
    downloadFile(JSON.stringify(quiz, null, 2), `f1_quiz_${Date.now()}.json`);
  }
  function downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    a.remove(); URL.revokeObjectURL(url);
  }

  // small helpers
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  }

  // Unit testing helpers (exposed for tests)
  window.__app = {
    addQuestionForTest: (q) => {
      q.id = uuidv4();
      q.created = Date.now();
      questions.unshift(q);
      saveQuestions();
      return q;
    },
    getQuestions: () => questions,
    clearQuestionsForTest: () => { questions = []; saveQuestions(); },
    startQuiz, renderQuestion, currentQuiz, questions,
    loadQuestions
  };
});
