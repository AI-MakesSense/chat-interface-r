import type { Renderer, RendererMountOptions, WidgetFetcher } from '@/widget/src/core/renderer';

describe('Renderer interface', () => {
  it('satisfies the Renderer shape (type-checked at compile time)', () => {
    const stub: Renderer = {
      mount: async (_rc, _container, _options?: RendererMountOptions) => {},
      dispose: async () => {},
    };
    expect(typeof stub.mount).toBe('function');
    expect(typeof stub.dispose).toBe('function');
  });

  it('RendererMountOptions.fetcher is optional', () => {
    const opts: RendererMountOptions = {};
    expect(opts.fetcher).toBeUndefined();
  });

  it('WidgetFetcher type is assignable from a simple async function', () => {
    const f: WidgetFetcher = async () => new Response('{}', { status: 200 });
    expect(typeof f).toBe('function');
  });
});
