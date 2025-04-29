// Import required libraries
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

// Initialize express app
const app = express();
app.use(cors());
app.use(express.json()); // To parse JSON bodies

// Create MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // if you have a password for MySQL, put it here
  database: 'crm'
});

// Connect to MySQL
db.connect(err => {
  if (err) {
    console.error('DB connection error:', err);
  } else {
    console.log('Connected to MySQL database');
  }
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Fetch all users
app.get('/users', (req, res) => {
  db.query('SELECT * FROM users', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Login API
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length > 0) {
      res.json({ message: 'Login Successful', user: results[0] });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });
});

// CRUD API for `whatapp`

// Add a lead
app.post('/whatapp', (req, res) => {
  const { lead_name, lead_phone_number, order_id, product, status, note } = req.body;
  if (!lead_name || !lead_phone_number || !product || !status) {
    return res.status(400).json({ error: 'lead_name, lead_phone_number, product, and status are required' });
  }
  const sql = 'INSERT INTO whatapp (lead_name, lead_phone_number, order_id, product, status, note) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(sql, [lead_name, lead_phone_number, order_id, product, status, note], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Lead added', id: result.insertId });
  });
});

// Get all leads from `whatapp`
app.get('/whatapp', (req, res) => {
  db.query('SELECT * FROM whatapp ORDER BY id DESC', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Get a lead by ID from `whatapp`
app.get('/whatapp/:id', (req, res) => {
  const sql = 'SELECT * FROM whatapp WHERE id = ?';
  db.query(sql, [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Lead not found' });
    res.json(results[0]);
  });
});

// Update lead in `whatapp`
app.put('/whatapp/:id', (req, res) => {
  const { lead_name, lead_phone_number, order_id, product, status, note } = req.body;
  const sql = `
    UPDATE whatapp SET
      lead_name = ?,
      lead_phone_number = ?,
      order_id = ?,
      product = ?,
      status = ?,
      note = ?
    WHERE id = ?`;
  db.query(sql, [lead_name, lead_phone_number, order_id, product, status, note, req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Lead not found' });
    res.json({ message: 'Lead updated' });
  });
});

// Delete lead from `whatapp`
app.delete('/whatapp/:id', (req, res) => {
  db.query('DELETE FROM whatapp WHERE id = ?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Lead not found' });
    res.json({ message: 'Lead deleted' });
  });
});

// CRUD API for `orders` and `order_items`

// Create a new order
app.post('/orders', (req, res) => {
  const { customer_name, customer_phone, status, items } = req.body;
  if (!customer_name || !customer_phone || !status) {
    return res.status(400).json({ error: 'customer_name, customer_phone, and status are required' });
  }

  const sql = 'INSERT INTO orders (customer_name, customer_phone, status) VALUES (?, ?, ?)';
  db.query(sql, [customer_name, customer_phone, status], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    // Insert items for the order
    if (items && items.length > 0) {
      const orderId = result.insertId;
      const orderItems = items.map(item => [
        orderId, 
        item.product_name, 
        item.size, 
        item.quantity, 
        item.price, 
        item.selected
      ]);

      const itemSql = 'INSERT INTO order_items (order_id, product_name, size, quantity, price, selected) VALUES ?';
      db.query(itemSql, [orderItems], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Order added', orderId });
      });
    } else {
      res.json({ message: 'Order added', orderId: result.insertId });
    }
  });
});

// Get all orders
app.get('/orders', (req, res) => {
  const sql = 'SELECT * FROM orders ORDER BY created_at DESC';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Get order by ID
app.get('/orders/:id', (req, res) => {
  const sql = 'SELECT * FROM orders WHERE id = ?';
  db.query(sql, [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Order not found' });

    const orderId = results[0].id;
    const itemsSql = 'SELECT * FROM order_items WHERE order_id = ?';
    db.query(itemsSql, [orderId], (err, items) => {
      if (err) return res.status(500).json({ error: err.message });
      results[0].items = items;
      res.json(results[0]);
    });
  });
});

// Update order status
app.put('/orders/:id', (req, res) => {
  const { status } = req.body;
  const sql = 'UPDATE orders SET status = ? WHERE id = ?';
  db.query(sql, [status, req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Order not found' });
    res.json({ message: 'Order status updated' });
  });
});

// Update order item selection
app.put('/order-items/:id/select', (req, res) => {
  const { selected } = req.body;
  const sql = 'UPDATE order_items SET selected = ? WHERE id = ?';
  db.query(sql, [selected, req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Order item not found' });
    res.json({ message: 'Order item selection updated' });
  });
});

// Delete order by ID
app.delete('/orders/:id', (req, res) => {
  db.query('DELETE FROM orders WHERE id = ?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Order not found' });
    res.json({ message: 'Order deleted' });
  });
});

// Delete order item by ID
app.delete('/order-items/:id', (req, res) => {
  db.query('DELETE FROM order_items WHERE id = ?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Order item not found' });
    res.json({ message: 'Order item deleted' });
  });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
