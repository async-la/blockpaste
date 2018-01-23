export const rootAddress =
  process.env.NODE_ENV === 'production'
    ? 'https://blockpaste.com'
    : 'http://localhost:3000'
export const gethAddress =
  process.env.NODE_ENV === 'production'
    ? 'http://test.bzz.network'
    : 'http://test.bzz.network'
export const swarmAddress =
  process.env.NODE_ENV === 'production'
    ? 'http://test.bzz.network'
    : 'http://test.bzz.network'
