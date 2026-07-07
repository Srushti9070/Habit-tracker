
let tasks = JSON.parse(localStorage.getItem('prodPulse_tasks')) || [];
let currentTheme = localStorage.getItem('prodPulse_theme') || 'light';
let editingTaskId = null;


document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initTabs();
    initForm();
    initFilters();
    renderApp();
});

function saveToLocalStorage() {
    localStorage.setItem('prodPulse_tasks', JSON.stringify(tasks));
}

function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const modeIcon = themeToggle.querySelector('.mode-icon');
    
    document.documentElement.setAttribute('data-theme', currentTheme);
    modeIcon.textContent = currentTheme === 'dark' ? '☀️' : '🌙';

    themeToggle.addEventListener('click', () => {
        currentTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', currentTheme);
        localStorage.setItem('prodPulse_theme', currentTheme);
        modeIcon.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
    });
}

function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanels.forEach(panel => panel.classList.remove('active'));

            button.classList.add('active');
            const targetId = button.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');

            if (targetId === 'analytics-view') {
                renderAnalytics();
            }
        });
    });
}

function initForm() {
    const form = document.getElementById('task-form');
    const cancelBtn = document.getElementById('cancel-edit-btn');
    
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('task-date').value = today;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const title = document.getElementById('task-title').value.trim();
        const desc = document.getElementById('task-desc').value.trim();
        const category = document.getElementById('task-category').value;
        const priority = document.getElementById('task-priority').value;
        const date = document.getElementById('task-date').value;
        const isPlanner = document.getElementById('task-planner').checked;

        if (editingTaskId) {
            tasks = tasks.map(task => {
                if (task.id === editingTaskId) {
                    return { ...task, title, desc, category, priority, date, isPlanner };
                }
                return task;
            });
            editingTaskId = null;
            document.getElementById('submit-task-btn').textContent = "Add Task";
            document.getElementById('form-title').textContent = "Create New Task";
            cancelBtn.classList.add('hidden');
        } else {
        
            const newTask = {
                id: Date.now().toString(),
                title,
                desc,
                category,
                priority,
                date,
                isPlanner,
                completed: false,
                completionDate: null
            };
            tasks.push(newTask);
        }

        saveToLocalStorage();
        form.reset();
        document.getElementById('task-date').value = today;
        renderApp();
    });

    cancelBtn.addEventListener('click', () => {
        editingTaskId = null;
        form.reset();
        document.getElementById('task-date').value = today;
        document.getElementById('submit-task-btn').textContent = "Add Task";
        document.getElementById('form-title').textContent = "Create New Task";
        cancelBtn.classList.add('hidden');
    });
}

function toggleTaskComplete(id) {
    tasks = tasks.map(task => {
        if (task.id === id) {
            const completed = !task.completed;
            return {
                ...task,
                completed,
                completionDate: completed ? new Date().toISOString().split('T')[0] : null
            };
        }
        return task;
    });
    saveToLocalStorage();
    renderApp();
    
    if (document.querySelector('.tab-btn[data-target="analytics-view"]').classList.contains('active')) {
        renderAnalytics();
    }
}

function startEditTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    editingTaskId = id;
    
    document.getElementById('task-id').value = task.id;
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-desc').value = task.desc;
    document.getElementById('task-category').value = task.category;
    document.getElementById('task-priority').value = task.priority;
    document.getElementById('task-date').value = task.date;
    document.getElementById('task-planner').checked = task.isPlanner;

    document.getElementById('submit-task-btn').textContent = "Update Task";
    document.getElementById('form-title').textContent = "Modify Task Elements";
    document.getElementById('cancel-edit-btn').classList.remove('hidden');
    
    
    document.getElementById('task-form').scrollIntoView({ behavior: 'smooth' });
}

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveToLocalStorage();
    renderApp();

    if (document.querySelector('.tab-btn[data-target="analytics-view"]').classList.contains('active')) {
        renderAnalytics();
    }
}

function initFilters() {
    document.getElementById('search-input').addEventListener('input', renderApp);
    document.getElementById('filter-category').addEventListener('change', renderApp);
    document.getElementById('filter-priority').addEventListener('change', renderApp);
    document.getElementById('filter-status').addEventListener('change', renderApp);
}


function renderApp() {
    const searchVal = document.getElementById('search-input').value.toLowerCase();
    const catFilter = document.getElementById('filter-category').value;
    const prioFilter = document.getElementById('filter-priority').value;
    const statusFilter = document.getElementById('filter-status').value;

    const masterListElement = document.getElementById('master-task-list');
    const plannerListElement = document.getElementById('planner-list');

    masterListElement.innerHTML = '';
    plannerListElement.innerHTML = '';

    const todayStr = new Date().toISOString().split('T')[0];

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchVal) || task.desc.toLowerCase().includes(searchVal);
        const matchesCat = catFilter === 'all' || task.category === catFilter;
        const matchesPrio = prioFilter === 'all' || task.priority === prioFilter;
        const matchesStatus = statusFilter === 'all' || 
            (statusFilter === 'completed' && task.completed) || 
            (statusFilter === 'pending' && !task.completed);

        return matchesSearch && matchesCat && matchesPrio && matchesStatus;
    });

    filteredTasks.forEach(task => {
        const isOverdue = !task.completed && task.date < todayStr;
        const taskHTML = `
            <li class="task-item priority-${task.priority.toLowerCase()} ${task.completed ? 'completed' : ''}">
                <div class="task-main-info">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTaskComplete('${task.id}')">
                    <div class="task-details">
                        <h4 class="task-title-text">${escapeHTML(task.title)}</h4>
                        ${task.desc ? `<p class="task-desc-text">${escapeHTML(task.desc)}</p>` : ''}
                        <div class="meta-tags">
                            <span class="tag">${task.category}</span>
                            <span class="tag">${task.priority}</span>
                            <span class="tag tag-date ${isOverdue ? 'overdue' : ''}">📅 ${task.date} ${isOverdue ? '(Overdue)' : ''}</span>
                        </div>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="btn-icon btn-edit" onclick="startEditTask('${task.id}')" title="Edit Task">✏️</button>
                    <button class="btn-icon btn-delete" onclick="deleteTask('${task.id}')" title="Delete Task">🗑️</button>
                </div>
            </li>
        `;

    
        masterListElement.insertAdjacentHTML('beforeend', taskHTML);

        
        if (task.isPlanner) {
            plannerListElement.insertAdjacentHTML('beforeend', taskHTML);
        }
    });

    if (filteredTasks.length === 0) {
        masterListElement.innerHTML = '<li class="task-desc-text" style="text-align:center; padding: 2rem 0;">No matching tasks found.</li>';
    }
    if (plannerListElement.children.length === 0) {
        plannerListElement.innerHTML = '<li class="task-desc-text" style="text-align:center; padding: 1rem 0;">No tasks scheduled in today\'s workspace module.</li>';
    }

    calculateSidebarMetrics();
}


function calculateSidebarMetrics() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const overdue = tasks.filter(t => !t.completed && t.date < todayStr).length;

    
    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-completed').textContent = completed;
    document.getElementById('stat-pending').textContent = pending;
    document.getElementById('stat-overdue').textContent = overdue;

    
    let baseScore = 0;
    if (total > 0) {
        const completionRate = completed / total;
        const penaltyFactor = overdue * 0.10; 
        
        let targetScore = (completionRate * 100) - (penaltyFactor * 100);
        baseScore = Math.max(0, Math.min(100, Math.round(targetScore)));
    }

    document.getElementById('prod-score').textContent = baseScore;

    const feedbackText = document.getElementById('score-feedback');
    const insightsList = document.getElementById('insights-list');
    insightsList.innerHTML = '';

    let insights = [];

    if (baseScore >= 80) {
        feedbackText.textContent = "Spectacular operational workflow! You are scaling fast.";
    } else if (baseScore >= 50) {
        feedbackText.textContent = "Solid output pacing, maintain focus mechanics to mitigate drag.";
    } else if (total > 0) {
        feedbackText.textContent = "Attention required. Operational friction is building up.";
    } else {
        feedbackText.textContent = "Add and complete tasks to build momentum!";
    }

    
    if (overdue > 0) {
        insights.push(`🚨 System tracking <strong>${overdue} overdue task(s)</strong>. Break structural backlog loops to recover points.`);
    }
    if (tasks.filter(t => t.priority === 'High' && !t.completed).length > 0) {
        insights.push("💡 High-priority metrics are unfulfilled. Dedicate today's focus to these high-value deliverables.");
    }
    if (total > 0 && (completed / total) < 0.5) {
        insights.push("📉 Net project threshold completion is under 50%. Focus on clearing open tasks before adding more.");
    }
    if (tasks.filter(t => t.isPlanner && !t.completed).length > 3) {
        insights.push("⚠️ Daily planner overcrowding detected. Limit specific tasks to 3-4 absolute crucial vectors to optimize flow.");
    }
    if (insights.length === 0) {
        insights.push("✨ Velocity healthy. All background components operational with balanced workload structures.");
    }

    insights.forEach(insight => {
        const li = document.createElement('li');
        li.innerHTML = insight;
        insightsList.appendChild(li);
    });
}


function renderAnalytics() {

    const chartContainer = document.getElementById('weekly-chart');
    chartContainer.innerHTML = '';

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    
 
    let pastSevenDays = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        pastSevenDays.push({
            dateString: d.toISOString().split('T')[0],
            dayName: dayLabels[d.getDay()]
        });
    }

    
    let maxDayCount = 1;
    pastSevenDays.forEach(day => {
        const count = tasks.filter(t => t.date === day.dateString).length;
        if (count > maxDayCount) maxDayCount = count;
    });


    pastSevenDays.forEach(day => {
        const dayTasks = tasks.filter(t => t.date === day.dateString);
        const count = dayTasks.length;
        const completedCount = dayTasks.filter(t => t.completed).length;
        
       
        const heightPercent = (count / maxDayCount) * 100;
        
        const barWrapper = document.createElement('div');
        barWrapper.className = 'chart-bar-wrapper';
        barWrapper.innerHTML = `
            <div class="bar-container" style="height: 100%;">
                <div class="bar-fill" style="height: ${heightPercent}%; background-color: ${count > 0 && completedCount === count ? 'var(--success)' : 'var(--primary)'};">
                    ${count > 0 ? `<span class="bar-count">${count}</span>` : ''}
                </div>
            </div>
            <div class="bar-label">${day.dayName}</div>
        `;
        chartContainer.appendChild(barWrapper);
    });


    const catContainer = document.getElementById('category-metrics');
    catContainer.innerHTML = '';
    const categories = ['Work', 'Personal', 'Health', 'Finance'];

    categories.forEach(cat => {
        const totalCat = tasks.filter(t => t.category === cat).length;
        const compCat = tasks.filter(t => t.category === cat && t.completed).length;
        const pct = totalCat > 0 ? Math.round((compCat / totalCat) * 100) : 0;

        catContainer.insertAdjacentHTML('beforeend', createMetricRowMarkup(cat, totalCat, compCat, pct));
    });

    const prioContainer = document.getElementById('priority-metrics');
    prioContainer.innerHTML = '';
    const priorities = ['High', 'Medium', 'Low'];

    priorities.forEach(prio => {
        const totalPrio = tasks.filter(t => t.priority === prio).length;
        const compPrio = tasks.filter(t => t.priority === prio && t.completed).length;
        const pct = totalPrio > 0 ? Math.round((compPrio / totalPrio) * 100) : 0;

        prioContainer.insertAdjacentHTML('beforeend', createMetricRowMarkup(prio, totalPrio, compPrio, pct));
    });
}

function createMetricRowMarkup(label, total, completed, percentage) {
    return `
        <div class="metric-row">
            <div class="metric-info">
                <span><strong>${label}</strong> (${completed}/${total})</span>
                <span>${percentage}% Effective</span>
            </div>
            <div class="metric-progress-bg">
                <div class="metric-progress-fill" style="width: ${percentage}%;"></div>
            </div>
        </div>
    `;
}


function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}
