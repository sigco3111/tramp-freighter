import { BaseManager } from './base-manager.js';
import { DISTRESS_CONFIG } from '../../constants.js';
import { SeededRandom, buildEncounterSeed } from '../../utils/seeded-random.js';

/**
 * DistressManager - Handles civilian distress call encounters
 *
 * Extracted from DangerManager. Checks for and resolves distress call
 * encounters: respond, ignore, loot.
 *
 * Feature: danger-system, Property 11: Distress Call Outcomes
 * Validates: Requirements 7.1-7.10, 8.6, 8.7
 */
export class DistressManager extends BaseManager {
  /**
   * Check for distress call encounters during jump
   *
   * @returns {Object|null} Distress call object or null if no encounter
   */
  checkDistressCall() {
    this.validateState();

    const seed = buildEncounterSeed(
      this.capabilities.getDaysElapsed(),
      this.capabilities.getCurrentSystem(),
      'check_distress'
    );
    const seededRng = new SeededRandom(seed).next();

    if (seededRng < DISTRESS_CONFIG.CHANCE) {
      return {
        id: `distress_${Date.now()}`,
        type: 'civilian_distress',
        description:
          '민간 선박이 조난 신호를 보내고 있습니다. 엔진이 고장 나 도움이 필요합니다.',
        options: ['respond', 'ignore', 'loot'],
      };
    }

    return null;
  }

  /**
   * Resolve a distress call encounter choice and return the outcome
   *
   * @param {Object} distressCall - The distress call encounter object
   * @param {string} choice - Distress call choice ('respond', 'ignore', 'loot')
   * @returns {Object} Distress call outcome with success, costs, rewards, and description
   */
  resolveDistressCallEncounter(distressCall, choice) {
    this.validateState();

    let result;
    switch (choice) {
      case 'respond':
        result = this.resolveDistressRespond();
        this.capabilities.incrementDangerFlag('civiliansSaved');
        break;
      case 'ignore':
        result = this.resolveDistressIgnore();
        break;
      case 'loot':
        result = this.resolveDistressLoot();
        this.capabilities.incrementDangerFlag('civiliansLooted');
        break;
      default:
        throw new Error(`Unknown distress call choice: ${choice}`);
    }

    return result;
  }

  /**
   * Resolve respond distress call choice
   *
   * Costs: 2 days, 15% fuel, 5% life support
   * Rewards: ₡500, +10 civilian reputation, +1 karma
   *
   * @returns {Object} Distress call outcome
   */
  resolveDistressRespond() {
    return {
      success: true,
      costs: {
        days: DISTRESS_CONFIG.RESPOND.DAYS_COST,
        fuel: DISTRESS_CONFIG.RESPOND.FUEL_COST,
        lifeSupport: DISTRESS_CONFIG.RESPOND.LIFE_SUPPORT_COST,
      },
      rewards: {
        credits: DISTRESS_CONFIG.RESPOND.CREDITS_REWARD,
        factionRep: {
          civilians: DISTRESS_CONFIG.RESPOND.REP_REWARD,
        },
        karma: DISTRESS_CONFIG.RESPOND.KARMA_REWARD,
      },
      description:
        '조난 선박의 엔진 수리를 도왔습니다. 그들은 고마워하며 도움에 대한 보수를 지불했습니다.',
    };
  }

  /**
   * Resolve ignore distress call choice
   *
   * Costs: -1 karma
   *
   * @returns {Object} Distress call outcome
   */
  resolveDistressIgnore() {
    return {
      success: false,
      costs: {},
      rewards: {
        karma: DISTRESS_CONFIG.IGNORE.KARMA_PENALTY,
      },
      description:
        '조난 신호를 무시하고 갈 길을 갔습니다. 그 결정이 양심을 짓누릅니다.',
    };
  }

  /**
   * Resolve loot distress call choice
   *
   * Costs: 1 day, -3 karma, -15 civilian reputation
   * Rewards: +5 outlaw reputation, cargo
   *
   * @returns {Object} Distress call outcome
   */
  resolveDistressLoot() {
    return {
      success: true,
      costs: {
        days: DISTRESS_CONFIG.LOOT.DAYS_COST,
      },
      rewards: {
        karma: DISTRESS_CONFIG.LOOT.KARMA_PENALTY,
        factionRep: {
          civilians: DISTRESS_CONFIG.LOOT.REP_PENALTY,
          outlaws: DISTRESS_CONFIG.LOOT.OUTLAW_REP_GAIN,
        },
        cargo: [
          {
            good: 'parts',
            qty: DISTRESS_CONFIG.LOOT.SALVAGE_PARTS_QTY,
            buyPrice: 0,
            buySystemName: '인양함',
          },
        ],
      },
      description:
        '조난 선박에서 값진 부품을 인양했습니다. 선원들은 당신의 배신을 기억할 것입니다.',
    };
  }
}
