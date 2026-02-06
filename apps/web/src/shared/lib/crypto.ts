/**
 * Crypto Utility
 *
 * Client-side encryption utilities using Web Crypto API.
 * Used for encrypting sensitive data before transmission.
 */

export interface EncryptedData {
  /** Base64 encoded encrypted data */
  ciphertext: string;
  /** Base64 encoded initialization vector */
  iv: string;
  /** Algorithm used for encryption */
  algorithm: 'AES-GCM';
}

export interface EncryptionKey {
  /** The raw CryptoKey for encryption */
  key: CryptoKey;
  /** Base64 encoded key for sharing with server */
  exportedKey: string;
}

/**
 * Generate a new AES-GCM encryption key
 *
 * @returns Promise resolving to encryption key with exportable format
 *
 * @example
 * ```typescript
 * const { key, exportedKey } = await generateEncryptionKey();
 * // Send exportedKey to server for decryption
 * ```
 */
export async function generateEncryptionKey(): Promise<EncryptionKey> {
  const key = await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );

  const rawKey = await crypto.subtle.exportKey('raw', key);
  const exportedKey = arrayBufferToBase64(rawKey);

  return { key, exportedKey };
}

/**
 * Import an encryption key from base64 string
 *
 * @param base64Key - Base64 encoded raw key
 * @returns Promise resolving to CryptoKey
 */
export async function importEncryptionKey(base64Key: string): Promise<CryptoKey> {
  const rawKey = base64ToArrayBuffer(base64Key);
  return crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data using AES-GCM
 *
 * @param data - Data to encrypt (string or ArrayBuffer)
 * @param key - CryptoKey for encryption
 * @returns Promise resolving to encrypted data with IV
 *
 * @example
 * ```typescript
 * const { key } = await generateEncryptionKey();
 * const encrypted = await encryptData('sensitive data', key);
 * // encrypted.ciphertext and encrypted.iv are base64 strings
 * ```
 */
export async function encryptData(
  data: string | ArrayBuffer,
  key: CryptoKey
): Promise<EncryptedData> {
  // Generate random IV (12 bytes for AES-GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Convert string to ArrayBuffer if needed
  const dataBuffer =
    typeof data === 'string' ? new TextEncoder().encode(data).buffer : data;

  // Encrypt
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    dataBuffer
  );

  return {
    ciphertext: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv.buffer),
    algorithm: 'AES-GCM',
  };
}

/**
 * Encrypt a Blob using AES-GCM
 *
 * @param blob - Blob to encrypt
 * @param key - CryptoKey for encryption
 * @returns Promise resolving to encrypted data with IV
 */
export async function encryptBlob(
  blob: Blob,
  key: CryptoKey
): Promise<EncryptedData> {
  const arrayBuffer = await blob.arrayBuffer();
  return encryptData(arrayBuffer, key);
}

/**
 * Decrypt data using AES-GCM
 *
 * @param encrypted - Encrypted data with IV
 * @param key - CryptoKey for decryption
 * @returns Promise resolving to decrypted ArrayBuffer
 */
export async function decryptData(
  encrypted: EncryptedData,
  key: CryptoKey
): Promise<ArrayBuffer> {
  const iv = base64ToArrayBuffer(encrypted.iv);
  const ciphertext = base64ToArrayBuffer(encrypted.ciphertext);

  return crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    ciphertext
  );
}

/**
 * Convert ArrayBuffer to base64 string
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

/**
 * Convert base64 string to ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Check if Web Crypto API is available
 */
export function isCryptoAvailable(): boolean {
  return (
    typeof crypto !== 'undefined' &&
    typeof crypto.subtle !== 'undefined' &&
    typeof crypto.subtle.encrypt === 'function'
  );
}
