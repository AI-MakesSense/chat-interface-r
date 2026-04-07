# Quick Start Guide - N8n Widget Designer

Get up and running with the N8n Widget Designer in **5 minutes**! This guide will walk you through creating and embedding your first chat widget.

## Prerequisites

- Node.js 18+ and pnpm installed
- PostgreSQL running locally
- 5 minutes of your time ⏱️

## Step 1: Environment Setup (1 minute)

```bash
# Clone or navigate to the project
cd "/Users/polinger.ai/Desktop/Projects/Chat Interfacer"

# Generate JWT secret
openssl rand -base64 32

# Create .env.local file (copy the example)
cp .env.example .env.local

# Edit .env.local and add these required variables:
# DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/n8n_widget_designer
# JWT_SECRET=<paste the output from openssl command above>
# NEXT_PUBLIC_URL=http://localhost:3000
# NODE_ENV=development
```

## Step 2: Database & Dependencies (2 minutes)

```bash
# Create database
createdb n8n_widget_designer

# Install dependencies
pnpm install

# Install widget dependencies
cd widget && pnpm install && pnpm build && cd ..

# Run database migrations
pnpm db:generate
pnpm db:migrate

# Seed demo data (creates test accounts and licenses)
pnpm db:seed
```

**Demo accounts created:**
- Email: `demo@example.com` / Password: `demo1234` (Pro tier)
- Email: `test@example.com` / Password: `password123` (Basic tier)
- Email: `agency@example.com` / Password: `agency1234` (Agency tier)

## Step 3: Start the Platform (30 seconds)

```bash
# Start the development server
pnpm dev

# Open your browser to: http://localhost:3000
```

## Step 4: Start Test Webhook (Optional, 30 seconds)

In a **new terminal window**, start the test webhook server:

```bash
# Start the test webhook server
node scripts/test-webhook.js

# This will run on: http://localhost:5678/webhook/chat
```

## Step 5: Try the Demo! (1 minute)

### Option A: Interactive Demo Tour
1. Visit **http://localhost:3000/demo**
2. Click through the interactive walkthrough
3. Explore the platform features

### Option B: Hands-On Testing
1. **Login**: Go to http://localhost:3000/auth/login
   - Email: `demo@example.com`
   - Password: `demo1234`

2. **Dashboard**: View your license and widgets
   - See your Pro license
   - Copy the embed code

3. **Configurator**: http://localhost:3000/configurator
   - Customize your widget
   - Change colors, fonts, and features
   - Preview on different devices
   - Save and deploy

4. **Download Packages**:
   - Download Website Package
   - Download Portal Package  
   - Download Chrome Extension

## Common Demo Flows

### Flow 1: Quick Widget Creation (2 minutes)

```bash
# 1. Login with demo account
# 2. Go to Configurator
# 3. Click "Branding" tab
#    - Company: "Acme Support"
#    - Welcome: "Hi! How can we help?"
# 4. Click "Theme" tab
#    - Primary Color: #0066FF
#    - Theme: Dark
# 5. Click "Connection" tab
#    - Webhook URL: http://localhost:5678/webhook/chat
# 6. Click "Save Changes"
# 7. Click "Deploy"
# 8. Done! Widget is ready
```

### Flow 2: Test Embedding (1 minute)

```bash
# 1. Create a test HTML file
cat > test-widget.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <title>Widget Test</title>
</head>
<body>
  <h1>My Test Page</h1>
  <p>Look for the chat widget in the bottom-right corner!</p>
  
  <!-- Get this from Dashboard → Copy Embed Code -->
  <script src="http://localhost:3000/api/widget/YOUR_LICENSE_KEY/chat-widget.js"></script>
</body>
</html>
EOF

# 2. Get your license key from the dashboard
# 3. Replace YOUR_LICENSE_KEY in the HTML file
# 4. Open test-widget.html in your browser
# 5. Widget appears in bottom-right corner!
```

### Flow 3: Download and Test Packages (2 minutes)

```bash
# 1. Go to Configurator
# 2. Scroll to "Download Widget Packages"
# 3. Click "Download Website Package"
# 4. Extract the ZIP file
# 5. Open index.html in your browser
# 6. Widget is fully functional!

# Try the Portal Package too:
# 1. Click "Download Portal Package"
# 2. Extract and open portal.html
# 3. See the fullscreen chat interface!

# And the Chrome Extension:
# 1. Click "Download Extension Package"
# 2. Extract to a folder
# 3. Open chrome://extensions
# 4. Enable "Developer mode"
# 5. Click "Load unpacked"
# 6. Select the extracted folder
# 7. Extension appears in Chrome toolbar!
```

## Testing the Widget

Once you have the webhook server running (`node scripts/test-webhook.js`):

1. **Configure webhook**: Set `http://localhost:5678/webhook/chat` in Connection tab
2. **Open widget**: Click the bubble in bottom-right
3. **Send message**: Type "Hello!" and press Enter
4. **See response**: The webhook echoes your message
5. **Check logs**: View webhook terminal for message logs

## What's Next?

### Explore More Features
- **Dashboard**: http://localhost:3000/dashboard - Manage licenses and domains
- **Configurator**: http://localhost:3000/configurator - 70+ customization options
- **Interactive Demo**: http://localhost:3000/demo - Guided walkthrough

### Read Full Documentation
- **[DEMOGUIDE.md](./DEMOGUIDE.md)** - Complete demo walkthrough (15 min)
- **[README.md](./README.md)** - Project overview and architecture
- **[docs/](./docs/)** - Detailed technical documentation

## Troubleshooting

### Database Connection Error
```bash
# Verify PostgreSQL is running
psql -U postgres -c "SELECT version();"

# Check your DATABASE_URL in .env.local
# Should be: postgresql://user:password@localhost:5432/n8n_widget_designer
```

### Widget Not Loading
```bash
# Check that domain is authorized
# 1. Go to Dashboard
# 2. Click "Add Domain"
# 3. Add: localhost:3000
# 4. Save changes
```

### Port Already in Use
```bash
# If port 3000 is busy, kill the process:
lsof -ti:3000 | xargs kill

# If port 5678 is busy (webhook):
lsof -ti:5678 | xargs kill
```

### Widget Preview Not Updating
```bash
# Hard refresh the browser
# Mac: Cmd + Shift + R
# Windows: Ctrl + Shift + R
```

## Need Help?

- **Full Demo Guide**: See [DEMOGUIDE.md](./DEMOGUIDE.md) for detailed instructions
- **Check Logs**: Look at terminal output for error messages
- **Database Issues**: Run `pnpm db:migrate` again
- **Fresh Start**: Drop database and re-run migrations

## One-Command Setup (Advanced)

If you're feeling adventurous, here's a one-liner to set everything up:

```bash
# WARNING: This drops existing database!
dropdb n8n_widget_designer 2>/dev/null; \
createdb n8n_widget_designer && \
pnpm db:generate && \
pnpm db:migrate && \
pnpm db:seed && \
echo "✅ Setup complete! Run 'pnpm dev' to start"
```

---

**Happy Building! 🚀**

For more detailed walkthroughs and advanced features, check out the full [DEMOGUIDE.md](./DEMOGUIDE.md).
