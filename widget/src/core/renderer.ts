import type { WidgetRuntimeConfig } from '../types';

/**
 * A Renderer owns a widget's DOM, lifecycle, and event listeners.
 * One instance is created per widget mount; dispose() must remove everything.
 *
 * dispose() returns a Promise so renderers that need to abort in-flight requests,
 * flush events, or await teardown can do so. Implementations with purely synchronous
 * teardown may still declare `async dispose() {}` — the async keyword is enough.
 * Callers MUST `await renderer.dispose()`.
 */
export interface Renderer {
  mount(runtimeConfig: WidgetRuntimeConfig, container: HTMLElement): Promise<void>;
  dispose(): Promise<void>;
}
