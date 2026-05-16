import type { Renderer } from '@/widget/src/core/renderer';

describe('Renderer interface', () => {
  it('requires mount and dispose methods', () => {
    const stub: Renderer = {
      mount: async () => {},
      dispose: () => {},
    };
    expect(typeof stub.mount).toBe('function');
    expect(typeof stub.dispose).toBe('function');
  });
});
