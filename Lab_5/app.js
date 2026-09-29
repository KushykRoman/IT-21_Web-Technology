const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const studentFilePath = path.join(__dirname, 'student.json');

// Middleware для обробки даних з HTML-форм та JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Роздача статичних файлів з папки public
app.use(express.static('public'));

// Початкові дані студента для запису у файл
const initialStudentData = {
    name: "Роман Кушик",
    group: "Спеціальність F6 (ІТ)",
    message: "Привіт! Це моя 5 лабораторна робота з веб-технологій."
};

// Запис інформації у файл student.json при першому запуску сервера
if (!fs.existsSync(studentFilePath)) {
    fs.writeFileSync(studentFilePath, JSON.stringify(initialStudentData, null, 2));
    console.log("Файл student.json успішно створено.");
}

// Маршрут / - головна сторінка (вивести HTML-привітання)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Маршрут /student - відобразити інформацію про студента
app.get('/student', (req, res) => {
    fs.readFile(studentFilePath, 'utf8', (err, data) => {
        if (err) return res.status(500).send("Помилка читання файлу");
        
        const student = JSON.parse(data);
        const htmlResponse = `
            <!DOCTYPE html>
            <html lang="uk">
            <head><meta charset="UTF-8"><title>Інформація про студента</title></head>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Інформація про студента</h2>
                <p><strong>Ім'я:</strong> ${student.name}</p>
                <p><strong>Група:</strong> ${student.group}</p>
                <p><strong>Повідомлення:</strong> ${student.message}</p>
                <br>
                <a href="/">Повернутися на головну</a>
            </body>
            </html>
        `;
        res.send(htmlResponse);
    });
});

// Маршрут /json - повернути ті самі дані у форматі JSON
app.get('/json', (req, res) => {
    fs.readFile(studentFilePath, 'utf8', (err, data) => {
        if (err) return res.status(500).send("Помилка читання файлу");
        res.json(JSON.parse(data));
    });
});

// Маршрут /update - змінює дані про студента у файлі student.json
app.post('/update', (req, res) => {
    const updatedData = {
        name: req.body.name,
        group: req.body.group,
        message: req.body.message
    };
    
    // Запис оновлених даних у файл
    fs.writeFileSync(studentFilePath, JSON.stringify(updatedData, null, 2));
    
    // Після оновлення перенаправляємо на сторінку /student
    res.redirect('/student');
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущено на http://localhost:${PORT}`);
});

