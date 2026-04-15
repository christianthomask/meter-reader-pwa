import '@testing-library/jest-dom';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useParams: () => ({}),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/image — use React.createElement to avoid JSX in .ts file
// eslint-disable-next-line @typescript-eslint/no-require-imports
const React = require('react');
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) =>
    React.createElement('img', props),
}));
