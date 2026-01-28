import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import db from './db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Performance Middleware
app.use(helmet({
    contentSecurityPolicy: false,
}));
app.use(compression());
app.use(morgan('combined'));

// Increase limit for Base64 attachments
app.use(bodyParser.json({ limit: '50mb' }));
app.use(cors());

// Serve Uploads Static Directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Helper: Save Base64 Attachments to Disk
function saveAttachments(attachments) {
    if (!attachments || !Array.isArray(attachments)) return [];

    return attachments.map(file => {
        if (!file.url || !file.url.startsWith('data:')) {
            return file;
        }

        try {
            const matches = file.url.match(/^data:(.+);base64,(.+)$/);
            if (!matches) return file;

            const timestamp = Date.now();
            const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const fileName = `${timestamp}_${safeName}`;
            const filePath = path.join(__dirname, 'uploads', fileName);
            const buffer = Buffer.from(matches[2], 'base64');

            fs.writeFileSync(filePath, buffer);

            return {
                ...file,
                url: `/uploads/${fileName}`,
                savedToDisk: true
            };
        } catch (err) {
            console.error("Error saving file:", err);
            return file;
        }
    });
}

// --- API ROUTES ---

// GET All Documents
app.get('/api/documents', async (req, res) => {
    try {
        // Quoting mixed-case column names is required in certain PG configurations if created that way
        const result = await db.query('SELECT * FROM documents ORDER BY "createdAt" DESC');

        const documents = result.rows.map(doc => ({
            ...doc,
            attachments: doc.attachments ? JSON.parse(doc.attachments) : []
        }));
        res.json({
            "message": "success",
            "data": documents
        });
    } catch (err) {
        console.error(err);
        res.status(400).json({ "error": err.message });
    }
});

// POST Create Document
app.post('/api/documents', async (req, res) => {
    const {
        id, registrationDate, type, docNumber, docDate,
        origin, destination, summary, observations, status,
        fileName, attachments
    } = req.body;

    const createdAt = new Date().toISOString();

    const processedAttachments = saveAttachments(attachments);
    const attachmentsJson = JSON.stringify(processedAttachments || []);

    const sql = `INSERT INTO documents (
        id, "registrationDate", type, "docNumber", "docDate", 
        origin, destination, summary, observations, status, 
        "fileName", attachments, "createdAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`;

    const params = [
        id, registrationDate, type, docNumber, docDate,
        origin, destination, summary, observations, status,
        fileName, attachmentsJson, createdAt
    ];

    try {
        const result = await db.query(sql, params);
        res.json({
            "message": "success",
            "data": { ...req.body, attachments: processedAttachments },
            "id": result.rows[0].id
        });
    } catch (err) {
        console.error(err);
        res.status(400).json({ "error": err.message });
    }
});

// PUT Update Document
app.put('/api/documents/:id', async (req, res) => {
    const {
        registrationDate, type, docNumber, docDate,
        origin, destination, summary, observations, status,
        fileName, attachments
    } = req.body;

    const processedAttachments = saveAttachments(attachments);
    const attachmentsJson = JSON.stringify(processedAttachments || []);

    const sql = `UPDATE documents SET 
        "registrationDate" = $1, 
        type = $2, 
        "docNumber" = $3, 
        "docDate" = $4, 
        origin = $5, 
        destination = $6, 
        summary = $7, 
        observations = $8, 
        status = $9, 
        "fileName" = $10, 
        attachments = $11
        WHERE id = $12`;

    const params = [
        registrationDate, type, docNumber, docDate,
        origin, destination, summary, observations, status,
        fileName, attachmentsJson, req.params.id
    ];

    try {
        const result = await db.query(sql, params);
        res.json({
            "message": "success",
            "data": { ...req.body, attachments: processedAttachments },
            "changes": result.rowCount
        });
    } catch (err) {
        console.error(err);
        res.status(400).json({ "error": err.message });
    }
});

// DELETE Document
app.delete('/api/documents/:id', async (req, res) => {
    try {
        const result = await db.query('DELETE FROM documents WHERE id = $1', [req.params.id]);
        res.json({ "message": "deleted", changes: result.rowCount });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// --- ENTITY ROUTES ---
// Departments
app.get('/api/departments', async (req, res) => {
    try {
        const result = await db.query("SELECT name FROM departments ORDER BY name ASC");
        res.json({ "message": "success", "data": result.rows.map(r => r.name) });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

app.post('/api/departments', async (req, res) => {
    const { name } = req.body;
    try {
        await db.query("INSERT INTO departments (name) VALUES ($1)", [name]);
        res.json({ "message": "success", "name": name });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// External Entities
app.get('/api/external-entities', async (req, res) => {
    try {
        const result = await db.query("SELECT name FROM external_entities ORDER BY name ASC");
        res.json({ "message": "success", "data": result.rows.map(r => r.name) });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

app.post('/api/external-entities', async (req, res) => {
    const { name } = req.body;
    try {
        await db.query("INSERT INTO external_entities (name) VALUES ($1)", [name]);
        res.json({ "message": "success", "name": name });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// --- USER MANAGEMENT ROUTES ---

app.get('/api/users', async (req, res) => {
    try {
        const result = await db.query("SELECT username, role, name FROM users ORDER BY username ASC");
        res.json({ "message": "success", "data": result.rows });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

app.put('/api/users/:username', async (req, res) => {
    const { password } = req.body;
    try {
        const result = await db.query('UPDATE users SET password = $1 WHERE username = $2', [password, req.params.username]);
        res.json({ "message": "success", "changes": result.rowCount });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    console.log(`Login attempt for: ${username}`);
    try {
        const result = await db.query("SELECT * FROM users WHERE username = $1 AND password = $2", [username, password]);
        const row = result.rows[0];
        if (row) {
            res.json({
                "message": "success",
                "user": {
                    username: row.username,
                    role: row.role,
                    name: row.name
                }
            });
        } else {
            res.status(401).json({ "message": "Invalid credentials" });
        }
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// --- CLIENT SERVING ---
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
} else {
    app.get('/', (req, res) => {
        res.send('API Server Running. Run `npm run build` in root to generate frontend.');
    });
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
