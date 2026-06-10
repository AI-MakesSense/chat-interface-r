/**
 * Tests for WidgetPreviewFrame (Phase 5, Task 20).
 *
 * Verifies the configurator's real-bundle preview iframe:
 *   - renders pointing at /preview/widget?preview=1 with a script-only sandbox
 *   - on a `widget:ready` message from the iframe, posts a `widget:config` message
 *     carrying the TRANSLATED runtime config (runtime WidgetConfig shape — has
 *     theme.colorScheme / style, NOT the canonical colorSystem), targeted at origin.
 *
 * jsdom note: the iframe gets a real contentWindow but it never actually loads the
 * preview page, so we (a) spy on contentWindow.postMessage and (b) synthesize the
 * `widget:ready` message with `source` set to that same contentWindow (the component
 * only trusts messages whose source IS its iframe).
 */
import { render, act } from '@testing-library/react';
import { WidgetPreviewFrame } from '@/components/configurator/widget-preview-frame';
import { chatWidgetConfigSchema } from '@/lib/widget-config/schema';

const config = chatWidgetConfigSchema.parse({});

describe('WidgetPreviewFrame', () => {
  it('renders the preview iframe with the preview src and script-only sandbox', () => {
    const { container } = render(
      <WidgetPreviewFrame kind="chat" config={config} tier="agency" />
    );
    const iframe = container.querySelector('iframe')!;
    expect(iframe).toBeTruthy();
    expect(iframe.getAttribute('src')).toContain('/preview/widget?preview=1');
    expect(iframe.getAttribute('sandbox')).toContain('allow-scripts');
    expect(iframe.getAttribute('sandbox')).not.toContain('allow-same-origin');
  });

  it('posts a translated widget:config to the iframe when the bridge signals ready', () => {
    const { container } = render(
      <WidgetPreviewFrame kind="chat" config={config} tier="agency" />
    );
    const iframe = container.querySelector('iframe') as HTMLIFrameElement;
    const cw = iframe.contentWindow!;
    const postSpy = jest.spyOn(cw, 'postMessage').mockImplementation(() => {});

    // Simulate the bridge announcing readiness (source must be the iframe's window).
    act(() => {
      const evt = new MessageEvent('message', {
        data: { type: 'widget:ready' },
        source: cw as unknown as Window,
      });
      window.dispatchEvent(evt);
    });

    expect(postSpy).toHaveBeenCalledTimes(1);
    const [message, targetOrigin] = postSpy.mock.calls[0];
    // Must be '*': the sandboxed iframe has a `null` origin, so a specific targetOrigin
    // would be silently dropped by the browser and the bridge would never mount.
    expect(targetOrigin).toBe('*');
    expect(message).toMatchObject({
      type: 'widget:config',
      kind: 'chat',
      tier: 'agency',
    });

    // The posted config must be the TRANSLATED runtime shape, not canonical.
    const posted = (message as { config: Record<string, unknown> }).config;
    expect(posted).toHaveProperty('style');
    expect((posted as { theme: { colorScheme: string } }).theme).toHaveProperty('colorScheme');
    // Canonical-only fields must be absent from the runtime payload.
    expect(posted).not.toHaveProperty('colorSystem');
  });

  it('ignores messages that do not originate from its own iframe', () => {
    const { container } = render(
      <WidgetPreviewFrame kind="chat" config={config} tier="agency" />
    );
    const iframe = container.querySelector('iframe') as HTMLIFrameElement;
    const postSpy = jest.spyOn(iframe.contentWindow!, 'postMessage').mockImplementation(() => {});

    act(() => {
      // source is some OTHER window (the top window), not the iframe → must be ignored.
      const evt = new MessageEvent('message', {
        data: { type: 'widget:ready' },
        source: window as unknown as Window,
      });
      window.dispatchEvent(evt);
    });

    expect(postSpy).not.toHaveBeenCalled();
  });

  it('shows the error overlay when the bridge reports widget:error', () => {
    const { container } = render(
      <WidgetPreviewFrame kind="chat" config={config} tier="agency" />
    );
    const iframe = container.querySelector('iframe') as HTMLIFrameElement;
    const cw = iframe.contentWindow!;

    expect(container.textContent).not.toContain('Preview error');

    act(() => {
      const evt = new MessageEvent('message', {
        data: { type: 'widget:error', message: 'boom: renderer failed' },
        source: cw as unknown as Window,
      });
      window.dispatchEvent(evt);
    });

    expect(container.textContent).toContain('Preview error');
    expect(container.textContent).toContain('boom: renderer failed');
  });
});
