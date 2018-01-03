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
