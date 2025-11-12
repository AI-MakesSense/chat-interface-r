/**
 * RED Tests for Session Manager
 *
 * Tests for widget/src/services/messaging/session-manager.ts
 *
 * WHY THESE TESTS WILL FAIL:
 * - Production module does not exist yet (widget/src/services/messaging/session-manager.ts)
 * - SessionManager class is not implemented
 * - This is the RED phase of TDD - tests are written BEFORE production code
 *
 * Test Coverage:
 * 1. Generate new UUID when no existing session
 * 2. Restore session ID from sessionStorage
 * 3. Reset session and generate new ID
 * 4. Scope session to licenseId (multiple widgets isolated)
 *
 * Module Purpose:
 * - Manages session ID lifecycle for widget-N8n communication
 * - Generates UUID v4 for new sessions
 * - Persists session ID in sessionStorage (scoped by licenseId)
 * - Enables session reset for testing/debugging
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
// @ts-expect-error - Module does not exist yet (RED phase)
import { SessionManager } from '@/widget/src/services/messaging/session-manager';

describe('SessionManager - RED Tests', () => {
  beforeEach(() => {
    // Clear sessionStorage before each test
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  // ============================================================
  // Test 1: Generate new UUID when no existing session
  // ============================================================

  it('should generate new UUID when no existing session', () => {
    // ARRANGE
    const licenseId = 'test-license-123';
    const sessionManager = new SessionManager(licenseId);

    // ACT
    const sessionId = sessionManager.getSessionId();

    // ASSERT
    // Verify UUID v4 format (8-4-4-4-12 hexadecimal pattern)
    expect(sessionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );

    // Verify session is stored in sessionStorage with license-scoped key
    const storedId = sessionStorage.getItem('chat-widget-session-test-license-123');
    expect(storedId).toBe(sessionId);

    // Verify hasSession returns true after generation
    expect(sessionManager.hasSession()).toBe(true);
  });

  // ============================================================
  // Test 2: Restore session ID from sessionStorage
  // ============================================================

  it('should restore session ID from sessionStorage', () => {
    // ARRANGE
    const licenseId = 'test-license-456';
    const existingSessionId = 'a1b2c3d4-e5f6-4789-a012-3456789abcde';

    // Pre-populate sessionStorage with existing session
    sessionStorage.setItem(
      'chat-widget-session-test-license-456',
      existingSessionId
    );

    // ACT
    const sessionManager = new SessionManager(licenseId);
    const sessionId = sessionManager.getSessionId();

    // ASSERT
    // Should return existing session ID, not generate new one
    expect(sessionId).toBe(existingSessionId);

    // Verify hasSession returns true
    expect(sessionManager.hasSession()).toBe(true);

    // Verify session start time is set
    const startTime = sessionManager.getSessionStartTime();
    expect(startTime).toBeInstanceOf(Date);
    expect(startTime.getTime()).toBeLessThanOrEqual(Date.now());
  });

  // ============================================================
  // Test 3: Reset session and generate new ID
  // ============================================================

  it('should reset session and generate new ID', () => {
    // ARRANGE
    const licenseId = 'test-license-789';
    const sessionManager = new SessionManager(licenseId);
    const firstSessionId = sessionManager.getSessionId();

    // ACT
    sessionManager.resetSession();
    const newSessionId = sessionManager.getSessionId();

    // ASSERT
    // New session ID should be different from first
    expect(newSessionId).not.toBe(firstSessionId);

    // Both should be valid UUIDs
    expect(firstSessionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
    expect(newSessionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );

    // Verify new session is stored in sessionStorage
    const storedId = sessionStorage.getItem('chat-widget-session-test-license-789');
    expect(storedId).toBe(newSessionId);

    // Verify session start time is updated
    const startTime = sessionManager.getSessionStartTime();
    expect(startTime).toBeInstanceOf(Date);
    expect(startTime.getTime()).toBeLessThanOrEqual(Date.now());
  });

  // ============================================================
  // Test 4: Scope session to licenseId (multiple widgets isolated)
  // ============================================================

  it('should scope session to licenseId (multiple widgets isolated)', () => {
    // ARRANGE
    const licenseId1 = 'license-widget-1';
    const licenseId2 = 'license-widget-2';

    const sessionManager1 = new SessionManager(licenseId1);
    const sessionManager2 = new SessionManager(licenseId2);

    // ACT
    const sessionId1 = sessionManager1.getSessionId();
    const sessionId2 = sessionManager2.getSessionId();

    // ASSERT
    // Sessions should be different (independent)
    expect(sessionId1).not.toBe(sessionId2);

    // Both should be valid UUIDs
    expect(sessionId1).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
    expect(sessionId2).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );

    // Verify each session is stored with separate keys
    const stored1 = sessionStorage.getItem('chat-widget-session-license-widget-1');
    const stored2 = sessionStorage.getItem('chat-widget-session-license-widget-2');

    expect(stored1).toBe(sessionId1);
    expect(stored2).toBe(sessionId2);

    // Verify hasSession is independent
    expect(sessionManager1.hasSession()).toBe(true);
    expect(sessionManager2.hasSession()).toBe(true);

    // Verify resetting one session doesn't affect the other
    sessionManager1.resetSession();
    const newSessionId1 = sessionManager1.getSessionId();

    expect(newSessionId1).not.toBe(sessionId1);
    expect(sessionManager2.getSessionId()).toBe(sessionId2); // Unchanged
  });
});
