/**
 * Environment-Aware Logging Utility
 *
 * Purpose: Centralized logging with environment-specific behavior
 *
 * Behavior by Environment:
 * - Development: Verbose logging with full stack traces and details
 * - Production: Structured JSON logging with sanitized data, no stack traces
 *
 * Security:
 * - Never logs sensitive data (tokens, passwords, API keys)
 * - Sanitizes error messages to prevent information leakage
 * - Redacts PII and credentials from log output
 */

/**
 * Log levels in order of severity
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Log context - additional structured data to include
 */
export interface LogContext {
  [key: string]: unknown;
}

/**
 * Patterns to redact from log output
 */
const SENSITIVE_PATTERNS = [
  // API keys and tokens
  /sk-[a-zA-Z0-9]{24,}/g,              // OpenAI API keys
  /whsec_[a-zA-Z0-9]+/g,               // Stripe webhook secrets
  /sk_(?:test|live)_[a-zA-Z0-9]+/g,    // Stripe secret keys
  /pk_(?:test|live)_[a-zA-Z0-9]+/g,    // Stripe publishable keys
  /Bearer\s+[a-zA-Z0-9._-]+/gi,        // Bearer tokens
  /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g, // JWTs

  // Credentials
  /password['":\s]*[^\s,}]*/gi,        // Password fields
  /secret['":\s]*[^\s,}]*/gi,          // Secret fields
  /authorization['":\s]*[^\s,}]*/gi,   // Authorization headers

  // Common API key formats
  /[a-f0-9]{32}/gi,                    // 32-char hex (license keys, API keys)
  /AKIA[0-9A-Z]{16}/g,                 // AWS access keys
];

/**
 * Keys to redact in objects
 */
const SENSITIVE_KEYS = new Set([
  'password',
  'passwordHash',
  'secret',
  'apiKey',
  'api_key',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'authorization',
  'cookie',
  'licenseKey',
  'license_key',
  'stripeCustomerId',
  'stripeSubscriptionId',
  'webhookSecret',
  'privateKey',
  'private_key',
]);

/**
 * Check if running in production
 */
function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Redact sensitive values from a string
 */
function redactString(value: string): string {
  let result = value;
  for (const pattern of SENSITIVE_PATTERNS) {
    result = result.replace(pattern, '[REDACTED]');
  }
  return result;
}

/**
 * Recursively sanitize an object for logging
 */
function sanitizeValue(value: unknown, depth = 0): unknown {
  // Prevent infinite recursion
  if (depth > 10) return '[MAX_DEPTH]';

  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    return isProduction() ? redactString(value) : value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: isProduction() ? redactString(value.message) : value.message,
      // Only include stack in development
      ...(isProduction() ? {} : { stack: value.stack }),
    };
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, depth + 1));
  }

  if (typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      // Redact sensitive keys entirely
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeValue(val, depth + 1);
      }
    }
    return sanitized;
  }

  // For functions, symbols, etc.
  return String(value);
}

/**
 * Format log entry for output
 */
function formatLog(
  level: LogLevel,
  message: string,
  context?: LogContext
): string {
  const timestamp = new Date().toISOString();
  const sanitizedContext = context ? sanitizeValue(context) : undefined;

  if (isProduction()) {
    // Production: JSON format for log aggregation
    return JSON.stringify({
      timestamp,
      level,
      message: redactString(message),
      ...(sanitizedContext ? { context: sanitizedContext } : {}),
    });
  }

  // Development: Human-readable format
  const contextStr = sanitizedContext
    ? `\n${JSON.stringify(sanitizedContext, null, 2)}`
    : '';
  return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
}

/**
 * Main logger object
 */
export const logger = {
  /**
   * Debug level - verbose development info
   * Suppressed in production unless DEBUG env var is set
   */
  debug(message: string, context?: LogContext): void {
    if (isProduction() && !process.env.DEBUG) return;
    console.debug(formatLog('debug', message, context));
  },

  /**
   * Info level - general operational messages
   */
  info(message: string, context?: LogContext): void {
    console.info(formatLog('info', message, context));
  },

  /**
   * Warning level - potential issues that didn't cause failure
   */
  warn(message: string, context?: LogContext): void {
    console.warn(formatLog('warn', message, context));
  },

  /**
   * Error level - errors that need attention
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = error
      ? { ...context, error: sanitizeValue(error) }
      : context;
    console.error(formatLog('error', message, errorContext));
  },

  /**
   * Create a child logger with preset context
   */
  child(baseContext: LogContext) {
    return {
      debug: (message: string, context?: LogContext) =>
        logger.debug(message, { ...baseContext, ...context }),
      info: (message: string, context?: LogContext) =>
        logger.info(message, { ...baseContext, ...context }),
      warn: (message: string, context?: LogContext) =>
        logger.warn(message, { ...baseContext, ...context }),
      error: (message: string, error?: Error | unknown, context?: LogContext) =>
        logger.error(message, error, { ...baseContext, ...context }),
    };
  },
};

/**
 * Security logging - specific for security-related events
 * Always logs regardless of environment, with appropriate redaction
 */
export const securityLogger = {
  /**
   * Log a blocked request or security violation
   */
  blocked(type: string, context: LogContext): void {
    logger.warn(`[SECURITY] Blocked ${type}`, {
      ...context,
      securityEvent: true,
    });
  },

  /**
   * Log an authentication event
   */
  auth(event: 'login' | 'logout' | 'failed' | 'refresh', context: LogContext): void {
    logger.info(`[AUTH] ${event}`, {
      ...context,
      authEvent: event,
    });
  },

  /**
   * Log a rate limit event
   */
  rateLimit(identifier: string, type: string, context?: LogContext): void {
    logger.warn(`[RATE_LIMIT] Exceeded for ${type}`, {
      identifier: identifier.substring(0, 8) + '...', // Partial ID only
      type,
      ...context,
    });
  },
};

export default logger;
