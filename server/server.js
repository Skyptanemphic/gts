// server/server.js
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// --- DATABASE CONNECTION ---
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'gts',
  password: '060650682236', 
  port: 5432,
});

// --- API ENDPOINT ---
app.get('/api/theses', async (req, res) => {
  try {
    const { search, type, language, year } = req.query;

    // We build the query dynamically. 
    // NOTE: University is fetched by joining thesis -> institute -> university
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
    
    // 1. Search (Checks Title, Author, or Keywords)
    if (search) {
      query += ` AND (t.title ILIKE $${paramIndex} OR a.author_name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // 2. Type Filter
    if (type && type !== 'All') {
      query += ` AND t.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    // 3. Language Filter
    if (language && language !== 'All') {
      query += ` AND l.language_name = $${paramIndex}`;
      params.push(language);
      paramIndex++;
    }

    // 4. Year Filter
    if (year) {
      query += ` AND t.year = $${paramIndex}`;
      params.push(year);
      paramIndex++;
    }

    // Limit to 30 as per requirements
    query += ` ORDER BY t.year DESC LIMIT 30`;

    const result = await pool.query(query, params);
    res.json(result.rows);

  } catch (err) {
    console.error("Database Error:", err.message);
    res.status(500).send("Server Error");
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
