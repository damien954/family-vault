const router = require('express').Router();
const { pool } = require('../models/db');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;

    const [totals, byStatus, byLocation, byCategory, recentItems] = await Promise.all([
      pool.query(`
        SELECT COUNT(*) AS total_items
        FROM items WHERE (is_private = false OR owner_id = $1)
      `, [userId]),
      pool.query(`
        SELECT status, COUNT(*) AS count
        FROM items WHERE (is_private = false OR owner_id = $1)
        GROUP BY status ORDER BY count DESC
      `, [userId]),
      pool.query(`
        SELECT sl.name AS location, COUNT(i.id) AS count
        FROM items i
        LEFT JOIN storage_locations sl ON i.storage_location_id = sl.id
        WHERE (i.is_private = false OR i.owner_id = $1)
        GROUP BY sl.name ORDER BY count DESC LIMIT 10
      `, [userId]),
      pool.query(`
        SELECT c.name AS category, COUNT(i.id) AS count
        FROM items i
        LEFT JOIN categories c ON i.category_id = c.id
        WHERE (i.is_private = false OR i.owner_id = $1)
        GROUP BY c.name ORDER BY count DESC
      `, [userId]),
      pool.query(`
        SELECT i.id, i.name, i.status, i.updated_at, u.name AS owner_name, c.name AS category_name
        FROM items i
        LEFT JOIN users u ON i.owner_id = u.id
        LEFT JOIN categories c ON i.category_id = c.id
        WHERE (i.is_private = false OR i.owner_id = $1)
        ORDER BY i.updated_at DESC LIMIT 5
      `, [userId])
    ]);

    res.json({
      summary: totals.rows[0],
      by_status: byStatus.rows,
      by_location: byLocation.rows,
      by_category: byCategory.rows,
      recent_items: recentItems.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
