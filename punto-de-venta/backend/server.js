require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar Express
app.use(cors());
// Aumentar el límite para soportar imágenes en Base64
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Servir frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// ==========================================
// SSE (Server-Sent Events) REAL-TIME SYNC
// ==========================================
let sseClients = [];

app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    
    sseClients.push(res);
    
    req.on('close', () => {
        sseClients = sseClients.filter(client => client !== res);
    });
});

const broadcastEvent = (type, payload = {}) => {
    const data = JSON.stringify({ type, ...payload });
    sseClients.forEach(client => client.write(`data: ${data}\n\n`));
};

// ==========================================
// RUTAS DE PRODUCTOS
// ==========================================

// Obtener todos los productos
app.get('/api/products', (req, res) => {
    const query = req.query.search ? `%${req.query.search}%` : '%';
    const sql = `SELECT * FROM products WHERE name LIKE ? OR barcode LIKE ? ORDER BY name ASC`;
    db.all(sql, [query, query], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Obtener un producto por código de barras
app.get('/api/products/barcode/:barcode', (req, res) => {
    const sql = `SELECT * FROM products WHERE barcode = ?`;
    db.get(sql, [req.params.barcode], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "Producto no encontrado" });
        res.json(row);
    });
});

// Crear producto
app.post('/api/products', (req, res) => {
    const { name, barcode, cost, margin, price, stock, image_base64, wholesale_min_qty, wholesale_price, is_favorite } = req.body;
    const sql = `INSERT INTO products (name, barcode, cost, margin, price, stock, image_base64, wholesale_min_qty, wholesale_price, is_favorite) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [name, barcode || null, cost, margin, price, stock, image_base64 || null, wholesale_min_qty || 0, wholesale_price || 0, is_favorite ? 1 : 0], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: "El código de barras ya existe." });
            }
            return res.status(500).json({ error: err.message });
        }
        broadcastEvent('products_updated');
        res.json({ id: this.lastID, message: 'Producto creado exitosamente' });
    });
});

// Actualizar producto
app.put('/api/products/:id', (req, res) => {
    const { name, barcode, cost, margin, price, stock, image_base64, wholesale_min_qty, wholesale_price, is_favorite } = req.body;
    const sql = `UPDATE products SET name = ?, barcode = ?, cost = ?, margin = ?, price = ?, stock = ?, image_base64 = ?, wholesale_min_qty = ?, wholesale_price = ?, is_favorite = ? WHERE id = ?`;
    db.run(sql, [name, barcode || null, cost, margin, price, stock, image_base64 || null, wholesale_min_qty || 0, wholesale_price || 0, is_favorite ? 1 : 0, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        broadcastEvent('products_updated');
        res.json({ message: 'Producto actualizado' });
    });
});

// Eliminar producto
app.delete('/api/products/:id', (req, res) => {
    const sql = `DELETE FROM products WHERE id = ?`;
    db.run(sql, [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        broadcastEvent('products_updated');
        res.json({ message: 'Producto eliminado' });
    });
});

// ==========================================
// RUTAS DE VENTAS
// ==========================================

// Registrar una venta
app.post('/api/sales', (req, res) => {
    const { items, total } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ error: 'La venta no tiene artículos.' });

    const date = new Date().toISOString();
    
    db.serialize(() => {
        db.run(`INSERT INTO sales (date, total) VALUES (?, ?)`, [date, total], function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            const saleId = this.lastID;
            let stmt = db.prepare(`INSERT INTO sale_items (sale_id, product_id, quantity, price, cost, item_name) VALUES (?, ?, ?, ?, ?, ?)`);
            let updateStockStmt = db.prepare(`UPDATE products SET stock = stock - ? WHERE id = ?`);
            
            items.forEach(item => {
                const productCost = item.cost || 0;
                stmt.run(saleId, item.id, item.quantity, item.price, productCost, item.name);
                // Si el ID no es de venta rápida (empieza con qs_), actualizamos stock
                if (!String(item.id).startsWith('qs_')) {
                    updateStockStmt.run(item.quantity, item.id);
                }
            });
            
            stmt.finalize();
            updateStockStmt.finalize();
            
            broadcastEvent('sales_updated');
            res.json({ message: 'Venta registrada exitosamente', saleId });
        });
    });
});

// Obtener ventas del día (Corte de caja)
app.get('/api/sales/today', (req, res) => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Calcular totales uniendo sales y sale_items para obtener el costo
    const sql = `
        SELECT s.id, s.date, s.total, SUM(si.cost * si.quantity) as total_cost
        FROM sales s
        LEFT JOIN sale_items si ON s.id = si.sale_id
        WHERE s.date LIKE ?
        GROUP BY s.id
    `;
    db.all(sql, [`${today}%`], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const total = rows.reduce((acc, curr) => acc + curr.total, 0);
        const total_cost = rows.reduce((acc, curr) => acc + (curr.total_cost || 0), 0);
        res.json({ sales: rows, total, total_cost });
    });
});

// Obtener reporte histórico por rango de fechas
app.get('/api/sales/report', (req, res) => {
    const { start, end } = req.query;
    if (!start || !end) return res.status(400).json({ error: 'Faltan fechas start y end' });

    // date formato: YYYY-MM-DDTHH:mm:ss.sssZ
    // start será YYYY-MM-DD, end será YYYY-MM-DD. 
    // Para incluir todo el día end, buscamos hasta end + 'T23:59:59'
    const endOfDay = end + 'T23:59:59.999Z';

    const sql = `
        SELECT s.id, s.date, s.total, SUM(si.cost * si.quantity) as total_cost
        FROM sales s
        LEFT JOIN sale_items si ON s.id = si.sale_id
        WHERE s.date >= ? AND s.date <= ?
        GROUP BY s.id
        ORDER BY s.date DESC
    `;
    
    db.all(sql, [start, endOfDay], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const total = rows.reduce((acc, curr) => acc + curr.total, 0);
        const total_cost = rows.reduce((acc, curr) => acc + (curr.total_cost || 0), 0);
        res.json({ sales: rows, total, total_cost });
    });
});

// Obtener detalle de una venta específica (ticket)
app.get('/api/sales/:id', (req, res) => {
    const saleId = req.params.id;
    
    // Convert to number or valid check if needed
    const saleSql = 'SELECT * FROM sales WHERE id = ?';
    db.get(saleSql, [saleId], (err, sale) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!sale) return res.status(404).json({ error: 'Venta no encontrada' });
        
        const itemsSql = `
            SELECT si.*, COALESCE(si.item_name, p.name) as name, p.barcode 
            FROM sale_items si
            LEFT JOIN products p ON si.product_id = p.id
            WHERE si.sale_id = ?
        `;
        db.all(itemsSql, [saleId], (err, items) => {
            if (err) return res.status(500).json({ error: err.message });
            sale.items = items;
            res.json(sale);
        });
    });
});

// ==========================================
// RUTAS DE KITS
// ==========================================
app.get('/api/kits', (req, res) => {
    db.all(`SELECT * FROM kits ORDER BY name ASC`, [], (err, kits) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Cargar items para cada kit
        let kitsProcessed = 0;
        if (kits.length === 0) return res.json([]);
        
        kits.forEach(kit => {
            db.all(`
                SELECT ki.quantity, p.* 
                FROM kit_items ki 
                JOIN products p ON ki.product_id = p.id 
                WHERE ki.kit_id = ?`, [kit.id], (err, items) => {
                
                kit.items = items || [];
                kitsProcessed++;
                
                if (kitsProcessed === kits.length) {
                    res.json(kits);
                }
            });
        });
    });
});

app.post('/api/kits', (req, res) => {
    const { name, barcode, price, items } = req.body;
    db.run(`INSERT INTO kits (name, barcode, price) VALUES (?, ?, ?)`, [name, barcode || null, price], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        const kitId = this.lastID;
        const stmt = db.prepare(`INSERT INTO kit_items (kit_id, product_id, quantity) VALUES (?, ?, ?)`);
        
        items.forEach(item => {
            stmt.run([kitId, item.product_id, item.quantity]);
        });
        
        stmt.finalize();
        res.json({ id: kitId, message: 'Kit creado' });
    });
});

// ==========================================
// RUTAS DE INTELIGENCIA ARTIFICIAL
// ==========================================
app.post('/api/recognize-product', async (req, res) => {
    try {
        const { imageBase64 } = req.body;
        if (!imageBase64) return res.status(400).json({ error: 'Falta la imagen' });
        
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'API Key de Gemini no configurada en el servidor' });

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-flash-latest",
            generationConfig: { responseMimeType: "application/json" }
        });

        // Remover prefijo 'data:image/jpeg;base64,' si existe
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

        const prompt = `Analiza esta imagen y extrae la siguiente información en formato JSON:
1. "name": El nombre corto y genérico del producto (ej: 'Cuaderno Profesional Scribe 100 Hojas'). Si es imposible identificarlo, pon "Producto desconocido".
2. "barcode": El número del código de barras si es legible en la imagen. Si no se ve claramente el número del código de barras, pon un string vacío "".`;

        const image = {
            inlineData: {
                data: base64Data,
                mimeType: "image/jpeg"
            }
        };

        const result = await model.generateContent([prompt, image]);
        const response = await result.response;
        let data = {};
        try {
            let rawText = response.text().trim();
            if (rawText.startsWith('```json')) {
                rawText = rawText.replace(/^```json\n/, '').replace(/\n```$/, '');
            }
            if (rawText.startsWith('```')) {
                rawText = rawText.replace(/^```\n/, '').replace(/\n```$/, '');
            }
            data = JSON.parse(rawText);
        } catch(e) {
            console.error("Error parseando JSON de Gemini:", e);
            data = { name: "Producto desconocido", barcode: "" };
        }

        res.json(data);
    } catch (error) {
        console.error("Error en Gemini:", error);
        res.status(500).json({ error: 'Error al analizar la imagen con IA' });
    }
});

// Endpoint para extraer SOLO el código de barras con IA (Fallback)
app.post('/api/ai/read-barcode', async (req, res) => {
    try {
        const { imageBase64 } = req.body;
        if (!imageBase64) return res.status(400).json({ error: 'Falta la imagen' });
        
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'API Key de Gemini no configurada en el servidor' });

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const prompt = "Extrae únicamente el número del código de barras visible en esta imagen. Responde SOLAMENTE con los números. Si no ves ningún código de barras claro, responde 'No encontrado'.";

        const image = {
            inlineData: { data: base64Data, mimeType: "image/jpeg" }
        };

        const result = await model.generateContent([prompt, image]);
        const response = await result.response;
        const text = response.text().trim();

        if (text === 'No encontrado' || text.includes('No encontrado')) {
            res.status(404).json({ error: 'No se encontró código de barras' });
        } else {
            // Remove any non-numeric characters just in case
            const numericBarcode = text.replace(/[^0-9A-Za-z-]/g, '');
            res.json({ barcode: numericBarcode });
        }
    } catch (error) {
        console.error("Error en Gemini Barcode:", error);
        res.status(500).json({ error: 'Error al leer código de barras con IA' });
    }
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log('Accesible en tu red local usando tu dirección IP.');
});
