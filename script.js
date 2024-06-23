document.addEventListener('DOMContentLoaded', function () {
    let tasks = [];

    const functionalForm = document.getElementById('functionalForm');
    const functionalTable = document.getElementById('functionalTable').getElementsByTagName('tbody')[0];
    const technicalForm = document.getElementById('technicalForm');
    const technicalTable = document.getElementById('technicalTable').getElementsByTagName('tbody')[0];
    const API_BASE_URL = 'https://task-coordination-proj.vercel.app';
  
    
    functionalForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const task = await addTaskToTable(functionalForm, true);
        await saveTask(task);
    });

    technicalForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const task = await addTaskToTable(technicalForm, false);
        await saveTask(task);
    });

    async function loadTasks() {
        try {
            const response = await fetch('${API_BASE_URL}/tasks');
            if (!response.ok) {
                throw new Error('Failed to fetch tasks');
            }
            return await response.json();
        } catch (error) {
            console.error('Error loading tasks:', error);
            return [];
        }
    }

    async function saveTask(task) {
        try {
            const formData = new FormData();
            for (const key in task) {
                formData.append(key, task[key]);
            }

            const response = await fetch('${API_BASE_URL}/tasks', { method: 'POST', body: formData });

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(`Failed to save task: ${errorMessage}`);
            }

            const savedTask = await response.json();
            tasks.push(savedTask);
            populateTables();
            functionalForm.reset();
            technicalForm.reset();
        } catch (error) {
            console.error('Error saving task:', error);
        }
    }

    async function addTaskToTable(form, isFunctionalTeam) {
        const formData = new FormData(form);
        const task = {};

        formData.forEach((value, key) => {
            if (key === 'taskDocumentation') {
                const file = value instanceof File ? value : null;
                task['taskDocumentation'] = file;
            } else {
                task[key] = value;
            }
        });

        task.taskId = getNextTaskId(isFunctionalTeam);
        return task;
    }

    function getNextTaskId(isFunctionalTeam) {
        const prefix = isFunctionalTeam ? 'FT' : 'TT';
        const tasksWithPrefix = tasks.filter(task => task.taskId && task.taskId.startsWith(prefix));
        const maxId = tasksWithPrefix.reduce((max, task) => {
            const numericPart = parseInt(task.taskId.slice(2), 10);
            return numericPart > max ? numericPart : max;
        }, 0);

        const nextId = maxId + 1;
        return `${prefix}${nextId.toString().padStart(2, '0')}`;
    }

    async function populateTables() {
        try {
            tasks = await loadTasks();

            populateTable(functionalTable, task => [
                task.taskId,
                task.project,
                task.taskName,
                task.taskDescription,
                createDownloadLink(task.taskDocumentationKey, task.taskDocumentationName),
                task.responsiblePerson,
                task.internalDeadline,
                task.userDeadline,
            ], 'FT');

            populateTable(technicalTable, task => [
                task.taskId,
                task.functionalTaskId,
                task.responsiblePerson,
                task.estimateDeadline,
            ], 'TT');

            populateFunctionalTaskIdDropdown();
        } catch (error) {
            console.error('Error populating tables:', error);
        }
    }

    function populateTable(table, getRowData, prefix) {
        table.innerHTML = '';

        tasks.filter(task => task.taskId && task.taskId.startsWith(prefix)).forEach(task => {
            const rowData = getRowData(task);
            const newRow = table.insertRow();

            rowData.forEach(value => {
                const cell = newRow.insertCell();
                if (typeof value === 'string') {
                    cell.textContent = value;
                } else {
                    cell.appendChild(value);
                }
            });

            const actionsCell = newRow.insertCell();
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.className = 'delete';
            deleteButton.addEventListener('click', () => deleteTask(task.taskId));
            actionsCell.appendChild(deleteButton);
        });
    }

    function populateFunctionalTaskIdDropdown() {
        const functionalTaskIds = tasks.filter(task => task.taskId && task.taskId.startsWith('FT')).map(task => task.taskId);
        const functionalTaskIdSelect = technicalForm.querySelector('select[name="functionalTaskId"]');
        functionalTaskIdSelect.innerHTML = '';

        functionalTaskIds.forEach(taskId => {
            const option = document.createElement('option');
            option.value = taskId;
            option.textContent = taskId;
            functionalTaskIdSelect.appendChild(option);
        });
    }

    function createDownloadLink(fileKey, fileName) {
        if (!fileKey) return '';

        const downloadLink = document.createElement('a');
        downloadLink.textContent = fileName;
        downloadLink.href = '${API_BASE_URL}/download/${fileKey}';
        downloadLink.target = '_blank';
        downloadLink.setAttribute('download', fileName);

        return downloadLink;
    }

    async function deleteTask(taskId) {
        try {
            const response = await fetch('${API_BASE_URL}/tasks/${taskId}', { method: 'DELETE' });
            if (response.ok) {
                tasks = tasks.filter(task => task.taskId !== taskId);
                populateTables();
                console.log(`Task ${taskId} deleted successfully.`);
            } else {
                console.error('Failed to delete task:', response.statusText);
            }
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    }

    populateTables();
});
//UPDATED