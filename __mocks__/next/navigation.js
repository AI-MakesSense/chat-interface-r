const useRouter = jest.fn(() => ({
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
}));

const usePathname = jest.fn(() => '/');

const useSearchParams = jest.fn(() => new URLSearchParams());

module.exports = {
  useRouter,
  usePathname,
  useSearchParams,
};
