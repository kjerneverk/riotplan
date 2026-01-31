/**
 * Tests for RiotPlan configuration schema
 */

import { describe, it, expect } from 'vitest';
import { RiotPlanConfigSchema } from '../../src/config/schema.js';

describe('RiotPlanConfigSchema', () => {
    describe('valid configurations', () => {
        it('should accept config with all fields', () => {
            const config = {
                planDirectory: './my-plans',
                defaultProvider: 'anthropic' as const,
                defaultModel: 'claude-3-5-sonnet-20241022',
                templateDirectory: './templates',
            };

            const result = RiotPlanConfigSchema.parse(config);
            expect(result.planDirectory).toBe('./my-plans');
            expect(result.defaultProvider).toBe('anthropic');
            expect(result.defaultModel).toBe('claude-3-5-sonnet-20241022');
            expect(result.templateDirectory).toBe('./templates');
        });

        it('should accept config with only planDirectory', () => {
            const config = {
                planDirectory: './plans',
            };

            const result = RiotPlanConfigSchema.parse(config);
            expect(result.planDirectory).toBe('./plans');
            expect(result.defaultProvider).toBeUndefined();
            expect(result.defaultModel).toBeUndefined();
            expect(result.templateDirectory).toBeUndefined();
        });

        it('should apply default value for planDirectory when not provided', () => {
            const config = {};

            const result = RiotPlanConfigSchema.parse(config);
            expect(result.planDirectory).toBe('./plans');
        });

        it('should accept valid provider values', () => {
            const providers = ['anthropic', 'openai', 'gemini'] as const;

            for (const provider of providers) {
                const config = {
                    planDirectory: './plans',
                    defaultProvider: provider,
                };

                const result = RiotPlanConfigSchema.parse(config);
                expect(result.defaultProvider).toBe(provider);
            }
        });
    });

    describe('invalid configurations', () => {
        it('should reject invalid provider value', () => {
            const config = {
                planDirectory: './plans',
                defaultProvider: 'invalid-provider',
            };

            expect(() => {
                RiotPlanConfigSchema.parse(config);
            }).toThrow();
        });

        it('should reject non-string planDirectory', () => {
            const config = {
                planDirectory: 123,
            };

            expect(() => {
                RiotPlanConfigSchema.parse(config);
            }).toThrow();
        });

        it('should reject non-string defaultModel', () => {
            const config = {
                planDirectory: './plans',
                defaultModel: 123,
            };

            expect(() => {
                RiotPlanConfigSchema.parse(config);
            }).toThrow();
        });

        it('should reject non-string templateDirectory', () => {
            const config = {
                planDirectory: './plans',
                templateDirectory: 123,
            };

            expect(() => {
                RiotPlanConfigSchema.parse(config);
            }).toThrow();
        });
    });

    describe('optional fields', () => {
        it('should allow undefined optional fields', () => {
            const config = {
                planDirectory: './plans',
            };

            const result = RiotPlanConfigSchema.parse(config);
            expect(result.defaultProvider).toBeUndefined();
            expect(result.defaultModel).toBeUndefined();
            expect(result.templateDirectory).toBeUndefined();
        });

        it('should allow empty config object (uses defaults)', () => {
            const config = {};

            const result = RiotPlanConfigSchema.parse(config);
            expect(result.planDirectory).toBe('./plans');
        });
    });
});
