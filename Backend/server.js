const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const app = express();
const port = 3647;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection configuration
const pool = new Pool({
  user: 'postgres',
  host: 'postgres', // matches the Docker Compose service name
  database: 'notifications',
  password: 'admin123',
  port: 5432,
});

// Retry logic for initial database connection
const waitForDatabase = async (retries = 10, delay = 3000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query('SELECT 1');
      console.log('Connected to PostgreSQL database');
      return;
    } catch (err) {
      console.error(`PostgreSQL connection failed (attempt ${i + 1}/${retries}):`, err.message);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  console.error('Could not connect to PostgreSQL after several attempts. Exiting...');
  process.exit(1);
};

// Create notifications table if it doesn't exist
const createTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        title VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        icon VARCHAR(50) NOT NULL,
        date VARCHAR(50) NOT NULL,
        time VARCHAR(50) NOT NULL
      )
    `);
    console.log('Notifications table is ready');
  } catch (err) {
    console.error('Error creating notifications table:', err.stack);
  }
};

// Health check route
app.get('/', (req, res) => {
  res.send('Notification backend is running');
});

// Get all notifications
app.get('/api/notifications', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM notifications ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching notifications:', err.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new notification
app.post('/api/notifications', async (req, res) => {
  const { title, message, icon, date, time } = req.body;

  if (!title || !message || !icon || !date || !time) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO notifications (title, message, icon, date, time) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, message, icon, date, time]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating notification:', err.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server after DB is ready
waitForDatabase().then(() => {
  createTable().then(() => {
    app.listen(port, () => {
      console.log(`Server running at http://44.223.23.145:${port}`);
    });
  });
});

