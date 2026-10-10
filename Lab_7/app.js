const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'schedule.json');

// Налаштування для роботи з JSON та статичними файлами
app.use(express.json());
app.use(express.static('public')); // Підключення статичних файлів

// Допоміжна функція для читання даних
const readData = () => {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Помилка при читанні файлу:', error); // Обробка помилок
        return [];
    }
};

// Допоміжна функція для запису даних
const writeData = (data) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// GET: Отримати весь розклад
app.get('/api/schedule', (req, res) => {
    const data = readData();
    res.json(data);
});

// POST: Додати нове заняття[cite: 1]
app.post('/api/schedule', (req, res) => {
    const data = readData();
    const newItem = {
        id: Date.now(),
        day: req.body.day,
        subject: req.body.subject
    };
    data.push(newItem);
    writeData(data);
    res.json({ message: 'Заняття додано', item: newItem });
});

// PUT: Оновити існуюче заняття[cite: 1]
app.put('/api/schedule/:id', (req, res) => {
    let data = readData();
    const id = parseInt(req.params.id);
    const index = data.findIndex(item => item.id === id);
    
    if (index !== -1) {
        data[index] = { ...data[index], day: req.body.day, subject: req.body.subject };
        writeData(data);
        res.json({ message: 'Заняття оновлено', item: data[index] });
    } else {
        res.status(404).json({ message: 'Заняття не знайдено' });
    }
});

// DELETE: Видалити заняття[cite: 1]
app.delete('/api/schedule/:id', (req, res) => {
    let data = readData();
    const id = parseInt(req.params.id);
    const newData = data.filter(item => item.id !== id);
    
    if (data.length !== newData.length) {
        writeData(newData);
        res.json({ message: 'Заняття видалено' });
    } else {
        res.status(404).json({ message: 'Заняття не знайдено' });
    }
});

app.listen(PORT, () => {
    console.log(`Сервер працює на http://localhost:${PORT}`);
});