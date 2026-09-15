const fs = require('fs').promises;

async function processFile() {
  try {
    // 1. Зчитуємо дані з файлу mydata.txt
    const data = await fs.readFile('mydata.txt', 'utf8');
    
    // 2. Додаємо в кінець файлу потрібний рядок
    const appendedText = "\n Непарний варіант - додано студентом Кушик Роман";
    const newData = data + appendedText;
    
    // 3. Зберігаємо результат у файл result.txt
    await fs.writeFile('result.txt', newData, 'utf8');
    
    console.log("Успіх! Файл result.txt створено.");
    console.log("Вміст нового файлу:\n-------------------");
    console.log(newData);
    
  } catch (err) {
    console.error("Виникла помилка:", err);
  }
}

// Запускаємо функцію
processFile();