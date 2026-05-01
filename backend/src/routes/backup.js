const router = require('express').Router();
const { execFile } = require('child_process');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate, requireAdmin);

// GET /api/backup — download a pg_dump SQL file
router.get('/', (req, res) => {
  const {
    DB_HOST = 'postgres',
    DB_PORT = '5432',
    DB_NAME = 'familyvault',
    DB_USER = 'familyvault',
    DB_PASSWORD = '',
  } = process.env;

  const timestamp = new Date().toISOString().slice(0, 10);
  const filename  = `familyvault-backup-${timestamp}.sql`;

  res.setHeader('Content-Type', 'application/sql');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const env = { ...process.env, PGPASSWORD: DB_PASSWORD };

  const pg_dump = execFile(
    'pg_dump',
    [
      '-h', DB_HOST,
      '-p', DB_PORT,
      '-U', DB_USER,
      '-d', DB_NAME,
      '--no-password',
      '--format=plain',
      '--clean',
      '--if-exists',
    ],
    { env, maxBuffer: 100 * 1024 * 1024 },
    (err) => {
      if (err) {
        console.error('pg_dump failed:', err.message);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Backup failed: ' + err.message });
        }
      }
    }
  );

  pg_dump.stdout.pipe(res);
  pg_dump.stderr.on('data', (d) => console.error('pg_dump stderr:', d.toString()));
});

module.exports = router;
