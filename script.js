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
  },
  // Add more questions...
];

let currentQuestion = 0;
let score = 0;

const questionText = document.getElementById("question-text");
const answersDiv = document.getElementById("answers");
const progress = document.getElementById("progress");
const scoreDisplay = document.getElementById("score");
const restartBtn = document.getElementById("restartBtn");

function loadQuestion() {
  const q = questions[currentQuestion];
  questionText.textContent = q.question;
  answersDiv.innerHTML = "";
  q.answers.forEach((ans, i) => {
    const btn = document.createElement("button");
    btn.textContent = ans;
    btn.onclick = () => checkAnswer(i);
    answersDiv.appendChild(btn);
  });
  progress.textContent = `Question ${currentQuestion + 1} of ${questions.length}`;
}

function checkAnswer(i) {
  if (i === questions[currentQuestion].correct) {
    score++;
    Swal.fire("Correct!", "Nice job!", "success");
  } else {
    Swal.fire("Wrong!", "Better luck on the next one!", "error");
  }

  currentQuestion++;
  if (currentQuestion < questions.length) {
    loadQuestion();
  } else {
    finishQuiz();
  }
}

function finishQuiz() {
  questionText.textContent = `You scored ${score} / ${questions.length}!`;
  saveGameStats(score, timeTaken);
  answersDiv.innerHTML = "";
  scoreDisplay.textContent = "";
  restartBtn.classList.remove("hidden");

  // Save score for logged-in user
  const user = localStorage.getItem("currentUser");
  if (user) {
    const scores = JSON.parse(localStorage.getItem(`${user}_scores`) || "[]");
    scores.push(score);
    localStorage.setItem(`${user}_scores`, JSON.stringify(scores));
  }
}

restartBtn.addEventListener("click", () => {
  currentQuestion = 0;
  score = 0;
  restartBtn.classList.add("hidden");
  loadQuestion();
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("currentUser");
  window.location.href = "index.html";
});

loadQuestion();

function saveGameStats(score, timeTaken) {
  const games = JSON.parse(localStorage.getItem("f1trivia_games")) || [];

  const newGame = {
    date: new Date().toLocaleDateString(),
    score,
    timeTaken
  };

  games.push(newGame);
  localStorage.setItem("f1trivia_games", JSON.stringify(games));
}
