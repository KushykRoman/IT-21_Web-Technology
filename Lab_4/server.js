const http = require('http');
const fs = require('fs');

// Дані про студента
const studentData = {
  name: "Роман Кушик",
  specialty: "Інформаційні системи та технології",
  message: "Я вчуся працювати з Node.js!"
};

// Запис даних у файл при першому запуску сервера
const filePath = './student.json';
if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(studentData, null, 2), 'utf8');
    console.log('Файл student.json успішно створено!');
}

// Створюємо сервер
const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>Головна сторінка</h1><p>Лабораторна робота №4. Варіант 5</p>');
    
  } else if (req.url === '/about') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>Про нас</h1><p>Це простий HTTP-сервер на Node.js без додаткових фреймворків.</p>');
    
  } else if (req.url === '/student') {
    // Маршрут, що повертає JSON
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(studentData));
    
  } else if (req.url === '/student/html') {
    // Маршрут, що повертає відформатовану HTML-таблицю
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html lang="uk">
      <head>
          <meta charset="UTF-8">
          <title>Дані студента</title>
          <style>
              table { border-collapse: collapse; width: 50%; margin-top: 20px; font-family: sans-serif; }
              th, td { border: 1px solid black; padding: 10px; text-align: left; }
              th { background-color: #f2f2f2; }
          </style>
      </head>
      <body>
          <h1>Інформація про студента</h1>
          <table>
            <tr><th>Ім'я</th><td>${studentData.name}</td></tr>
            <tr><th>Спеціальність</th><td>${studentData.specialty}</td></tr>
            <tr><th>Повідомлення</th><td>${studentData.message}</td></tr>
          </table>
      </body>
      </html>
    `);
    
  } else {
    // Обробка неіснуючих маршрутів
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>404 - Сторінку не знайдено</h1>');
  }
});

// Запускаємо сервер на порту 3000
server.listen(3000, () => {
  console.log('Сервер працює на http://localhost:3000');
});