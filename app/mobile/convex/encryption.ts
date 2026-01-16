"use node";

/**
 * Encryption utilities for BYOK API keys.
 * 
 * Uses AES-256-GCM for encryption. The encryption key must be set as
 * BYOK_ENCRYPTION_KEY environment variable in the Convex dashboard.
 * 
 * Key format: 64 hex characters (256 bits)
 * Generate with: openssl rand -hex 32
 */

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a base64-encoded string containing: IV (12 bytes) + ciphertext + auth tag (16 bytes)
 */
export function encryptApiKey(plaintext: string): string {
    // Dynamic import for node crypto
    const crypto = require("crypto");

    const key = process.env.BYOK_ENCRYPTION_KEY;
    if (!key || key.length !== 64) {
        // In development, just base64 encode (not secure, but allows testing)
        console.warn("[BYOK] BYOK_ENCRYPTION_KEY not set or invalid, using base64 fallback (INSECURE)");
        return `b64:${Buffer.from(plaintext, "utf-8").toString("base64")}`;
    }

    const keyBuffer = Buffer.from(key, "hex");
    const iv = crypto.randomBytes(12); // 96 bits for GCM

    const cipher = crypto.createCipheriv("aes-256-gcm", keyBuffer, iv);
    const encrypted = Buffer.concat([
        cipher.update(plaintext, "utf-8"),
        cipher.final()
    ]);
    const authTag = cipher.getAuthTag();

    // Combine: IV + ciphertext + authTag
    const combined = Buffer.concat([iv, encrypted, authTag]);
    return `enc:${combined.toString("base64")}`;
}

/**
 * Decrypts a ciphertext string that was encrypted with encryptApiKey.
 */
export function decryptApiKey(ciphertext: string): string {
    // Handle base64 fallback
    if (ciphertext.startsWith("b64:")) {
        return Buffer.from(ciphertext.slice(4), "base64").toString("utf-8");
    }

    // Handle unencrypted legacy keys (migration case)
    if (!ciphertext.startsWith("enc:")) {
        console.warn("[BYOK] Legacy unencrypted key detected, returning as-is");
        return ciphertext;
    }

    const crypto = require("crypto");

    const key = process.env.BYOK_ENCRYPTION_KEY;
    if (!key || key.length !== 64) {
        throw new Error("BYOK_ENCRYPTION_KEY not set or invalid for decryption");
    }

    const keyBuffer = Buffer.from(key, "hex");
    const combined = Buffer.from(ciphertext.slice(4), "base64");

    // Extract: IV (12 bytes) + ciphertext + authTag (16 bytes)
    const iv = combined.subarray(0, 12);
    const authTag = combined.subarray(combined.length - 16);
    const encrypted = combined.subarray(12, combined.length - 16);

    const decipher = crypto.createDecipheriv("aes-256-gcm", keyBuffer, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
    ]);

    return decrypted.toString("utf-8");
}

/**
 * Checks if an API key is already encrypted.
 */
export function isEncrypted(value: string): boolean {
    return value.startsWith("enc:") || value.startsWith("b64:");
}
