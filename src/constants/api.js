export const rootAddress = process.env.NODE_ENV === 'production' ? 'http://sandbox.asy.nc' : 'http://localhost:3000'
export const gethAddress = process.env.NODE_ENV === 'production' ? 'http://sandbox.asy.nc/geth' : 'http://localhost:8545'
export const swarmAddress = process.env.NODE_ENV === 'production' ? 'http://sandbox.asy.nc' : 'http://localhost:8500'
