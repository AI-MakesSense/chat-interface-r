import type { WidgetRuntimeConfig } from '../types';

/**
 * A thin wrapper around the browser's fetch API.
 * Production callers do not need to supply this — it defaults to
 * `globalThis.fetch`. Pass a stub in preview / test scenarios where
 * real network calls must be avoided.
 */
export type WidgetFetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

/**
 * Optional third argument to `Renderer.mount()`.
 */
export interface RendererMountOptions {
  /**
   * Custom fetch implementation. Defaults to `globalThis.fetch`.
   * Intended for preview/testing scenarios where a stub is needed so that
   * production network endpoints are never called. Production callers omit
   * this parameter entirely.
   */
  fetcher?: WidgetFetcher;
}

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
  mount(
    runtimeConfig: WidgetRuntimeConfig,
    container: HTMLElement,
    options?: RendererMountOptions
  ): Promise<void>;
  dispose(): Promise<void>;
}
