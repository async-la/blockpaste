import { APP_BLOCKPASTE, APP_PLAYGROUND } from '../constants/app'

const isBlockpaste = process.env.REACT_APP_ID === APP_BLOCKPASTE

export default {
  appId: isBlockpaste ? APP_BLOCKPASTE : APP_PLAYGROUND,
  isBlockpaste,
  rootAddress:
    process.env.NODE_ENV === 'production'
      ? isBlockpaste ? 'https://blockpaste.com' : 'https://play.blockpaste.com'
      : 'http://localhost:3000',
  gethAddress:
    process.env.NODE_ENV === 'production'
      ? 'https://test.bzz.network/geth'
      : 'https://test.bzz.network/geth',
  swarmAddress:
    process.env.NODE_ENV === 'production'
      ? 'https://test.bzz.network'
      : 'https://test.bzz.network',
}
