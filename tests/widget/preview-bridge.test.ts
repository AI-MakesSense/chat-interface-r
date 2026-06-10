/**
 * Preview Bridge Tests (jsdom)
 *
 * Verifies the configurator preview bridge:
 *  - returns false (inert) when the page URL has no ?preview flag
 *  - returns true and announces readiness when ?preview=1
 *  - mounts the real renderer on a widget:config message (a [data-n8n-widget-root]
 *    element appears) and posts widget:mounted to the parent
 *
 * window.parent.postMessage is mocked. window.location.search is set via a jsdom
 * navigation (jsdom supports the testURL / reconfigure path through jest's
 * @jest-environment-options, but the simplest portable approach is delete+redefine).
 */

import { initPreviewBridge } from '@/widget/src/preview/preview-bridge';

function setSearch(search: string): void {
  // jsdom: redefine window.location.search without a full navigation.
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...window.location, search, href: `http://localhost/${search}` },
  });
}

describe('initPreviewBridge', () => {
  let parentPostMessage: jest.Mock;

  beforeEach(() => {
    document.body.innerHTML = '';
    parentPostMessage = jest.fn();
    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: { postMessage: parentPostMessage },
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('returns false when there is no ?preview flag', () => {
    setSearch('');
    expect(initPreviewBridge()).toBe(false);
    expect(parentPostMessage).not.toHaveBeenCalled();
  });

  it('returns true and announces widget:ready when ?preview=1', () => {
    jest.useFakeTimers();
    setSearch('?preview=1');

    expect(initPreviewBridge()).toBe(true);
    // Immediate ready announcement.
    expect(parentPostMessage).toHaveBeenCalledWith(
      { type: 'widget:ready' },
      '*'
    );
  });

  it('mounts the real renderer on a widget:config message', async () => {
    setSearch('?preview=1');
    expect(initPreviewBridge()).toBe(true);

    // A minimal translated runtime uiConfig (the shape the renderers consume).
    const config = {
      kind: 'chat',
      branding: {
        companyName: 'Preview Co',
        welcomeText: 'Hi',
        firstMessage: 'Hello!',
      },
      features: {
        fileAttachmentsEnabled: false,
        allowedExtensions: [],
        maxFileSizeKB: 10240,
      },
    };

    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'widget:config', kind: 'chat', config, tier: 'agency' },
      })
    );

    // The message handler is async; allow microtasks/await to flush.
    await new Promise((r) => setTimeout(r, 0));

    expect(document.querySelector('[data-n8n-widget-root]')).not.toBeNull();
    expect(parentPostMessage).toHaveBeenCalledWith(
      { type: 'widget:mounted' },
      '*'
    );
  });
});
