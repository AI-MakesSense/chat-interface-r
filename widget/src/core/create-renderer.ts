/**
 * Renderer factory.
 *
 * Lives in its own module (not renderer.ts) because renderer.ts declares the
 * `Renderer` interface that the concrete renderers import — adding the concrete
 * imports there would create an import cycle (renderer.ts → renderers → renderer.ts).
 * Keeping the factory separate breaks that cycle.
 */
import { ChatRenderer } from '../renderers/chat/chat-renderer';
import { DisplayRenderer } from '../renderers/display/display-renderer';
import type { Renderer } from './renderer';

export function createRenderer(kind: 'chat' | 'display'): Renderer {
  return kind === 'display' ? new DisplayRenderer() : new ChatRenderer();
}
