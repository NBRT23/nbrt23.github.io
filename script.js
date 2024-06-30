document.addEventListener('DOMContentLoaded', function() {
    const claimButton = document.getElementById('claimButton');
    const countdownElement = document.getElementById('countdown');
    const currentCoinsElement = document.getElementById('currentCoins');
    const claimInterval = 0.08 * 60 * 60 * 1000; // 8 часов в миллисекундах
    const maxCoins = 100; // Максимальное количество монет за период
    const taskRewardInterval = 1 * 60 * 1000; // Интервал для зачисления вознаграждения за задание (1 минута)

    let lastClaimTime = localStorage.getItem('lastClaimTime');
    let coins = localStorage.getItem('coins') ? parseInt(localStorage.getItem('coins')) : 0;

    function updateTimer() {
        if (claimButton && countdownElement && currentCoinsElement) {
            const currentTime = new Date().getTime();
            const timeSinceLastClaim = currentTime - lastClaimTime;
            const timeToNextClaim = claimInterval - timeSinceLastClaim;

            if (timeToNextClaim <= 0) {
                claimButton.disabled = false;
                countdownElement.textContent = 'Сейчас можно собрать!';
                currentCoinsElement.textContent = maxCoins; // Показать максимальное количество монет
            } else {
                claimButton.disabled = true;
                const hours = Math.floor((timeToNextClaim % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((timeToNextClaim % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((timeToNextClaim % (1000 * 60)) / 1000);
                countdownElement.textContent = `${hours}ч ${minutes}м ${seconds}с`;

                // Обновление текущего количества нафармленных монет
                const currentCoins = Math.floor((timeSinceLastClaim / claimInterval) * maxCoins);
                currentCoinsElement.textContent = currentCoins;
            }
        }
    }

    function claimCoins() {
        const currentTime = new Date().getTime();
        coins += maxCoins;
        localStorage.setItem('coins', coins);
        lastClaimTime = currentTime;
        localStorage.setItem('lastClaimTime', lastClaimTime);
        updateTimer();
    }

    if (claimButton) {
        claimButton.addEventListener('click', claimCoins);
    }

    if (!lastClaimTime) {
        lastClaimTime = new Date().getTime();
        localStorage.setItem('lastClaimTime', lastClaimTime);
    }

    setInterval(updateTimer, 1000);
    updateTimer();

    // Функция для выполнения задания
    window.completeTask = function(taskId) {
        const linkId = `link_${taskId}`;
        const btnId = `btn_${taskId}`;

        // Проверяем, выполнено ли задание
        const taskCompleted = localStorage.getItem(`task_${taskId}`);

        if (taskCompleted) {
            alert(`Задание "${taskId}" уже выполнено!`);
            return;
        }

        // Открываем ссылку в новой вкладке
        const taskLink = document.getElementById(linkId);
        if (taskLink) {
            window.open(taskLink.href, '_blank');
        }

        // Устанавливаем таймер на зачисление вознаграждения за выполнение задания
        setTimeout(() => {
            localStorage.setItem(`task_${taskId}`, 'completed');

            // Делаем кнопку неактивной и меняем текст на "Выполнено"
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.disabled = true;
                btn.textContent = 'Выполнено';
            }

            // Добавляем награду за выполненное задание к общему счету монет
            const taskReward = parseInt(document.getElementById(`reward_${taskId}`).textContent);
            coins += taskReward; // Добавляем вознаграждение к общему счету монет
            localStorage.setItem('coins', coins);

            if (currentCoinsElement) {
                currentCoinsElement.textContent = coins;
            }
        }, taskRewardInterval); // Интервал для зачисления вознаграждения в миллисекундах
    };

    // Добавляем обработчики событий для кнопок на странице TASKS
    function initializeTasks() {
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];

        const tasksList = document.getElementById('tasksList');
        if (tasksList) {
            tasksList.innerHTML = '';
            tasks.forEach(task => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <a href="${task.link}" target="_blank" id="link_${task.id}">${task.name}</a>
                    - Вознаграждение: <span id="reward_${task.id}">${task.reward}</span> монет
                    <button id="btn_${task.id}" onclick="completeTask('${task.id}')">Выполнить</button>
                `;
                tasksList.appendChild(li);

                // Инициализация кнопок
                const taskCompleted = localStorage.getItem(`task_${task.id}`);
                const btn = document.getElementById(`btn_${task.id}`);
                if (taskCompleted) {
                    btn.disabled = true;
                    btn.textContent = 'Выполнено';
                }
            });
        }
    }

    // Инициализация заданий на странице TASKS
    initializeTasks();

    // Админка: добавление и удаление заданий
    const addTaskForm = document.getElementById('addTaskForm');
    if (addTaskForm) {
        addTaskForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const taskName = document.getElementById('taskName').value;
            const taskLink = document.getElementById('taskLink').value;
            const taskReward = parseInt(document.getElementById('taskReward').value); // Получаем значение вознаграждения

            const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            const taskId = `task_${tasks.length + 1}`;
            tasks.push({ id: taskId, name: taskName, link: taskLink, reward: taskReward });
            localStorage.setItem('tasks', JSON.stringify(tasks));
            initializeTasks();

            // Обновление списка в админке
            loadAdminTasks();
        });
    }

    function loadAdminTasks() {
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        const adminTasksList = document.getElementById('adminTasksList');
        if (adminTasksList) {
            adminTasksList.innerHTML = '';
            tasks.forEach(task => {
                const li = document.createElement('li');
                li.innerHTML = `
                    ${task.name} - <a href="${task.link}" target="_blank">${task.link}</a> - Вознаграждение: ${task.reward} монет
                    <button onclick="deleteTask('${task.id}')">Удалить</button>
                `;
                adminTasksList.appendChild(li);
            });
        }
    }

    window.deleteTask = function(taskId) {
        let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        tasks = tasks.filter(task => task.id !== taskId);
        localStorage.setItem('tasks', JSON.stringify(tasks));
        initializeTasks();
        loadAdminTasks();
    };

    // Инициализация списка заданий в админке
    if (document.getElementById('adminTasksList')) {
        loadAdminTasks();
    }
});

