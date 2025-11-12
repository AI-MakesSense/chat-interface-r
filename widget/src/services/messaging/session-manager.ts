/**
 * Session Manager
 *
 * Purpose: Manage chat session ID lifecycle for widget-N8n communication
 *
 * Responsibility:
 * - Generate UUID v4 session IDs for new sessions
 * - Persist session IDs in sessionStorage (scoped by licenseId)
 * - Restore existing sessions from storage
 * - Enable session reset for testing/debugging
 * - Track session start time
 *
 * Assumptions:
 * - Browser supports sessionStorage API
 * - Each license ID has an independent session
 * - Sessions persist only for the browser tab lifetime
 */

import { generateSessionId } from '../../utils/session-id-generator';

/**
 * Session storage key prefix
 */
const SESSION_STORAGE_PREFIX = 'chat-widget-session-';

/**
 * Session start time storage key prefix
 */
const SESSION_START_TIME_PREFIX = 'chat-widget-session-start-';

/**
 * SessionManager class
 *
 * Manages session ID lifecycle for a specific license ID.
 * Each widget instance (identified by license ID) has an isolated session.
 */
export class SessionManager {
  private licenseId: string;
  private storageKey: string;
  private startTimeKey: string;
  private sessionId: string | null = null;
  private startTime: Date | null = null;

  /**
   * Creates a new SessionManager instance
   *
   * @param licenseId - The license ID to scope the session to
   */
  constructor(licenseId: string) {
    this.licenseId = licenseId;
    this.storageKey = `${SESSION_STORAGE_PREFIX}${licenseId}`;
    this.startTimeKey = `${SESSION_START_TIME_PREFIX}${licenseId}`;

    // Load existing session from storage if available
    this.loadSession();
  }

  /**
   * Loads existing session from sessionStorage
   *
   * @private
   */
  private loadSession(): void {
    const storedSessionId = sessionStorage.getItem(this.storageKey);
    const storedStartTime = sessionStorage.getItem(this.startTimeKey);

    if (storedSessionId) {
      this.sessionId = storedSessionId;
      this.startTime = storedStartTime ? new Date(storedStartTime) : new Date();
    }
  }

  /**
   * Saves current session to sessionStorage
   *
   * @private
   */
  private saveSession(): void {
    if (this.sessionId) {
      sessionStorage.setItem(this.storageKey, this.sessionId);
      sessionStorage.setItem(
        this.startTimeKey,
        (this.startTime || new Date()).toISOString()
      );
    }
  }

  /**
   * Gets the current session ID
   *
   * Generates a new UUID v4 if no session exists, otherwise returns the existing session ID.
   *
   * @returns The session ID string (UUID v4 format)
   */
  getSessionId(): string {
    if (!this.sessionId) {
      this.sessionId = generateSessionId();
      this.startTime = new Date();
      this.saveSession();
    }

    return this.sessionId;
  }

  /**
   * Resets the current session
   *
   * Clears the existing session from storage and memory.
   * The next call to getSessionId() will generate a new session ID.
   *
   * Side effects:
   * - Removes session ID from sessionStorage
   * - Removes session start time from sessionStorage
   * - Clears in-memory session state
   */
  resetSession(): void {
    // Clear storage
    sessionStorage.removeItem(this.storageKey);
    sessionStorage.removeItem(this.startTimeKey);

    // Clear in-memory state
    this.sessionId = null;
    this.startTime = null;
  }

  /**
   * Checks if a session currently exists
   *
   * @returns true if a session exists in sessionStorage, false otherwise
   */
  hasSession(): boolean {
    return sessionStorage.getItem(this.storageKey) !== null;
  }

  /**
   * Gets the session start time
   *
   * @returns The Date when the session was first created
   * @throws Error if no session exists
   */
  getSessionStartTime(): Date {
    if (!this.startTime) {
      // If not in memory, try to load from storage
      const storedStartTime = sessionStorage.getItem(this.startTimeKey);
      if (storedStartTime) {
        this.startTime = new Date(storedStartTime);
      } else {
        // If no stored time, use current time
        this.startTime = new Date();
      }
    }

    return this.startTime;
  }
}
