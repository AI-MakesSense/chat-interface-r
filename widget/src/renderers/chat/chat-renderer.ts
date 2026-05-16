import type { Renderer } from '../../core/renderer';
import type { WidgetRuntimeConfig } from '../../types';
import { createChatWidget } from '../../widget';

/**
 * Wraps the existing createChatWidget() entry point as a Renderer.
 * Behavior is identical to calling createChatWidget directly; this class
 * exists so the bootstrap can dispatch on widget kind through a uniform interface.
 */
export class ChatRenderer implements Renderer {
  async mount(runtimeConfig: WidgetRuntimeConfig, _container: HTMLElement): Promise<void> {
    createChatWidget(runtimeConfig);
  }

  async dispose(): Promise<void> {
    // The chat widget owns its own lifecycle internally; no-op for v1.
  }
}
