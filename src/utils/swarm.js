import config from '../config'

import { SwarmClient } from '@erebos/swarm'

const client = new SwarmClient({ bzz: { url: config.swarmAddress } })

export function BZZRawGetAsync(hash) {
  return client.bzz.download(hash, { mode: 'raw' })
}

export function BZZRawPostAsync(payload) {
  return client.bzz.uploadFile(payload, { mode: 'raw' })
}
