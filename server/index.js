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
    contentSecurityPolicy: false, // Disabled for simplicity during dev/prod transition to avoid breaking inline scripts/images
}));
app.use(compression());
app.use(morgan('combined')); // Logging

// Increase limit for Base64 attachments
app.use(bodyParser.json({ limit: '50mb' }));
app.use(cors());

// Serve Uploads Static Directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Helper: Save Base64 Attachments to Disk
function saveAttachments(attachments) {
    if (!attachments || !Array.isArray(attachments)) return [];

    return attachments.map(file => {
        // If it's already a URL (previously saved) or not base64, skip
        if (!file.url || !file.url.startsWith('data:')) {
            return file;
        }

        try {
            // "data:application/pdf;base64,JVBERi0xLj..."
            const matches = file.url.match(/^data:(.+);base64,(.+)$/);
            if (!matches) return file;

            const ext = file.name.split('.').pop();
            const timestamp = Date.now();
            // Create a safe unique filename: 123456789_clean-file-name.pdf
            const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const fileName = `${timestamp}_${safeName}`;
            const filePath = path.join(__dirname, 'uploads', fileName);
            const buffer = Buffer.from(matches[2], 'base64');

            fs.writeFileSync(filePath, buffer);

            // Return file object with updated URL pointing to server
            // Use relative path if serving from same domain, or absolute if needed.
            // For flexibility, let's keep full URL but if we are on same domain, relative is better.
            // But client expects full URL usually. We can construct it.
            // Actually, best to store relative path /uploads/... in DB or formatted.
            // But here we return what UI expects.
            return {
                ...file,
                url: `/uploads/${fileName}`, // Relative path is safer for prod if served from same origin
                savedToDisk: true
            };
        } catch (err) {
            console.error("Error saving file:", err);
            return file; // Return original on error to not lose data
        }
    });
}

// --- API ROUTES ---

// GET All Documents
app.get('/api/documents', (req, res) => {
    const sql = "SELECT * FROM documents ORDER BY createdAt DESC";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        // Parse attachments JSON string back to object
        const documents = rows.map(doc => ({
            ...doc,
            attachments: doc.attachments ? JSON.parse(doc.attachments) : []
        }));
        res.json({
            "message": "success",
            "data": documents
        });
    });
});

// POST Create Document
app.post('/api/documents', (req, res) => {
    const {
        id, registrationDate, type, docNumber, docDate,
        origin, destination, summary, observations, status,
        fileName, attachments
    } = req.body;

    const createdAt = new Date().toISOString();

    // Process attachments to save files to disk
    const processedAttachments = saveAttachments(attachments);
    const attachmentsJson = JSON.stringify(processedAttachments || []);

    const sql = `INSERT INTO documents (
        id, registrationDate, type, docNumber, docDate, 
        origin, destination, summary, observations, status, 
        fileName, attachments, createdAt
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`;

    const params = [
        id, registrationDate, type, docNumber, docDate,
        origin, destination, summary, observations, status,
        fileName, attachmentsJson, createdAt
    ];

    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": { ...req.body, attachments: processedAttachments },
            "id": this.lastID
        });
    });
});

// PUT Update Document
app.put('/api/documents/:id', (req, res) => {
    const {
        registrationDate, type, docNumber, docDate,
        origin, destination, summary, observations, status,
        fileName, attachments
    } = req.body;

    // Process attachments to save new files to disk
    const processedAttachments = saveAttachments(attachments);
    const attachmentsJson = JSON.stringify(processedAttachments || []);

    const sql = `UPDATE documents SET 
        registrationDate = ?, 
        type = ?, 
        docNumber = ?, 
        docDate = ?, 
        origin = ?, 
        destination = ?, 
        summary = ?, 
        observations = ?, 
        status = ?, 
        fileName = ?, 
        attachments = ?
        WHERE id = ?`;

    const params = [
        registrationDate, type, docNumber, docDate,
        origin, destination, summary, observations, status,
        fileName, attachmentsJson, req.params.id
    ];

    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": { ...req.body, attachments: processedAttachments },
            "changes": this.changes
        });
    });
});

// DELETE Document
app.delete('/api/documents/:id', (req, res) => {
    // Optionally: delete files from disk. 
    // fetch doc first -> iterate attachments -> fs.unlink

    db.run(
        'DELETE FROM documents WHERE id = ?',
        req.params.id,
        function (err) {
            if (err) {
                res.status(400).json({ "error": res.message });
                return;
            }
            res.json({ "message": "deleted", changes: this.changes });
        }
    );
});

// --- ENTITY ROUTES ---

// GET All Departments
app.get('/api/departments', (req, res) => {
    db.all("SELECT name FROM departments ORDER BY name ASC", [], (err, rows) => {
        if (err) return res.status(400).json({ "error": err.message });
        res.json({ "message": "success", "data": rows.map(r => r.name) });
    });
});

// POST New Department
app.post('/api/departments', (req, res) => {
    const { name } = req.body;
    db.run("INSERT INTO departments (name) VALUES (?)", [name], function (err) {
        if (err) return res.status(400).json({ "error": err.message });
        res.json({ "message": "success", "name": name });
    });
});

// GET All External Entities
app.get('/api/external-entities', (req, res) => {
    db.all("SELECT name FROM external_entities ORDER BY name ASC", [], (err, rows) => {
        if (err) return res.status(400).json({ "error": err.message });
        res.json({ "message": "success", "data": rows.map(r => r.name) });
    });
});

// POST New External Entity
app.post('/api/external-entities', (req, res) => {
    const { name } = req.body;
    db.run("INSERT INTO external_entities (name) VALUES (?)", [name], function (err) {
        if (err) return res.status(400).json({ "error": err.message });
        res.json({ "message": "success", "name": name });
    });
});

// --- USER MANAGEMENT ROUTES ---

// GET All Users
app.get('/api/users', (req, res) => {
    db.all("SELECT username, role, name FROM users ORDER BY username ASC", [], (err, rows) => {
        if (err) return res.status(400).json({ "error": err.message });
        res.json({ "message": "success", "data": rows });
    });
});

// UPDATE User Password
app.put('/api/users/:username', (req, res) => {
    const { password } = req.body;
    db.run(
        'UPDATE users SET password = ? WHERE username = ?',
        [password, req.params.username],
        function (err) {
            if (err) {
                res.status(400).json({ "error": err.message });
                return;
            }
            res.json({
                "message": "success",
                "changes": this.changes
            });
        }
    );
});

// LOGIN
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const sql = "SELECT * FROM users WHERE username = ? AND password = ?";
    db.get(sql, [username, password], (err, row) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
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
    });
});

// --- CLIENT SERVING ---
// Serve React Static Files
// Assumes 'dist' is in the project root found at '../dist' relative to server/
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));

    // Handle React Routing, return all requests to React app
    app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
} else {
    // Dev fallback text if no build
    app.get('/', (req, res) => {
        res.send('API Server Running. Run `npm run build` in root to generate frontend.');
    });
}


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
