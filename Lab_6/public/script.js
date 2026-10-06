document.addEventListener('DOMContentLoaded', loadTasks);

const taskForm = document.getElementById('taskForm');
const taskList = document.getElementById('taskList');

// Додавання нового завдання
taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;

    await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description })
    });

    taskForm.reset();
    loadTasks();
});

// Отримання та відображення списку завдань
async function loadTasks() {
    const res = await fetch('/api/tasks');
    const tasks = await res.json();
    taskList.innerHTML = '';
    
    tasks.forEach(task => {
        const li = document.createElement('li');
        if (task.status === 'done') li.classList.add('done');
        
        li.innerHTML = `
            <div>
                <span><strong>${task.title}</strong>: ${task.description}</span>
            </div>
            <div class="task-actions">
                <button class="status-btn" onclick="toggleStatus(${task.id}, '${task.status}')">
                    ${task.status === 'active' ? 'Виконано' : 'Відновити'}
                </button>
                <button class="delete-btn" onclick="deleteTask(${task.id})">Видалити</button>
            </div>
        `;
        taskList.appendChild(li);
    });
}

// Зміна статусу або опису
async function toggleStatus(id, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'done' : 'active';
    await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
    });
    loadTasks();
}

// Видалення завдання
async function deleteTask(id) {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    loadTasks();
}