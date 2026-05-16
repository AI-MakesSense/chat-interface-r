import type { Renderer } from '@/widget/src/core/renderer';

describe('Renderer interface', () => {
  it('satisfies the Renderer shape (type-checked at compile time)', () => {
    const stub: Renderer = {
      mount: async () => {},
      dispose: async () => {},
    };
    expect(typeof stub.mount).toBe('function');
    expect(typeof stub.dispose).toBe('function');
  });
});
