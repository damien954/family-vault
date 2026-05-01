require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../models/db');

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Users
    const adminHash = await bcrypt.hash('Admin1234!', 12);
    const adminR    = await client.query(
      `INSERT INTO users (email, password_hash, name, is_admin)
       VALUES ('admin@familyvault.local', $1, 'Admin User', true)
       ON CONFLICT (email) DO UPDATE SET password_hash=$1 RETURNING id`,
      [adminHash]
    );
    const adminId = adminR.rows[0].id;

    const userHash = await bcrypt.hash('User1234!', 12);
    const userR    = await client.query(
      `INSERT INTO users (email, password_hash, name, is_admin)
       VALUES ('user@familyvault.local', $1, 'Family Member', false)
       ON CONFLICT (email) DO UPDATE SET password_hash=$1 RETURNING id`,
      [userHash]
    );
    const userId = userR.rows[0].id;

    // Locations
    const locs = ['Gun Safe', 'Bedroom Closet', 'Office Safe', 'Storage Unit', 'Display Case'];
    const locIds = {};
    for (const loc of locs) {
      const r = await client.query(
        `INSERT INTO storage_locations (name, created_by) VALUES ($1,$2)
         ON CONFLICT DO NOTHING RETURNING id`,
        [loc, adminId]
      );
      if (r.rows.length) locIds[loc] = r.rows[0].id;
    }

    // Categories (firearm types only)
    const cats = ['Handgun', 'Rifle', 'Shotgun'];
    const catIds = {};
    for (const cat of cats) {
      const r = await client.query(
        `INSERT INTO categories (name, created_by) VALUES ($1,$2)
         ON CONFLICT (name) DO UPDATE SET name=$1 RETURNING id`,
        [cat, adminId]
      );
      catIds[cat] = r.rows[0].id;
    }

    // Tags
    const tagNames = ['Self Defense', 'Competition', 'Hunting', 'Collector', 'Home Defense'];
    const tagIds = {};
    for (const tag of tagNames) {
      const r = await client.query(
        `INSERT INTO tags (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name=$1 RETURNING id`,
        [tag]
      );
      tagIds[tag] = r.rows[0].id;
    }

    // Sample items
    const items = [
      { make:'Glock', model:'19 Gen 5', caliber:'9mm', sn:'BXXD123', date:'2022-03-15', paid:589, value:550, from:'Local Gun Store', loc:'Gun Safe', cat:'Handgun', owner:adminId, priv:false, tags:['Self Defense','Home Defense'] },
      { make:'Sig Sauer', model:'P365', caliber:'9mm', sn:'66B123456', date:'2023-01-20', paid:649, value:620, from:'Online Dealer', loc:'Bedroom Closet', cat:'Handgun', owner:userId, priv:false, tags:['Self Defense'] },
      { make:'Palmetto State Armory', model:'M4', caliber:'5.56 NATO / .223 Rem', sn:'PSA987654', date:'2021-07-04', paid:799, value:750, from:'PSA Direct', loc:'Gun Safe', cat:'Rifle', owner:adminId, priv:false, tags:['Home Defense','Competition'] },
      { make:'Mossberg', model:'500 Tactical', caliber:'12 Gauge', sn:'M500XYZ', date:'2020-11-28', paid:420, value:400, from:'Sporting Goods Store', loc:'Office Safe', cat:'Shotgun', owner:adminId, priv:false, tags:['Home Defense','Hunting'] },
      { make:'Ruger', model:'10/22 Carbine', caliber:'.22 LR', sn:'RUG10225', date:'2023-06-01', paid:329, value:310, from:'Local Gun Store', loc:'Gun Safe', cat:'Rifle', owner:userId, priv:false, tags:['Hunting'] },
    ];

    for (const item of items) {
      const r = await client.query(
        `INSERT INTO items (name, serial_number, make, model, caliber, purchase_date, purchase_amount,
          current_value, purchased_from, storage_location_id, status, category_id, owner_id, is_private, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'Active',$11,$12,$13,$14) RETURNING id`,
        [
          `${item.make} ${item.model}`, item.sn, item.make, item.model, item.caliber,
          item.date, item.paid, item.value, item.from,
          locIds[item.loc], catIds[item.cat], item.owner, item.priv, adminId,
        ]
      );
      const itemId = r.rows[0].id;
      for (const tag of item.tags) {
        if (tagIds[tag]) {
          await client.query('INSERT INTO item_tags (item_id,tag_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [itemId, tagIds[tag]]);
        }
      }
    }

    await client.query('COMMIT');
    console.log('✅ Seed data inserted');
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
