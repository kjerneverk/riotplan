/**
 * Configuration commands for RiotPlan CLI
 *
 * Provides commands for managing RiotPlan configuration:
 * - --init-config: Create initial configuration file
 * - --check-config: Show current configuration resolution
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { existsSync, writeFileSync, statSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { loadConfig, resolvePlanDirectory, findPlansDirectory } from '../../config/index.js';

/**
 * Register configuration commands
 */
export function registerConfigCommands(program: Command): void {
    // --init-config flag
    program
        .option('--init-config', 'Create initial riotplan.config.yaml file')
        .hook('preAction', async (thisCommand) => {
            if (thisCommand.opts().initConfig) {
                await handleInitConfig();
                process.exit(0);
            }
        });

    // --check-config command
    program
        .command('check-config')
        .description('Show current configuration resolution and validation')
        .action(async () => {
            await handleCheckConfig();
        });
}

/**
 * Handle --init-config flag
 * Creates a riotplan.config.yaml file with sensible defaults
 */
async function handleInitConfig(): Promise<void> {
    const configPath = resolve(process.cwd(), 'riotplan.config.yaml');

    // Check if config file already exists
    if (existsSync(configPath)) {
        console.log(chalk.yellow(`⚠ Configuration file already exists: ${configPath}`));
        console.log(chalk.dim('Use --check-config to view current configuration.'));
        return;
    }

    // Create config file with defaults
    const configContent = `# RiotPlan Configuration
# See https://github.com/kjerneverk/riotplan for documentation

# Directory where plans are stored (relative or absolute)
# Relative paths are resolved from this config file's location
planDirectory: ./plans

# Optional: Default AI provider for plan generation
# Options: anthropic, openai, gemini
# defaultProvider: anthropic

# Optional: Default model to use for plan generation
# Examples: claude-3-5-sonnet-20241022, gpt-4, gemini-pro
# defaultModel: claude-3-5-sonnet-20241022

# Optional: Custom template directory
# templateDirectory: ./.riotplan/templates
`;

    try {
        writeFileSync(configPath, configContent, 'utf-8');
        console.log(chalk.green(`✓ Created configuration file: ${configPath}`));
        console.log(chalk.dim('\nEdit this file to customize your RiotPlan configuration.'));
        console.log(chalk.dim('Run "riotplan check-config" to verify your configuration.'));
    } catch (error) {
        console.error(chalk.red(`✗ Failed to create config file: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
    }
}

/**
 * Handle check-config command
 * Shows current configuration resolution and validation
 */
async function handleCheckConfig(): Promise<void> {
    console.log(chalk.bold('\nRiotPlan Configuration Check'));
    console.log('============================\n');

    let configSource = 'Unknown';
    let configLocation: string | null = null;
    let planDirectory: string;
    let config: Awaited<ReturnType<typeof loadConfig>> = null;

    // Check tier 1: Environment variable
    if (process.env.RIOTPLAN_PLAN_DIRECTORY) {
        configSource = 'Environment variable (tier 1)';
        planDirectory = resolve(process.env.RIOTPLAN_PLAN_DIRECTORY);
        console.log(chalk.green('✓ Configuration loaded successfully\n'));
        console.log(`Source: ${chalk.bold(configSource)}`);
        console.log(`Environment Variable: ${chalk.cyan('RIOTPLAN_PLAN_DIRECTORY')}`);
        console.log(`Plan Directory: ${chalk.cyan(planDirectory)} ${existsSync(planDirectory) ? chalk.green('(exists)') : chalk.yellow('(does not exist)')}`);
    } else {
        // Check tier 2: Config file
        try {
            config = await loadConfig();
            if (config) {
                configSource = 'Config file (tier 2)';
                // Try to find the config file location
                configLocation = findConfigFileLocation();
                planDirectory = resolve(config.planDirectory || './plans');
                console.log(chalk.green('✓ Configuration loaded successfully\n'));
                console.log(`Source: ${chalk.bold(configSource)}`);
                if (configLocation) {
                    console.log(`Location: ${chalk.cyan(configLocation)}`);
                }
                console.log(`Plan Directory: ${chalk.cyan(planDirectory)} ${existsSync(planDirectory) ? chalk.green('(exists)') : chalk.yellow('(does not exist)')}`);
            } else {
                // Check tier 3: Walk-up
                const foundPlansParent = findPlansDirectory(process.cwd());
                if (foundPlansParent) {
                    configSource = 'Walk-up detection (tier 3)';
                    planDirectory = join(foundPlansParent, 'plans');
                    console.log(chalk.green('✓ Configuration resolved successfully\n'));
                    console.log(`Source: ${chalk.bold(configSource)}`);
                    console.log(`Found plans/ directory at: ${chalk.cyan(dirname(planDirectory))}`);
                    console.log(`Plan Directory: ${chalk.cyan(planDirectory)} ${existsSync(planDirectory) ? chalk.green('(exists)') : chalk.yellow('(does not exist)')}`);
                } else {
                    // Tier 4: Fallback
                    configSource = 'Fallback (tier 4)';
                    planDirectory = join(process.cwd(), 'plans');
                    console.log(chalk.yellow('⚠ Using default configuration\n'));
                    console.log(`Source: ${chalk.bold(configSource)}`);
                    console.log(`Plan Directory: ${chalk.cyan(planDirectory)} ${existsSync(planDirectory) ? chalk.green('(exists)') : chalk.yellow('(will be created on first use)')}`);
                }
            }
        } catch (error) {
            console.log(chalk.red('✗ Configuration error\n'));
            console.log(`Error: ${chalk.red(error instanceof Error ? error.message : String(error))}`);
            console.log(chalk.dim('\nFix the configuration error and try again.'));
            process.exit(1);
        }
    }

    // Show resolved plan directory
    try {
        const resolved = await resolvePlanDirectory();
        console.log(`\nResolved Plan Directory: ${chalk.bold.cyan(resolved)}`);
    } catch (error) {
        console.log(chalk.yellow(`\n⚠ Could not resolve plan directory: ${error instanceof Error ? error.message : String(error)}`));
    }

    // Show config settings if available
    if (config) {
        console.log('\nSettings:');
        if (config.planDirectory) {
            console.log(`  planDirectory: ${chalk.cyan(config.planDirectory)}`);
        }
        if (config.defaultProvider) {
            console.log(`  defaultProvider: ${chalk.cyan(config.defaultProvider)}`);
        }
        if (config.defaultModel) {
            console.log(`  defaultModel: ${chalk.cyan(config.defaultModel)}`);
        }
        if (config.templateDirectory) {
            console.log(`  templateDirectory: ${chalk.cyan(config.templateDirectory)}`);
        }
        if (!config.planDirectory && !config.defaultProvider && !config.defaultModel && !config.templateDirectory) {
            console.log(chalk.dim('  (using defaults)'));
        }
    }

    console.log();
}

/**
 * Try to find the config file location by walking up the directory tree
 */
function findConfigFileLocation(): string | null {
    const configNames = [
        'riotplan.config.yaml',
        'riotplan.config.yml',
        'riotplan.config.json',
        'riotplan.config.js',
        'riotplan.config.ts',
        'riotplan.conf.yaml',
        'riotplan.conf.yml',
        'riotplan.conf.json',
        '.riotplanrc.yaml',
        '.riotplanrc.yml',
        '.riotplanrc.json',
        '.riotplanrc',
    ];

    let currentPath = process.cwd();

    while (currentPath !== '/') {
        for (const name of configNames) {
            const configPath = join(currentPath, name);
            if (existsSync(configPath)) {
                try {
                    const stats = statSync(configPath);
                    if (stats.isFile()) {
                        return configPath;
                    }
                } catch {
                    // Continue searching
                }
            }
        }

        // Check .riotplan/config.*
        const dotRiotplanDir = join(currentPath, '.riotplan');
        if (existsSync(dotRiotplanDir)) {
            try {
                const stats = statSync(dotRiotplanDir);
                if (stats.isDirectory()) {
                    for (const ext of ['yaml', 'yml', 'json', 'js', 'ts']) {
                        const configPath = join(dotRiotplanDir, `config.${ext}`);
                        if (existsSync(configPath)) {
                            return configPath;
                        }
                    }
                }
            } catch {
                // Continue searching
            }
        }

        const parentPath = dirname(currentPath);
        if (parentPath === currentPath) {
            break;
        }
        currentPath = parentPath;
    }

    return null;
}
