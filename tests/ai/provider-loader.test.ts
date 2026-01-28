import { describe, it, expect } from "vitest";
import {
    detectAvailableProviders,
    getDefaultProvider,
    getProviderApiKey,
} from "../../src/ai/provider-loader.js";

describe("Provider Loader", () => {
    describe("detectAvailableProviders", () => {
        it("should return array of available providers", async () => {
            const providers = await detectAvailableProviders();
            expect(Array.isArray(providers)).toBe(true);
        });
    });

    describe("getDefaultProvider", () => {
        it("should return null if no API keys set", () => {
            const originalAnthropicKey = process.env.ANTHROPIC_API_KEY;
            const originalOpenAIKey = process.env.OPENAI_API_KEY;
            const originalGoogleKey = process.env.GOOGLE_API_KEY;

            delete process.env.ANTHROPIC_API_KEY;
            delete process.env.OPENAI_API_KEY;
            delete process.env.GOOGLE_API_KEY;

            const provider = getDefaultProvider();
            expect(provider).toBeNull();

            // Restore
            if (originalAnthropicKey) process.env.ANTHROPIC_API_KEY = originalAnthropicKey;
            if (originalOpenAIKey) process.env.OPENAI_API_KEY = originalOpenAIKey;
            if (originalGoogleKey) process.env.GOOGLE_API_KEY = originalGoogleKey;
        });

        it("should return anthropic if ANTHROPIC_API_KEY is set", () => {
            const original = process.env.ANTHROPIC_API_KEY;
            process.env.ANTHROPIC_API_KEY = "test-key";

            const provider = getDefaultProvider();
            expect(provider).toBe("anthropic");

            // Restore
            if (original) {
                process.env.ANTHROPIC_API_KEY = original;
            } else {
                delete process.env.ANTHROPIC_API_KEY;
            }
        });
    });

    describe("getProviderApiKey", () => {
        it("should return undefined for unknown provider", () => {
            const key = getProviderApiKey("unknown");
            expect(key).toBeUndefined();
        });

        it("should return ANTHROPIC_API_KEY for anthropic provider", () => {
            const original = process.env.ANTHROPIC_API_KEY;
            process.env.ANTHROPIC_API_KEY = "test-key";

            const key = getProviderApiKey("anthropic");
            expect(key).toBe("test-key");

            // Restore
            if (original) {
                process.env.ANTHROPIC_API_KEY = original;
            } else {
                delete process.env.ANTHROPIC_API_KEY;
            }
        });

        it("should return ANTHROPIC_API_KEY for claude provider alias", () => {
            const original = process.env.ANTHROPIC_API_KEY;
            process.env.ANTHROPIC_API_KEY = "test-key";

            const key = getProviderApiKey("claude");
            expect(key).toBe("test-key");

            // Restore
            if (original) {
                process.env.ANTHROPIC_API_KEY = original;
            } else {
                delete process.env.ANTHROPIC_API_KEY;
            }
        });
    });
});
