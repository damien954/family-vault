require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../models/db');

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Admin user
    const adminHash = await bcrypt.hash('Admin1234!', 12);
    const adminResult = await client.query(
      `INSERT INTO users (email, password_hash, name, is_admin)
       VALUES ('admin@familyvault.local', $1, 'Admin User', true)
       ON CONFLICT (email) DO UPDATE SET password_hash = $1
       RETURNING id`,
      [adminHash]
    );
    const adminId = adminResult.rows[0].id;

    // Regular user
    const userHash = await bcrypt.hash('User1234!', 12);
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, name, is_admin)
       VALUES ('user@familyvault.local', $1, 'Family Member', false)
       ON CONFLICT (email) DO UPDATE SET password_hash = $1
       RETURNING id`,
      [userHash]
    );
    const userId = userResult.rows[0].id;

    // Storage locations
    const locations = ['Gun Safe', 'Bedroom Closet', 'Office Safe', 'Storage Unit', 'Display Case'];
    const locationIds = {};
    for (const loc of locations) {
      const r = await client.query(
        `INSERT INTO storage_locations (name, created_by) VALUES ($1, $2)
         ON CONFLICT DO NOTHING RETURNING id`,
        [loc, adminId]
      );
      if (r.rows.length) locationIds[loc] = r.rows[0].id;
    }

    // Categories
    const categories = ['Handgun', 'Rifle', 'Shotgun', 'Accessories', 'Ammunition', 'Optics'];
    const categoryIds = {};
    for (const cat of categories) {
      const r = await client.query(
        `INSERT INTO categories (name, created_by) VALUES ($1, $2)
         ON CONFLICT (name) DO UPDATE SET name = $1 RETURNING id`,
        [cat, adminId]
      );
      categoryIds[cat] = r.rows[0].id;
    }

    // Tags
    const tagNames = ['Self Defense', 'Competition', 'Hunting', 'Collector', 'Home Defense'];
    const tagIds = {};
    for (const tag of tagNames) {
      const r = await client.query(
        `INSERT INTO tags (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = $1 RETURNING id`,
        [tag]
      );
      tagIds[tag] = r.rows[0].id;
    }

    // Sample items
    const items = [
      {
        name: 'Glock 19 Gen 5',
        serial_number: 'BXXD123',
        make: 'Glock',
        model: '19 Gen 5',
        caliber: '9mm',
        purchase_date: '2022-03-15',
        purchase_amount: 589,
        current_value: 550,
        purchased_from: 'Local Gun Store',
        location: 'Gun Safe',
        status: 'Active',
        category: 'Handgun',
        owner_id: adminId,
        is_private: false,
        tags: ['Self Defense', 'Home Defense']
      },
      {
        name: 'Sig Sauer P365',
        serial_number: '66B123456',
        make: 'Sig Sauer',
        model: 'P365',
        caliber: '9mm',
        purchase_date: '2023-01-20',
        purchase_amount: 649,
        current_value: 620,
        purchased_from: 'Online Dealer',
        location: 'Bedroom Closet',
        status: 'Active',
        category: 'Handgun',
        owner_id: userId,
        is_private: false,
        tags: ['Self Defense']
      },
      {
        name: 'AR-15 PSA M4',
        serial_number: 'PSA987654',
        make: 'Palmetto State Armory',
        model: 'M4',
        caliber: '5.56 NATO',
        purchase_date: '2021-07-04',
        purchase_amount: 799,
        current_value: 750,
        purchased_from: 'PSA Direct',
        location: 'Gun Safe',
        status: 'Active',
        category: 'Rifle',
        owner_id: adminId,
        is_private: false,
        tags: ['Home Defense', 'Competition']
      },
      {
        name: 'Mossberg 500',
        serial_number: 'M500XYZ',
        make: 'Mossberg',
        model: '500 Tactical',
        caliber: '12 Gauge',
        purchase_date: '2020-11-28',
        purchase_amount: 420,
        current_value: 400,
        purchased_from: 'Sporting Goods Store',
        location: 'Office Safe',
        status: 'Active',
        category: 'Shotgun',
        owner_id: adminId,
        is_private: false,
        tags: ['Home Defense', 'Hunting']
      },
      {
        name: 'Vortex Viper PST Gen II',
        serial_number: 'VPR789',
        make: 'Vortex',
        model: 'Viper PST Gen II 5-25x50',
        caliber: null,
        purchase_date: '2022-09-10',
        purchase_amount: 1199,
        current_value: 1050,
        purchased_from: 'Vortex Optics',
        location: 'Gun Safe',
        status: 'Active',
        category: 'Optics',
        owner_id: adminId,
        is_private: false,
        tags: ['Competition', 'Collector']
      }
    ];

    for (const item of items) {
      const r = await client.query(
        `INSERT INTO items (name, serial_number, make, model, caliber, purchase_date, purchase_amount,
          current_value, purchased_from, storage_location_id, status, category_id, owner_id, is_private, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`,
        [
          item.name, item.serial_number, item.make, item.model, item.caliber,
          item.purchase_date, item.purchase_amount, item.current_value, item.purchased_from,
          locationIds[item.location], item.status, categoryIds[item.category],
          item.owner_id, item.is_private, adminId
        ]
      );
      const itemId = r.rows[0].id;
      for (const tag of item.tags || []) {
        if (tagIds[tag]) {
          await client.query(
            'INSERT INTO item_tags (item_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [itemId, tagIds[tag]]
          );
        }
      }
    }

    await client.query('COMMIT');
    console.log('✅ Seed data inserted successfully');
    console.log('👤 Admin: admin@familyvault.local / Admin1234!');
    console.log('👤 User:  user@familyvault.local  / User1234!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
