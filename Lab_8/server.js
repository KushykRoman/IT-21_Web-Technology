const express = require('express');
const fs = require('fs');
const path = require('path');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = 3000;

// Налаштування шаблонізатора EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware для парсингу form-data 
app.use(express.urlencoded({ extended: true }));

// Middleware для логування запитів
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] Запит: ${req.method} ${req.url}`);
    next();
});

// Правила валідації для Варіанту 5
const validateRecipe = [
    body('name')
        .notEmpty().withMessage('Назва рецепту є обов’язковою')
        .trim().escape(),
    body('ingredients')
        .notEmpty().withMessage('Поле інгредієнтів не може бути порожнім')
        .trim().escape(),
    body('cookingTime')
        .isInt({ min: 5, max: 300 }).withMessage('Час приготування має бути у хвилинах (від 5 до 300)'),
    body('difficulty')
        .isIn(['easy', 'medium', 'hard']).withMessage('Оберіть коректну складність: easy, medium або hard')
];

// GET-маршрут: відображення форми
app.get('/', (req, res) => {
    res.render('index', { errors: [], old: {} });
});

// POST-маршрут: обробка та валідація даних форми
app.post('/submit', validateRecipe, (req, res) => {
    const errors = validationResult(req);
    
    // Якщо є помилки, повертаємо форму з повідомленнями
    if (!errors.isEmpty()) {
        return res.status(400).render('index', { 
            errors: errors.array(), 
            old: req.body 
        });
    }

    // Збереження успішних даних у data.json
    const dataFilePath = path.join(__dirname, 'data.json');
    let recipes = [];
    
    if (fs.existsSync(dataFilePath)) {
        const fileData = fs.readFileSync(dataFilePath, 'utf-8');
        if (fileData) {
            recipes = JSON.parse(fileData);
        }
    }

    recipes.push(req.body);
    fs.writeFileSync(dataFilePath, JSON.stringify(recipes, null, 2));

    // Відповідь про успіх
    res.send('<h2>Рецепт успішно додано!</h2><a href="/">Додати ще один</a>');
});

app.listen(PORT, () => {
    console.log(`Сервер працює на http://localhost:${PORT}`);
});