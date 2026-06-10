/**
 * Unit tests for translateConfig (lib/widget/translate-config.ts).
 *
 * Focus: canonical colorSystem → runtime theme.color mapping, specifically the
 * custom text color slot (F2 integration fix).
 */
import { translateConfig } from '@/lib/widget/translate-config';
import { createDefaultConfig } from '@/lib/widget-config/defaults';

const ORIGIN = 'https://app.example.com';
const WIDGET_KEY = 'abcdef0123456789';

describe('translateConfig — custom text color (F2)', () => {
  it('sets theme.color.text when colorSystem.useCustomTextColor is true', () => {
    const cfg = createDefaultConfig('pro');
    cfg.colorSystem.useCustomTextColor = true;
    cfg.colorSystem.customTextColor = '#abcdef';

    const out = translateConfig(cfg, ORIGIN, WIDGET_KEY, 'pro', false);

    expect(out.theme.color?.text).toBe('#abcdef');
  });

  it('leaves theme.color.text unset when useCustomTextColor is false', () => {
    const cfg = createDefaultConfig('pro');
    cfg.colorSystem.useCustomTextColor = false;
    cfg.colorSystem.customTextColor = '#abcdef';

    const out = translateConfig(cfg, ORIGIN, WIDGET_KEY, 'pro', false);

    expect(out.theme.color?.text).toBeUndefined();
  });
});

describe('translateConfig — captureContext passthrough', () => {
  it('forwards connection.captureContext:false to the runtime config', () => {
    const cfg = createDefaultConfig('pro');
    cfg.connection.captureContext = false;

    const out = translateConfig(cfg, ORIGIN, WIDGET_KEY, 'pro', false);

    expect(out.connection?.captureContext).toBe(false);
  });

  it('forwards connection.captureContext:true (default) to the runtime config', () => {
    const cfg = createDefaultConfig('pro');
    cfg.connection.captureContext = true;

    const out = translateConfig(cfg, ORIGIN, WIDGET_KEY, 'pro', false);

    expect(out.connection?.captureContext).toBe(true);
  });
});

describe('translateConfig — chatkit flag wiring (F4)', () => {
  it('enables agentKit only when chatkitEnabled AND provider is chatkit', () => {
    const cfg = createDefaultConfig('pro');
    cfg.connection.provider = 'chatkit';

    const enabled = translateConfig(cfg, ORIGIN, WIDGET_KEY, 'pro', true);
    expect(enabled.agentKit?.enabled).toBe(true);

    const disabled = translateConfig(cfg, ORIGIN, WIDGET_KEY, 'pro', false);
    expect(disabled.agentKit?.enabled).toBe(false);
  });
});
