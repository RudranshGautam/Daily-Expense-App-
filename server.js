const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();
const port = 3000;

// Set up MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'rudransh@1',  // Replace with your MySQL password
  database: 'myapp_db'     // Replace with your database name
});

db.connect(err => {
  if (err) throw err;
  console.log('Connected to MySQL database');
});

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Route for the root URL
app.get('/', (req, res) => {
  res.redirect('/login'); // Redirect to login page
});

// Route for signup page
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

// Route for login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Route for expenses page
app.get('/expenses', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'expenses.html'));
});

// Handle POST request for signup
app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.send('Please provide name, email, and password.');
  }

  try {
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) throw err;

      if (results.length > 0) {
        return res.send('Email already in use.');
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword], (err, results) => {
        if (err) throw err;
        res.redirect('/login');  // Redirect to login after successful signup
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
});

// Handle POST request for login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Internal server error');
    }

    if (results.length === 0) {
      return res.status(404).send('User not found');
    }

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);

    if (match) {
      res.redirect('/expenses');  // Redirect to expenses page after successful login
    } else {
      res.status(401).send('User not authorized');
    }
  });
});

// Handle POST request for adding expenses
app.post('/add-expense', (req, res) => {
  const { amount, description, category } = req.body;

  db.query('INSERT INTO expenses (amount, description, category) VALUES (?, ?, ?)', [amount, description, category], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error saving expense');
    }
    res.send('Expense added successfully');
  });
});

// Fetch all expenses
app.get('/get-expenses', (req, res) => {
  db.query('SELECT * FROM expenses', (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error fetching expenses');
    }
    res.json(results);
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
