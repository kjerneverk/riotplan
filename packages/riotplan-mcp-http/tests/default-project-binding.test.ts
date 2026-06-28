import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @redaksjon/context — use vi.hoisted for the getProject mock
const { mockReadProjectBinding, mockBindProjectToPlan, mockResolveDirectory, mockGetProject, mockCreateContext } = vi.hoisted(() => ({
    mockReadProjectBinding: vi.fn(),
    mockBindProjectToPlan: vi.fn(),
    mockResolveDirectory: vi.fn(),
    mockGetProject: vi.fn(),
    mockCreateContext: vi.fn(),
}));

vi.mock('../src/tools/project-binding-shared.js', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return {
        ...actual,
        readProjectBinding: mockReadProjectBinding,
        bindProjectToPlan: mockBindProjectToPlan,
    };
});

vi.mock('../src/tools/shared.js', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return {
        ...actual,
        resolveDirectory: mockResolveDirectory,
    };
});

vi.mock('@redaksjon/context', () => ({
    create: mockCreateContext,
}));

import { __test__ } from '../src/server-hono.js';

const { applyDefaultProjectBinding, defaultProjectStore } = __test__;

describe('applyDefaultProjectBinding', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        mockReadProjectBinding.mockResolvedValue(null);
        mockBindProjectToPlan.mockResolvedValue(undefined);
        mockResolveDirectory.mockReturnValue('/fake/path/test.plan');
        mockCreateContext.mockResolvedValue({ getProject: mockGetProject });
    });

    describe('X-Default-Project header', () => {
        it('binds plan to project from header when project exists', async () => {
            mockGetProject.mockReturnValue({ id: 'my-project', name: 'My Project' });

            const config = { port: 8080, plansDir: '/tmp', contextDir: '/tmp' };
            const result = { success: true, data: { planId: 'test-plan' } };

            await defaultProjectStore.run('my-project', async () => {
                await applyDefaultProjectBinding(
                    'riotplan_plan',
                    { action: 'create' },
                    result,
                    '/tmp',
                    config as any
                );
            });

            expect(mockBindProjectToPlan).toHaveBeenCalledWith(
                '/fake/path/test.plan',
                { id: 'my-project', relationship: 'primary' }
            );
        });

        it('throws error when header project does not exist in context', async () => {
            mockGetProject.mockReturnValue(undefined);

            const config = { port: 8080, plansDir: '/tmp', contextDir: '/tmp' };
            const result = { success: true, data: { planId: 'test-plan' } };

            await expect(
                defaultProjectStore.run('nonexistent-project', async () => {
                    await applyDefaultProjectBinding(
                        'riotplan_plan',
                        { action: 'create' },
                        result,
                        '/tmp',
                        config as any
                    );
                })
            ).rejects.toThrow(/not found in context/);

            expect(mockBindProjectToPlan).not.toHaveBeenCalled();
        });
    });

    describe('server config defaultProject fallback', () => {
        it('falls back to server config when no header is set', async () => {
            mockGetProject.mockReturnValue({ id: 'fallback-project', name: 'Fallback' });

            const config = {
                port: 8080,
                plansDir: '/tmp',
                contextDir: '/tmp',
                defaultProject: {
                    id: 'fallback-project',
                    name: 'Fallback Project',
                    relationship: 'primary' as const,
                },
            };
            const result = { success: true, data: { planId: 'test-plan' } };

            await applyDefaultProjectBinding(
                'riotplan_plan',
                { action: 'create' },
                result,
                '/tmp',
                config as any
            );

            expect(mockBindProjectToPlan).toHaveBeenCalledWith(
                '/fake/path/test.plan',
                { id: 'fallback-project', name: 'Fallback Project', relationship: 'primary' }
            );
        });

        it('throws when server config defaultProject does not exist in context', async () => {
            mockGetProject.mockReturnValue(undefined);

            const config = {
                port: 8080,
                plansDir: '/tmp',
                contextDir: '/tmp',
                defaultProject: {
                    id: 'nonexistent',
                    name: 'Nonexistent',
                    relationship: 'primary' as const,
                },
            };
            const result = { success: true, data: { planId: 'test-plan' } };

            await expect(
                applyDefaultProjectBinding(
                    'riotplan_plan',
                    { action: 'create' },
                    result,
                    '/tmp',
                    config as any
                )
            ).rejects.toThrow(/not found in context/);
        });
    });

    describe('header vs server config priority', () => {
        it('header takes priority over server config', async () => {
            mockGetProject.mockReturnValue({ id: 'header-project', name: 'Header' });

            const config = {
                port: 8080,
                plansDir: '/tmp',
                contextDir: '/tmp',
                defaultProject: {
                    id: 'config-project',
                    name: 'Config Project',
                    relationship: 'primary' as const,
                },
            };
            const result = { success: true, data: { planId: 'test-plan' } };

            await defaultProjectStore.run('header-project', async () => {
                await applyDefaultProjectBinding(
                    'riotplan_plan',
                    { action: 'create' },
                    result,
                    '/tmp',
                    config as any
                );
            });

            expect(mockBindProjectToPlan).toHaveBeenCalledWith(
                '/fake/path/test.plan',
                { id: 'header-project', relationship: 'primary' }
            );
        });
    });

    describe('no binding cases', () => {
        it('does not bind when neither header nor server config is set', async () => {
            const config = { port: 8080, plansDir: '/tmp', contextDir: '/tmp' };
            const result = { success: true, data: { planId: 'test-plan' } };

            await applyDefaultProjectBinding(
                'riotplan_plan',
                { action: 'create' },
                result,
                '/tmp',
                config as any
            );

            expect(mockBindProjectToPlan).not.toHaveBeenCalled();
        });

        it('does not bind when plan already has a project binding', async () => {
            mockReadProjectBinding.mockResolvedValue({
                project: { id: 'existing-project', relationship: 'primary' },
                source: 'explicit',
                migration: { manifestCreated: false },
            });
            const config = { port: 8080, plansDir: '/tmp', contextDir: '/tmp' };
            const result = { success: true, data: { planId: 'test-plan' } };

            await defaultProjectStore.run('my-project', async () => {
                await applyDefaultProjectBinding(
                    'riotplan_plan',
                    { action: 'create' },
                    result,
                    '/tmp',
                    config as any
                );
            });

            expect(mockBindProjectToPlan).not.toHaveBeenCalled();
        });

        it('does not bind for non-create tool calls', async () => {
            const config = { port: 8080, plansDir: '/tmp', contextDir: '/tmp' };
            const result = { success: true, data: { planId: 'test-plan' } };

            await defaultProjectStore.run('my-project', async () => {
                await applyDefaultProjectBinding(
                    'riotplan_plan',
                    { action: 'status' },
                    result,
                    '/tmp',
                    config as any
                );
            });

            expect(mockBindProjectToPlan).not.toHaveBeenCalled();
        });

        it('does not bind when result is unsuccessful', async () => {
            const config = { port: 8080, plansDir: '/tmp', contextDir: '/tmp' };
            const result = { success: false, data: { planId: 'test-plan' } };

            await defaultProjectStore.run('my-project', async () => {
                await applyDefaultProjectBinding(
                    'riotplan_plan',
                    { action: 'create' },
                    result,
                    '/tmp',
                    config as any
                );
            });

            expect(mockBindProjectToPlan).not.toHaveBeenCalled();
        });
    });

    describe('riotplan_create tool', () => {
        it('triggers binding for riotplan_create tool without action param', async () => {
            mockGetProject.mockReturnValue({ id: 'my-project', name: 'My Project' });

            const config = { port: 8080, plansDir: '/tmp', contextDir: '/tmp' };
            const result = { success: true, data: { planId: 'test-plan' } };

            await defaultProjectStore.run('my-project', async () => {
                await applyDefaultProjectBinding(
                    'riotplan_create',
                    {},
                    result,
                    '/tmp',
                    config as any
                );
            });

            expect(mockBindProjectToPlan).toHaveBeenCalled();
        });
    });

    describe('plan reference extraction', () => {
        it('uses code field when planId is not present', async () => {
            mockGetProject.mockReturnValue({ id: 'my-project', name: 'My Project' });

            const config = { port: 8080, plansDir: '/tmp', contextDir: '/tmp' };
            const result = { success: true, data: { code: 'my-plan-code' } };

            await defaultProjectStore.run('my-project', async () => {
                await applyDefaultProjectBinding(
                    'riotplan_plan',
                    { action: 'create' },
                    result,
                    '/tmp',
                    config as any
                );
            });

            expect(mockResolveDirectory).toHaveBeenCalledWith(
                { planId: 'my-plan-code' },
                expect.anything()
            );
        });

        it('does not bind when no plan reference can be extracted', async () => {
            const config = { port: 8080, plansDir: '/tmp', contextDir: '/tmp' };
            const result = { success: true, data: {} };

            await defaultProjectStore.run('my-project', async () => {
                await applyDefaultProjectBinding(
                    'riotplan_plan',
                    { action: 'create' },
                    result,
                    '/tmp',
                    config as any
                );
            });

            expect(mockBindProjectToPlan).not.toHaveBeenCalled();
        });
    });
});
