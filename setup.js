// Setup page logic: fetch categories, capture selections, save to localStorage, and go to quiz.html

(function () {
    'use strict';
  
    const API_CATEGORIES = 'https://opentdb.com/api_category.php';
  
    const categoryEl   = document.getElementById('category');
    const startBtn     = document.getElementById('startBtn');
    const msgEl        = document.getElementById('setupMsg');
    const numQuestions = document.getElementById('numQuestions');
  
    // guard: ensure elements exist
    if (!categoryEl || !startBtn || !numQuestions) {
      console.error('[setup] Missing required DOM elements.');
      setMsg('Internal setup error. Check console.');
      return;
    }
  
    document.addEventListener('DOMContentLoaded', () => {
      loadCategories();
      wireEvents();
    });
  
    function wireEvents() {
      startBtn.addEventListener('click', onStart);
    }
  
    async function loadCategories() {
      try {
        setMsg('Loading categories…');
        categoryEl.disabled = true;
  
        const res = await fetch(API_CATEGORIES);
        if (!res.ok) throw new Error(`Network error: ${res.status}`);
        const data = await res.json();
  
        const categories = Array.isArray(data?.trivia_categories) ? data.trivia_categories : [];
        categoryEl.innerHTML = `<option value="">Any Category</option>`;
        categories.forEach(cat => {
          const opt = document.createElement('option');
          opt.value = String(cat.id);
          opt.textContent = cat.name;
          categoryEl.appendChild(opt);
        });
  
        setMsg('Categories loaded. Choose your options and press Start.');
        console.log('[setup] Categories:', categories);
      } catch (err) {
        console.error('[setup] Failed to load categories:', err);
        setMsg('Could not load categories — using "Any Category".');
        categoryEl.innerHTML = `<option value="">Any Category</option>`;
      } finally {
        categoryEl.disabled = false;
      }
    }
  
    function onStart() {
      // read values
      const amountRaw = parseInt(numQuestions.value, 10);
      const amount = clamp(Number.isFinite(amountRaw) ? amountRaw : 10, 1, 50);
      const category = categoryEl.value.trim();
      const difficulty = getCheckedValue('difficulty'); // '', 'easy', 'medium', 'hard'
      const type = getCheckedValue('qtype');            // '', 'boolean', 'multiple'
  
      // validate # of questions
      if (!amount || amount < 1) {
        alert('Please enter a valid number of questions (1-50).');
        numQuestions.focus();
        return;
      }
  
      // persist settings for script.js
      const settings = { amount, category, difficulty, type };
      localStorage.setItem('quizSettings', JSON.stringify(settings));
      console.log('[setup] Saved settings:', settings);
  
      // store the final API URL if you want to debug later
      const apiUrl = buildOpenTdbUrl(settings);
      localStorage.setItem('quizApiUrl', apiUrl);
      console.log('[setup] Built API URL:', apiUrl);
  
      // go to quiz
      window.location.href = 'quiz.html';
    }
  
    // helpers
    function getCheckedValue(name) {
      const el = document.querySelector(`input[name="${name}"]:checked`);
      return el ? el.value : '';
    }
  
    function clamp(n, min, max) {
      return Math.max(min, Math.min(max, n));
    }
  
    function setMsg(text) {
      if (msgEl) msgEl.textContent = text;
    }
  
    function buildOpenTdbUrl({ amount, category, difficulty, type }) {
      const url = new URL('https://opentdb.com/api.php');
      url.searchParams.set('amount', String(amount));
      if (category)   url.searchParams.set('category', category);
      if (difficulty) url.searchParams.set('difficulty', difficulty);
      if (type)       url.searchParams.set('type', type);
      return url.toString();
    }
  })();
  
