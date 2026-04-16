const router = require('express').Router();
const { pool } = require('../models/db');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;

    // Only include items visible to this user
    const visibilityClause = `(is_private = false OR owner_id = '${userId}')`;

    const [totals, byStatus, byLocation, recentItems] = await Promise.all([
      pool.query(`
        SELECT 
          COUNT(*) AS total_items,
          COALESCE(SUM(current_value), 0) AS total_value,
          COALESCE(SUM(purchase_amount), 0) AS total_purchase_amount
        FROM items WHERE ${visibilityClause}
      `),
      pool.query(`
        SELECT status, COUNT(*) AS count, COALESCE(SUM(current_value), 0) AS value
        FROM items WHERE ${visibilityClause}
        GROUP BY status ORDER BY count DESC
      `),
      pool.query(`
        SELECT sl.name AS location, COUNT(i.id) AS count, COALESCE(SUM(i.current_value), 0) AS value
        FROM items i
        LEFT JOIN storage_locations sl ON i.storage_location_id = sl.id
        WHERE ${visibilityClause}
        GROUP BY sl.name ORDER BY count DESC LIMIT 10
      `),
      pool.query(`
        SELECT i.id, i.name, i.current_value, i.status, i.updated_at, u.name AS owner_name
        FROM items i LEFT JOIN users u ON i.owner_id = u.id
        WHERE ${visibilityClause}
        ORDER BY i.updated_at DESC LIMIT 5
      `)
    ]);

    res.json({
      summary: totals.rows[0],
      by_status: byStatus.rows,
      by_location: byLocation.rows,
      recent_items: recentItems.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
