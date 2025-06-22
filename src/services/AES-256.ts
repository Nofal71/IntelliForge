import CryptoJS from 'crypto-js';

const SECRET_PASSPHRASE = import.meta.env.VITE_ENCRYPTION_SECRET;

export function encryptAES256(plainText: string): string {
  return CryptoJS.AES.encrypt(plainText, SECRET_PASSPHRASE).toString();
}

export function decryptAES256(cipherText: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_PASSPHRASE);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || '(failed to decrypt)';
  } catch (err) {
    console.error('Decryption error:', err);
    return '(decryption error)';
  }
}