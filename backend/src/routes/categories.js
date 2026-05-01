const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { pool } = require('../models/db');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  try { res.json((await pool.query('SELECT * FROM categories ORDER BY name')).rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', [body('name').trim().notEmpty()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const r = await pool.query(
      'INSERT INTO categories (name, created_by) VALUES ($1,$2) RETURNING *',
      [req.body.name, req.user.id]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Category already exists' });
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', [body('name').trim().notEmpty()], async (req, res) => {
  try {
    const r = await pool.query(
      'UPDATE categories SET name = $1 WHERE id = $2 RETURNING *',
      [req.body.name, req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM categories WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
