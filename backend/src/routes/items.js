const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const { pool } = require('../models/db');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// Multer setup
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    cb(null, allowed.test(file.mimetype));
  }
});

// Build the full item select query
function itemQuery(extraWhere = '') {
  return `
    SELECT
      i.*,
      u.name AS owner_name,
      u.email AS owner_email,
      sl.name AS storage_location_name,
      c.name AS category_name,
      COALESCE(
        json_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name)) FILTER (WHERE t.id IS NOT NULL),
        '[]'
      ) AS tags,
      COALESCE(
        json_agg(DISTINCT jsonb_build_object('id', img.id, 'filename', img.filename, 'original_name', img.original_name)) FILTER (WHERE img.id IS NOT NULL),
        '[]'
      ) AS images
    FROM items i
    LEFT JOIN users u ON i.owner_id = u.id
    LEFT JOIN storage_locations sl ON i.storage_location_id = sl.id
    LEFT JOIN categories c ON i.category_id = c.id
    LEFT JOIN item_tags it ON i.id = it.item_id
    LEFT JOIN tags t ON it.tag_id = t.id
    LEFT JOIN item_images img ON i.id = img.item_id
    ${extraWhere}
    GROUP BY i.id, u.name, u.email, sl.name, c.name
  `;
}

// GET /api/items
router.get('/', async (req, res) => {
  const { search, status, category_id, tag, location_id, owner_id, sort_by, sort_dir, private: isPrivate } = req.query;
  const conditions = [];
  const values = [];
  let i = 1;

  // Privacy: private items only visible to owner
  conditions.push(`(i.is_private = false OR i.owner_id = $${i++})`);
  values.push(req.user.id);

  if (search) {
    conditions.push(`(i.name ILIKE $${i} OR i.serial_number ILIKE $${i++})`);
    values.push(`%${search}%`);
  }
  if (status) { conditions.push(`i.status = $${i++}`); values.push(status); }
  if (category_id) { conditions.push(`i.category_id = $${i++}`); values.push(category_id); }
  if (location_id) { conditions.push(`i.storage_location_id = $${i++}`); values.push(location_id); }
  if (owner_id) { conditions.push(`i.owner_id = $${i++}`); values.push(owner_id); }
  if (isPrivate === 'true') { conditions.push(`i.is_private = true AND i.owner_id = $${i++}`); values.push(req.user.id); }

  const where = `WHERE ${conditions.join(' AND ')}`;
  const validSorts = { value: 'i.current_value', purchase_date: 'i.purchase_date', name: 'i.name' };
  const orderCol = validSorts[sort_by] || 'i.created_at';
  const orderDir = sort_dir === 'asc' ? 'ASC' : 'DESC';

  try {
    // Tag filter needs subquery
    let query = itemQuery(where) + ` ORDER BY ${orderCol} ${orderDir}`;
    let result = await pool.query(query, values);
    
    // Filter by tag in application layer (simpler than complex SQL)
    let rows = result.rows;
    if (tag) {
      rows = rows.filter(r => r.tags.some(t => t.name === tag));
    }
    
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/items/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      itemQuery('WHERE i.id = $1 AND (i.is_private = false OR i.owner_id = $2)'),
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Item not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/items
router.post('/', [
  body('name').trim().notEmpty(),
  body('status').optional().isIn(['Active', 'Sold', 'Transferred', 'Lost', 'Stolen']),
  body('owner_id').isUUID()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const {
    name, serial_number, make, model, caliber, purchase_date, purchase_amount,
    current_value, purchased_from, storage_location_id, status = 'Active',
    category_id, notes, owner_id, is_private = false, tags = []
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO items (name, serial_number, make, model, caliber, purchase_date, purchase_amount,
        current_value, purchased_from, storage_location_id, status, category_id, notes, owner_id, is_private, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING id`,
      [name, serial_number, make, model, caliber, purchase_date || null, purchase_amount || null,
       current_value || null, purchased_from, storage_location_id || null, status,
       category_id || null, notes, owner_id, is_private, req.user.id]
    );
    const itemId = result.rows[0].id;

    // Handle tags
    for (const tagName of tags) {
      const trimmed = tagName.trim();
      if (!trimmed) continue;
      let tagResult = await client.query('SELECT id FROM tags WHERE name = $1', [trimmed]);
      if (!tagResult.rows.length) {
        tagResult = await client.query('INSERT INTO tags (name) VALUES ($1) RETURNING id', [trimmed]);
      }
      await client.query('INSERT INTO item_tags (item_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [itemId, tagResult.rows[0].id]);
    }

    await client.query('COMMIT');
    const full = await pool.query(itemQuery('WHERE i.id = $1'), [itemId]);
    res.status(201).json(full.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// PUT /api/items/:id
router.put('/:id', [
  body('name').optional().trim().notEmpty(),
  body('status').optional().isIn(['Active', 'Sold', 'Transferred', 'Lost', 'Stolen'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const fields = ['name','serial_number','make','model','caliber','purchase_date','purchase_amount',
    'current_value','purchased_from','storage_location_id','status','category_id','notes','owner_id','is_private'];
  
  const updates = [];
  const values = [];
  let i = 1;

  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = $${i++}`);
      values.push(req.body[f] === '' ? null : req.body[f]);
    }
  }
  if (!updates.length && req.body.tags === undefined) return res.status(400).json({ error: 'No fields to update' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (updates.length) {
      values.push(req.params.id);
      const result = await client.query(
        `UPDATE items SET ${updates.join(', ')} WHERE id = $${i} RETURNING id`,
        values
      );
      if (!result.rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Item not found' }); }
    }

    // Update tags if provided
    if (req.body.tags !== undefined) {
      await client.query('DELETE FROM item_tags WHERE item_id = $1', [req.params.id]);
      for (const tagName of req.body.tags) {
        const trimmed = tagName.trim();
        if (!trimmed) continue;
        let tagResult = await client.query('SELECT id FROM tags WHERE name = $1', [trimmed]);
        if (!tagResult.rows.length) {
          tagResult = await client.query('INSERT INTO tags (name) VALUES ($1) RETURNING id', [trimmed]);
        }
        await client.query('INSERT INTO item_tags (item_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.params.id, tagResult.rows[0].id]);
      }
    }

    await client.query('COMMIT');
    const full = await pool.query(itemQuery('WHERE i.id = $1'), [req.params.id]);
    res.json(full.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// DELETE /api/items/:id
router.delete('/:id', async (req, res) => {
  try {
    // Delete associated images from disk
    const images = await pool.query('SELECT filename FROM item_images WHERE item_id = $1', [req.params.id]);
    for (const img of images.rows) {
      const imgPath = path.join(uploadDir, img.filename);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }
    const result = await pool.query('DELETE FROM items WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Item not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/items/:id/images
router.post('/:id/images', upload.array('images', 10), async (req, res) => {
  if (!req.files?.length) return res.status(400).json({ error: 'No files uploaded' });
  try {
    const inserted = [];
    for (const file of req.files) {
      const result = await pool.query(
        'INSERT INTO item_images (item_id, filename, original_name, mime_type, size) VALUES ($1,$2,$3,$4,$5) RETURNING *',
        [req.params.id, file.filename, file.originalname, file.mimetype, file.size]
      );
      inserted.push(result.rows[0]);
    }
    res.status(201).json(inserted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/items/:id/images/:imageId
router.delete('/:id/images/:imageId', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM item_images WHERE id = $1 AND item_id = $2 RETURNING filename',
      [req.params.imageId, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Image not found' });
    const imgPath = path.join(uploadDir, result.rows[0].filename);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
