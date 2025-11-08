# N8n Widget Designer Platform

A SaaS platform that enables users to visually design, customize, and deploy embeddable chat widgets for N8n workflows without writing code.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL database (Vercel Postgres recommended)
- OpenSSL (for generating secrets)

### Installation

1. **Clone and install dependencies:**
```bash
cd n8n-widget-designer
pnpm install
```

2. **Setup environment variables:**
```bash
# Generate a JWT secret
openssl rand -base64 32

# Copy .env.example to .env.local
cp .env.example .env.local

# Edit .env.local and add:
# - DATABASE_URL (from Vercel Postgres)
# - JWT_SECRET (generated above)
```

3. **Setup database:**
```bash
# Generate migration files
pnpm db:generate

# Run migrations
pnpm db:migrate
```

4. **Start development server:**
```bash
pnpm dev
```

Visit http://localhost:3000

## 📋 Development Status

✅ **Phase 1 Complete:** Foundation (Auth, Database, Core APIs)

Next: Phase 2 - License system, Stripe integration, Email system

See [TODO.md](../TODO.md) for full roadmap.
