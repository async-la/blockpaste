import config from '../config'

export function BZZRawGetAsync(hash) {
  return new Promise((resolve, reject) => {
    const req = new XMLHttpRequest()
    req.open('GET', `${config.swarmAddress}/bzz-raw:/${hash}`)
    req.onload = event => {
      if (req.status === 200) {
        resolve(req.responseText)
      } else {
        reject(req.responseText)
      }
    }
    req.withCredentials = true
    req.send(null)
  })
}

export function BZZRawPostAsync(payload) {
  return new Promise((resolve, reject) => {
    const req = new XMLHttpRequest()
    req.open('POST', `${config.swarmAddress}/bzz-raw:/`)
    req.onload = event => {
      if (req.status === 200) {
        resolve(req.responseText)
      } else {
        reject(req.responseText)
      }
    }
    req.withCredentials = true
    req.send(payload)
  })
}
