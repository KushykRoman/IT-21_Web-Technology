async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const data = response.status === 204 ? {} : await response.json();
  if (!response.ok) {
    if (response.status === 401 && !location.pathname.includes('login')) location.href = '/login.html';
    throw new Error(data.message || (data.errors || []).join(' ') || 'Сталася помилка.');
  }
  return data;
}
function showMessage(element, text, isError = true) {
  if (!element) return;
  element.textContent = text;
  element.className = 'message ' + (isError ? 'error' : 'success');
}
const loginForm = document.querySelector('#login-form');
if (loginForm) loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  const message = document.querySelector('#message');
  try {
    const form = new FormData(loginForm);
    await api('/api/login', { method: 'POST', body: JSON.stringify(Object.fromEntries(form)) });
    location.href = '/dashboard.html';
  } catch (error) { showMessage(message, error.message); }
});
const registerForm = document.querySelector('#register-form');
if (registerForm) registerForm.addEventListener('submit', async event => {
  event.preventDefault();
  const message = document.querySelector('#message');
  try {
    const form = new FormData(registerForm);
    await api('/api/register', { method: 'POST', body: JSON.stringify(Object.fromEntries(form)) });
    location.href = '/dashboard.html';
  } catch (error) { showMessage(message, error.message); }
});

if (document.querySelector('#task-list')) {
  let tasks = [];
  let filter = 'all';
  let chart = null;
  const taskList = document.querySelector('#task-list');
  const taskMessage = document.querySelector('#task-message');

  function render() {
    const priority = document.querySelector('#priority-filter').value;
    const filtered = tasks.filter(task => {
      const statusMatches = filter === 'all' || (filter === 'active' && !task.completed) || (filter === 'done' && task.completed);
      return statusMatches && (priority === 'all' || task.priority === priority);
    });
    taskList.replaceChildren();
    document.querySelector('#empty-state').style.display = filtered.length ? 'none' : 'block';
    document.querySelector('#visible-count').textContent = `${filtered.length} завдань`;
    filtered.forEach(task => {
      const row = document.createElement('article');
      row.className = 'task-row' + (task.completed ? ' completed' : '');
      const check = document.createElement('button');
      check.className = 'check-btn';
      check.textContent = task.completed ? '✓' : '';
      check.setAttribute('aria-label', task.completed ? 'Позначити невиконаним' : 'Позначити виконаним');
      check.addEventListener('click', () => updateTask(task, { completed: !task.completed }));
      const title = document.createElement('span');
      title.className = 'task-title';
      title.textContent = task.title;
      const badge = document.createElement('span');
      badge.className = `priority priority-${task.priority === 'висока' ? 'high' : task.priority === 'низька' ? 'low' : 'medium'}`;
      badge.textContent = task.priority;
      const edit = document.createElement('button');
      edit.className = 'icon-btn';
      edit.textContent = '✎';
      edit.title = 'Редагувати';
      edit.addEventListener('click', async () => {
        const newTitle = prompt('Нова назва завдання:', task.title);
        if (newTitle === null) return;
        const titleTrimmed = newTitle.trim();
        if (!titleTrimmed) return showMessage(taskMessage, 'Назва не може бути порожньою.');
        const newPriority = prompt('Пріоритет: низька, середня або висока', task.priority);
        if (newPriority === null) return;
        if (!['низька', 'середня', 'висока'].includes(newPriority.trim())) return showMessage(taskMessage, 'Вкажіть низька, середня або висока.');
        try {
          await api(`/api/tasks/${task.id}`, { method: 'PUT', body: JSON.stringify({ title: titleTrimmed, priority: newPriority.trim(), completed: task.completed }) });
          await loadTasks();
          showMessage(taskMessage, 'Завдання оновлено.', false);
        } catch (error) { showMessage(taskMessage, error.message); }
      });
      const remove = document.createElement('button');
      remove.className = 'icon-btn delete-btn';
      remove.textContent = '×';
      remove.title = 'Видалити';
      remove.addEventListener('click', async () => {
        if (!confirm('Видалити це завдання?')) return;
        try {
          await api(`/api/tasks/${task.id}`, { method: 'DELETE' });
          await loadTasks();
          showMessage(taskMessage, 'Завдання видалено.', false);
        } catch (error) { showMessage(taskMessage, error.message); }
      });
      row.append(check, title, badge, edit, remove);
      taskList.append(row);
    });
    const done = tasks.filter(t => t.completed).length;
    const total = tasks.length;
    const left = total - done;
    const percent = total ? Math.round(done / total * 100) : 0;
    document.querySelector('#total-count').textContent = total;
    document.querySelector('#done-count').textContent = done;
    document.querySelector('#left-count').textContent = left;
    document.querySelector('#progress-percent').textContent = `${percent}%`;
    document.querySelector('#legend-done').textContent = done;
    document.querySelector('#legend-left').textContent = left;
    if (chart) {
      chart.data.datasets[0].data = [done, left];
      chart.update();
    } else if (window.Chart) {
      chart = new Chart(document.querySelector('#task-chart'), {
        type: 'doughnut',
        data: { labels: ['Виконано', 'Не виконано'], datasets: [{ data: [done, left], backgroundColor: ['#24b47e', '#e8edf4'], borderWidth: 0, hoverOffset: 5 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '78%', plugins: { legend: { display: false } } }
      });
    }
  }
  async function loadTasks() {
    tasks = await api('/api/tasks');
    render();
  }
  async function updateTask(task, changes) {
    try {
      await api(`/api/tasks/${task.id}`, { method: 'PUT', body: JSON.stringify({ title: task.title, priority: task.priority, completed: changes.completed ?? task.completed }) });
      await loadTasks();
    } catch (error) { showMessage(taskMessage, error.message); }
  }
  document.querySelector('#task-form').addEventListener('submit', async event => {
    event.preventDefault();
    const taskForm = event.currentTarget;
    const form = new FormData(taskForm);
    try {
      await api('/api/tasks', { method: 'POST', body: JSON.stringify(Object.fromEntries(form)) });
      taskForm.reset();
      await loadTasks();
      showMessage(taskMessage, 'Завдання додано.', false);
    } catch (error) { showMessage(taskMessage, error.message); }
  });
  document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('.filter').forEach(item => item.classList.remove('active'));
    button.classList.add('active');
    filter = button.dataset.filter;
    render();
  }));
  document.querySelector('#priority-filter').addEventListener('change', render);
  document.querySelector('#logout-btn').addEventListener('click', async () => {
    try { await api('/api/logout'); location.href = '/login.html'; }
    catch (error) { showMessage(taskMessage, error.message); }
  });
  (async () => {
    try {
      const result = await api('/api/me');
      document.querySelector('#user-name').textContent = result.user.name;
      document.querySelector('#welcome-title').textContent = `Вітаємо, ${result.user.name}!`;
      document.querySelector('#today-date').textContent = new Intl.DateTimeFormat('uk-UA', { dateStyle: 'long' }).format(new Date());
      await loadTasks();
    } catch { location.href = '/login.html'; }
  })();
}