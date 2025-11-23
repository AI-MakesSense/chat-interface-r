#!/usr/bin/env node

/**
 * Test Webhook Server for N8n Widget Demo
 * 
 * This simple Express server simulates an n8n webhook endpoint
 * for testing the chat widget functionality.
 * 
 * Usage:
 *   node scripts/test-webhook.js
 * 
 * The server will run on http://localhost:5678/webhook/chat
 */

const express = require('express');
const cors = require('cors');
const app = express();

const PORT = 5678;

// Middleware
app.use(cors());
app.use(express.json());

// Sample AI-like responses
const responses = [
    "That's a great question! Let me help you with that.",
    "I understand what you're looking for. Here's what I can tell you...",
    "Thanks for reaching out! I'm here to assist you.",
    "Interesting! Let me provide some information about that.",
    "I appreciate you asking. Here's my response...",
    "Great to hear from you! Let's work through this together.",
];

// Webhook endpoint
app.post('/webhook/chat', (req, res) => {
    const { message, sessionId, timestamp, context } = req.body;

    console.log('\n' + '='.repeat(60));
    console.log('📨 Incoming Message');
    console.log('='.repeat(60));
    console.log('Time:', new Date().toISOString());
    console.log('Session:', sessionId || 'N/A');
    console.log('Message:', message || 'N/A');

    if (context) {
        console.log('Context:', JSON.stringify(context, null, 2));
    }

    console.log('='.repeat(60) + '\n');

    // Simulate a small delay
    setTimeout(() => {
        // Pick a random response and include the echo
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        const responseText = message
            ? `${randomResponse}\n\nYou said: "${message}"`
            : randomResponse;

        res.json({
            response: responseText,
            timestamp: new Date().toISOString(),
            sessionId: sessionId || 'test-session',
        });

        console.log('✅ Response sent:', responseText.substring(0, 50) + '...\n');
    }, 500); // 500ms delay to simulate processing
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint with instructions
app.get('/', (req, res) => {
    res.json({
        message: 'N8n Widget Test Webhook Server',
        endpoints: {
            webhook: 'POST /webhook/chat',
            health: 'GET /health',
        },
        usage: 'Configure your widget to use: http://localhost:5678/webhook/chat',
    });
});

// Start server
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log('✅ Test Webhook Server Running!');
    console.log('='.repeat(60));
    console.log(`📍 Webhook URL: http://localhost:${PORT}/webhook/chat`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    console.log('='.repeat(60));
    console.log('\n💡 Configuration Instructions:');
    console.log('   1. Go to the Widget Configurator');
    console.log('   2. Navigate to the "Connection" tab');
    console.log(`   3. Set webhook URL to: http://localhost:${PORT}/webhook/chat`);
    console.log('   4. Save and deploy your widget');
    console.log('   5. Test by sending a message!');
    console.log('\n📝 All incoming messages will be logged below:\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down webhook server...');
    process.exit(0);
});
