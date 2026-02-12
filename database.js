const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const DB_PATH = path.join(__dirname, 'blocks.db');

// Initialize database
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

// Create tables if they don't exist
function initializeDatabase() {
    const createTableSQL = `
    CREATE TABLE IF NOT EXISTS blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      material TEXT NOT NULL,
      height REAL NOT NULL,
      width REAL NOT NULL,
      length REAL NOT NULL,
      photo_front TEXT,
      photo_back TEXT,
      photo_left TEXT,
      photo_right TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

    db.run(createTableSQL, (err) => {
        if (err) {
            console.error('Error creating table:', err.message);
        } else {
            console.log('Blocks table ready');
        }
    });
}

// Create a new block
function createBlock(blockData) {
    return new Promise((resolve, reject) => {
        const { code, material, height, width, length, photo_front, photo_back, photo_left, photo_right } = blockData;

        const sql = `
      INSERT INTO blocks (code, material, height, width, length, photo_front, photo_back, photo_left, photo_right)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

        db.run(sql, [code, material, height, width, length, photo_front, photo_back, photo_left, photo_right], function (err) {
            if (err) {
                reject(err);
            } else {
                resolve({ id: this.lastID, ...blockData });
            }
        });
    });
}

// Get all blocks
function getAllBlocks() {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM blocks ORDER BY created_at DESC';

        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// Get a single block by ID
function getBlockById(id) {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM blocks WHERE id = ?';

        db.get(sql, [id], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

// Update a block
function updateBlock(id, blockData) {
    return new Promise((resolve, reject) => {
        const { code, material, height, width, length, photo_front, photo_back, photo_left, photo_right } = blockData;

        const sql = `
      UPDATE blocks 
      SET code = ?, material = ?, height = ?, width = ?, length = ?, 
          photo_front = ?, photo_back = ?, photo_left = ?, photo_right = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

        db.run(sql, [code, material, height, width, length, photo_front, photo_back, photo_left, photo_right, id], function (err) {
            if (err) {
                reject(err);
            } else {
                resolve({ id, changes: this.changes });
            }
        });
    });
}

// Delete a block
function deleteBlock(id) {
    return new Promise((resolve, reject) => {
        const sql = 'DELETE FROM blocks WHERE id = ?';

        db.run(sql, [id], function (err) {
            if (err) {
                reject(err);
            } else {
                resolve({ id, changes: this.changes });
            }
        });
    });
}

// Search blocks by code or material
function searchBlocks(query) {
    return new Promise((resolve, reject) => {
        const sql = `
      SELECT * FROM blocks 
      WHERE code LIKE ? OR material LIKE ?
      ORDER BY created_at DESC
    `;
        const searchPattern = `%${query}%`;

        db.all(sql, [searchPattern, searchPattern], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

module.exports = {
    createBlock,
    getAllBlocks,
    getBlockById,
    updateBlock,
    deleteBlock,
    searchBlocks
};
