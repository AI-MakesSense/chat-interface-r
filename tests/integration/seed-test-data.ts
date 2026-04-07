/**
 * Seed test data for integration tests
 */
import { db } from '../../lib/db/client';
import { licenses, widgets, users } from '../../lib/db/schema';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const TEST_WIDGET_ID = '123e4567-e89b-12d3-a456-426614174000';
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';
const TEST_LICENSE_KEY = 'test-license-key-12345';

async function seedTestData() {
    console.log('Seeding test data...');

    // Delete existing test data if exists
    console.log('Cleaning up existing test data...');
    await db.delete(widgets).where(eq(widgets.id, TEST_WIDGET_ID));

    // Find and delete existing user by email (may have different ID)
    const existingUsers = await db.select().from(users).where(eq(users.email, 'test@example.com'));
    if (existingUsers.length > 0) {
        const userId = existingUsers[0].id;
        console.log('Found existing user:', userId);
        // Delete licenses first (foreign key constraint)
        const deletedLicenses = await db.delete(licenses).where(eq(licenses.userId, userId)).returning();
        console.log('Deleted', deletedLicenses.length, 'existing licenses');
        // Then delete user
        await db.delete(users).where(eq(users.email, 'test@example.com'));
        console.log('Deleted existing user');
    }

    // Create a test user
    const [testUser] = await db.insert(users).values({
        id: TEST_USER_ID,
        email: 'test@example.com',
        passwordHash: 'test-hash',
    }).returning();

    console.log('Created test user:', testUser.id);

    // Create a test license
    const [testLicense] = await db.insert(licenses).values({
        userId: testUser.id,
        licenseKey: TEST_LICENSE_KEY,
        tier: 'pro',
        status: 'active',
        domainLimit: 10,
        widgetLimit: 5,
        brandingEnabled: false,
    }).returning();

    console.log('Created test license:', testLicense.id);

    // Create a test widget
    const [testWidget] = await db.insert(widgets).values({
        id: TEST_WIDGET_ID,
        licenseId: testLicense.id,
        name: 'Test Widget',
        status: 'active',
        config: {
            connection: {
                webhookUrl: 'https://n8n.example.com/webhook/test',
            },
        },
    }).returning();

    console.log('Created test widget:', testWidget.id);
    console.log('Test data seeded successfully!');
    console.log('---');
    console.log('Test Widget ID:', testWidget.id);
    console.log('Test License Key:', testLicense.licenseKey);
}

seedTestData()
    .then(() => {
        console.log('Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Error seeding test data:', error);
        process.exit(1);
    });
