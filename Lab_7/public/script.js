const form = document.getElementById('scheduleForm');
const list = document.getElementById('scheduleList');
const filterInput = document.getElementById('filterDay');
let scheduleData = [];

// Отримання даних
async function fetchSchedule() {
    const response = await fetch('/api/schedule');
    scheduleData = await response.json();
    renderList(scheduleData);
}

// Фільтрація
filterInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = scheduleData.filter(item => item.day.toLowerCase().includes(term));
    renderList(filtered);
});

// Відображення списку
function renderList(data) {
    list.innerHTML = '';
    data.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span><strong>${item.day}:</strong> ${item.subject}</span>
            <div class="actions">
                <button class="edit-btn" onclick="editItem(${item.id}, '${item.day}', '${item.subject}')">Редагувати</button>
                <button class="delete-btn" onclick="deleteItem(${item.id})">Видалити</button>
            </div>
        `;
        list.appendChild(li);
    });
}

// Збереження (Додавання або Оновлення)
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editId').value;
    const day = document.getElementById('dayInput').value;
    const subject = document.getElementById('subjectInput').value;

    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/schedule/${id}` : '/api/schedule';

    await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day, subject })
    });

    form.reset();
    document.getElementById('editId').value = '';
    fetchSchedule();
});

// Видалення
async function deleteItem(id) {
    if(confirm('Ви впевнені?')) {
        await fetch(`/api/schedule/${id}`, { method: 'DELETE' });
        fetchSchedule();
    }
}

// Заповнення форми для редагування
function editItem(id, day, subject) {
    document.getElementById('editId').value = id;
    document.getElementById('dayInput').value = day;
    document.getElementById('subjectInput').value = subject;
}

// Ініціалізація
fetchSchedule();