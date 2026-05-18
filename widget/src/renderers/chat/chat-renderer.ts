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
 * The `_options` argument (including any `fetcher`) is intentionally unused:
 * ChatRenderer delegates entirely to createChatWidget which manages its own
 * internal fetch calls. A custom fetcher would have no effect here.
 */
export class ChatRenderer implements Renderer {
  private cleanup: WidgetCleanup | null = null;

  async mount(
    runtimeConfig: WidgetRuntimeConfig,
    _container: HTMLElement,
    _options?: RendererMountOptions
  ): Promise<void> {
    this.cleanup = createChatWidget(runtimeConfig);
  }

  async dispose(): Promise<void> {
    this.cleanup?.destroy();
    this.cleanup = null;
  }
}
