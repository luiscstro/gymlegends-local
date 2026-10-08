import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// jsdom não implementa scrollTo (usado pelo body scroll lock e pela lista do picker)
Element.prototype.scrollTo = function scrollTo() {};
window.scrollTo = (() => {}) as typeof window.scrollTo;
