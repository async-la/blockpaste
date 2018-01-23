import { swarmAddress } from '../constants/api'

export function BZZRawGetAsync(hash) {
  return new Promise((resolve, reject) => {
    const req = new XMLHttpRequest()
    req.open('GET', `${swarmAddress}/bzzr:/${hash}`)
    req.onload = event => {
      if (req.status === 200) {
        resolve(req.responseText)
      } else {
        reject(req.responseText)
      }
    }
    req.send(null)
  })
}

export function BZZRawPostAsync(payload) {
  return new Promise((resolve, reject) => {
    const req = new XMLHttpRequest()
    req.open('POST', `${swarmAddress}/bzzr:/`)
    req.onload = event => {
      if (req.status === 200) {
        resolve(req.responseText)
      } else {
        reject(req.responseText)
      }
    }
    req.send(payload)
  })
}
