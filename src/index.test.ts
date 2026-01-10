/**
 * Tests for RiotPlan stub functions
 */

import { describe, it, expect } from 'vitest';
import {
  VERSION,
  PLAN_CONVENTIONS,
  loadPlan,
  createPlan,
  parseStatus,
  generateStatus,
  executeStep,
  resumePlan,
  updatePlanState,
} from './index.js';

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
  describe('loadPlan', () => {
    it('should throw not implemented error', async () => {
      await expect(loadPlan('./some/path')).rejects.toThrow(
        'riotplan.loadPlan is not yet implemented'
      );
    });
  });

  describe('createPlan', () => {
    it('should throw not implemented error', async () => {
      await expect(
        createPlan({
          code: 'test',
          name: 'Test Plan',
          path: './test',
        })
      ).rejects.toThrow('riotplan.createPlan is not yet implemented');
    });
  });

  describe('parseStatus', () => {
    it('should throw not implemented error', () => {
      expect(() => parseStatus('# Status')).toThrow(
        'riotplan.parseStatus is not yet implemented'
      );
    });
  });

  describe('generateStatus', () => {
    it('should throw not implemented error', () => {
      expect(() => generateStatus({})).toThrow(
        'riotplan.generateStatus is not yet implemented'
      );
    });
  });

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

