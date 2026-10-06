const express = require('express');
const app = express();
const PORT = 3000;

// Middleware для логування запитів до сервера
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] Отримано запит: ${req.method} ${req.url}`);
    next();
});

// Обробка JSON-запитів
app.use(express.json());

// Віддача статичних файлів з папки public
app.use(express.static('public'));

// Тимчасове зберігання даних у пам'яті
let tasks = [];
let currentId = 1;

// GET /api/tasks - отримати всі завдання
app.get('/api/tasks', (req, res) => {
    res.json(tasks);
});

// GET /api/tasks/:id - отримати завдання за ID
app.get('/api/tasks/:id', (req, res) => {
    const task = tasks.find(t => t.id === parseInt(req.params.id));
    if (!task) return res.status(404).json({ message: 'Завдання не знайдено' });
    res.json(task);
});

// POST /api/tasks - додати нове завдання
app.post('/api/tasks', (req, res) => {
    const { title, description } = req.body;
    const newTask = {
        id: currentId++,
        title,
        description,
        status: 'active' // За замовчуванням статус active
    };
    tasks.push(newTask);
    res.status(201).json(newTask);
});

// PUT /api/tasks/:id - змінити статус або опис
app.put('/api/tasks/:id', (req, res) => {
    const task = tasks.find(t => t.id === parseInt(req.params.id));
    if (!task) return res.status(404).json({ message: 'Завдання не знайдено' });

    const { title, description, status } = req.body;
    if (title) task.title = title;
    if (description) task.description = description;
    if (status) task.status = status;

    res.json(task);
});

// DELETE /api/tasks/:id - видалити завдання
app.delete('/api/tasks/:id', (req, res) => {
    const taskIndex = tasks.findIndex(t => t.id === parseInt(req.params.id));
    if (taskIndex === -1) return res.status(404).json({ message: 'Завдання не знайдено' });

    tasks.splice(taskIndex, 1);
    res.status(204).send();
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущено на порту ${PORT}`);
});