const questions = [
  {
    question: "Who holds the record for the most Formula 1 World Championships?",
    answers: [
      "Michael Schumacher",
      "Lewis Hamilton",
      "Both are tied with 7",
      "Ayrton Senna"
    ],
    correct: 2
  },
  {
    question: "Which team has the most Constructors' Championships?",
    answers: ["McLaren", "Ferrari", "Red Bull", "Mercedes"],
    correct: 1
  },
  // Add 8+ more questions...
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
    Swal.fire("Wrong!", "Better luck next one!", "error");
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

