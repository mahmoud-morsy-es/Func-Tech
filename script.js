document.addEventListener('DOMContentLoaded', function () {
    // Initialize tasks array
    let tasks = loadTasks();

    // DOM elements
    const functionalForm = document.getElementById('functionalForm');
    const functionalTable = document.getElementById('functionalTable').getElementsByTagName('tbody')[0];
    const technicalForm = document.getElementById('technicalForm');
    const technicalTable = document.getElementById('technicalTable').getElementsByTagName('tbody')[0];

    // Event listeners for form submissions
    functionalForm.addEventListener('submit', function (e) {
        e.preventDefault();
        addTaskToTable(functionalTable, functionalForm, true); // true indicates functional team
    });

    technicalForm.addEventListener('submit', function (e) {
        e.preventDefault();
        addTaskToTable(technicalTable, technicalForm, false); // false indicates technical team
    });

    // Load tasks from localStorage
    function loadTasks() {
        const storedTasks = localStorage.getItem('tasks');
        return storedTasks ? JSON.parse(storedTasks) : [];
    }

    // Save tasks to localStorage
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    // Add task to respective table and localStorage
    function addTaskToTable(table, form, isFunctionalTeam) {
        const formData = new FormData(form);
        const task = {};

        formData.forEach((value, key) => {
            if (key === 'taskDocumentation') {
                const file = value instanceof File ? value : null; // Store file object directly
                task['taskDocumentationName'] = file ? file.name : ''; // Store file name
                task['taskDocumentationType'] = file ? file.type : ''; // Store file type
                task['taskDocumentationKey'] = `taskDoc_${Date.now()}_${file.name}`; // Unique key for localStorage
                saveFileToLocalStorage(task['taskDocumentationKey'], file); // Save file to localStorage
            } else {
                task[key] = value;
            }
        });

        task.taskId = getNextTaskId(isFunctionalTeam); // Generate task ID

        tasks.push(task); // Add task to tasks array
        saveTasks(); // Save tasks to localStorage
        populateTables(); // Update tables with new task
        form.reset(); // Reset form fields
    }

    // Save file to localStorage
    function saveFileToLocalStorage(key, file) {
        const reader = new FileReader();
        reader.onload = function (event) {
            localStorage.setItem(key, event.target.result);
        };
        reader.readAsDataURL(file);
    }

    // Retrieve file from localStorage
    function retrieveFileFromLocalStorage(key) {
        const fileData = localStorage.getItem(key);
        if (fileData) {
            const blob = dataURItoBlob(fileData);
            return new File([blob], key.split('_')[2], { type: blob.type });
        }
        return null;
    }

    // Convert data URI to Blob
    function dataURItoBlob(dataURI) {
        const byteString = atob(dataURI.split(',')[1]);
        const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], { type: mimeString });
    }

    // Generate next task ID based on team type
    function getNextTaskId(isFunctionalTeam) {
        const prefix = isFunctionalTeam ? 'FT' : 'TT';
        let maxId = 0;

        // Find maximum task ID with the specified prefix
        tasks.forEach(task => {
            const taskId = task.taskId;
            if (taskId && typeof taskId === 'string' && taskId.startsWith(prefix)) {
                const numericPart = parseInt(taskId.slice(2), 10); // Extract numeric part
                if (!isNaN(numericPart) && numericPart > maxId) {
                    maxId = numericPart;
                }
            }
        });

        const nextId = maxId + 1;
        return `${prefix}${nextId.toString().padStart(2, '0')}`;
    }

    // Populate both functional and technical team tables
    function populateTables() {
        populateTable('functionalTable', task => [
            task.taskId,
            task.project,
            task.taskName,
            task.taskDescription,
            createFileLink(task.taskDocumentationKey, task.taskDocumentationName), // Use file key and name
            task.responsiblePerson,
            task.internalDeadline,
            task.userDeadline,
            task.status,
            task.changingStatusDate
        ]);

        populateTable('technicalTable', task => [
            task.taskId,
            task.functionalTaskId || '', // Ensure empty string if no functional task ID
            task.responsiblePerson,
            task.estimateDeadline,
            task.status,
            task.changingStatusDate
        ]);
    }

    // Populate a specific table
    function populateTable(tableId, getRowData) {
        const table = document.getElementById(tableId).getElementsByTagName('tbody')[0];
        table.innerHTML = '';

        tasks.filter(task => {
            return tableId === 'functionalTable' ? (task.taskId && task.taskId.startsWith('FT')) : (task.taskId && task.taskId.startsWith('TT'));
        }).forEach(task => {
            const rowData = getRowData(task);
            const newRow = table.insertRow();

            rowData.forEach((value, index) => {
                const cell = newRow.insertCell();
                if (index === 4 && typeof value === 'object' && value.key && value.name) {
                    const fileLink = document.createElement('a');
                    fileLink.href = createFileURL(value.key); // Create download URL
                    fileLink.textContent = value.name; // Display file name as link text
                    fileLink.download = value.name; // Set file name as download attribute
                    cell.appendChild(fileLink);
                } else {
                    cell.textContent = value;
                }
            });

            const actionsCell = newRow.insertCell();
            const editButton = document.createElement('button');
            editButton.textContent = 'Edit';
            editButton.className = 'edit';
            editButton.addEventListener('click', () => editTask(task.taskId, tableId, newRow));
            actionsCell.appendChild(editButton);

            const clearButton = document.createElement('button');
            clearButton.textContent = 'Clear';
            clearButton.className = 'clear';
            clearButton.addEventListener('click', () => clearTask(task.taskId, tableId));
            actionsCell.appendChild(clearButton);
        });
    }

    // Clear a task
    function clearTask(taskId, tableId) {
        const confirmed = confirm('Are you sure you want to clear this task?');
        if (!confirmed) return;

        const taskIndex = tasks.findIndex(task => task.taskId === taskId);
        if (taskIndex !== -1) {
            tasks.splice(taskIndex, 1); // Remove task from array
            deleteFileFromLocalStorage(tasks[taskIndex]['taskDocumentationKey']);
            saveTasks(); // Save updated tasks to localStorage
            populateTables(); // Update tables
        } else {
            console.error('Task not found:', taskId);
        }
    }

    // Edit a task
    function editTask(taskId, tableId, editRow) {
        const confirmed = confirm('Are you sure you want to edit this task?');
        if (!confirmed) return;

        const taskIndex = tasks.findIndex(task => task.taskId === taskId);
        if (taskIndex !== -1) {
            const task = tasks[taskIndex];

            // Update existing row with input fields for editing
            for (let i = 0; i < editRow.cells.length - 1; i++) {
                const cell = editRow.cells[i];
                const value = task[Object.keys(task)[i]]; // Get corresponding task property value
                cell.textContent = ''; // Clear cell content

                // Create input element for editing
                const input = document.createElement('input');
                input.type = 'text';
                input.value = value;
                input.setAttribute('name', Object.keys(task)[i]); // Set input name to match task property
                cell.appendChild(input);
            }

            // Handle file input separately
            const fileCell = editRow.cells[4];
            fileCell.textContent = ''; // Clear existing file link

            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.setAttribute('name', 'taskDocumentation'); // Set input name to match task property
            fileCell.appendChild(fileInput);

            // Add Save button if not already added
            const saveButton = editRow.querySelector('.save');
            if (!saveButton) {
                const actionsCell = editRow.cells[editRow.cells.length - 1];
                const saveButton = document.createElement('button');
                saveButton.textContent = 'Save';
                saveButton.className = 'save';
                saveButton.addEventListener('click', () => saveEditedTask(taskId, tableId, editRow));
                actionsCell.appendChild(saveButton);
            }
        } else {
            console.error('Task not found:', taskId);
        }
    }

    // Save edited task
    function saveEditedTask(taskId, tableId, editRow) {
        const taskIndex = tasks.findIndex(task => task.taskId === taskId);
        if (taskIndex !== -1) {
            const editedTask = tasks[taskIndex];
            const cells = editRow.cells;

            // Update editedTask object with input values
            for (let i = 0; i < cells.length - 1; i++) { // Exclude last cell (actions cell)
                const input = cells[i].querySelector('input');
                const key = input.getAttribute('name');
                if (key === 'taskDocumentation') {
                    const fileInput = cells[i].querySelector('input[type="file"]');
                    if (fileInput.files.length > 0) {
                        const file = fileInput.files[0];
                        editedTask['taskDocumentationName'] = file.name; // Update file name
                        editedTask['taskDocumentationType'] = file.type; // Update file type
                        editedTask['taskDocumentationKey'] = `taskDoc_${Date.now()}_${file.name}`; // New key for localStorage
                        saveFileToLocalStorage(editedTask['taskDocumentationKey'], file); // Save new file to localStorage
                    }
                } else {
                    editedTask[key] = input.value;
                }
            }

            // Update tasks array with edited task
            tasks[taskIndex] = editedTask;
            saveTasks(); // Save updated tasks to localStorage
            populateTables(); // Re-populate tables with updated data
        } else {
            console.error('Task not found:', taskId);
        }
    }

    // Delete file from localStorage
    function deleteFileFromLocalStorage(key) {
        localStorage.removeItem(key);
    }

    // Create file download URL
    function createFileURL(key) {
        const file = retrieveFileFromLocalStorage(key);
        if (file) {
            return URL.createObjectURL(file);
        }
        return '#';
    }

    // Create file link object
    function createFileLink(key, name) {
        if (key && name) {
            return { key, name };
        }
        return '';
    }

    // Initialize tables with loaded tasks
    populateTables();
});
