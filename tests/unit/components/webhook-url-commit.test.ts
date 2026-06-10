/**
 * Webhook URL commit gate tests.
 *
 * The configurator's webhookUrl inputs buffer a local draft and commit only
 * values this gate accepts — otherwise the store's wholesale rejection would
 * wipe every keystroke of a partially-typed URL (the canonical validator
 * rejects "h", "http", "https:/", ...). Typing character-by-character must
 * keep the draft locally and commit exactly once the URL becomes valid.
 */

import { isCommittableWebhookUrl } from '@/components/configurator/webhook-url-commit';

describe('isCommittableWebhookUrl', () => {
  it('accepts empty string (clearing the field commits)', () => {
    expect(isCommittableWebhookUrl('')).toBe(true);
  });

  it('rejects every prefix typed on the way to a valid URL, then accepts the full URL', () => {
    const target = 'https://n8n.example.com/webhook/x';
    let commits = 0;
    for (let i = 1; i < target.length; i++) {
      if (isCommittableWebhookUrl(target.slice(0, i))) commits++;
    }
    // Mid-typing prefixes that already form a valid https URL are fine to
    // commit (e.g. "https://n8n.example.com/webhook"), but the early
    // fragments ("h", "http", "https:/", "https://n") must not commit.
    expect(isCommittableWebhookUrl('h')).toBe(false);
    expect(isCommittableWebhookUrl('http')).toBe(false);
    expect(isCommittableWebhookUrl('https:/')).toBe(false);
    expect(isCommittableWebhookUrl('https://')).toBe(false);
    expect(isCommittableWebhookUrl(target)).toBe(true);
    expect(commits).toBeGreaterThan(0); // some valid intermediate commits exist
  });

  it('accepts https and localhost URLs, rejects plain http on other hosts', () => {
    expect(isCommittableWebhookUrl('https://n8n.example.com/webhook/abc')).toBe(true);
    expect(isCommittableWebhookUrl('http://localhost:5678/webhook/abc')).toBe(true);
    expect(isCommittableWebhookUrl('http://127.0.0.1:5678/webhook/abc')).toBe(true);
    expect(isCommittableWebhookUrl('http://evil.example.com/webhook')).toBe(false);
    expect(isCommittableWebhookUrl('http://evil.com/localhost/x')).toBe(false);
  });

  it('rejects non-URL garbage', () => {
    expect(isCommittableWebhookUrl('not a url')).toBe(false);
    expect(isCommittableWebhookUrl('javascript:alert(1)')).toBe(false);
  });
});
