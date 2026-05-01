require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

// ── Safety checks on startup ───────────────────────────────────────────────
const JWT_DEFAULT = 'please-change-this-secret-in-production';
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === JWT_DEFAULT) {
  console.error('FATAL: JWT_SECRET is not set or is using the insecure default.');
  console.error('Set a strong random value in your .env file.');
  console.error('Generate one with: openssl rand -hex 64');
  process.exit(1);
}

const { testConnection } = require('./models/db');
const authRoutes     = require('./routes/auth');
const userRoutes     = require('./routes/users');
const itemRoutes     = require('./routes/items');
const locationRoutes = require('./routes/locations');
const categoryRoutes = require('./routes/categories');
const tagRoutes      = require('./routes/tags');
const dashboardRoutes= require('./routes/dashboard');
const exportRoutes   = require('./routes/export');
const backupRoutes   = require('./routes/backup');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Global rate limit (generous, just stops abuse) ─────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// ── Strict login rate limit ────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please wait 15 minutes and try again.' },
  skipSuccessfulRequests: true,
});

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(globalLimiter);

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth',       loginLimiter, authRoutes);
app.use('/api/users',      userRoutes);
app.use('/api/items',      itemRoutes);
app.use('/api/locations',  locationRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tags',       tagRoutes);
app.use('/api/dashboard',  dashboardRoutes);
app.use('/api/export',     exportRoutes);
app.use('/api/backup',     backupRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Error handler ─────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

async function start() {
  await testConnection();
  app.listen(PORT, () => console.log(`FamilyVault API running on port ${PORT}`));
}

start();
