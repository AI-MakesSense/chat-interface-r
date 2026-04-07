import { describe, it, expect, beforeEach } from '@jest/globals';
import { clearBundleCache, serveWidgetBundle } from '@/lib/widget/serve';

describe('Bundle Cache Isolation', () => {
  const license = {
    id: 'license-1',
    licenseKey: 'legacy-license-key-1',
    tier: 'pro',
    brandingEnabled: false,
    domainLimit: 1,
  } as any;

  beforeEach(() => {
    clearBundleCache();
  });

  it('keeps per-widget injected relay config isolated', async () => {
    const bundleA = await serveWidgetBundle(license, 'widget-a');
    const bundleB = await serveWidgetBundle(license, 'widget-b');

    expect(bundleA).toContain('"widgetId":"widget-a"');
    expect(bundleB).toContain('"widgetId":"widget-b"');
    expect(bundleA).not.toEqual(bundleB);
  });

  it('still caches repeated requests for the same widget key', async () => {
    const bundleA1 = await serveWidgetBundle(license, 'widget-a');
    const bundleA2 = await serveWidgetBundle(license, 'widget-a');

    expect(bundleA1).toEqual(bundleA2);
  });
});
