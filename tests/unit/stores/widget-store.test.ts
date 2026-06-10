/**
 * Widget Store Tests
 *
 * The store consumes the CANONICAL config schema (lib/widget-config):
 * - initial state comes from createDefaultConfig
 * - server hydration goes through migrateConfig (legacy shapes normalized)
 * - updateConfig deep-merges and validates against chatWidgetConfigSchema
 *
 * Note: this file previously imported from 'vitest' and never ran under the
 * jest runner. It was rewritten as a jest suite when the store moved to the
 * canonical config (Task 4). Network-dependent CRUD flows are exercised via
 * integration tests; this suite covers pure state behavior.
 */

import { useWidgetStore, type Widget } from '@/stores/widget-store';
import { chatWidgetConfigSchema } from '@/lib/widget-config/schema';
import { createDefaultConfig } from '@/lib/widget-config/defaults';

function resetStore() {
  useWidgetStore.setState({
    widgets: [],
    currentWidget: null,
    currentLicense: null,
    currentConfig: createDefaultConfig('basic', 'chat'),
    isLoading: false,
    isSaving: false,
    error: null,
    hasUnsavedChanges: false,
  });
}

/** A widget whose stored config is the LEGACY store shape (pre-canonical). */
function legacyWidget(): Widget {
  return {
    id: 'widget-123',
    name: 'Legacy Widget',
    // Legacy shape on purpose — setCurrentWidget must migrate it.
    config: {
      branding: { companyName: 'Original Company' },
      style: { theme: 'dark', primaryColor: '#FF0000', position: 'bottom-left', cornerRadius: 8 },
      connection: { webhookUrl: 'https://original.example.com/webhook' },
      greeting: 'Legacy greeting',
      accentColor: '#22D3EE',
      radius: 'pill',
    } as unknown as Widget['config'],
    isDeployed: false,
    deployedAt: null,
    deployUrl: null,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  };
}

describe('widget store uses canonical config', () => {
  beforeEach(resetStore);

  it('initial config is the canonical default and validates', () => {
    const { currentConfig } = useWidgetStore.getState();
    expect(chatWidgetConfigSchema.safeParse(currentConfig).success).toBe(true);
    expect(currentConfig.theme.colors.primary).toBe('#4F46E5'); // NOT the old '#00bfff'
    expect(currentConfig.schemaVersion).toBe(2);
    expect(currentConfig.kind).toBe('chat');
    expect(useWidgetStore.getState().hasUnsavedChanges).toBe(false);
  });

  it('updateConfig rejects values that fail schema validation', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { updateConfig } = useWidgetStore.getState();
    updateConfig({ theme: { colors: { primary: 'not-a-color' } } } as never);
    expect(useWidgetStore.getState().currentConfig.theme.colors.primary).toBe('#4F46E5');
    expect(useWidgetStore.getState().hasUnsavedChanges).toBe(false);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('updateConfig deep-merges canonical sections without clobbering siblings', () => {
    const { updateConfig } = useWidgetStore.getState();
    updateConfig({ branding: { companyName: 'New Company' } });
    const state = useWidgetStore.getState();
    expect(state.currentConfig.branding.companyName).toBe('New Company');
    // Sibling branding fields preserved
    expect(state.currentConfig.branding.welcomeText).toBe('Welcome! How can we help you today?');
    // Other sections preserved
    expect(state.currentConfig.theme.colors.primary).toBe('#4F46E5');
    expect(state.hasUnsavedChanges).toBe(true);
  });

  it('updateConfig merges nested theme paths (colors + typography)', () => {
    const { updateConfig } = useWidgetStore.getState();
    updateConfig({ theme: { colors: { primary: '#FF0000' }, typography: { fontFamily: 'Inter' } } });
    const cfg = useWidgetStore.getState().currentConfig;
    expect(cfg.theme.colors.primary).toBe('#FF0000');
    expect(cfg.theme.typography.fontFamily).toBe('Inter');
    // Untouched leaves keep defaults
    expect(cfg.theme.colors.background).toBe('#FFFFFF');
    expect(cfg.theme.typography.fontSize).toBe(14);
    expect(cfg.theme.mode).toBe('light');
  });

  it('the result of every accepted update still validates', () => {
    const { updateConfig } = useWidgetStore.getState();
    updateConfig({ colorSystem: { accentColor: '#A855F7', useAccent: false } });
    updateConfig({ chatkit: { accentLevel: 3 } });
    const cfg = useWidgetStore.getState().currentConfig;
    expect(chatWidgetConfigSchema.safeParse(cfg).success).toBe(true);
    expect(cfg.colorSystem.accentColor).toBe('#A855F7');
    expect(cfg.colorSystem.useAccent).toBe(false);
    expect(cfg.chatkit.accentLevel).toBe(3);
  });

  it('setCurrentWidget migrates a legacy-shaped server config to canonical', () => {
    const { setCurrentWidget } = useWidgetStore.getState();
    setCurrentWidget(legacyWidget());
    const state = useWidgetStore.getState();
    expect(chatWidgetConfigSchema.safeParse(state.currentConfig).success).toBe(true);
    expect(state.currentConfig.branding.companyName).toBe('Original Company');
    expect(state.currentConfig.theme.mode).toBe('dark'); // from legacy style.theme
    // Flat accentColor (playground tier) mirrors into theme.colors.primary and
    // beats legacy style.primaryColor per documented migration precedence.
    expect(state.currentConfig.theme.colors.primary).toBe('#22D3EE');
    expect(state.currentConfig.theme.position.position).toBe('bottom-left');
    expect(state.currentConfig.startScreen.greeting).toBe('Legacy greeting'); // flat greeting
    expect(state.currentConfig.colorSystem.accentColor).toBe('#22D3EE'); // flat accentColor
    expect(state.currentConfig.theme.radius).toBe('pill'); // flat radius
    expect(state.currentConfig.connection.webhookUrl).toBe('https://original.example.com/webhook');
    expect(state.hasUnsavedChanges).toBe(false);
  });

  it('setCurrentWidget(null) resets to the canonical default config', () => {
    const { setCurrentWidget } = useWidgetStore.getState();
    setCurrentWidget(legacyWidget());
    setCurrentWidget(null);
    const state = useWidgetStore.getState();
    expect(state.currentWidget).toBeNull();
    expect(state.currentConfig).toEqual(createDefaultConfig('basic', 'chat'));
    expect(state.hasUnsavedChanges).toBe(false);
  });

  it('resetConfig restores the saved snapshot (re-migrated, no shared refs)', () => {
    const { setCurrentWidget, updateConfig, resetConfig } = useWidgetStore.getState();
    setCurrentWidget(legacyWidget());
    updateConfig({ branding: { companyName: 'Changed Company' } });
    expect(useWidgetStore.getState().currentConfig.branding.companyName).toBe('Changed Company');
    expect(useWidgetStore.getState().hasUnsavedChanges).toBe(true);

    resetConfig();
    const state = useWidgetStore.getState();
    expect(state.currentConfig.branding.companyName).toBe('Original Company');
    expect(state.hasUnsavedChanges).toBe(false);
    // Mutating the restored config must not touch the widget's stored config
    state.currentConfig.branding.companyName = 'Mutated';
    expect((useWidgetStore.getState().currentWidget!.config as unknown as Record<string, { companyName: string }>).branding.companyName).toBe('Original Company');
  });

  it('markSaved clears hasUnsavedChanges without altering the config', () => {
    const { updateConfig, markSaved } = useWidgetStore.getState();
    updateConfig({ startScreen: { greeting: 'Hello there' } });
    expect(useWidgetStore.getState().hasUnsavedChanges).toBe(true);
    markSaved();
    const state = useWidgetStore.getState();
    expect(state.hasUnsavedChanges).toBe(false);
    expect(state.currentConfig.startScreen.greeting).toBe('Hello there');
  });

  it('saveConfig without a current widget throws', async () => {
    const { saveConfig } = useWidgetStore.getState();
    await expect(saveConfig()).rejects.toThrow('No widget selected');
  });

  it('rejection is WHOLESALE: an invalid color in one section also drops a valid sibling-section patch', () => {
    // Documents the contract the sidebar relies on: a multi-section update
    // containing any invalid leaf is rejected in full — the valid parts do
    // NOT land. (This is why ColorPicker must only commit valid hex.)
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { updateConfig } = useWidgetStore.getState();
    updateConfig({
      branding: { companyName: 'Should Not Land' },
      theme: { colors: { primary: '#ff' } }, // invalid mid-typing hex
    } as never);
    const state = useWidgetStore.getState();
    expect(state.currentConfig.branding.companyName).toBe('My Company'); // sibling unchanged
    expect(state.currentConfig.theme.colors.primary).toBe('#4F46E5');
    expect(state.hasUnsavedChanges).toBe(false);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('updateConfig REPLACES arrays whole (starterPrompts shrink works)', () => {
    const { updateConfig } = useWidgetStore.getState();
    updateConfig({
      startScreen: {
        starterPrompts: [
          { label: 'One', icon: 'pen' },
          { label: 'Two', icon: 'zap' },
        ],
      },
    });
    expect(useWidgetStore.getState().currentConfig.startScreen.starterPrompts).toHaveLength(2);

    updateConfig({ startScreen: { starterPrompts: [{ label: 'Only', icon: 'pen' }] } });
    const prompts = useWidgetStore.getState().currentConfig.startScreen.starterPrompts;
    expect(prompts).toHaveLength(1);
    expect(prompts[0].label).toBe('Only');
  });
});
