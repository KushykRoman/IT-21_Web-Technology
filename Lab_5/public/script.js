// Отримуємо поточні дані студента через JSON-маршрут і заповнюємо форму
document.addEventListener('DOMContentLoaded', () => {
    fetch('/json')
        .then(response => response.json())
        .then(data => {
            document.getElementById('name').value = data.name;
            document.getElementById('group').value = data.group;
            document.getElementById('message').value = data.message;
        })
        .catch(error => console.error('Помилка завантаження даних:', error));
});

