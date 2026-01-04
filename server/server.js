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
    const { rows } = await pool.query("SELECT professor_id, professor_name, email, professor_title, university_id, institute_id FROM professor ORDER BY professor_name");
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
        t.number_of_pages,
        t.type, 
        t.submission_date,
        a.author_name, 
        l.language_name, 
        i.institute_name,
        u.university_name,
        p.professor_name as supervisor_name
      FROM thesis t
      LEFT JOIN author a ON t.author_id = a.author_id
      LEFT JOIN language l ON t.language_id = l.language_id
      LEFT JOIN institute i ON t.institute_id = i.institute_id
      LEFT JOIN university u ON i.university_id = u.university_id
      LEFT JOIN professor p ON t.supervisor_id = p.professor_id
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
  const { 
    title, abstract, year, number_of_pages, type, language, 
    author_id, user_id, supervisor_id, cosupervisor_id, 
    institute_id, keywords 
  } = req.body;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let finalAuthorId = author_id;

    if (!finalAuthorId) {
      // Find user name and email from users table
      const uRes = await client.query("SELECT full_name, email FROM users WHERE user_id = $1", [user_id]);
      if (uRes.rows.length === 0) throw new Error("User not found in database. Relogin required.");
      
      const { full_name, email } = uRes.rows[0];
      
      // Check if author exists by email
      const authCheck = await client.query("SELECT author_id FROM author WHERE email = $1", [email]);
      if (authCheck.rows.length > 0) {
        finalAuthorId = authCheck.rows[0].author_id;
      } else {
        // Create new author with email (defaulting university_id to 1 if not passed)
        const newAuth = await client.query(
          "INSERT INTO author (author_name, email, university_id) VALUES ($1, $2, 1) RETURNING author_id", 
          [full_name, email]
        );
        finalAuthorId = newAuth.rows[0].author_id;
      }
    }

    // Language Logic
    const langRes = await client.query("SELECT language_id FROM language WHERE language_name = $1", [language]);
    const langId = langRes.rows[0]?.language_id || 1;

    // Insert Thesis
    const thesisNo = Math.floor(100000 + Math.random() * 900000); 
    
    await client.query(
      `INSERT INTO thesis (
        thesis_no, title, abstract, year, number_of_pages, type, author_id, language_id, 
        institute_id, supervisor_id, cosupervisor_id, submission_date
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_DATE)`,
      [
        thesisNo, title, abstract, parseInt(year), parseInt(number_of_pages) || 0, 
        type, finalAuthorId, langId, parseInt(institute_id), 
        parseInt(supervisor_id), cosupervisor_id ? parseInt(cosupervisor_id) : null
      ]
    );

    // Keywords
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


// --- 5. AUTH (Login & Register Updated) ---
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { rows } = await pool.query(
      "SELECT user_id, full_name, role, email FROM users WHERE email = $1 AND password = $2", 
      [email, password]
    );
    if (rows.length > 0) {
      const user = rows[0];

      // Match Profile ID based on Role
      if (user.role === 'AUTHOR') {
        const authRes = await pool.query("SELECT author_id FROM author WHERE email = $1", [email]);
        if (authRes.rows.length > 0) user.author_id = authRes.rows[0].author_id;
      } else if (user.role === 'PROFESSOR') {
        const profRes = await pool.query("SELECT professor_id FROM professor WHERE email = $1", [email]);
        if (profRes.rows.length > 0) user.professor_id = profRes.rows[0].professor_id;
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
  const { email, password, full_name, role, university_id, institute_id, professor_title } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const check = await client.query("SELECT 1 FROM users WHERE email = $1", [email]);
    if (check.rows.length > 0) throw new Error("Email already registered");

    // 1. Insert into core users table
    const userRes = await client.query(
      "INSERT INTO users (email, password, full_name, role) VALUES ($1, $2, $3, $4) RETURNING user_id",
      [email, password, full_name, role]
    );

    // 2. Create specialized profile entries
    if (role === 'PROFESSOR') {
        await client.query(
            "INSERT INTO professor (professor_name, email, professor_title, university_id, institute_id) VALUES ($1, $2, $3, $4, $5)",
            [full_name, email, professor_title, university_id, institute_id]
        );
    } else {
        await client.query(
            "INSERT INTO author (author_name, email, university_id) VALUES ($1, $2, $3)",
            [full_name, email, university_id]
        );
    }
    
    await client.query('COMMIT');
    res.json({ success: true, message: "Account created successfully" });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Register Error:", err.message);
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