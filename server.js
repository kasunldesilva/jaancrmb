const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json()); // to accept JSON body

// Connect to MySQL database
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'crm'
});

// Test DB connection
db.connect(err => {
  if (err) {
    console.log('DB connection error:', err);
  } else {
    console.log('Connected to MySQL database');
  }
});

// GET all users
app.get('/users', (req, res) => {
  db.query('SELECT * FROM users', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// POST login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length > 0) {
      res.json({ message: 'Login Successful', user: results[0] });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });
});

/** CRUD API for `whatapp` table **/

// CREATE a new lead
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

// READ all leads
app.get('/whatapp', (req, res) => {
  db.query('SELECT * FROM whatapp ORDER BY id DESC', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// READ single lead by id
app.get('/whatapp/:id', (req, res) => {
  const sql = 'SELECT * FROM whatapp WHERE id = ?';
  db.query(sql, [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Lead not found' });
    res.json(results[0]);
  });
});

// UPDATE lead by id
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

// DELETE lead by id
app.delete('/whatapp/:id', (req, res) => {
  db.query('DELETE FROM whatapp WHERE id = ?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Lead not found' });
    res.json({ message: 'Lead deleted' });
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
