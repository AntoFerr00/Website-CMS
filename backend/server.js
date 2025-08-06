// --- Node.js Backend (server.js) ---
// This server uses Express to handle API requests and SQLite for the database.
// To run this:
// 1. Make sure you have Node.js installed.
// 2. Create a folder for your backend.
// 3. Save this file as `server.js` inside that folder.
// 4. Run `npm init -y` in your terminal in that folder.
// 5. Run `npm install express sqlite3 sqlite jsonwebtoken bcryptjs cors`
// 6. Run `node server.js` to start the server.

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
const PORT = 3001; // Port for the backend server
const JWT_SECRET = 'your_super_secret_key_change_this'; // IMPORTANT: Use a strong, unique secret

// --- Middleware ---
app.use(cors()); // Enable Cross-Origin Resource Sharing for your React app
app.use(express.json()); // Allow the server to parse JSON request bodies

// --- Database Setup ---
const db = new sqlite3.Database('./cms.db', (err) => {
    if (err) {
        console.error("Error opening database", err.message);
    } else {
        console.log("Connected to the SQLite database.");
        // Create tables if they don't exist
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS pages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT,
                userId INTEGER NOT NULL,
                FOREIGN KEY (userId) REFERENCES users(id)
            )`);
        });
    }
});

// --- Authentication Middleware ---
// This function will be used to protect routes that require a logged-in user.
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) {
        return res.sendStatus(401); // Unauthorized if no token
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403); // Forbidden if token is invalid
        }
        req.user = user; // Add the user payload to the request object
        next();
    });
};


// --- API Routes ---

// 1. User Registration
app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = `INSERT INTO users (email, password) VALUES (?, ?)`;
        
        db.run(sql, [email, hashedPassword], function(err) {
            if (err) {
                // Check for unique constraint violation (email already exists)
                if (err.code === 'SQLITE_CONSTRAINT') {
                    return res.status(409).json({ message: "Email already in use." });
                }
                return res.status(500).json({ message: "Database error during registration." });
            }
            res.status(201).json({ message: "User created successfully.", userId: this.lastID });
        });
    } catch (error) {
        res.status(500).json({ message: "Server error during registration." });
    }
});

// 2. User Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
    }

    const sql = `SELECT * FROM users WHERE email = ?`;
    db.get(sql, [email], async (err, user) => {
        if (err) {
            return res.status(500).json({ message: "Database error during login." });
        }
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        // User is valid, create a JWT
        const accessToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ accessToken });
    });
});

// --- Page Management Routes (Protected) ---

// Get all pages for the logged-in user
app.get('/api/pages', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const sql = `SELECT id, title, content FROM pages WHERE userId = ?`;

    db.all(sql, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: "Could not retrieve pages." });
        }
        res.json(rows);
    });
});

// Create a new page
app.post('/api/pages', authenticateToken, (req, res) => {
    const { title, content } = req.body;
    const userId = req.user.id;

    if (!title) {
        return res.status(400).json({ message: "Title is required." });
    }

    const sql = `INSERT INTO pages (title, content, userId) VALUES (?, ?, ?)`;
    db.run(sql, [title, content || '', userId], function(err) {
        if (err) {
            return res.status(500).json({ message: "Could not create page." });
        }
        res.status(201).json({ id: this.lastID, title, content, userId });
    });
});

// Update an existing page
app.put('/api/pages/:id', authenticateToken, (req, res) => {
    const { title, content } = req.body;
    const pageId = req.params.id;
    const userId = req.user.id;

    if (!title) {
        return res.status(400).json({ message: "Title is required." });
    }

    // Ensure the user owns the page they are trying to update
    const sql = `UPDATE pages SET title = ?, content = ? WHERE id = ? AND userId = ?`;
    db.run(sql, [title, content, pageId, userId], function(err) {
        if (err) {
            return res.status(500).json({ message: "Could not update page." });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: "Page not found or you don't have permission to edit it." });
        }
        res.json({ message: "Page updated successfully." });
    });
});

// Delete a page
app.delete('/api/pages/:id', authenticateToken, (req, res) => {
    const pageId = req.params.id;
    const userId = req.user.id;

    // Ensure the user owns the page they are trying to delete
    const sql = `DELETE FROM pages WHERE id = ? AND userId = ?`;
    db.run(sql, [pageId, userId], function(err) {
        if (err) {
            return res.status(500).json({ message: "Could not delete page." });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: "Page not found or you don't have permission to delete it." });
        }
        res.status(204).send(); // No Content
    });
});


// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});
