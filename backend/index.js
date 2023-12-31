const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const port = 3000;
const DATABASE_HOST = "localhost";
const DATABASE_USER = "abhidb";
const DATABASE_PASSWORD = "admin";
const DATABASE_NAME = "pastebin";


const db = mysql.createConnection({
  host: DATABASE_HOST,
  user: DATABASE_USER,
  password: DATABASE_PASSWORD,
  database: DATABASE_NAME
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database: ' + err.stack);
    return;
  }
  console.log('Connected to the database as id ' + db.threadId);
});

app.use(express.json());
app.use(cors());

// Create a new paste
app.post('/api/paste', (req, res) => {
  const content = req.body.content;
  const expire_at = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const URL = generateUniqueURL(content);

  db.query(
    'INSERT INTO pastes (content, expire_at, URL) VALUES (?, ?, ?)',
      [content, expire_at, URL],
    (err, results) => {
      if (err) {
        console.error('Error creating a paste: ' + err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }

	res.status(201).json({ id: results.insertId, url: URL });
    }
  );
});

// Create a new paste with expiry date
app.post('/api/paste/expiry', (req, res) => {
    const content = req.body.content;
    const expire_after_seconds = req.body.expiry; // In seconds
    const expire_at = new Date(Date.now() + expire_after_seconds * 1000); // 24 hours
    const URL = generateUniqueURL(content);

  db.query(
    'INSERT INTO pastes (content, expire_at, URL) VALUES (?, ?, ?)',
      [content, expire_at, URL],
    (err, results) => {
      if (err) {
        console.error('Error creating a paste: ' + err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }

	res.status(201).json({ id: results.insertId, url: URL });
    }
  );
});

// Retrieve a paste by ID
app.get('/api/paste/content/:id', (req, res) => {
  const id = req.params.id;

  db.query('SELECT content FROM pastes WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('Error retrieving paste: ' + err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }

    if (results.length === 0) {
      res.status(404).json({ error: 'Paste not found' });
      return;
    }
      res.status(200).send({"content": results[0].content});
  });
});

// Create a GET endpoint for retrieving content by URL
app.get('/api/paste/content', (req, res) => {
    const URL = req.query.url;
    console.log(`DEBUG: ${URL}`);

    if (!URL) {
	return res.status(400).json({ error: 'URL parameter is missing' });
    }
    
    // Assuming you have a database table named 'pastes' with columns 'id' and 'content'
    db.query('SELECT content FROM pastes WHERE URL = ?', [URL], (err, results) => {
	if (err) {
	    console.error('Error retrieving content: ' + err);
	    res.status(500).json({ error: 'Internal server error' });
	    return;
	}
	
	if (results.length === 0) {
	    res.status(404).json({ error: 'Paste not found' });
	    return;
	}

    res.status(200).send(results[0].content);
  });
});

// Job to delete old pastes
function deleteExpiredPastes() {
  const now = new Date();
  
  db.query('DELETE FROM pastes WHERE expire_at <= ?', [now], (err, results) => {
    if (err) {
      console.error('Error deleting expired pastes: ' + err);
      return;
    }
    
    console.log(`Deleted ${results.affectedRows} expired pastes.`);
  });
}


// Function to generate a unique URL
function generateUniqueURL(content) {
  const timestamp = new Date().getTime().toString();
  const uniqueString = content + timestamp;

  const hash = crypto.createHash('sha256').update(uniqueString).digest('hex');

  const uniqueURL = hash.slice(0, 6);
  return uniqueURL;
}



// Set up a periodic check (e.g., every hour)
const checkInterval = 60 * 60 * 1000; // 1 hour in milliseconds
setInterval(deleteExpiredPastes, checkInterval);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
