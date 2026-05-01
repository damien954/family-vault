const router = require('express').Router();
const { pool } = require('../models/db');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const userId  = req.user.id;
    const vis     = `(i.is_private = false OR i.owner_id = $1)`;
    const visAct  = `(i.is_private = false OR i.owner_id = $1) AND i.status = 'Active'`;

    const [totals, byStatus, byCategory, byLocation, topMakes, leastMakes,
           topCalibers, leastCalibers, recentlyAcquired, longestOwned, recentItems] =
      await Promise.all([
        pool.query(`SELECT COUNT(*) AS total_items,
          COUNT(*) FILTER (WHERE status='Active') AS active_items,
          COUNT(*) FILTER (WHERE status!='Active') AS inactive_items,
          COUNT(DISTINCT owner_id) AS total_owners
          FROM items i WHERE ${vis}`, [userId]),
        pool.query(`SELECT status, COUNT(*) AS count FROM items i WHERE ${vis} GROUP BY status ORDER BY count DESC`, [userId]),
        pool.query(`SELECT COALESCE(c.name,'Uncategorized') AS category, COUNT(*) AS count FROM items i LEFT JOIN categories c ON i.category_id=c.id WHERE ${visAct} GROUP BY c.name ORDER BY count DESC`, [userId]),
        pool.query(`SELECT COALESCE(sl.name,'Unassigned') AS location, COUNT(*) AS count FROM items i LEFT JOIN storage_locations sl ON i.storage_location_id=sl.id WHERE ${visAct} GROUP BY sl.name ORDER BY count DESC LIMIT 8`, [userId]),
        pool.query(`SELECT make, COUNT(*) AS count FROM items i WHERE ${visAct} AND make IS NOT NULL AND make!='' GROUP BY make ORDER BY count DESC LIMIT 6`, [userId]),
        pool.query(`SELECT make, COUNT(*) AS count FROM items i WHERE ${visAct} AND make IS NOT NULL AND make!='' GROUP BY make HAVING COUNT(*)>=1 ORDER BY count ASC LIMIT 4`, [userId]),
        pool.query(`SELECT caliber, COUNT(*) AS count FROM items i WHERE ${visAct} AND caliber IS NOT NULL AND caliber!='' GROUP BY caliber ORDER BY count DESC LIMIT 6`, [userId]),
        pool.query(`SELECT caliber, COUNT(*) AS count FROM items i WHERE ${visAct} AND caliber IS NOT NULL AND caliber!='' GROUP BY caliber HAVING COUNT(*)>=1 ORDER BY count ASC LIMIT 4`, [userId]),
        pool.query(`SELECT i.id, i.make, i.model, i.caliber, i.purchase_date, i.status, u.name AS owner_name, c.name AS category_name FROM items i LEFT JOIN users u ON i.owner_id=u.id LEFT JOIN categories c ON i.category_id=c.id WHERE ${vis} AND i.purchase_date IS NOT NULL ORDER BY i.purchase_date DESC LIMIT 5`, [userId]),
        pool.query(`SELECT i.id, i.make, i.model, i.caliber, i.purchase_date, u.name AS owner_name, c.name AS category_name, DATE_PART('year',AGE(NOW(),i.purchase_date)) AS years_owned, DATE_PART('month',AGE(NOW(),i.purchase_date)) AS months_owned FROM items i LEFT JOIN users u ON i.owner_id=u.id LEFT JOIN categories c ON i.category_id=c.id WHERE ${visAct} AND i.purchase_date IS NOT NULL ORDER BY i.purchase_date ASC LIMIT 5`, [userId]),
        pool.query(`SELECT i.id, i.make, i.model, i.caliber, i.status, i.created_at, u.name AS owner_name, c.name AS category_name FROM items i LEFT JOIN users u ON i.owner_id=u.id LEFT JOIN categories c ON i.category_id=c.id WHERE ${vis} ORDER BY i.created_at DESC LIMIT 6`, [userId]),
      ]);

    res.json({
      summary: totals.rows[0], by_status: byStatus.rows, by_category: byCategory.rows,
      by_location: byLocation.rows, top_makes: topMakes.rows, least_makes: leastMakes.rows,
      top_calibers: topCalibers.rows, least_calibers: leastCalibers.rows,
      recently_acquired: recentlyAcquired.rows, longest_owned: longestOwned.rows,
      recent_items: recentItems.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
