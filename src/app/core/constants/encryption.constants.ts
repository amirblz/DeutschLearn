export const ENCRYPTION_CONFIG = {
    // ✅ FIX: This is a real, valid 32-byte key (Base64 encoded)
    // You can generate a new one in Node terminal: crypto.randomBytes(32).toString('base64')
    RAW_KEY: 'n4bQgYhMfWWaL+qgxVrQFZO/TxsrC4Is0V1sFbDwCgg=',
    ALGO_NAME: 'AES-GCM'
};