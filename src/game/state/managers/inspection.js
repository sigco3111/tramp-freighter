import { BaseManager } from './base-manager.js';
import { INSPECTION_CONFIG } from '../../constants.js';
import { SeededRandom, buildEncounterSeed } from '../../utils/seeded-random.js';

/**
 * InspectionManager - Handles customs inspection resolution
 *
 * Extracted from DangerManager. Resolves inspection choices:
 * cooperate, bribe, flee.
 *
 * Feature: danger-system, Property 7: Inspection Outcomes
 * Validates: Requirements 5.3-5.11, 8.4, 8.5, 8.7, 11.8
 */
export class InspectionManager extends BaseManager {
  /**
   * Resolve an inspection choice and return the outcome
   *
   * @param {string} choice - Inspection choice ('cooperate', 'bribe', 'flee')
   * @returns {Object} Inspection outcome with success, costs, rewards, and description
   */
  resolveInspection(choice) {
    this.validateState();

    const seed = buildEncounterSeed(
      this.capabilities.getDaysElapsed(),
      this.capabilities.getCurrentSystem(),
      'inspection'
    );
    const seededRng = new SeededRandom(seed).next();

    let result;
    switch (choice) {
      case 'cooperate':
        result = this.resolveInspectionCooperate(seededRng);
        this.capabilities.incrementDangerFlag('inspectionsPassed');
        break;
      case 'bribe':
        result = this.resolveInspectionBribe(seededRng);
        this.capabilities.incrementDangerFlag('inspectionsBribed');
        break;
      case 'flee':
        result = this.resolveInspectionFlee();
        this.capabilities.incrementDangerFlag('inspectionsFled');
        break;
      default:
        throw new Error(`Unknown inspection choice: ${choice}`);
    }

    return result;
  }

  /**
   * Resolve cooperate inspection choice
   *
   * Cooperate complies with the inspection, confiscating restricted goods
   * and imposing fines. Hidden cargo may be discovered based on security level.
   *
   * @param {number} rng - Random number (0-1) for hidden cargo discovery
   * @returns {Object} Inspection outcome
   */
  resolveInspectionCooperate(rng) {
    let totalFine = 0;
    let restrictedGoodsConfiscated = false;
    let hiddenCargoConfiscated = false;
    let authorityRepChange = INSPECTION_CONFIG.COOPERATE.AUTHORITY_REP_GAIN;
    let outlawRepChange = 0;

    const currentSystem = this.capabilities.getCurrentSystem() || 0;
    const zone = this.capabilities.getDangerZone(currentSystem);
    const cargo = this.capabilities.getShipCargo() || [];
    const restrictedCount = this.capabilities.countRestrictedGoods(
      cargo,
      zone,
      currentSystem
    );
    const hasRestrictedGoods = restrictedCount > 0;
    if (hasRestrictedGoods) {
      totalFine += INSPECTION_CONFIG.COOPERATE.RESTRICTED_FINE;
      restrictedGoodsConfiscated = true;
      authorityRepChange +=
        INSPECTION_CONFIG.REPUTATION_PENALTIES.RESTRICTED_GOODS;
    }

    const hiddenCargo = this.capabilities.getShipHiddenCargo();
    const hasHiddenCargo = hiddenCargo && hiddenCargo.length > 0;
    if (hasHiddenCargo) {
      let securityMultiplier;
      if (currentSystem === 0 || currentSystem === 1) {
        securityMultiplier = INSPECTION_CONFIG.SECURITY_LEVEL_MULTIPLIERS.core;
      } else {
        securityMultiplier = INSPECTION_CONFIG.SECURITY_LEVEL_MULTIPLIERS[zone];
      }

      const discoveryChance =
        INSPECTION_CONFIG.HIDDEN_CARGO_DISCOVERY_CHANCE * securityMultiplier;

      if (rng < discoveryChance) {
        totalFine += INSPECTION_CONFIG.COOPERATE.HIDDEN_FINE;
        hiddenCargoConfiscated = true;
        authorityRepChange =
          INSPECTION_CONFIG.REPUTATION_PENALTIES.HIDDEN_CARGO;
        outlawRepChange =
          INSPECTION_CONFIG.REPUTATION_PENALTIES.SMUGGLING_OUTLAW_BONUS;
      }
    }

    let description;
    if (restrictedGoodsConfiscated || hiddenCargoConfiscated) {
      if (hiddenCargoConfiscated) {
        description =
          '숨겨진 칸을 찾아냈습니다. 비싸게 먹히겠군요.';
      } else {
        description =
          "검사관의 표정이 굳습니다. 제한 품목입니다. 벌금이 부과됩니다.";
      }
    } else {
      description =
        '검사 완료. 모두 이상 없습니다. 검사관이 만족스럽게 고개를 끄덕입니다.';
    }

    const outcome = {
      success: true,
      costs: {
        credits: totalFine,
        isFine: totalFine > 0,
      },
      rewards: {
        factionRep: {
          authorities: authorityRepChange,
        },
      },
      description,
    };

    if (restrictedGoodsConfiscated) {
      outcome.costs.restrictedGoodsConfiscated = true;
    }
    if (hiddenCargoConfiscated) {
      outcome.costs.hiddenCargoConfiscated = true;
    }
    if (outlawRepChange > 0) {
      outcome.rewards.factionRep.outlaws = outlawRepChange;
    }

    return outcome;
  }

  /**
   * Resolve bribery inspection choice
   *
   * Success rate: 60% base chance
   * Success: Pay bribe cost, avoid confiscation
   * Failure: Pay bribe cost + additional fine, confiscate goods
   *
   * @param {number} rng - Random number (0-1) for bribery success
   * @returns {Object} Inspection outcome
   */
  resolveInspectionBribe(rng) {
    const success = rng < INSPECTION_CONFIG.BRIBE.BASE_CHANCE;

    let totalCost = INSPECTION_CONFIG.BRIBE.COST;
    let description = '세관 검사관에게 뇌물을 쓰려 했습니다.';

    if (success) {
      description =
        '검사관이 크레딧을 챙기고 통과시켜 줍니다. 이게 장부에서 빠질 거라곤 믿기 어렵군요.';
    } else {
      totalCost += INSPECTION_CONFIG.BRIBE.FAILURE_ADDITIONAL_FINE;
      description =
        '뇌물 시도 실패. 검사관이 추가 벌금을 부과했습니다.';
    }

    const costs = { credits: totalCost };
    if (!success) {
      costs.isFine = true;
    }

    return {
      success,
      costs,
      rewards: {
        factionRep: {
          authorities: INSPECTION_CONFIG.BRIBE.AUTHORITY_REP_PENALTY,
        },
      },
      description,
    };
  }

  /**
   * Resolve flee inspection choice
   *
   * Applies fuel and hull costs from an emergency burn, plus authority
   * reputation penalties.
   *
   * @returns {Object} Inspection outcome
   */
  resolveInspectionFlee() {
    return {
      success: false,
      costs: {
        fuel: INSPECTION_CONFIG.FLEE.FUEL_COST,
        hull: INSPECTION_CONFIG.FLEE.HULL_COST,
      },
      rewards: {
        factionRep: {
          authorities: INSPECTION_CONFIG.FLEE.AUTHORITY_REP_PENALTY,
        },
      },
      description:
        '스로틀을 밟고 이탈합니다. 비상 연소로 연료가 소모되고 선체가 흔들립니다.',
    };
  }
}
