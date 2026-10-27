// Підключення необхідних бібліотек і функцій для роботи сервера, сесій, паролів, перевірки даних і файлів.
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const flash = require('connect-flash');
const path = require('path');
const { read, write } = require('./utils/db');

// Створення Express-додатка та визначення порту сервера.
const app = express();
const PORT = process.env.PORT || 3000;

// Налаштування обробки JSON, HTML-форм, сесій користувачів і статичних файлів.
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'todo-app-change-this-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 1000 * 60 * 60 * 4 }
}));
app.use(flash());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware для перевірки авторизації користувача перед доступом до захищених маршрутів.
function isAuthenticated(req, res, next) {
  if (req.session.user) return next();
  return res.status(401).json({ message: 'Потрібно увійти в систему.', redirect: '/login.html' });
}

// Правила перевірки назви та пріоритету завдання.
const taskValidation = [
  body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Назва має містити від 1 до 100 символів.'),
  body('priority').optional().isIn(['низька', 'середня', 'висока']).withMessage('Неправильний пріоритет.')
];

// Реєстрація нового користувача: перевірка даних, пошук повторного email,
// хешування пароля, збереження користувача та створення сесії.
app.post('/api/register', [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Введіть ПІБ (від 2 до 80 символів).'),
  body('email').trim().isEmail().withMessage('Введіть коректний email.'),
  body('password').isLength({ min: 6, max: 100 }).withMessage('Пароль має містити щонайменше 6 символів.')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array().map(e => e.msg) });
  const users = read('users.json');
  const email = req.body.email.trim().toLowerCase();
  if (users.some(u => u.email === email)) return res.status(409).json({ message: 'Цей email уже зареєстрований.' });
  try {
    const user = {
      id: users.reduce((max, u) => Math.max(max, u.id), 0) + 1,
      name: req.body.name.trim(),
      email,
      password: await bcrypt.hash(req.body.password, 12)
    };
    users.push(user);
    write('users.json', users);
    req.session.user = { id: user.id, name: user.name, email: user.email };
    res.status(201).json({ success: true, user: req.session.user });
  } catch {
    res.status(500).json({ message: 'Не вдалося створити обліковий запис.' });
  }
});

// Авторизація користувача: перевірка email і пароля, створення нової сесії
// та повернення даних користувача після успішного входу.
app.post('/api/login', [
  body('email').trim().isEmail().withMessage('Введіть коректний email.'),
  body('password').notEmpty().withMessage('Введіть пароль.')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array().map(e => e.msg) });
  const email = req.body.email.trim().toLowerCase();
  const user = read('users.json').find(u => u.email === email);
  if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
    return res.status(401).json({ message: 'Неправильний email або пароль.' });
  }
  req.session.regenerate(err => {
    if (err) return res.status(500).json({ message: 'Не вдалося створити сесію.' });
    req.session.user = { id: user.id, name: user.name, email: user.email };
    res.json({ success: true, user: req.session.user });
  });
});

// Завершення сесії користувача та видалення cookie авторизації.
app.get('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ message: 'Не вдалося завершити сесію.' });
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

// Отримання інформації про поточного авторизованого користувача.
app.get('/api/me', isAuthenticated, (req, res) => res.json({ user: req.session.user }));

// Отримання списку завдань лише поточного користувача.
app.get('/api/tasks', isAuthenticated, (req, res) => {
  res.json(read('tasks.json').filter(t => t.userId === req.session.user.id));
});

// Додавання нового завдання: перевірка даних, створення об'єкта,
// призначення ID і власника, збереження у файлі tasks.json.
app.post('/api/tasks', isAuthenticated, taskValidation, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array().map(e => e.msg) });
  const tasks = read('tasks.json');
  const task = {
    id: tasks.reduce((max, t) => Math.max(max, t.id), 0) + 1,
    userId: req.session.user.id,
    title: req.body.title.trim(),
    completed: false,
    createdAt: new Date().toISOString(),
    priority: req.body.priority || 'середня'
  };
  tasks.push(task);
  write('tasks.json', tasks);
  res.status(201).json(task);
});

// Редагування завдання за ID: перевірка власника, оновлення назви,
// пріоритету та статусу виконання із подальшим збереженням змін.
app.put('/api/tasks/:id', isAuthenticated, taskValidation, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array().map(e => e.msg) });
  const tasks = read('tasks.json');
  const task = tasks.find(t => t.id === Number(req.params.id) && t.userId === req.session.user.id);
  if (!task) return res.status(404).json({ message: 'Завдання не знайдено.' });
  task.title = req.body.title.trim();
  task.priority = req.body.priority || task.priority || 'середня';
  if (typeof req.body.completed === 'boolean') task.completed = req.body.completed;
  write('tasks.json', tasks);
  res.json({ success: true, task });
});

// Видалення завдання за ID з перевіркою того, чи належить воно поточному користувачу.
app.delete('/api/tasks/:id', isAuthenticated, (req, res) => {
  const tasks = read('tasks.json');
  const index = tasks.findIndex(t => t.id === Number(req.params.id) && t.userId === req.session.user.id);
  if (index === -1) return res.status(404).json({ message: 'Завдання не знайдено.' });
  tasks.splice(index, 1);
  write('tasks.json', tasks);
  res.json({ success: true });
});

// Відкриття особистого кабінету лише для авторизованих користувачів.
// Якщо користувач не увійшов у систему, його перенаправляє на сторінку входу.
app.get('/dashboard.html', (req, res, next) => {
  if (!req.session.user) return res.redirect('/login.html');
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Запуск вебсервера та виведення адреси в консоль.
app.listen(PORT, () => console.log(`Todo App працює: http://localhost:${PORT}`));
