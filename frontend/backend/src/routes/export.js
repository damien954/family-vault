const router = require('express').Router();
const xlsx = require('xlsx');
const { pool } = require('../models/db');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

async function getExportData(userId) {
  const result = await pool.query(`
    SELECT
      i.name, i.serial_number, i.make, i.model, i.caliber,
      i.purchase_date, i.purchase_amount, i.current_value, i.purchased_from,
      sl.name AS storage_location, i.status,
      c.name AS category, i.notes,
      u.name AS owner,
      i.is_private,
      i.created_at, i.updated_at,
      STRING_AGG(t.name, ', ') AS tags
    FROM items i
    LEFT JOIN users u ON i.owner_id = u.id
    LEFT JOIN storage_locations sl ON i.storage_location_id = sl.id
    LEFT JOIN categories c ON i.category_id = c.id
    LEFT JOIN item_tags it ON i.id = it.item_id
    LEFT JOIN tags t ON it.tag_id = t.id
    WHERE (i.is_private = false OR i.owner_id = $1)
    GROUP BY i.id, u.name, sl.name, c.name
    ORDER BY i.name
  `, [userId]);
  return result.rows;
}

// GET /api/export/csv
router.get('/csv', async (req, res) => {
  try {
    const rows = await getExportData(req.user.id);
    const headers = Object.keys(rows[0] || {});
    const csv = [
      headers.join(','),
      ...rows.map(row =>
        headers.map(h => {
          const val = row[h] ?? '';
          return `"${String(val).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="familyvault-export-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/export/excel
router.get('/excel', async (req, res) => {
  try {
    const rows = await getExportData(req.user.id);
    const ws = xlsx.utils.json_to_sheet(rows);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Inventory');
    const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="familyvault-export-${Date.now()}.xlsx"`);
    res.send(buf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
