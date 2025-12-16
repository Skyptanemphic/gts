// server/server.js
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = 3000;

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json()); 

// --- DATABASE CONNECTION ---
// Ensure these match your local Postgres setup
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'gts',
  password: '060650682236', 
  port: 5432,
});

// ==========================================
// 1. SEARCH THESES (GET)
// ==========================================
app.get('/api/theses', async (req, res) => {
  try {
    const { search, type, language, year } = req.query;

    let query = `
      SELECT 
        t.thesis_no, 
        t.title, 
        t.abstract, 
        t.year, 
        t.type, 
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

    let params = [];
    let paramIndex = 1;

    // --- FILTERS ---
    if (search) {
      query += ` AND (t.title ILIKE $${paramIndex} OR a.author_name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (type && type !== 'All') {
      query += ` AND t.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }
    if (language && language !== 'All') {
      query += ` AND l.language_name = $${paramIndex}`;
      params.push(language);
      paramIndex++;
    }
    if (year) {
      query += ` AND t.year = $${paramIndex}`;
      params.push(year);
      paramIndex++;
    }

    query += ` ORDER BY t.year DESC LIMIT 30`;

    const result = await pool.query(query, params);
    res.json(result.rows);

  } catch (err) {
    console.error("Search Error:", err.message);
    res.status(500).send("Server Error");
  }
});

// ==========================================
// 2. LOGIN (POST)
// ==========================================
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'MISSING CREDENTIALS' });
  }

  try {
    const query = `SELECT * FROM users WHERE email = $1 AND password = $2`;
    const result = await pool.query(query, [email, password]);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log(`Login Successful: ${user.full_name}`);
      
      res.json({
        success: true,
        user: {
          id: user.user_id,
          name: user.full_name,
          role: user.role,
          email: user.email
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'INVALID CREDENTIALS' });
    }

  } catch (err) {
    console.error("Login Error:", err.message);
    res.status(500).json({ success: false, message: 'SERVER ERROR' });
  }
});

// ==========================================
// 3. REGISTER (POST)
// ==========================================
app.post('/api/register', async (req, res) => {
  const { email, password, full_name, role } = req.body;

  if (!email || !password || !full_name || !role) {
    return res.status(400).json({ success: false, message: 'ALL FIELDS REQUIRED' });
  }

  try {
    const checkRes = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
    if (checkRes.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'EMAIL ALREADY REGISTERED' });
    }

    const insertQuery = `
      INSERT INTO users (email, password, full_name, role)
      VALUES ($1, $2, $3, $4)
      RETURNING user_id, email, full_name, role
    `;
    
    const result = await pool.query(insertQuery, [email, password, full_name, role]);
    const newUser = result.rows[0];

    console.log(`New User Registered: ${newUser.full_name}`);

    res.json({
      success: true,
      message: 'REGISTRATION SUCCESSFUL',
      user: {
        id: newUser.user_id,
        name: newUser.full_name,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (err) {
    console.error("Registration Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 4. SUBMIT THESIS (POST)
// ==========================================
app.post('/api/theses', async (req, res) => {
  const { title, abstract, year, type, language, author_name } = req.body;

  // We use a "Client" instead of "Pool" here so we can use Transactions (BEGIN/COMMIT)
  const client = await pool.connect(); 

  try {
    await client.query('BEGIN'); // Start Transaction

    // --- A. HANDLE AUTHOR ---
    let authorId;
    const authorRes = await client.query("SELECT author_id FROM author WHERE author_name = $1", [author_name]);
    if (authorRes.rows.length > 0) {
      authorId = authorRes.rows[0].author_id;
    } else {
      const newAuthor = await client.query("INSERT INTO author (author_name) VALUES ($1) RETURNING author_id", [author_name]);
      authorId = newAuthor.rows[0].author_id;
    }

    // --- B. HANDLE LANGUAGE ---
    let langId;
    const langRes = await client.query("SELECT language_id FROM language WHERE language_name = $1", [language]);
    if (langRes.rows.length > 0) {
      langId = langRes.rows[0].language_id;
    } else {
      // Create new language (Make sure input matches 'English', 'Turkish' etc in DB constraints)
      const newLang = await client.query("INSERT INTO language (language_name) VALUES ($1) RETURNING language_id", [language]);
      langId = newLang.rows[0].language_id;
    }

    // --- C. HANDLE INSTITUTE (Required NOT NULL) ---
    // We look for ANY institute. If none, we create a default one.
    let instId;
    const instRes = await client.query("SELECT institute_id FROM institute LIMIT 1");
    if (instRes.rows.length > 0) {
      instId = instRes.rows[0].institute_id;
    } else {
      // Need a university first
      let uniId;
      const uniRes = await client.query("SELECT university_id FROM university LIMIT 1");
      if (uniRes.rows.length > 0) uniId = uniRes.rows[0].university_id;
      else {
        const newUni = await client.query("INSERT INTO university (university_name) VALUES ('Default University') RETURNING university_id");
        uniId = newUni.rows[0].university_id;
      }
      const newInst = await client.query("INSERT INTO institute (institute_name, university_id) VALUES ('Default Institute', $1) RETURNING institute_id", [uniId]);
      instId = newInst.rows[0].institute_id;
    }

    // --- D. HANDLE SUPERVISOR (Required NOT NULL) ---
    // We look for ANY professor. If none, we create a default one.
    let profId;
    const profRes = await client.query("SELECT professor_id FROM professor LIMIT 1");
    if (profRes.rows.length > 0) {
      profId = profRes.rows[0].professor_id;
    } else {
      const newProf = await client.query("INSERT INTO professor (professor_name, professor_title) VALUES ('Default Supervisor', 'Dr.') RETURNING professor_id");
      profId = newProf.rows[0].professor_id;
    }

    // --- E. GENERATE THESIS_NO ---
    // Since thesis_no is INT (not SERIAL), we generate a random ID
    const thesisNo = Math.floor(1000000 + Math.random() * 9000000);

    // --- F. INSERT THESIS ---
    const insertQuery = `
      INSERT INTO thesis 
      (thesis_no, title, abstract, year, type, author_id, language_id, institute_id, supervisor_id, submission_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING thesis_no
    `;

    await client.query(insertQuery, [
      thesisNo, title, abstract, year, type, authorId, langId, instId, profId
    ]);

    await client.query('COMMIT'); // Save everything
    console.log(`Thesis Uploaded: ${title} (ID: ${thesisNo})`);
    res.json({ success: true, message: "Thesis Saved Successfully" });

  } catch (err) {
    await client.query('ROLLBACK'); // Undo if error
    console.error("Submit Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// ==========================================
// 5. GET MY HISTORY (GET)
// ==========================================
app.get('/api/my-theses', async (req, res) => {
  const { author_name } = req.query;

  if (!author_name) return res.json([]);

  try {
    const query = `
      SELECT 
        t.thesis_no, t.title, t.year, t.type, 
        l.language_name, u.university_name
      FROM thesis t
      LEFT JOIN author a ON t.author_id = a.author_id
      LEFT JOIN language l ON t.language_id = l.language_id
      LEFT JOIN institute i ON t.institute_id = i.institute_id
      LEFT JOIN university u ON i.university_id = u.university_id
      WHERE a.author_name = $1
      ORDER BY t.year DESC
    `;

    const result = await pool.query(query, [author_name]);
    res.json(result.rows);

  } catch (err) {
    console.error("My History Error:", err.message);
    res.status(500).send("Server Error");
  }
});

// ==========================================
// START SERVER
// ==========================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});