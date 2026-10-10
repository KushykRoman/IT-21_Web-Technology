const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const flash = require('connect-flash');
const { body, validationResult } = require('express-validator');
const path = require('path');
const { readUsers, writeUsers } = require('./utils/db');

const app = express();

// Налаштування
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));

// Налаштування сесій
app.use(session({
    secret: 'my-super-secret-key-2025-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24 години
}));

app.use(flash());

// Передача flash-повідомлень у всі шаблони
app.use((req, res, next) => {
    res.locals.error = req.flash('error');
    res.locals.success = req.flash('success');
    res.locals.oldData = req.flash('oldData')[0] || {};
    next();
});

// Middleware для захисту маршрутів
const isAuthenticated = (req, res, next) => {
    if (req.session.user) return next();
    req.flash('error', 'Увійдіть в систему для доступу');
    res.redirect('/login');
};

const isNotAuthenticated = (req, res, next) => {
    if (req.session.user) return res.redirect('/dashboard');
    next();
};

// Маршрути
app.get('/', (req, res) => {
    if (req.session.user) {
        res.redirect('/dashboard');
    } else {
        res.redirect('/login');
    }
});

// Реєстрація
app.get('/register', isNotAuthenticated, (req, res) => {
    res.render('register');
});

const registerValidation = [
    body('name').isLength({ min: 3, max: 30 }).withMessage('ПІБ має містити від 3 до 30 символів'),
    body('email').isEmail().withMessage('Невірний формат email')
        .custom(async (value) => {
            const users = await readUsers();
            if (users.find(u => u.email === value)) {
                throw new Error('Цей email вже зареєстровано');
            }
            return true;
        }),
    body('password').isLength({ min: 6 }).withMessage('Пароль має містити мінімум 6 символів'),
    body('passwordConfirm').custom((value, { req }) => {
        if (value !== req.body.password) throw new Error('Паролі не збігаються');
        return true;
    })
];

app.post('/register', isNotAuthenticated, registerValidation, async (req, res) => {
    const errors = validationResult(req);
    const { name, email, password } = req.body;

    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => err.msg);
        req.flash('error', errorMessages);
        req.flash('oldData', { name, email });
        return res.redirect('/register');
    }

    try {
        const users = await readUsers();
        const hashedPassword = await bcrypt.hash(password, 12);
        
        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            password: hashedPassword
        };

        users.push(newUser);
        await writeUsers(users);

        req.session.user = { id: newUser.id, name: newUser.name, email: newUser.email };
        res.redirect('/dashboard');
    } catch (error) {
        req.flash('error', 'Помилка при реєстрації');
        res.redirect('/register');
    }
});

// Логін
app.get('/login', isNotAuthenticated, (req, res) => {
    res.render('login');
});

app.post('/login', isNotAuthenticated, async (req, res) => {
    const { email, password } = req.body;
    const users = await readUsers();
    
    const user = users.find(u => u.email === email);
    
    if (user && await bcrypt.compare(password, user.password)) {
        req.session.user = { id: user.id, name: user.name, email: user.email };
        res.redirect('/dashboard');
    } else {
        req.flash('error', 'Невірний email або пароль');
        req.flash('oldData', { email });
        res.redirect('/login');
    }
});

// Дашборд
app.get('/dashboard', isAuthenticated, (req, res) => {
    res.render('dashboard', { user: req.session.user });
});

// Вихід
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));