/**
 * chatEncryption.js
 * =================
 * Client-side AES-GCM end-to-end encryption for chat messages.
 * Uses the Web Crypto API - zero external dependencies, runs entirely in browser.
 *
 * Key derivation:  PBKDF2 (100,000 iterations, SHA-256)
 * Encryption:      AES-GCM 256-bit
 * Key material:    Derived from userId + session secret stored only in sessionStorage
 *
 * The encryption key never leaves the browser. The backend stores only
 * ciphertext + IV - it cannot read message content.
 *
 * Usage:
 *   import { encryptMessage, decryptMessage, initSession } from './chatEncryption';
 *   await initSession(userId);
 *   const { ciphertext, iv } = await encryptMessage('Hello');
 *   const plain = await decryptMessage(ciphertext, iv);
 */

const STORAGE_KEY = 'aura_chat_session_key';
const SALT_KEY    = 'aura_chat_salt';

// -- Encode/decode helpers -------------------------------------------------
const enc = new TextEncoder();
const dec = new TextDecoder();

function bufToBase64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function base64ToBuf(b64) {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

// -- Key generation --------------------------------------------------------

/**
 * Derive an AES-GCM key from a password + salt using PBKDF2.
 */
async function deriveKey(password, saltBuf) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name:       'PBKDF2',
      salt:       saltBuf,
      iterations: 100_000,
      hash:       'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,             // not extractable
    ['encrypt', 'decrypt']
  );
}

// -- Session management ----------------------------------------------------

let _sessionKey = null;

/**
 * Initialise the session encryption key.
 * Call once when the chat opens.
 * Key is derived from userId + a random session secret stored in sessionStorage.
 */
export async function initSession(userId) {
  if (_sessionKey) return;   // already initialised

  // Get or create a per-session secret (ephemeral - lost on tab close)
  let secret = sessionStorage.getItem(STORAGE_KEY);
  if (!secret) {
    const rand = crypto.getRandomValues(new Uint8Array(32));
    secret = bufToBase64(rand);
    sessionStorage.setItem(STORAGE_KEY, secret);
  }

  // Get or create a persistent salt (stored in localStorage - survives sessions)
  let saltB64 = localStorage.getItem(SALT_KEY);
  if (!saltB64) {
    const saltArr = crypto.getRandomValues(new Uint8Array(16));
    saltB64 = bufToBase64(saltArr);
    localStorage.setItem(SALT_KEY, saltB64);
  }

  const password = `${userId}:${secret}`;
  const saltBuf  = base64ToBuf(saltB64);

  _sessionKey = await deriveKey(password, saltBuf);
}

/**
 * Clear the session key (call on logout / chat close if desired).
 */
export function clearSession() {
  _sessionKey = null;
  sessionStorage.removeItem(STORAGE_KEY);
}

// -- Encrypt / Decrypt -----------------------------------------------------

/**
 * Encrypt a plaintext string.
 * Returns { ciphertext: string (base64), iv: string (base64) }
 */
export async function encryptMessage(plaintext) {
  if (!_sessionKey) throw new Error('Chat session not initialised. Call initSession() first.');

  const iv         = crypto.getRandomValues(new Uint8Array(12));   // 96-bit IV for AES-GCM
  const encoded    = enc.encode(plaintext);
  const cipherBuf  = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    _sessionKey,
    encoded
  );

  return {
    ciphertext: bufToBase64(cipherBuf),
    iv:         bufToBase64(iv),
  };
}

/**
 * Decrypt a ciphertext string.
 * Returns the plaintext string.
 */
export async function decryptMessage(ciphertextB64, ivB64) {
  if (!_sessionKey) throw new Error('Chat session not initialised. Call initSession() first.');

  const cipherBuf  = base64ToBuf(ciphertextB64);
  const iv         = base64ToBuf(ivB64);
  const plainBuf   = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    _sessionKey,
    cipherBuf
  );

  return dec.decode(plainBuf);
}

/**
 * Convenience: encrypt then immediately decrypt (round-trip test).
 * Returns true if successful.
 */
export async function testEncryption(userId) {
  await initSession(userId);
  const original   = 'Aura E2E encryption test 🔒';
  const { ciphertext, iv } = await encryptMessage(original);
  const decrypted  = await decryptMessage(ciphertext, iv);
  return decrypted === original;
}
