/**
 * Resolves the trigger message for the display widget's auto-fire request.
 *
 * Priority order:
 *   1. `window.ChatWidgetConfig.message` (host page injection — highest priority)
 *   2. configurator default (passed in)
 *   3. empty string (no message)
 *
 * Empty-string and non-string window values are treated as "not set" and the
 * function falls back to the configurator default.
 */
export function resolveTriggerMessage(configDefault: string | undefined): string {
  const winValue = (typeof window !== 'undefined' ? (window as any).ChatWidgetConfig?.message : undefined);
  if (typeof winValue === 'string' && winValue.length > 0) return winValue;
  return configDefault ?? '';
}

export interface DisplayPayloadInput {
  widgetId: string;
  licenseKey: string;
  message: string;
  sessionId: string;
  context: Record<string, unknown>;
  customContext: Record<string, unknown>;
  tier: string;
}

/**
 * Builds the chat-relay payload for the display widget's auto-fire.
 * Shape is identical to what the chat widget sends so n8n workflows can be
 * shared or branch on the message contents alone.
 */
export function buildDisplayPayload(input: DisplayPayloadInput) {
  return {
    widgetId: input.widgetId,
    licenseKey: input.licenseKey,
    message: input.message,
    chatInput: input.message,
    sessionId: input.sessionId,
    context: input.context,
    customContext: input.customContext,
    metadata: { tier: input.tier },
  };
}
