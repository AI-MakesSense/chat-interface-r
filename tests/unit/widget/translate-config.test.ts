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

describe('translateConfig — shadeLevel scale mapping', () => {
  function configWithShadeLevel(shadeLevel: number) {
    const cfg = createDefaultConfig('pro');
    cfg.colorSystem.useTintedGrayscale = true;
    cfg.colorSystem.shadeLevel = shadeLevel;
    return cfg;
  }

  it('maps canonical default 10 to runtime shade 0 (neutral)', () => {
    const out = translateConfig(configWithShadeLevel(10), ORIGIN, WIDGET_KEY, 'pro', false);
    expect(out.theme.color?.grayscale?.shade).toBe(0);
  });

  it('maps canonical 0 to -4 and canonical 20 to +4', () => {
    const low = translateConfig(configWithShadeLevel(0), ORIGIN, WIDGET_KEY, 'pro', false);
    expect(low.theme.color?.grayscale?.shade).toBe(-4);

    const high = translateConfig(configWithShadeLevel(20), ORIGIN, WIDGET_KEY, 'pro', false);
    expect(high.theme.color?.grayscale?.shade).toBe(4);
  });

  it('maps intermediate values linearly with rounding', () => {
    const five = translateConfig(configWithShadeLevel(5), ORIGIN, WIDGET_KEY, 'pro', false);
    expect(five.theme.color?.grayscale?.shade).toBe(-2); // Math.round((5-10)*0.4)

    const thirteen = translateConfig(configWithShadeLevel(13), ORIGIN, WIDGET_KEY, 'pro', false);
    expect(thirteen.theme.color?.grayscale?.shade).toBe(1); // Math.round(1.2)
  });
});

describe('translateConfig — tintLevel scale mapping', () => {
  function configWithTintLevel(tintLevel: number) {
    const cfg = createDefaultConfig('pro');
    cfg.colorSystem.useTintedGrayscale = true;
    cfg.colorSystem.tintLevel = tintLevel;
    return cfg;
  }

  it('maps canonical default 10 to runtime tint 5', () => {
    const out = translateConfig(configWithTintLevel(10), ORIGIN, WIDGET_KEY, 'pro', false);
    expect(out.theme.color?.grayscale?.tint).toBe(5); // Math.round(4.5)
  });

  it('maps canonical 0 to 0 and canonical 20 to 9', () => {
    const low = translateConfig(configWithTintLevel(0), ORIGIN, WIDGET_KEY, 'pro', false);
    expect(low.theme.color?.grayscale?.tint).toBe(0);

    const high = translateConfig(configWithTintLevel(20), ORIGIN, WIDGET_KEY, 'pro', false);
    expect(high.theme.color?.grayscale?.tint).toBe(9);
  });

  it('maps intermediate values linearly with rounding', () => {
    const seven = translateConfig(configWithTintLevel(7), ORIGIN, WIDGET_KEY, 'pro', false);
    expect(seven.theme.color?.grayscale?.tint).toBe(3); // Math.round(3.15)

    const fifteen = translateConfig(configWithTintLevel(15), ORIGIN, WIDGET_KEY, 'pro', false);
    expect(fifteen.theme.color?.grayscale?.tint).toBe(7); // Math.round(6.75)
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
