let tasks = [];

document.addEventListener('DOMContentLoaded', function () {
    const functionalForm = document.getElementById('functionalForm');
    const technicalForm = document.getElementById('technicalForm');

    functionalForm.addEventListener('submit', function (e) {
        e.preventDefault();
        addTask('functional');
        functionalForm.reset();
    });

    technicalForm.addEventListener('submit', function (e) {
        e.preventDefault();
        addTask('technical');
        technicalForm.reset();
    });

    loadTasks();
});

function addTask(type) {
    const form = type === 'functional' ? document.getElementById('functionalForm') : document.getElementById('technicalForm');
    const formData = new FormData(form);
    const task = {};
    
    formData.forEach((value, key) => {
        task[key] = value;
    });

    task.taskId = getNextTaskId(type);

    tasks.push(task);
    saveTasks();
    populateTables();
}

function getNextTaskId(type) {
    let taskIdPrefix = type === 'functional' ? 'F' : 'T';
    let taskIdCounter = tasks.filter(task => task.taskId.startsWith(taskIdPrefix)).length + 1;
    return `${taskIdPrefix}${taskIdCounter.toString().padStart(2, '0')}`;
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasks() {
    const storedTasks = localStorage.getItem('tasks');
    tasks = storedTasks ? JSON.parse(storedTasks) : [];
    populateTables();
}

function populateTables() {
    populateFunctionalTable();
    populateTechnicalTable();
    populateFunctionalTaskIdDropdown();
}

function populateFunctionalTable() {
    const functionalTable = document.getElementById('functionalTable').getElementsByTagName('tbody')[0];
    functionalTable.innerHTML = '';

    tasks.filter(task => task.taskId.startsWith('F')).forEach(task => {
        const newRow = functionalTable.insertRow();
        Object.values(task).forEach(value => {
            const cell = newRow.insertCell();
            if (typeof value === 'string' && value.startsWith('data:')) {
                const fileLink = document.createElement('a');
                fileLink.href = value;
                fileLink.textContent = 'Download File';
                cell.appendChild(fileLink);
            } else {
                cell.textContent = value;
            }
        });

        const actionsCell = newRow.insertCell();
        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.className = 'edit';
        editButton.addEventListener('click', () => editTask(task.taskId));
        actionsCell.appendChild(editButton);
    });
}

function populateTechnicalTable() {
    const technicalTable = document.getElementById('technicalTable').getElementsByTagName('tbody')[0];
    technicalTable.innerHTML = '';

    tasks.filter(task => task.taskId.startsWith('T')).forEach(task => {
        const newRow = technicalTable.insertRow();
        Object.values(task).forEach(value => {
            const cell = newRow.insertCell();
            if (typeof value === 'string' && value.startsWith('data:')) {
                const fileLink = document.createElement('a');
                fileLink.href = value;
                fileLink.textContent = 'Download File';
                cell.appendChild(fileLink);
            } else {
                cell.textContent = value;
            }
        });

        const actionsCell = newRow.insertCell();
        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.className = 'edit';
        editButton.addEventListener('click', () => editTask(task.taskId));
        actionsCell.appendChild(editButton);
    });
}

function populateFunctionalTaskIdDropdown() {
    const functionalTasks = tasks.filter(task => task.taskId.startsWith('F'));
    const technicalForm = document.getElementById('technicalForm');
    const functionalTaskIdSelect = technicalForm.querySelector('select[name="functionalTaskId"]');
    
    functionalTaskIdSelect.innerHTML = '';
    
    functionalTasks.forEach(task => {
        const option = document.createElement('option');
        option.value = task.taskId;
        option.textContent = task.taskId;
        functionalTaskIdSelect.appendChild(option);
    });
}

function editTask(taskId) {
    const taskIndex = tasks.findIndex(task => task.taskId === taskId);
    if (taskIndex !== -1) {
        const task = tasks[taskIndex];
        // Example: prefill form fields for editing
        // Assuming there are separate functions or logic for editing forms
        console.log('Editing task:', task);
    } else {
        console.error('Task not found:', taskId);
    }
}
