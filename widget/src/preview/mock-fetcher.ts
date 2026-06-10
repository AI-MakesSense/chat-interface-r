/**
 * Preview-mode fetcher: never hits the network. Echoes a canned bot response so the
 * configurator preview demonstrates message styling/markdown without a webhook.
 *
 * Response shape: { "message": string }. This matches what the chat path parses —
 * createChatWidget reads `data.response || data.message || data.output` and
 * MessageSender reads `data.message || data.output` — so `message` is the common key.
 */
export const CANNED_RESPONSE = [
  'Thanks for your message! Here is **markdown**, `inline code`, and a list:',
  '- Point one',
  '- Point two',
  '',
  '```ts',
  'const greeting = "hello from the preview";',
  '```',
].join('\n');

export async function mockFetcher(
  _url: RequestInfo | URL,
  _init?: RequestInit
): Promise<Response> {
  await new Promise((r) => setTimeout(r, 400)); // visible "thinking" delay
  return new Response(JSON.stringify({ message: CANNED_RESPONSE }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
