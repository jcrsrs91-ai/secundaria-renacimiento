const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'pos.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error al conectar con SQLite:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite.');
        db.serialize(() => {
            // Tabla de productos
            db.run(`CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                barcode TEXT UNIQUE,
                cost REAL NOT NULL,
                margin REAL NOT NULL,
                price REAL NOT NULL,
                stock INTEGER NOT NULL DEFAULT 0,
                image_base64 TEXT,
                wholesale_min_qty INTEGER DEFAULT 0,
                wholesale_price REAL DEFAULT 0,
                is_favorite INTEGER DEFAULT 0
            )`);

            // Tabla de kits
            db.run(`CREATE TABLE IF NOT EXISTS kits (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                barcode TEXT UNIQUE,
                price REAL NOT NULL
            )`);

            // Tabla de items de kits
            db.run(`CREATE TABLE IF NOT EXISTS kit_items (
                kit_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL,
                FOREIGN KEY (kit_id) REFERENCES kits (id),
                FOREIGN KEY (product_id) REFERENCES products (id)
            )`);

            // Tabla de ventas
            db.run(`CREATE TABLE IF NOT EXISTS sales (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                total REAL NOT NULL
            )`);

            // Tabla de detalle de ventas
            db.run(`CREATE TABLE IF NOT EXISTS sale_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sale_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL,
                price REAL NOT NULL,
                cost REAL NOT NULL DEFAULT 0,
                item_name TEXT,
                FOREIGN KEY (sale_id) REFERENCES sales (id),
                FOREIGN KEY (product_id) REFERENCES products (id)
            )`);
        });
    }
});

module.exports = db;
