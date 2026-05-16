import type { WidgetRuntimeConfig } from '../types';

/**
 * A Renderer owns a widget's DOM, lifecycle, and event listeners.
 * One instance is created per widget mount; dispose() must remove everything.
 */
export interface Renderer {
  mount(runtimeConfig: WidgetRuntimeConfig, container: HTMLElement): Promise<void>;
  dispose(): void;
}
