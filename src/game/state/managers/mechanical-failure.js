import { BaseManager } from './base-manager.js';
import { FAILURE_CONFIG } from '../../constants.js';
import { SeededRandom, buildEncounterSeed } from '../../utils/seeded-random.js';

/**
 * MechanicalFailureManager - Handles ship system failure checks and repairs
 *
 * Extracted from DangerManager. Checks for and resolves mechanical failures:
 * hull breach, engine failure, life support emergency.
 *
 * Feature: danger-system, Property 9: Mechanical Failure Thresholds
 * Feature: danger-system, Property 10: Engine Failure Repair Options
 * Validates: Requirements 6.1-6.11
 */
export class MechanicalFailureManager extends BaseManager {
  /**
   * Check for mechanical failures based on ship condition
   *
   * @returns {Object|null} Failure object with type and severity, or null if no failure
   */
  checkMechanicalFailure() {
    this.validateState();

    const seed = buildEncounterSeed(
      this.capabilities.getDaysElapsed(),
      this.capabilities.getCurrentSystem(),
      'check_mechanical'
    );
    const seededRng = new SeededRandom(seed).next();

    const ship = this.capabilities.getShipCondition();

    if (ship.hull < FAILURE_CONFIG.HULL_BREACH.CONDITION_THRESHOLD) {
      if (seededRng < FAILURE_CONFIG.HULL_BREACH.CHANCE) {
        return {
          type: 'hull_breach',
          severity: ship.hull,
        };
      }
    }

    if (ship.engine < FAILURE_CONFIG.ENGINE_FAILURE.CONDITION_THRESHOLD) {
      if (seededRng < FAILURE_CONFIG.ENGINE_FAILURE.CHANCE) {
        return {
          type: 'engine_failure',
          severity: ship.engine,
        };
      }
    }

    if (ship.lifeSupport < FAILURE_CONFIG.LIFE_SUPPORT.CONDITION_THRESHOLD) {
      if (seededRng < FAILURE_CONFIG.LIFE_SUPPORT.CHANCE) {
        return {
          type: 'life_support',
          severity: ship.lifeSupport,
        };
      }
    }

    return null;
  }

  /**
   * Resolve a mechanical failure with the chosen repair option
   *
   * @param {string} failureType - Type of failure ('hull_breach', 'engine_failure', 'life_support')
   * @param {string|null} choice - Repair choice (null for immediate consequences)
   * @returns {Object} Failure resolution outcome with success, costs, and description
   */
  resolveMechanicalFailure(failureType, choice) {
    this.validateState();

    const seed = buildEncounterSeed(
      this.capabilities.getDaysElapsed(),
      this.capabilities.getCurrentSystem(),
      'resolve_mechanical'
    );
    const seededRng = new SeededRandom(seed).next();

    switch (failureType) {
      case 'hull_breach':
        return this.resolveHullBreach();
      case 'engine_failure':
        return this.resolveEngineFailure(choice, seededRng);
      case 'life_support':
        return this.resolveLifeSupportEmergency();
      default:
        throw new Error(`Unknown failure type: ${failureType}`);
    }
  }

  /**
   * Resolve hull breach failure
   *
   * @returns {Object} Hull breach outcome
   */
  resolveHullBreach() {
    return {
      success: false,
      costs: {
        hull: FAILURE_CONFIG.HULL_BREACH.HULL_DAMAGE,
        cargoLoss: true,
      },
      rewards: {},
      description:
        '선체 파손 감지! 비상 격벽이 봉쇄되었지만 일부 화물이 우주로 유실되었습니다.',
    };
  }

  /**
   * Resolve engine failure with repair choice
   *
   * @param {string} choice - Repair choice ('emergency_restart', 'call_for_help', 'jury_rig')
   * @param {number} rng - Random number (0-1) for success determination
   * @returns {Object} Engine failure resolution outcome
   */
  resolveEngineFailure(choice, rng) {
    switch (choice) {
      case 'emergency_restart':
        return this.resolveEmergencyRestart(rng);
      case 'call_for_help':
        return this.resolveCallForHelp();
      case 'jury_rig':
        return this.resolveJuryRig(rng);
      default:
        throw new Error(`Unknown engine failure repair choice: ${choice}`);
    }
  }

  /**
   * Resolve emergency restart repair option
   *
   * @param {number} rng - Random number (0-1) for success determination
   * @returns {Object} Emergency restart outcome
   */
  resolveEmergencyRestart(rng) {
    const success =
      rng < FAILURE_CONFIG.ENGINE_FAILURE.EMERGENCY_RESTART.CHANCE;

    if (success) {
      return {
        success: true,
        costs: {
          engine: FAILURE_CONFIG.ENGINE_FAILURE.EMERGENCY_RESTART.ENGINE_COST,
        },
        rewards: {},
        description:
          '비상 재시동 성공! 엔진이 다시 돌아가지만 상태가 나빠졌습니다.',
      };
    } else {
      return {
        success: false,
        costs: {
          engine: FAILURE_CONFIG.ENGINE_FAILURE.EMERGENCY_RESTART.ENGINE_COST,
        },
        rewards: {},
        description:
          '비상 재시동 실패. 엔진 상태가 악화되었고 발이 묶였습니다.',
      };
    }
  }

  /**
   * Resolve call for help repair option
   *
   * @returns {Object} Call for help outcome
   */
  resolveCallForHelp() {
    return {
      success: true,
      costs: {
        credits: FAILURE_CONFIG.ENGINE_FAILURE.CALL_FOR_HELP.CREDITS_COST,
        days: FAILURE_CONFIG.ENGINE_FAILURE.CALL_FOR_HELP.DAYS_DELAY,
      },
      rewards: {},
      description:
        '구조 예인선이 도착해 엔진을 수리했습니다. 수수료가 청구되고 시간을 잃었습니다.',
    };
  }

  /**
   * Resolve jury-rig repair option
   *
   * @param {number} rng - Random number (0-1) for success determination
   * @returns {Object} Jury-rig outcome
   */
  resolveJuryRig(rng) {
    const success = rng < FAILURE_CONFIG.ENGINE_FAILURE.JURY_RIG.CHANCE;

    if (success) {
      return {
        success: true,
        costs: {
          engine: FAILURE_CONFIG.ENGINE_FAILURE.JURY_RIG.ENGINE_COST,
        },
        rewards: {},
        description:
          '임시변통 수리 성공! 땜질로 엔진이 다시 돌아갑니다.',
      };
    } else {
      return {
        success: false,
        costs: {
          engine: FAILURE_CONFIG.ENGINE_FAILURE.JURY_RIG.ENGINE_COST,
        },
        rewards: {},
        description:
          '임시변통 수리 실패. 엔진 상태가 악화되었고 발이 묶였습니다.',
      };
    }
  }

  /**
   * Resolve life support emergency
   *
   * @returns {Object} Life support emergency outcome
   */
  resolveLifeSupportEmergency() {
    return {
      success: false,
      costs: {
        lifeSupport: FAILURE_CONFIG.LIFE_SUPPORT.EMERGENCY_COST,
      },
      rewards: {},
      description:
        '생명 유지 비상! 예비 시스템이 가동되었지만 전반적인 상태가 나빠졌습니다.',
    };
  }
}
