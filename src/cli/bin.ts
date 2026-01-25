#!/usr/bin/env node

/**
 * RiotPlan CLI executable entry point
 * This file is the actual binary that gets executed when running `riotplan`
 */

import { createProgram } from './cli.js';

const program = createProgram();
program.parse();
