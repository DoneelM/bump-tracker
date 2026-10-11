import { describe, expect, it } from 'vitest';
import { watchForUpdate, type WorkerContainer } from './registerServiceWorker';

function container(controlled: boolean) {
  const handlers: (() => void)[] = [];
  const c: WorkerContainer & { fire(): void } = {
    controller: controlled ? {} : null,
    addEventListener: (_type, l) => void handlers.push(l),
    fire: () => handlers.forEach((h) => h()),
  };
  return c;
}

describe('watchForUpdate', () => {
  it('reports a new version taking over a page an older one controlled', () => {
    const c = container(true);
    let ready = 0;
    watchForUpdate(c, () => ready++);
    c.fire();
    expect(ready).toBe(1);
  });

  it('ignores the first install claiming the page, but reports a later update', () => {
    const c = container(false);
    let ready = 0;
    watchForUpdate(c, () => ready++);
    c.fire(); // first install
    expect(ready).toBe(0);
    c.fire(); // a deploy later in the same session
    expect(ready).toBe(1);
  });
});
