const router = require('express').Router();
const { pool } = require('../models/db');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  try { res.json((await pool.query('SELECT * FROM tags ORDER BY name')).rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// Manually delete orphaned tags
router.post('/cleanup', async (req, res) => {
  try {
    const r = await pool.query(
      'DELETE FROM tags WHERE id NOT IN (SELECT DISTINCT tag_id FROM item_tags) RETURNING id'
    );
    res.json({ deleted: r.rowCount });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM tags WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
