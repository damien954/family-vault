# 🔒 FamilyVault

A self-hosted, Dockerized web application for managing a personal or family inventory of sensitive assets — built for documentation and insurance purposes.

---

## ✨ Features

- **Multi-user** — Admin-created accounts with shared and private inventories
- **Full inventory CRUD** — Name, serial number, make, model, caliber, purchase info, value, and more
- **Image uploads** — Attach multiple photos per item for insurance records
- **Dashboard** — Live stats: total items, total value, breakdown by status and location
- **Search & filter** — By name, serial, status, category, location; sort by value or date
- **CSV / Excel export** — One-click inventory export
- **Storage locations & categories** — User-managed reference lists
- **Custom tags** — Free-form tagging per item
- **Private items** — Items marked private are only visible to their owner
- **Responsive UI** — Works on desktop and mobile

---

## 🚀 Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)

### 1. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set:
- `DB_PASSWORD` — a strong database password
- `JWT_SECRET` — a long random string (generate with `openssl rand -hex 64`)

### 2. Start the app

```bash
docker compose up -d --build
```

This starts:
- **PostgreSQL** on an internal network
- **Node.js API** on port 3001 (internal)
- **Nginx + React** on port **80** (or `PORT` from your `.env`)

### 3. Seed demo data (optional)

```bash
docker compose exec backend npm run seed
```

This creates two demo accounts:

| Email | Password | Role |
|-------|----------|------|
| `admin@familyvault.local` | `Admin1234!` | Admin |
| `user@familyvault.local` | `User1234!` | Member |

### 4. Open the app

Visit [http://localhost](http://localhost) in your browser.

---

## 🏗️ Architecture

```
familyvault/
├── docker-compose.yml       # Orchestration
├── .env.example             # Environment template
│
├── db/
│   └── schema.sql           # PostgreSQL schema (auto-runs on first start)
│
├── backend/                 # Node.js + Express REST API
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js         # App entry point
│       ├── middleware/
│       │   └── auth.js      # JWT authentication
│       ├── models/
│       │   └── db.js        # PostgreSQL pool
│       ├── routes/
│       │   ├── auth.js      # Login, /me
│       │   ├── users.js     # User management (admin)
│       │   ├── items.js     # Inventory CRUD + images
│       │   ├── locations.js # Storage locations CRUD
│       │   ├── categories.js
│       │   ├── tags.js
│       │   ├── dashboard.js # Stats aggregation
│       │   └── export.js    # CSV + Excel export
│       └── utils/
│           └── seed.js      # Development seed data
│
└── frontend/                # React 18 SPA
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    └── src/
        ├── App.jsx
        ├── api/
        │   └── client.js    # Axios + all API methods
        ├── store/
        │   └── auth.js      # Auth context
        ├── components/
        │   ├── common/      # Btn, Toast, ConfirmDialog
        │   ├── layout/      # Sidebar layout
        │   └── inventory/   # ItemFormModal
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── DashboardPage.jsx
        │   ├── InventoryPage.jsx
        │   ├── ItemDetailPage.jsx
        │   ├── LocationsPage.jsx
        │   ├── CategoriesPage.jsx
        │   └── UsersPage.jsx
        └── styles/
            └── global.css
```

---

## 🗄️ Database Schema

```
users
  └─< items >── storage_locations
           >── categories
           >── item_tags >── tags
           <── item_images
```

Key tables:
- **users** — Accounts with bcrypt password hashing
- **items** — Core inventory with all asset fields
- **storage_locations** — User-defined storage places
- **categories** — Item types (Handgun, Rifle, etc.)
- **tags** — Free-form labels (many-to-many with items)
- **item_images** — Image metadata (files stored in Docker volume)

---

## 🔧 Common Operations

### View logs
```bash
docker compose logs -f backend
docker compose logs -f frontend
```

### Restart a service
```bash
docker compose restart backend
```

### Stop everything
```bash
docker compose down
```

### Stop and delete all data (⚠️ destructive)
```bash
docker compose down -v
```

### Backup the database
```bash
docker compose exec postgres pg_dump -U familyvault familyvault > backup_$(date +%Y%m%d).sql
```

### Restore a backup
```bash
cat backup_20240115.sql | docker compose exec -T postgres psql -U familyvault familyvault
```

### Add a user via API (curl)
```bash
# First, get a token
TOKEN=$(curl -s -X POST http://localhost/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@familyvault.local","password":"Admin1234!"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# Create a new user
curl -X POST http://localhost/api/users \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"New Member","email":"member@example.com","password":"SecurePass1!","is_admin":false}'
```

---

## 🔐 Security Notes

- Passwords are hashed with bcrypt (12 rounds)
- JWT tokens expire after 7 days
- Private items are enforced server-side
- No public registration — all accounts are admin-created
- For production, put behind a VPN or add HTTPS via a reverse proxy (Caddy, Traefik, Nginx Proxy Manager)

---

## 🔮 Future Improvements

- [ ] HTTPS with Caddy or Traefik as reverse proxy
- [ ] PDF export with insurance-style item reports
- [ ] Barcode / QR code scanning on mobile
- [ ] Value history tracking over time
- [ ] Email notifications for value changes
- [ ] OIDC / SSO integration (Authentik, Keycloak)
- [ ] Audit log (who changed what, when)
- [ ] Bulk import via CSV upload

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Query, React Router, Recharts |
| Backend | Node.js, Express |
| Database | PostgreSQL 16 |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Images | Multer (local disk) |
| Export | SheetJS (xlsx) |
| Serving | Nginx |
| Container | Docker + Docker Compose |
