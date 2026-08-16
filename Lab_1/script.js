const ctx = document.getElementById('myChart').getContext('2d');
const myChart = new Chart(ctx, {
    type: 'line', // Тип діаграми змінено на лінійний (для непарних варіантів)
    data: {
        labels: ['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота', 'Неділя'],
        datasets: [{
            label: 'Температура (°C)',
            data: [22, 24, 25, 21, 23, 27, 26], // Дані температури протягом тижня
            borderWidth: 2,
            borderColor: 'rgba(255, 99, 132, 1)', // Власний колір лінії (червоний)
            backgroundColor: 'rgba(255, 99, 132, 0.2)', // Колір заливки під лінією
            fill: true, // Заливка під графіком
            tension: 0.3 // Згладжування лінії
        }]
    },
    options: {
        responsive: true,
        plugins: {
            title: {
                display: true,
                text: 'Температура у Львові протягом тижня (Виконав: К. Р.)',
                font: {
                    size: 16
                }
            }
        },
        scales: {
            y: {
                beginAtZero: false // Температура не обов'язково починається з нуля
            }
        }
    }
});