/**
 * Simple test to verify relay configuration injection
 */
import { injectLicenseFlags } from '@/lib/widget/inject';
import type { License } from '@/lib/db/schema';

// Mock bundle with markers
const mockBundle = `
// Some widget code
// __START_LICENSE_FLAGS__
// __END_LICENSE_FLAGS__
// More widget code
`;

// Mock license
const mockLicense: License = {
    id: 'license-123',
    userId: 'user-123',
    licenseKey: 'test-license-key-12345',
    tier: 'pro',
    domains: ['example.com'],
    domainLimit: 3,
    widgetLimit: 3,
    brandingEnabled: false,
    status: 'active',
    stripeSubscriptionId: null,
    stripeCustomerId: null,
    expiresAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
};

console.log('Testing relay configuration injection...\n');

// Test 1: Without widget ID
console.log('Test 1: Injection without widget ID');
const bundleWithoutRelay = injectLicenseFlags(mockBundle, mockLicense);
console.log('Contains N8N_LICENSE_FLAGS:', bundleWithoutRelay.includes('window.N8N_LICENSE_FLAGS'));
console.log('Contains ChatWidgetConfig.relay:', bundleWithoutRelay.includes('window.ChatWidgetConfig.relay'));
console.log('Expected: true, false\n');

// Test 2: With widget ID
console.log('Test 2: Injection with widget ID');
const bundleWithRelay = injectLicenseFlags(mockBundle, mockLicense, '123e4567-e89b-12d3-a456-426614174000');
console.log('Contains N8N_LICENSE_FLAGS:', bundleWithRelay.includes('window.N8N_LICENSE_FLAGS'));
console.log('Contains ChatWidgetConfig.relay:', bundleWithRelay.includes('window.ChatWidgetConfig.relay'));
console.log('Contains relayUrl:', bundleWithRelay.includes('/api/chat-relay'));
console.log('Contains widgetId:', bundleWithRelay.includes('123e4567-e89b-12d3-a456-426614174000'));
console.log('Contains licenseKey:', bundleWithRelay.includes('test-license-key-12345'));
console.log('Expected: true, true, true, true, true\n');

// Print the injected relay config
console.log('Injected content:');
console.log(bundleWithRelay);
