const db = require('./backend/database.js');

db.serialize(() => {
    try {
        db.run("ALTER TABLE products ADD COLUMN package_qty INTEGER DEFAULT 0;");
        db.run("ALTER TABLE products ADD COLUMN package_price REAL DEFAULT 0;");
        db.run("ALTER TABLE products ADD COLUMN package_barcode TEXT;");
        console.log("Migration successful");
    } catch(e) {
        console.error("Migration failed:", e);
    }
});
