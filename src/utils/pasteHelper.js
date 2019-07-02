import CryptoJS from 'crypto-js'
import qs from 'qs'

export function getPasteHash(url) {
  const hash = qs.parse(window.location.search, { ignoreQueryPrefix: true })
    .hash
  return hash
}

export function getPasteKey(url) {
  const key = qs.parse(window.location.search, { ignoreQueryPrefix: true }).key
  return key
}

export function generatePasteKey() {
  let text = ''
  let possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (var i = 0; i < 32; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  return text
}

export function encryptPayload(payload, key) {
  return CryptoJS.AES.encrypt(JSON.stringify(payload), key).toString()
}

export function decryptPayload(payload) {
  const bytes = CryptoJS.AES.decrypt(payload, getPasteKey())
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
}
