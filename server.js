const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());
app.use(express.static(__dirname + "/public/"));

const uploadsDirectory = path.join(__dirname, 'uploads');
const tasksFilePath = path.join(__dirname, 'tasks.json');

if (!fs.existsSync(uploadsDirectory)) {
    fs.mkdirSync(uploadsDirectory);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDirectory);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileName = `${uniqueSuffix}_${file.originalname}`;
        cb(null, fileName);
    }
});
const upload = multer({ storage });

let tasks = [];
try {
    const data = fs.readFileSync(tasksFilePath, 'utf8');
    tasks = JSON.parse(data);
} catch (err) {
    console.error('Error reading tasks file:', err);
}

function saveTasksToFile() {
    fs.writeFileSync(tasksFilePath, JSON.stringify(tasks, null, 2), 'utf8');
    console.log('Tasks saved to file.');
}

app.get('/api/tasks', (req, res) => {
    res.json(tasks);
});

app.post('/api/tasks', upload.single('taskDocumentation'), (req, res) => {
    console.log('Received task upload request:', req.file, req.body);

    if (!req.body.taskId || !req.body.project || !req.body.taskName) {
        return res.status(400).send('Missing required fields');
    }

    const task = {
        taskId: req.body.taskId,
        project: req.body.project,
        taskName: req.body.taskName,
        taskDescription: req.body.taskDescription,
        taskDocumentationName: req.file ? req.file.filename : null,
        taskDocumentationKey: req.file ? req.file.filename : null,
        responsiblePerson: req.body.responsiblePerson,
        internalDeadline: req.body.internalDeadline,
        userDeadline: req.body.userDeadline,
        functionalTaskId: req.body.functionalTaskId,
        estimateDeadline: req.body.estimateDeadline
    };

    tasks.push(task);
    saveTasksToFile();

    res.status(201).json(task);
});

app.get('/api/download/:fileKey', (req, res) => {
    const fileKey = req.params.fileKey;
    const filePath = path.join(uploadsDirectory, fileKey);

    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).send('File not found');
    }
});

app.delete('/api/tasks/:taskId', (req, res) => {
    const taskId = req.params.taskId;
    tasks = tasks.filter(task => task.taskId !== taskId);
    saveTasksToFile();
    res.status(204).send();
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
//UPDATED