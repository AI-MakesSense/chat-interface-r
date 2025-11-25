/**
 * Script to create a test user with unlimited agency license
 * Usage: npx tsx scripts/create-test-user.ts
 */

import { db } from '../lib/db';
import { users, licenses } from '../lib/db/schema';
import { hashPassword } from '../lib/auth/password';
import { randomBytes } from 'crypto';

async function createTestUser() {
    const email = 'etan@polinger.ai';
    const password = 'MakesSense';
    const name = 'Etan Polinger (Test)';

    console.log('Creating test user...');

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, email),
    });

    let userId: string;

    if (existingUser) {
        console.log(`User ${email} already exists with ID: ${existingUser.id}`);
        userId = existingUser.id;
    } else {
        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user
        const [newUser] = await db.insert(users).values({
            email,
            passwordHash,
            name,
            emailVerified: true, // Auto-verify for test account
        }).returning();

        userId = newUser.id;
        console.log(`Created user ${email} with ID: ${userId}`);
    }

    // Generate license key (32-char hex)
    const licenseKey = randomBytes(16).toString('hex');

    // Create agency license (unlimited domains and widgets)
    const [license] = await db.insert(licenses).values({
        userId,
        licenseKey,
        tier: 'agency',
        domains: [], // Empty array = no restrictions
        domainLimit: -1, // -1 = unlimited
        widgetLimit: -1, // -1 = unlimited
        brandingEnabled: false, // White-label
        status: 'active',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    }).returning();

    console.log('\n✅ Test account created successfully!');
    console.log('\nLogin Credentials:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`\nLicense Details:`);
    console.log(`License Key: ${licenseKey}`);
    console.log(`Tier: agency (unlimited domains & widgets)`);
    console.log(`Status: active`);
    console.log(`Expires: ${license.expiresAt?.toLocaleDateString()}`);
    console.log(`\nYou can now log in at http://localhost:3001/auth/login`);
}

createTestUser()
    .then(() => {
        console.log('\nDone!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Error creating test user:', error);
        process.exit(1);
    });
