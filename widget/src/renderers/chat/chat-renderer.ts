import type { Renderer, RendererMountOptions } from '../../core/renderer';
import type { WidgetRuntimeConfig } from '../../types';
import { createChatWidget } from '../../widget';
import type { WidgetCleanup } from '../../widget';

/**
 * Wraps the existing createChatWidget() entry point as a Renderer.
 * Behavior is identical to calling createChatWidget directly; this class
 * exists so the bootstrap can dispatch on widget kind through a uniform interface.
 *
 * The `_container` argument is intentionally unused: createChatWidget self-attaches
 * to the document (it locates or creates its own container based on display mode).
 * It is part of the Renderer signature for use by other renderer kinds.
 *
 * The `_container` argument is intentionally unused: createChatWidget self-attaches.
 * The optional `options.fetcher` IS forwarded to createChatWidget so preview mode
 * can route relay calls through a mock fetcher (no real webhook hit). Production
 * callers omit it and createChatWidget falls back to the global fetch.
 */
export class ChatRenderer implements Renderer {
  private cleanup: WidgetCleanup | null = null;

  async mount(
    runtimeConfig: WidgetRuntimeConfig,
    _container: HTMLElement,
    options?: RendererMountOptions
  ): Promise<void> {
    this.cleanup = createChatWidget(runtimeConfig, options?.fetcher);
  }

  async dispose(): Promise<void> {
    this.cleanup?.destroy();
    this.cleanup = null;
  }
}
