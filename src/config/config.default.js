import { APP_BLOCKPASTE, APP_PLAYGROUND } from '../constants/app'

import localConfig from './config.local.js'

const isBlockpaste =
  localConfig.appId === APP_BLOCKPASTE ||
  process.env.REACT_APP_ENV === APP_BLOCKPASTE

export default {
  appId: localConfig.appId || isBlockpaste ? APP_BLOCKPASTE : APP_PLAYGROUND,
  isBlockpaste,
  rootAddress:
    process.env.NODE_ENV === 'production'
      ? isBlockpaste ? 'https://blockpaste.com' : 'https://web3playground.com'
      : 'http://localhost:3000',
  gethAddress:
    process.env.NODE_ENV === 'production'
      ? 'http://test.bzz.network'
      : 'http://test.bzz.network',
  swarmAddress:
    process.env.NODE_ENV === 'production'
      ? 'http://test.bzz.network'
      : 'http://test.bzz.network',
}
