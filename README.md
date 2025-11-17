# N8n Widget Designer Platform

A complete SaaS platform that enables users to visually design, customize, and deploy embeddable chat widgets for N8n workflows without writing code.

## ✨ Features

### 🎯 Widget Design & Configuration
- **Visual Configurator** - 70+ customization options with real-time preview
- **Multi-Device Preview** - Desktop, Mobile, and Tablet views
- **Theme System** - Light/Dark themes with custom color schemes
- **Branding Controls** - Company logos, welcome messages, and custom styling
- **Position & Layout** - Corner radius, positioning, and responsive design

### 🚀 Widget Deployment & Distribution
- **Version Control** - Track widget configurations with deployment history
- **Package Downloads** - Generate ready-to-deploy packages:
  - **Website Package** - HTML + JS + README for direct embedding
  - **Portal Package** - Standalone HTML for dedicated chat pages
  - **Chrome Extension** - Ready-to-use browser extension
- **Widget Serving** - Secure embeddable JavaScript with rate limiting
- **Portal Mode** - Fullscreen chat experience for dedicated pages

### 💬 Advanced Chat Features
- **Session Management** - Persistent chat sessions with conversation history
- **File Attachments** - Upload and share files (PDF, images, documents)
- **Context Capture** - Automatically capture page URL and query parameters
- **Custom Context** - User-defined metadata for enhanced personalization
- **Extra Inputs** - Additional form fields and data collection
- **Real-time Messaging** - WebSocket-based chat with n8n workflow integration

### 🔐 Authentication & Security
- **User Authentication** - JWT-based login/signup with secure sessions
- **License Management** - Three-tier system (Basic, Pro, Agency) with domain controls
- **Rate Limiting** - Built-in protection against abuse
- **CORS Security** - Proper cross-origin resource sharing configuration

### 🛠️ Technical Stack
- **Next.js 16** - Latest React framework with App Router
- **TypeScript** - Full type safety across frontend and backend
- **PostgreSQL** - Robust database with Drizzle ORM
- **Tailwind CSS** - Modern utility-first styling
- **Vite** - Fast widget bundling and optimization
- **Jest** - Comprehensive testing suite (95% coverage)

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

# Seed database with demo accounts (for local development)
pnpm db:seed
```

**Demo Accounts** (after running `pnpm db:seed`):
- `demo@example.com` / `demo1234` (Pro tier)
- `test@example.com` / `password123` (Basic tier)
- `agency@example.com` / `agency1234` (Agency tier)

4. **Start development server:**
```bash
pnpm dev
```

Visit http://localhost:3000

## 📋 Development Status

✅ **Phase 1 Complete:** Foundation (Auth, Database, Core APIs)
✅ **Phase 2 Complete:** Widget System (Configurator, Session Management, File Attachments)
✅ **Phase 3 Complete:** Deployment System (Portal Mode, Package Downloads, Zip Generation)
✅ **Phase 4 Complete:** Next.js 16 Migration (API Routes, Client-side Compatibility)

### 🎯 Current Capabilities
- **Widget Design**: Full visual configurator with 70+ options
- **Chat Features**: Sessions, attachments, context capture, custom metadata
- **Deployment**: Website packages, portal pages, Chrome extension ready
- **Authentication**: Complete user system with license management
- **Infrastructure**: Next.js 16 compatible with full TypeScript support

### 🚧 Next Development Priorities
- Stripe payment integration (schema ready)
- Email notifications (SendGrid configured)
- Admin dashboard for user management
- Advanced analytics and reporting

**Important**: For local development, run `pnpm db:seed` after database setup to populate demo accounts for testing.

### 🧪 Testing Coverage
- **95% Test Coverage**: 1400+ passing tests across frontend, backend, and widget
- **End-to-End Testing**: Complete API and widget functionality verified
- **Type Safety**: Full TypeScript implementation with strict mode

## 🎮 Demo Experience

### Try It Yourself
1. **Login** with demo accounts at http://localhost:3000/auth/login
2. **Configure** your widget using the visual configurator
3. **Preview** your design across different devices
4. **Deploy** your widget and download packages
5. **Test** the embedded widget with file attachments and chat features

### Widget Capabilities
- **Real-time Chat** - Connect to n8n workflows via webhooks
- **File Sharing** - Upload documents, images, and PDFs
- **Session Persistence** - Maintain conversation history
- **Responsive Design** - Works on all screen sizes
- **Custom Branding** - Match your website's look and feel

## 🛣️ Roadmap

See [TODO.md](../TODO.md) for detailed development roadmap and upcoming features.

## 📚 Additional Documentation

- [Demo Guide](./DEMOGUIDE.md) - Detailed walkthrough of all features
- [Codebase Audit](./CODEBASE_AUDIT_REPORT.md) - Technical analysis and architecture
- [API Documentation](./docs/api.md) - Complete API reference
