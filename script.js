document.addEventListener('DOMContentLoaded', function () {
    const functionalForm = document.getElementById('functionalForm');
    const functionalTable = document.getElementById('functionalTable').getElementsByTagName('tbody')[0];

    functionalForm.addEventListener('submit', function (e) {
        e.preventDefault();
        addRowToTable(functionalTable, functionalForm);
        populateFunctionalTaskIdDropdown(); // Update dropdown options after adding a task
    });

    const technicalForm = document.getElementById('technicalForm');
    const technicalTable = document.getElementById('technicalTable').getElementsByTagName('tbody')[0];

    technicalForm.addEventListener('submit', function (e) {
        e.preventDefault();
        addRowToTable(technicalTable, technicalForm);
    });

    // Initial population of Functional Team Task ID dropdown
    populateFunctionalTaskIdDropdown();
});

let functionalTaskIdCounter = 1;
let technicalTaskIdCounter = 1;

function getNextTaskId(isFunctionalTeam) {
    if (isFunctionalTeam) {
        return 'FT' + functionalTaskIdCounter.toString().padStart(2, '0');
    } else {
        return 'TT' + technicalTaskIdCounter.toString().padStart(2, '0');
    }
}

function addRowToTable(table, form) {
    const newRow = table.insertRow();
    const formData = new FormData(form);
    const formElements = Array.from(form.elements);

    // Generate task ID
    const taskIdInput = formElements.find(input => input.name === 'taskId');
    taskIdInput.value = getNextTaskId(form.id === 'functionalForm');
    
    if (form.id === 'functionalForm') {
        functionalTaskIdCounter++;
    } else {
        technicalTaskIdCounter++;
    }

    formElements.forEach((input, index) => {
        if (input.type !== 'hidden' && input.type !== 'file') {
            const newCell = newRow.insertCell(index);
            newCell.textContent = input.value;
        } else if (input.type === 'file') {
            const file = input.files[0];
            if (file) {
                const fileCell = newRow.insertCell(index);
                const fileLink = document.createElement('a');
                fileLink.href = URL.createObjectURL(file);
                fileLink.textContent = file.name;
                fileLink.download = file.name;
                fileCell.appendChild(fileLink);
                fileCell.dataset.fileName = file.name;
            }
        }
    });

    // Add Edit button
    const actionsCell = newRow.insertCell(formElements.length);
    const editButton = document.createElement('button');
    editButton.textContent = 'Edit';
    editButton.className = 'edit';
    editButton.addEventListener('click', () => editRow(newRow));
    actionsCell.appendChild(editButton);

    form.reset();

    // If adding to technical team, populate Functional Team Task ID dropdown again
    if (form.id === 'technicalForm') {
        populateFunctionalTaskIdDropdown();
    }
}

function editRow(row) {
    const cells = row.cells;
    const formElements = [];

    for (let i = 0; i < cells.length - 1; i++) {
        const cell = cells[i];
        const input = document.createElement('input');
        input.value = cell.dataset.fileName || cell.textContent.trim(); // Restore file name or text content
        if (cell.dataset.fileName) {
            input.type = 'file';
            input.dataset.previousFile = cell.dataset.fileName;
        }
        cell.innerHTML = '';
        cell.appendChild(input);
        formElements.push(input);
    }

    // Replace Edit button with Save button
    const actionsCell = cells[cells.length - 1];
    actionsCell.innerHTML = '';
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save';
    saveButton.className = 'save';
    saveButton.addEventListener('click', () => saveRow(row, formElements));
    actionsCell.appendChild(saveButton);
}

function saveRow(row, formElements) {
    const cells = row.cells;

    formElements.forEach((input, index) => {
        const cell = cells[index];
        if (input.type === 'file') {
            // Handle file input
            if (input.files.length > 0) {
                const file = input.files[0];
                const fileLink = document.createElement('a');
                fileLink.href = URL.createObjectURL(file);
                fileLink.textContent = file.name;
                fileLink.download = file.name;
                cell.innerHTML = '';
                cell.appendChild(fileLink);
                cell.dataset.fileName = file.name;
            } else {
                // Keep previous file if no new file selected
                if (input.dataset.previousFile) {
                    const fileLink = document.createElement('a');
                    fileLink.href = '#'; // Dummy href
                    fileLink.textContent = input.dataset.previousFile;
                    fileLink.download = input.dataset.previousFile;
                    cell.innerHTML = '';
                    cell.appendChild(fileLink);
                    cell.dataset.fileName = input.dataset.previousFile;
                } else {
                    // No file provided
                    cell.textContent = '';
                    delete cell.dataset.fileName;
                }
            }
        } else {
            // Handle text input
            cell.textContent = input.value;
        }
    });

    // Replace Save button with Edit button
    const actionsCell = cells[cells.length - 1];
    actionsCell.innerHTML = '';
    const editButton = document.createElement('button');
    editButton.textContent = 'Edit';
    editButton.className = 'edit';
    editButton.addEventListener('click', () => editRow(row));
    actionsCell.appendChild(editButton);
}

function populateFunctionalTaskIdDropdown() {
    const functionalTable = document.getElementById('functionalTable');
    const functionalTaskIds = [];

    // Skip header row, start from index 1
    for (let i = 1; i < functionalTable.rows.length; i++) {
        const taskId = functionalTable.rows[i].cells[0].textContent.trim(); // Assuming first cell is Task ID
        functionalTaskIds.push(taskId);
    }

    const technicalForm = document.getElementById('technicalForm');
    const functionalTaskIdSelect = technicalForm.querySelector('select[name="functionalTaskId"]');
    functionalTaskIdSelect.innerHTML = '';

    functionalTaskIds.forEach(taskId => {
        const option = document.createElement('option');
        option.value = taskId;
        option.textContent = taskId;
        functionalTaskIdSelect.appendChild(option);
    });
}
