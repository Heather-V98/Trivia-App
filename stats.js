document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.querySelector("#gamesTable tbody");
    const totalGames = document.getElementById("totalGames");
    const averageScore = document.getElementById("averageScore");
    const fastestTime = document.getElementById("fastestTime");
    const returnBtn = document.getElementById("returnBtn");
  
    // Retrieve stored game data
    const games = JSON.parse(localStorage.getItem("f1trivia_games")) || [];
  
    // Display in table
    games.forEach(game => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${game.date}</td>
        <td>${game.score}</td>
        <td>${game.timeTaken}s</td>
      `;
      tableBody.appendChild(row);
    });
  
    // General stats
    if (games.length > 0) {
      totalGames.textContent = games.length;
  
      const avgScore = games.reduce((sum, g) => sum + g.score, 0) / games.length;
      averageScore.textContent = avgScore.toFixed(1);
  
      const fastest = Math.min(...games.map(g => g.timeTaken));
      fastestTime.textContent = fastest + "s";
    }
  
    // Return to setup page
    returnBtn.addEventListener("click", () => {
      window.location.href = "index.html"; // change if your setup page is named differently
    });
  });
  