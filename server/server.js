const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// DATABASE CONFIG
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'gts',
  password: '060650682236',
  port: 5432,
});

// --- 1. DROPDOWN DATA ENDPOINTS ---

// GET Professors
app.get('/api/professors', async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT professor_id, professor_name FROM professor ORDER BY professor_name");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET Universities
app.get('/api/universities', async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT university_id, university_name FROM university ORDER BY university_name");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET Institutes (Filtered by University)
app.get('/api/institutes', async (req, res) => {
  try {
    const { university_id } = req.query;
    let query = "SELECT institute_id, institute_name, university_id FROM institute";
    let params = [];

    if (university_id) {
      query += " WHERE university_id = $1";
      params.push(university_id);
    }
    
    query += " ORDER BY institute_name";
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});


// --- 2. THESIS SEARCH & LISTING ---
app.get('/api/theses', async (req, res) => {
  try {
    const { search, type, language, year } = req.query;
    
    let queryText = `
      SELECT 
        t.thesis_no, 
        t.title, 
        t.abstract, 
        t.year, 
        t.type, 
        t.submission_date,
        a.author_name, 
        l.language_name, 
        i.institute_name,
        u.university_name 
      FROM thesis t
      LEFT JOIN author a ON t.author_id = a.author_id
      LEFT JOIN language l ON t.language_id = l.language_id
      LEFT JOIN institute i ON t.institute_id = i.institute_id
      LEFT JOIN university u ON i.university_id = u.university_id
      WHERE 1=1
    `;

    const queryParams = [];
    let paramCount = 1;

    if (search) {
      queryText += ` AND (t.title ILIKE $${paramCount} OR a.author_name ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
      paramCount++;
    }
    if (type && type !== 'All') {
      queryText += ` AND t.type = $${paramCount}`;
      queryParams.push(type);
      paramCount++;
    }
    if (language && language !== 'All') {
      queryText += ` AND l.language_name = $${paramCount}`;
      queryParams.push(language);
      paramCount++;
    }
    if (year) {
      queryText += ` AND t.year = $${paramCount}`;
      queryParams.push(parseInt(year));
      paramCount++;
    }

    queryText += ` ORDER BY t.submission_date DESC`;

    const { rows } = await pool.query(queryText, queryParams);
    res.json(rows);
  } catch (err) {
    console.error("Search Error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// --- 3. PROFESSOR PROFILE THESES ---
app.get('/api/professors/:id/theses', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(`
      SELECT t.thesis_no, t.title, t.year, t.type, a.author_name
      FROM thesis t
      LEFT JOIN author a ON t.author_id = a.author_id
      WHERE t.supervisor_id = $1 OR t.cosupervisor_id = $1
      ORDER BY t.year DESC`, 
      [id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});


// --- 4. SUBMIT THESIS ---
app.post('/api/theses', async (req, res) => {
  const { title, abstract, year, type, language, author_id, user_id, supervisor_id, cosupervisor_id, institute_id, keywords } = req.body;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. DETERMINE AUTHOR ID
    // We prefer the explicit author_id sent from frontend.
    // If not sent, we fall back to looking it up via user_id -> name.
    let finalAuthorId = author_id;

    if (!finalAuthorId) {
      // Find user name
      const uRes = await client.query("SELECT full_name FROM users WHERE user_id = $1", [user_id]);
      if (uRes.rows.length === 0) throw new Error("User not found");
      const authorName = uRes.rows[0].full_name;
      
      // Check if author exists
      const authCheck = await client.query("SELECT author_id FROM author WHERE author_name = $1", [authorName]);
      if (authCheck.rows.length > 0) {
        finalAuthorId = authCheck.rows[0].author_id;
      } else {
        // Create new author
        const newAuth = await client.query("INSERT INTO author (author_name) VALUES ($1) RETURNING author_id", [authorName]);
        finalAuthorId = newAuth.rows[0].author_id;
      }
    }

    // 2. Language Logic
    let langId;
    const langCheck = await client.query("SELECT language_id FROM language WHERE language_name = $1", [language]);
    if (langCheck.rows.length > 0) langId = langCheck.rows[0].language_id;
    else {
      const newLang = await client.query("INSERT INTO language (language_name) VALUES ($1) RETURNING language_id", [language]);
      langId = newLang.rows[0].language_id;
    }

    // 3. Insert Thesis
    const thesisNo = Math.floor(100000 + Math.random() * 900000); 
    
    await client.query(
      `INSERT INTO thesis (
        thesis_no, title, abstract, year, type, author_id, language_id, 
        institute_id, supervisor_id, cosupervisor_id, submission_date
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
      [
        thesisNo, title, abstract, parseInt(year), type, finalAuthorId, langId, 
        parseInt(institute_id), parseInt(supervisor_id), 
        cosupervisor_id ? parseInt(cosupervisor_id) : null
      ]
    );

    // 4. Keywords
    if (keywords) {
      const kwList = keywords.split(',').map(k => k.trim()).filter(k => k !== '');
      for (const k of kwList) {
        await client.query("INSERT INTO keyword (keyword_text, thesis_no) VALUES ($1, $2)", [k, thesisNo]);
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, message: "Thesis Published Successfully" });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Submit Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});


// --- 5. AUTH (Login Updated) ---
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { rows } = await pool.query(
      "SELECT user_id, full_name, role, email FROM users WHERE email = $1 AND password = $2", 
      [email, password]
    );
    if (rows.length > 0) {
      const user = rows[0];

      // If user is an AUTHOR, try to find their author_id so the frontend has it
      if (user.role === 'AUTHOR') {
        const authRes = await pool.query("SELECT author_id FROM author WHERE author_name = $1", [user.full_name]);
        if (authRes.rows.length > 0) {
          user.author_id = authRes.rows[0].author_id;
        }
      }
      
      res.json({ success: true, user });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/register', async (req, res) => {
  const { email, password, full_name, role } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const check = await client.query("SELECT 1 FROM users WHERE email = $1", [email]);
    if (check.rows.length > 0) throw new Error("Email already registered");

    const userRes = await client.query(
      "INSERT INTO users (email, password, full_name, role) VALUES ($1, $2, $3, $4) RETURNING user_id, full_name, role, email",
      [email, password, full_name, role]
    );
    const newUser = userRes.rows[0];

    // If AUTHOR, create entry in author table immediately? 
    // Usually better to wait until first thesis, but you can do it here if you like.
    // For now we keep logic simple (create on submit).
    
    await client.query('COMMIT');
    res.json({ success: true, user: newUser });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// My History
app.get('/api/my-theses', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT t.thesis_no, t.title, t.year, t.type
      FROM thesis t
      JOIN author a ON t.author_id = a.author_id
      WHERE a.author_name = $1 
      ORDER BY t.year DESC`, 
      [req.query.author_name]
    );
    res.json(rows);
  } catch (err) { res.status(500).send("Server Error"); }
});

app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));