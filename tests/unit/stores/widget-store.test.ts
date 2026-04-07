/**
 * Widget Store Tests (RED Phase)
 *
 * Tests for widget configuration state management.
 * These tests should FAIL initially as they expose missing functionality or bugs.
 *
 * Test Coverage:
 * - updateConfig (partial updates, deep merge)
 * - hasUnsavedChanges flag
 * - saveConfig
 * - resetConfig
 * - Widget CRUD operations
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useWidgetStore } from '@/stores/widget-store';
import { server } from '../../mocks/server';
import { http, HttpResponse } from 'msw';

describe('Widget Store', () => {
  beforeEach(() => {
    // Clear store state before each test
    useWidgetStore.setState({
      widgets: [],
      currentWidget: null,
      currentConfig: {
        branding: {
          companyName: 'My Company',
          welcomeText: 'How can we help you today?',
          firstMessage: "Hello! I'm your AI assistant. Ask me anything!",
        },
        style: {
          theme: 'light',
          primaryColor: '#00bfff',
          position: 'bottom-right',
          cornerRadius: 12,
        },
        connection: {
          webhookUrl: '',
        },
      },
      isLoading: false,
      isSaving: false,
      error: null,
      hasUnsavedChanges: false,
    });
  });

  describe('Initial State', () => {
    it('should fail - initial state should have default config', () => {
      // WHY THIS SHOULD FAIL: Verify default configuration
      const state = useWidgetStore.getState();

      expect(state.currentConfig.branding.companyName).toBe('My Company');
      expect(state.currentConfig.style.theme).toBe('light');
      expect(state.currentConfig.style.primaryColor).toBe('#00bfff');
      expect(state.hasUnsavedChanges).toBe(false);
    });
  });

  describe('updateConfig - Deep Merge', () => {
    it('should fail - updateConfig should merge branding without overwriting other fields', () => {
      // WHY THIS SHOULD FAIL: Need to verify deep merge works correctly
      const { updateConfig } = useWidgetStore.getState();

      updateConfig({
        branding: {
          companyName: 'New Company',
        },
      });

      const state = useWidgetStore.getState();

      // Should update companyName
      expect(state.currentConfig.branding.companyName).toBe('New Company');

      // Should preserve other branding fields
      expect(state.currentConfig.branding.welcomeText).toBe('How can we help you today?');
      expect(state.currentConfig.branding.firstMessage).toBe("Hello! I'm your AI assistant. Ask me anything!");

      // Should preserve other sections
      expect(state.currentConfig.style.theme).toBe('light');
      expect(state.currentConfig.connection.webhookUrl).toBe('');
    });

    it('should fail - updateConfig should merge style without overwriting other fields', () => {
      // WHY THIS SHOULD FAIL: Need to verify partial style updates
      const { updateConfig } = useWidgetStore.getState();

      updateConfig({
        style: {
          primaryColor: '#ff0000',
        },
      });

      const state = useWidgetStore.getState();

      // Should update primaryColor
      expect(state.currentConfig.style.primaryColor).toBe('#ff0000');

      // Should preserve other style fields
      expect(state.currentConfig.style.theme).toBe('light');
      expect(state.currentConfig.style.position).toBe('bottom-right');
      expect(state.currentConfig.style.cornerRadius).toBe(12);
    });

    it('should fail - updateConfig should handle nested optional fields', () => {
      // WHY THIS SHOULD FAIL: Need to verify optional field handling
      const { updateConfig } = useWidgetStore.getState();

      updateConfig({
        typography: {
          fontFamily: 'Inter',
        },
      });

      const state = useWidgetStore.getState();

      expect(state.currentConfig.typography?.fontFamily).toBe('Inter');

      // Update again with different field
      updateConfig({
        typography: {
          fontSize: 14,
        },
      });

      const updatedState = useWidgetStore.getState();

      // Should preserve fontFamily
      expect(updatedState.currentConfig.typography?.fontFamily).toBe('Inter');
      expect(updatedState.currentConfig.typography?.fontSize).toBe(14);
    });

    it('should fail - updateConfig should handle multiple sections at once', () => {
      // WHY THIS SHOULD FAIL: Need to verify multi-section updates
      const { updateConfig } = useWidgetStore.getState();

      updateConfig({
        branding: {
          companyName: 'Updated Company',
        },
        style: {
          theme: 'dark',
        },
        connection: {
          webhookUrl: 'https://n8n.example.com/webhook/123',
        },
      });

      const state = useWidgetStore.getState();

      expect(state.currentConfig.branding.companyName).toBe('Updated Company');
      expect(state.currentConfig.style.theme).toBe('dark');
      expect(state.currentConfig.connection.webhookUrl).toBe('https://n8n.example.com/webhook/123');

      // Should preserve other fields
      expect(state.currentConfig.branding.welcomeText).toBe('How can we help you today?');
      expect(state.currentConfig.style.primaryColor).toBe('#00bfff');
    });
  });

  describe('hasUnsavedChanges Flag', () => {
    it('should fail - updateConfig should set hasUnsavedChanges to true', () => {
      // WHY THIS SHOULD FAIL: Need to verify unsaved changes tracking
      const { updateConfig } = useWidgetStore.getState();

      expect(useWidgetStore.getState().hasUnsavedChanges).toBe(false);

      updateConfig({
        branding: {
          companyName: 'New Company',
        },
      });

      expect(useWidgetStore.getState().hasUnsavedChanges).toBe(true);
    });

    it('should fail - saveConfig should clear hasUnsavedChanges', async () => {
      // WHY THIS SHOULD FAIL: Need to verify save clears flag
      const { updateConfig, saveConfig, setCurrentWidget } = useWidgetStore.getState();

      // Set current widget
      setCurrentWidget({
        id: 'widget-123',
        licenseId: 'license-123',
        name: 'Test Widget',
        config: {
          branding: {
            companyName: 'My Company',
          },
          style: {
            theme: 'light',
            primaryColor: '#00bfff',
            position: 'bottom-right',
            cornerRadius: 12,
          },
          connection: {
            webhookUrl: '',
          },
        },
        isDeployed: false,
        deployedAt: null,
        deployUrl: null,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      });

      // Make changes
      updateConfig({
        branding: {
          companyName: 'Updated Company',
        },
      });

      expect(useWidgetStore.getState().hasUnsavedChanges).toBe(true);

      // Save
      await saveConfig();

      expect(useWidgetStore.getState().hasUnsavedChanges).toBe(false);
    });

    it('should fail - resetConfig should clear hasUnsavedChanges', () => {
      // WHY THIS SHOULD FAIL: Need to verify reset clears flag
      const { updateConfig, resetConfig, setCurrentWidget } = useWidgetStore.getState();

      // Set current widget
      setCurrentWidget({
        id: 'widget-123',
        licenseId: 'license-123',
        name: 'Test Widget',
        config: {
          branding: {
            companyName: 'Original Company',
          },
          style: {
            theme: 'light',
            primaryColor: '#00bfff',
            position: 'bottom-right',
            cornerRadius: 12,
          },
          connection: {
            webhookUrl: '',
          },
        },
        isDeployed: false,
        deployedAt: null,
        deployUrl: null,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      });

      // Make changes
      updateConfig({
        branding: {
          companyName: 'Changed Company',
        },
      });

      expect(useWidgetStore.getState().hasUnsavedChanges).toBe(true);

      // Reset
      resetConfig();

      const state = useWidgetStore.getState();
      expect(state.hasUnsavedChanges).toBe(false);
      expect(state.currentConfig.branding.companyName).toBe('Original Company');
    });
  });

  describe('saveConfig', () => {
    it('should fail - saveConfig should call updateWidget API', async () => {
      // WHY THIS SHOULD FAIL: Need to verify save calls API
      const { saveConfig, setCurrentWidget, updateConfig } = useWidgetStore.getState();

      // Set current widget
      setCurrentWidget({
        id: 'widget-123',
        licenseId: 'license-123',
        name: 'Test Widget',
        config: {
          branding: {
            companyName: 'Original',
          },
          style: {
            theme: 'light',
            primaryColor: '#00bfff',
            position: 'bottom-right',
            cornerRadius: 12,
          },
          connection: {
            webhookUrl: '',
          },
        },
        isDeployed: false,
        deployedAt: null,
        deployUrl: null,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      });

      // Update config
      updateConfig({
        branding: {
          companyName: 'Updated',
        },
      });

      // Save
      await saveConfig();

      const state = useWidgetStore.getState();
      expect(state.isSaving).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should fail - saveConfig without currentWidget should throw', async () => {
      // WHY THIS SHOULD FAIL: Need to verify error when no widget selected
      const { saveConfig } = useWidgetStore.getState();

      await expect(saveConfig()).rejects.toThrow('No widget selected');
    });
  });

  describe('resetConfig', () => {
    it('should fail - resetConfig should restore config from currentWidget', () => {
      // WHY THIS SHOULD FAIL: Need to verify reset restores original config
      const { resetConfig, setCurrentWidget, updateConfig } = useWidgetStore.getState();

      // Set current widget
      setCurrentWidget({
        id: 'widget-123',
        licenseId: 'license-123',
        name: 'Test Widget',
        config: {
          branding: {
            companyName: 'Original Company',
            welcomeText: 'Original Welcome',
          },
          style: {
            theme: 'dark',
            primaryColor: '#ff0000',
            position: 'bottom-left',
            cornerRadius: 8,
          },
          connection: {
            webhookUrl: 'https://original.com',
          },
        },
        isDeployed: false,
        deployedAt: null,
        deployUrl: null,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      });

      // Make changes
      updateConfig({
        branding: {
          companyName: 'Changed Company',
        },
        style: {
          primaryColor: '#0000ff',
        },
      });

      // Verify changes
      expect(useWidgetStore.getState().currentConfig.branding.companyName).toBe('Changed Company');
      expect(useWidgetStore.getState().currentConfig.style.primaryColor).toBe('#0000ff');

      // Reset
      resetConfig();

      const state = useWidgetStore.getState();
      expect(state.currentConfig.branding.companyName).toBe('Original Company');
      expect(state.currentConfig.branding.welcomeText).toBe('Original Welcome');
      expect(state.currentConfig.style.theme).toBe('dark');
      expect(state.currentConfig.style.primaryColor).toBe('#ff0000');
      expect(state.currentConfig.style.position).toBe('bottom-left');
      expect(state.currentConfig.connection.webhookUrl).toBe('https://original.com');
    });
  });

  describe('fetchWidgets', () => {
    it('should fail - fetchWidgets should populate widgets array', async () => {
      // WHY THIS SHOULD FAIL: Need to verify fetching
      const { fetchWidgets } = useWidgetStore.getState();

      await fetchWidgets();

      const state = useWidgetStore.getState();
      expect(state.widgets).toHaveLength(1);
      expect(state.error).toBeNull();
    });

    it('should fail - fetchWidgets with licenseId should filter by license', async () => {
      // WHY THIS SHOULD FAIL: Need to verify filtering
      const { fetchWidgets } = useWidgetStore.getState();

      await fetchWidgets('license-123');

      const state = useWidgetStore.getState();
      expect(state.widgets).toHaveLength(1);
    });
  });

  describe('createWidget', () => {
    it('should fail - createWidget should add widget to store', async () => {
      // WHY THIS SHOULD FAIL: Need to verify creation
      const { createWidget } = useWidgetStore.getState();

      const widget = await createWidget({
        licenseId: 'license-123',
        name: 'New Widget',
        config: {
          branding: {
            companyName: 'New Company',
          },
          style: {
            theme: 'light',
            primaryColor: '#00bfff',
            position: 'bottom-right',
            cornerRadius: 12,
          },
          connection: {
            webhookUrl: 'https://n8n.example.com/webhook/new',
          },
        },
      });

      expect(widget.name).toBe('New Widget');

      const state = useWidgetStore.getState();
      expect(state.widgets).toContainEqual(expect.objectContaining({ name: 'New Widget' }));
      expect(state.currentWidget).toEqual(widget);
      expect(state.currentConfig).toEqual(widget.config);
    });
  });

  describe('deleteWidget', () => {
    it('should fail - deleteWidget should remove widget from store', async () => {
      // WHY THIS SHOULD FAIL: Need to verify deletion
      const { fetchWidgets, deleteWidget } = useWidgetStore.getState();

      // Fetch widgets first
      await fetchWidgets();
      expect(useWidgetStore.getState().widgets).toHaveLength(1);

      // Delete
      await deleteWidget('widget-123');

      const state = useWidgetStore.getState();
      expect(state.widgets).toHaveLength(0);
    });

    it('should fail - deleteWidget should clear currentWidget if it matches', async () => {
      // WHY THIS SHOULD FAIL: Need to verify current widget is cleared
      const { setCurrentWidget, deleteWidget } = useWidgetStore.getState();

      // Set current widget
      setCurrentWidget({
        id: 'widget-123',
        licenseId: 'license-123',
        name: 'Test Widget',
        config: {
          branding: {},
          style: {
            theme: 'light',
            primaryColor: '#00bfff',
            position: 'bottom-right',
            cornerRadius: 12,
          },
          connection: {
            webhookUrl: '',
          },
        },
        isDeployed: false,
        deployedAt: null,
        deployUrl: null,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      });

      // Delete
      await deleteWidget('widget-123');

      const state = useWidgetStore.getState();
      expect(state.currentWidget).toBeNull();
    });
  });

  describe('setCurrentWidget', () => {
    it('should fail - setCurrentWidget should update currentWidget and currentConfig', () => {
      // WHY THIS SHOULD FAIL: Need to verify widget selection
      const { setCurrentWidget } = useWidgetStore.getState();

      const widget = {
        id: 'widget-123',
        licenseId: 'license-123',
        name: 'Test Widget',
        config: {
          branding: {
            companyName: 'Test Company',
          },
          style: {
            theme: 'dark' as const,
            primaryColor: '#ff0000',
            position: 'bottom-left' as const,
            cornerRadius: 8,
          },
          connection: {
            webhookUrl: 'https://test.com',
          },
        },
        isDeployed: false,
        deployedAt: null,
        deployUrl: null,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };

      setCurrentWidget(widget);

      const state = useWidgetStore.getState();
      expect(state.currentWidget).toEqual(widget);
      expect(state.currentConfig).toEqual(widget.config);
      expect(state.hasUnsavedChanges).toBe(false);
    });

    it('should fail - setCurrentWidget with null should reset to default config', () => {
      // WHY THIS SHOULD FAIL: Need to verify clearing widget
      const { setCurrentWidget } = useWidgetStore.getState();

      setCurrentWidget(null);

      const state = useWidgetStore.getState();
      expect(state.currentWidget).toBeNull();
      expect(state.currentConfig.branding.companyName).toBe('My Company');
      expect(state.hasUnsavedChanges).toBe(false);
    });
  });
});
