export const rootAddress = process.env.NODE_ENV === 'production' ? 'https://blockpaste.com' : 'http://localhost:3000'
export const gethAddress = process.env.NODE_ENV === 'production' ? 'https://blockpaste.com/geth' : 'http://localhost:8545'
export const swarmAddress = process.env.NODE_ENV === 'production' ? 'https://blockpaste.com' : 'http://localhost:8500'
