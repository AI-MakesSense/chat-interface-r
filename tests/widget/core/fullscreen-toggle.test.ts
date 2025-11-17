/**
 * Fullscreen Toggle Tests
 *
 * TDD RED Phase: Writing failing tests for fullscreen toggle feature
 * Feature: Allow normal widget to expand to fullscreen and back
 *
 * Requirements:
 * - Toggle button in normal mode widget header
 * - Click to expand to fullscreen
 * - ESC key to exit fullscreen
 * - Maintain chat state during toggle
 * - Visual indicator for fullscreen state
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { Widget } from '../../../widget/src/core/widget';

describe('Widget Fullscreen Toggle', () => {
  let dom: JSDOM;
  let document: Document;
  let window: Window;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    document = dom.window.document;
    window = dom.window as unknown as Window;
    global.document = document;
    global.window = window as any;
  });

  afterEach(() => {
    // Clean up
    document.body.innerHTML = '';
  });

  describe('Toggle Button Visibility', () => {
    it('should show fullscreen toggle button in normal mode', () => {
      const config = { mode: 'normal' as const, license: 'abc123' };
      const widget = new Widget(config);
      widget.render();

      const toggleBtn = document.querySelector('.fullscreen-toggle-btn');
      expect(toggleBtn).toBeTruthy();
      expect(toggleBtn?.getAttribute('title')).toContain('fullscreen');
    });

    it('should NOT show fullscreen toggle in portal mode (already fullscreen)', () => {
      const config = { mode: 'portal' as const, license: 'abc123' };
      const widget = new Widget(config);
      widget.render();

      const toggleBtn = document.querySelector('.fullscreen-toggle-btn');
      expect(toggleBtn).toBeNull();
    });

    it('should show fullscreen toggle in embedded mode', () => {
      const config = { mode: 'embedded' as const, license: 'abc123' };
      const widget = new Widget(config);
      widget.render();

      const toggleBtn = document.querySelector('.fullscreen-toggle-btn');
      expect(toggleBtn).toBeTruthy();
    });
  });

  describe('Toggle to Fullscreen', () => {
    it('should expand chat window to fullscreen when toggle clicked', () => {
      const config = { mode: 'normal' as const, license: 'abc123' };
      const widget = new Widget(config);
      widget.render();

      const chatWindow = document.querySelector('.chat-window') as HTMLElement;
      const toggleBtn = document.querySelector('.fullscreen-toggle-btn') as HTMLElement;

      // Initially not fullscreen
      expect(chatWindow.classList.contains('fullscreen')).toBe(false);
      expect(chatWindow.style.position).not.toBe('fixed');

      // Click toggle
      toggleBtn.click();

      // Should be fullscreen now
      expect(chatWindow.classList.contains('fullscreen')).toBe(true);
      expect(chatWindow.style.position).toBe('fixed');
      expect(chatWindow.style.width).toBe('100%');
      expect(chatWindow.style.height).toBe('100%');
      expect(chatWindow.style.top).toBe('0px');
      expect(chatWindow.style.left).toBe('0px');
    });

    it('should hide bubble button when in fullscreen', () => {
      const config = { mode: 'normal' as const, license: 'abc123' };
      const widget = new Widget(config);
      widget.render();

      const bubble = document.querySelector('.chat-bubble') as HTMLElement;
      const toggleBtn = document.querySelector('.fullscreen-toggle-btn') as HTMLElement;

      // Bubble visible initially
      expect(bubble.style.display).not.toBe('none');

      // Toggle to fullscreen
      toggleBtn.click();

      // Bubble should be hidden
      expect(bubble.style.display).toBe('none');
    });

    it('should change toggle button icon to exit fullscreen icon', () => {
      const config = { mode: 'normal' as const, license: 'abc123' };
      const widget = new Widget(config);
      widget.render();

      const toggleBtn = document.querySelector('.fullscreen-toggle-btn') as HTMLElement;

      // Initially shows "enter fullscreen" icon
      const initialIcon = toggleBtn.innerHTML;
      expect(toggleBtn.getAttribute('title')).toContain('Enter');

      // Click toggle
      toggleBtn.click();

      // Should show "exit fullscreen" icon
      expect(toggleBtn.innerHTML).not.toBe(initialIcon);
      expect(toggleBtn.getAttribute('title')).toContain('Exit');
    });
  });

  describe('Toggle from Fullscreen', () => {
    it('should return to normal size when toggle clicked again', () => {
      const config = { mode: 'normal' as const, license: 'abc123' };
      const widget = new Widget(config);
      widget.render();

      const chatWindow = document.querySelector('.chat-window') as HTMLElement;
      const toggleBtn = document.querySelector('.fullscreen-toggle-btn') as HTMLElement;

      // Toggle to fullscreen
      toggleBtn.click();
      expect(chatWindow.classList.contains('fullscreen')).toBe(true);

      // Toggle back
      toggleBtn.click();
      expect(chatWindow.classList.contains('fullscreen')).toBe(false);
      expect(chatWindow.style.position).not.toBe('fixed');
    });

    it('should show bubble button when exiting fullscreen', () => {
      const config = { mode: 'normal' as const, license: 'abc123' };
      const widget = new Widget(config);
      widget.render();

      const bubble = document.querySelector('.chat-bubble') as HTMLElement;
      const toggleBtn = document.querySelector('.fullscreen-toggle-btn') as HTMLElement;

      // Toggle to fullscreen (hides bubble)
      toggleBtn.click();
      expect(bubble.style.display).toBe('none');

      // Toggle back
      toggleBtn.click();

      // Bubble should be visible again
      expect(bubble.style.display).not.toBe('none');
    });
  });

  describe('ESC Key Handling', () => {
    it('should exit fullscreen when ESC key pressed', () => {
      const config = { mode: 'normal' as const, license: 'abc123' };
      const widget = new Widget(config);
      widget.render();

      const chatWindow = document.querySelector('.chat-window') as HTMLElement;
      const toggleBtn = document.querySelector('.fullscreen-toggle-btn') as HTMLElement;

      // Toggle to fullscreen
      toggleBtn.click();
      expect(chatWindow.classList.contains('fullscreen')).toBe(true);

      // Press ESC
      const escEvent = new window.KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escEvent);

      // Should exit fullscreen
      expect(chatWindow.classList.contains('fullscreen')).toBe(false);
    });

    it('should NOT exit fullscreen on other keys', () => {
      const config = { mode: 'normal' as const, license: 'abc123' };
      const widget = new Widget(config);
      widget.render();

      const chatWindow = document.querySelector('.chat-window') as HTMLElement;
      const toggleBtn = document.querySelector('.fullscreen-toggle-btn') as HTMLElement;

      // Toggle to fullscreen
      toggleBtn.click();
      expect(chatWindow.classList.contains('fullscreen')).toBe(true);

      // Press other key
      const enterEvent = new window.KeyboardEvent('keydown', { key: 'Enter' });
      document.dispatchEvent(enterEvent);

      // Should still be fullscreen
      expect(chatWindow.classList.contains('fullscreen')).toBe(true);
    });

    it('should do nothing if ESC pressed when not in fullscreen', () => {
      const config = { mode: 'normal' as const, license: 'abc123' };
      const widget = new Widget(config);
      widget.render();

      const chatWindow = document.querySelector('.chat-window') as HTMLElement;

      // Not in fullscreen
      expect(chatWindow.classList.contains('fullscreen')).toBe(false);

      // Press ESC (should not throw error)
      const escEvent = new window.KeyboardEvent('keydown', { key: 'Escape' });
      expect(() => document.dispatchEvent(escEvent)).not.toThrow();

      // Still not fullscreen
      expect(chatWindow.classList.contains('fullscreen')).toBe(false);
    });
  });

  describe('State Preservation', () => {
    it('should preserve chat messages during fullscreen toggle', () => {
      const config = { mode: 'normal' as const, license: 'abc123' };
      const widget = new Widget(config);
      widget.render();

      const messagesArea = document.querySelector('.chat-messages') as HTMLElement;
      const toggleBtn = document.querySelector('.fullscreen-toggle-btn') as HTMLElement;

      // Add test message
      const testMsg = document.createElement('div');
      testMsg.className = 'message user';
      testMsg.textContent = 'Test message';
      messagesArea.appendChild(testMsg);

      expect(messagesArea.children.length).toBeGreaterThan(0);
      const messageCount = messagesArea.children.length;

      // Toggle to fullscreen and back
      toggleBtn.click();
      toggleBtn.click();

      // Messages should still be there
      expect(messagesArea.children.length).toBe(messageCount);
      expect(messagesArea.querySelector('.message.user')?.textContent).toBe('Test message');
    });

    it('should preserve input text during fullscreen toggle', () => {
      const config = { mode: 'normal' as const, license: 'abc123' };
      const widget = new Widget(config);
      widget.render();

      const input = document.querySelector('.chat-input') as HTMLInputElement;
      const toggleBtn = document.querySelector('.fullscreen-toggle-btn') as HTMLElement;

      // Type in input
      input.value = 'Draft message';

      // Toggle to fullscreen and back
      toggleBtn.click();
      toggleBtn.click();

      // Input text should be preserved
      expect(input.value).toBe('Draft message');
    });
  });

  describe('Multiple Toggle Cycles', () => {
    it('should handle multiple fullscreen toggle cycles', () => {
      const config = { mode: 'normal' as const, license: 'abc123' };
      const widget = new Widget(config);
      widget.render();

      const chatWindow = document.querySelector('.chat-window') as HTMLElement;
      const toggleBtn = document.querySelector('.fullscreen-toggle-btn') as HTMLElement;

      // Cycle 1
      toggleBtn.click();
      expect(chatWindow.classList.contains('fullscreen')).toBe(true);
      toggleBtn.click();
      expect(chatWindow.classList.contains('fullscreen')).toBe(false);

      // Cycle 2
      toggleBtn.click();
      expect(chatWindow.classList.contains('fullscreen')).toBe(true);
      toggleBtn.click();
      expect(chatWindow.classList.contains('fullscreen')).toBe(false);

      // Cycle 3
      toggleBtn.click();
      expect(chatWindow.classList.contains('fullscreen')).toBe(true);
    });
  });
});
