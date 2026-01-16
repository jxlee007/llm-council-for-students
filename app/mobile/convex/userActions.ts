"use node";

import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { encryptApiKey, decryptApiKey } from "./encryption";

/**
 * User actions that require Node.js runtime for encryption.
 */

/**
 * Save API key with encryption.
 * This action encrypts the key before storing it in the database.
 */
export const saveApiKeySecure = action({
    args: { apiKey: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized");
        }

        // Encrypt the API key before storage
        const encryptedKey = encryptApiKey(args.apiKey);

        // Store the encrypted key
        await ctx.runMutation(internal.users.storeEncryptedApiKey, {
            clerkId: identity.subject,
            encryptedKey,
        });

        return { success: true };
    },
});

/**
 * Get decrypted API key for internal use.
 * Only called by other actions, never exposed to client.
 */
export const getDecryptedApiKey = async (
    ctx: { runQuery: Function; auth: { getUserIdentity: Function } },
    userId: string
): Promise<string | null> => {
    const userConfig = await ctx.runQuery(internal.users.getUserConfig, {
        userId,
    });

    if (!userConfig?.openRouterApiKey) {
        return null;
    }

    // Decrypt the key
    try {
        return decryptApiKey(userConfig.openRouterApiKey);
    } catch (error) {
        console.error("[BYOK] Failed to decrypt API key");
        return null;
    }
};
