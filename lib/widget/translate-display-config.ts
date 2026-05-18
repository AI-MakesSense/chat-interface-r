/**
 * Translates a stored display-widget config (DB JSONB) into the shape the client bundle expects.
 *
 * Strips secrets (the n8n webhookUrl stays server-side) and injects the relay endpoint URL
 * derived from the request URL. The client widget POSTs to relayEndpoint; the relay route
 * server-side then forwards to the real webhookUrl.
 */
export function translateDisplayConfig(dbConfig: any, requestUrl: string) {
  const origin = new URL(requestUrl).origin;
  return {
    kind: 'display' as const,
    branding: dbConfig.branding,
    theme: dbConfig.theme,
    display: dbConfig.display,
    connection: {
      provider: 'n8n' as const,
      relayEndpoint: `${origin}/api/chat-relay`,
      triggerMessage: dbConfig.connection?.triggerMessage ?? '',
      captureContext: dbConfig.connection?.captureContext ?? true,
      customContext: dbConfig.connection?.customContext ?? {},
    },
    features: { fileAttachmentsEnabled: false, allowedExtensions: [], maxFileSizeKB: 0 },
  };
}
