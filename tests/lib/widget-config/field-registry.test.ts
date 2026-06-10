import { CHAT_FIELD_REGISTRY, SECTIONS } from '@/lib/widget-config/field-registry';
import { getAtPath, setAtPath } from '@/lib/widget-config/path';
import { chatWidgetConfigSchema } from '@/lib/widget-config/schema';

describe('field registry', () => {
  const defaults = chatWidgetConfigSchema.parse({});

  it('every registry path exists in the canonical config', () => {
    for (const field of CHAT_FIELD_REGISTRY) {
      expect(getAtPath(defaults, field.path)).not.toBeUndefined();
    }
  });

  it('every registry field references a declared section', () => {
    const ids = SECTIONS.map((s) => s.id);
    for (const field of CHAT_FIELD_REGISTRY) {
      expect(ids).toContain(field.section);
    }
  });

  it('select fields list options that match the schema enum (spot-check theme.mode)', () => {
    const modeField = CHAT_FIELD_REGISTRY.find((f) => f.path === 'theme.mode');
    expect(modeField?.options?.map((o) => o.value).sort()).toEqual(['auto', 'dark', 'light']);
  });

  it('setAtPath produces a new object without mutating the original', () => {
    const next = setAtPath(defaults, 'theme.colors.primary', '#123456');
    expect(getAtPath(next, 'theme.colors.primary')).toBe('#123456');
    expect(getAtPath(defaults, 'theme.colors.primary')).toBe('#4F46E5');
  });
});
