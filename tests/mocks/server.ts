/**
 * MSW Server Setup
 *
 * Creates MSW server instance for mocking API requests in tests.
 * This server is started in setup-frontend.ts and runs throughout all tests.
 *
 * Usage in tests:
 * - Use server.use() to add/override handlers for specific test scenarios
 * - server.resetHandlers() is called after each test automatically
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * Setup MSW server with default handlers
 */
export const server = setupServer(...handlers);
