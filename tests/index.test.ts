/**
 * Tests for RiotPlan exports and stub functions
 */

import { describe, it, expect } from 'vitest';
import {
  VERSION,
  PLAN_CONVENTIONS,
  executeStep,
  resumePlan,
  updatePlanState,
} from '../src/index.js';

describe('VERSION', () => {
  it('should export version string', () => {
    expect(VERSION).toBe('0.0.1');
  });
});

describe('PLAN_CONVENTIONS export', () => {
  it('should export PLAN_CONVENTIONS from types', () => {
    expect(PLAN_CONVENTIONS).toBeDefined();
    expect(PLAN_CONVENTIONS.standardFiles).toBeDefined();
  });
});

describe('Stub functions', () => {
  describe('executeStep', () => {
    it('should throw not implemented error', async () => {
      await expect(executeStep({}, 1)).rejects.toThrow(
        'riotplan.executeStep is not yet implemented'
      );
    });
  });

  describe('resumePlan', () => {
    it('should throw not implemented error', async () => {
      await expect(resumePlan({})).rejects.toThrow(
        'riotplan.resumePlan is not yet implemented'
      );
    });
  });

  describe('updatePlanState', () => {
    it('should throw not implemented error', () => {
      expect(() => updatePlanState({}, 1, {})).toThrow(
        'riotplan.updatePlanState is not yet implemented'
      );
    });
  });
});

