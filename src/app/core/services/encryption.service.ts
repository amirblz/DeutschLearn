import { Injectable } from '@angular/core';
import { ENCRYPTION_CONFIG } from '../constants/encryption.constants';

@Injectable({
    providedIn: 'root'
})
export class EncryptionService {
    private key: CryptoKey | null = null;

    // 1. Instant Initialization
    async init() {
        if (this.key) return;

        // Decode Base64 Key directly to Buffer
        const binaryString = atob(ENCRYPTION_CONFIG.RAW_KEY);
        const keyBuffer = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            keyBuffer[i] = binaryString.charCodeAt(i);
        }

        this.key = await crypto.subtle.importKey(
            'raw',
            keyBuffer,
            { name: 'AES-GCM' },
            false,
            ['encrypt', 'decrypt']
        );
    }

    // 2. Encrypt (Fast)
    async encrypt(data: any, itemId: string): Promise<string> {
        if (!this.key) await this.init();

        // Use Item ID to create a Deterministic IV (12 bytes)
        const iv = await this.generateIvFromId(itemId);

        const encoded = new TextEncoder().encode(JSON.stringify(data));

        const cipherBuffer = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv as BufferSource },
            this.key!,
            encoded
        );

        return this.arrayBufferToBase64(cipherBuffer);
    }

    // 3. Decrypt (Fast)
    async decrypt<T>(cipherText: string, itemId: string): Promise<T> {
        if (!this.key) await this.init();

        const iv = await this.generateIvFromId(itemId);
        const buffer = this.base64ToArrayBuffer(cipherText);

        try {
            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv as BufferSource },
                this.key!,
                buffer
            );
            return JSON.parse(new TextDecoder().decode(decrypted));
        } catch (e) {
            console.warn(`Decryption failed for item ${itemId}. Data may be corrupt or key is wrong.`);
            throw e;
        }
    }

    // --- Helpers ---

    // Hash the ID to get a consistent 12-byte IV
    // This saves us from storing the IV in the DB
    private async generateIvFromId(id: string): Promise<Uint8Array> {
        const encoder = new TextEncoder();
        const data = encoder.encode(id);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return new Uint8Array(hash.slice(0, 12)); // Take first 12 bytes
    }

    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    private base64ToArrayBuffer(base64: string): ArrayBuffer {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }
}