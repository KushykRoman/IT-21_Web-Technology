const apiUrl = "https://api.adviceslip.com/advice";
const resultDiv = document.getElementById("result");

// 1. Запит однієї випадкової поради через Fetch
document.getElementById("btnFetch").addEventListener("click", async () => {
  try {
    resultDiv.innerHTML = "<p>Завантаження...</p>";
    
    // Додаю timestamp, щоб браузер не кешував відповідь (специфіка цього API)
    const response = await fetch(`${apiUrl}?t=${new Date().getTime()}`);
    
    if (!response.ok) {
      throw new Error(`Помилка HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    renderData([data.slip.advice], "Fetch (Одна порада)");
  } catch (error) {
    console.error("Помилка fetch:", error);
    showError("Не вдалося завантажити пораду через Fetch.");
  }
});

// 2. Виконання 5 запитів через Axios
document.getElementById("btnAxios").addEventListener("click", async () => {
  try {
    resultDiv.innerHTML = "<p>Збираємо ТОП-5 порад...</p>";
    
    const requests = [];
    // Створюємо масив з 5 промісів (запитів)
    for (let i = 0; i < 5; i++) {
      requests.push(axios.get(`${apiUrl}?t=${new Date().getTime()}_${i}`));
    }
    
    // Чекаємо виконання всіх 5 запитів одночасно
    const responses = await Promise.all(requests);
    
    // Витягуємо текст порад із відповідей
    const advices = responses.map(res => res.data.slip.advice);
    
    renderData(advices, "Axios (ТОП-5 порад)");
  } catch (error) {
    console.error("Помилка axios:", error);
    showError("Не вдалося завантажити поради через Axios.");
  }
});

// Очищення контейнера з результатами
document.getElementById("btnClear").addEventListener("click", () => {
  resultDiv.innerHTML = "";
});

// Функція для відображення отриманих даних
function renderData(advicesList, methodSource) {
  let html = `<h3>Джерело: ${methodSource}</h3>`;
  
  advicesList.forEach(advice => {
    html += `<div class="advice-card">${advice}</div>`;
  });
  
  resultDiv.innerHTML = html;
}

// Функція для виведення помилок
function showError(message) {
  resultDiv.innerHTML = `<p class="error">${message}</p>`;
}