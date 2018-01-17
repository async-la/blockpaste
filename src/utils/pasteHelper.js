import CryptoJS from 'crypto-js'

export function getPasteHash(url) {
  return window.location.pathname.replace(/\/|paste/g, '');
}

export function getPasteKey(url) {
  return window.location.hash.replace('#', '').replace(/(\?|&).*$/, '');
}

export function generatePasteKey() {
  return window.btoa(String.fromCharCode.apply(null, new Uint8Array(CryptoJS.lib.WordArray.random(128).words)))
}

export function encryptPayload(payload, key) {
  return CryptoJS.AES.encrypt(JSON.stringify(payload), key);
}

export function decryptPayload(payload) {
  const bytes = CryptoJS.AES.decrypt(payload, getPasteKey());
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}
