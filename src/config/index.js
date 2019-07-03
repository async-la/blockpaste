import { APP_SWARM_BIN, APP_PLAYGROUND } from '../constants/app'

const isSwarmBin = process.env.REACT_APP_ID === APP_SWARM_BIN

export default {
  appId: isSwarmBin ? APP_SWARM_BIN : APP_PLAYGROUND,
  isSwarmBin,
  rootAddress:
    process.env.NODE_ENV === 'production'
      ? isSwarmBin
        ? 'https://swarm-gateways.net/bzz:/swarmbin.eth'
        : 'https://play.blockpaste.com'
      : 'http://localhost:3000',
  gethAddress:
    process.env.NODE_ENV === 'production'
      ? 'https://test.bzz.network/geth'
      : 'https://test.bzz.network/geth',
  swarmAddress:
    process.env.NODE_ENV === 'production'
      ? 'https://swarm-gateways.net'
      : 'https://swarm-gateways.net',
}
