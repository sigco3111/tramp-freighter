import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RepairManager } from '../../src/game/state/managers/repair.js';
import { REPAIR_CONFIG } from '../../src/game/constants.js';

describe('Emergency Patch', () => {
  let repairManager;
  let capabilities;
  let mockState;

  beforeEach(() => {
    mockState = {
      player: { credits: 0, daysElapsed: 10 },
      ship: { hull: 5, engine: 80, lifeSupport: 90 },
    };

    capabilities = {
      getShipCondition: () => ({
        hull: mockState.ship.hull,
        engine: mockState.ship.engine,
        lifeSupport: mockState.ship.lifeSupport,
      }),
      getCredits: () => mockState.player.credits,
      getDaysElapsed: () => mockState.player.daysElapsed,
      updateShipCondition: vi.fn(),
      advanceTime: vi.fn(),
      markDirty: vi.fn(),
      isTestEnvironment: true,
    };

    repairManager = new RepairManager(capabilities);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should set system to EMERGENCY_PATCH_TARGET (21%)', () => {
    const result = repairManager.applyEmergencyPatch('hull');

    expect(result.success).toBe(true);
    expect(capabilities.updateShipCondition).toHaveBeenCalledWith(
      REPAIR_CONFIG.EMERGENCY_PATCH_TARGET,
      80,
      90
    );
  });

  it('should advance time by EMERGENCY_PATCH_DAYS_PENALTY days', () => {
    repairManager.applyEmergencyPatch('hull');

    expect(capabilities.advanceTime).toHaveBeenCalledWith(
      10 + REPAIR_CONFIG.EMERGENCY_PATCH_DAYS_PENALTY
    );
  });

  it('should reject patch for system above critical threshold', () => {
    mockState.ship.engine = 50;
    const result = repairManager.applyEmergencyPatch('engine');

    expect(result.success).toBe(false);
    expect(result.reason).toContain('심각하게 손상되지 않았습니다');
  });

  it('should reject patch for invalid system type', () => {
    const result = repairManager.applyEmergencyPatch('weapons');

    expect(result.success).toBe(false);
    expect(result.reason).toBe('잘못된 시스템 유형입니다');
  });

  it('should reject patch when player can afford repair above threshold', () => {
    mockState.player.credits = 1000;
    const result = repairManager.applyEmergencyPatch('hull');

    expect(result.success).toBe(false);
    expect(result.reason).toContain('감당할 수 있습니다');
  });

  it('should save game after successful patch', () => {
    repairManager.applyEmergencyPatch('hull');

    expect(capabilities.markDirty).toHaveBeenCalled();
  });
});
