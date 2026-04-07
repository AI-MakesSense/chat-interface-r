/**
 * Messaging Types
 *
 * Purpose: Shared type definitions for N8n messaging system
 *
 * Responsibility:
 * - Define N8n webhook payload structure
 * - Define N8n webhook response structure
 * - Define file attachment format
 * - Provide type safety for messaging operations
 *
 * Assumptions:
 * - N8n expects specific payload structure
 * - File attachments are base64-encoded
 * - SSE is optional (sseUrl in response)
 */

/**
 * File attachment structure for N8n webhook
 *
 * Files are encoded as base64 strings for JSON transmission.
 */
export interface FileAttachment {
  /** Original filename */
  name: string;
  /** MIME type (e.g., "image/png", "application/pdf") */
  type: string;
  /** Base64-encoded file data (without data:... prefix) */
  data: string;
  /** File size in bytes */
  size: number;
}

/**
 * N8n webhook response structure
 *
 * Response from N8n webhook after processing the message.
 */
export interface N8nWebhookResponse {
  /** Direct message response (for non-streaming) */
  output?: string;
  /** SSE endpoint URL for streaming responses */
  sseUrl?: string;
  /** Session ID (echoed back for verification) */
  sessionId: string;
  /** Optional message ID for tracking */
  messageId?: string;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}
