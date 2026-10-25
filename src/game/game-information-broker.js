import {
  COMMODITY_TYPES,
  INTELLIGENCE_CONFIG,
  ENDGAME_CONFIG,
} from './constants.js';
import { TradingSystem } from './game-trading.js';
import { EconomicEventsSystem } from './game-events.js';
import { SeededRandom } from './utils/seeded-random.js';
import { formatCargoDisplayName } from './utils/string-utils.js';

/**
 * InformationBroker - Handles market intelligence purchases and rumor generation
 *
 * Provides players with price data for systems they haven't visited recently,
 * creating a strategic layer around information gathering and trading decisions.
 */
// 받침 유무에 따라 이/가 조사를 고른다
function iga(word) {
  const ch = word.trim().charCodeAt(word.trim().length - 1);
  const batchim = ch >= 0xac00 && ch <= 0xd7a3 && (ch - 0xac00) % 28 !== 0;
  return batchim ? '이' : '가';
}

export class InformationBroker {
  /**
   * Calculate intelligence cost for a system based on visit history
   *
   * @param {number} systemId - Target system ID
   * @param {Object} priceKnowledge - Player's price knowledge database
   * @returns {number} Cost in credits
   */
  static getIntelligenceCost(systemId, priceKnowledge) {
    const knowledge = priceKnowledge[systemId];

    // Never visited or orbit-only (no price data)
    if (!knowledge || knowledge.source === INTELLIGENCE_CONFIG.SOURCES.ORBIT) {
      return INTELLIGENCE_CONFIG.PRICES.NEVER_VISITED;
    }

    // Recently visited (within threshold)
    if (knowledge.lastVisit <= INTELLIGENCE_CONFIG.RECENT_THRESHOLD) {
      return INTELLIGENCE_CONFIG.PRICES.RECENT_VISIT;
    }

    // Stale visit (beyond threshold)
    return INTELLIGENCE_CONFIG.PRICES.STALE_VISIT;
  }

  /**
   * Purchase market intelligence for a system
   *
   * Deducts credits and updates price knowledge with current prices.
   * Intelligence data is sometimes unreliable - prices may be manipulated
   * to show false profit opportunities.
   *
   * @param {Object} gameState - Current game state
   * @param {number} systemId - Target system ID
   * @param {Array} starData - Star system data
   * @param {number} discount - Discount fraction (0-1), e.g. 0.15 for 15% off
   * @returns {Object} { success: boolean, reason: string }
   */
  static purchaseIntelligence(gameState, systemId, starData, discount = 0) {
    const priceKnowledge = gameState.world.priceKnowledge || {};
    const credits = gameState.player.credits;

    // Calculate cost
    let cost = InformationBroker.getIntelligenceCost(systemId, priceKnowledge);
    if (discount > 0) {
      cost = Math.ceil(cost * (1 - discount));
    }

    // Validate purchase
    const validation = InformationBroker.validatePurchase(cost, credits);
    if (!validation.valid) {
      return { success: false, reason: validation.reason };
    }

    // Find target system
    const system = starData.find((s) => s.id === systemId);
    if (!system) {
      return { success: false, reason: 'System not found' };
    }

    // Calculate current prices for the system
    const currentDay = gameState.player.daysElapsed;
    const activeEvents = gameState.world.activeEvents || [];
    const currentPrices = {};

    // Use seeded random for deterministic price manipulation
    // Seed includes system ID and day to ensure consistency
    const seed = `intel_${systemId}_${currentDay}`;
    const rng = new SeededRandom(seed);
    const marketConditions = gameState.world.marketConditions || {};

    for (const goodType of COMMODITY_TYPES) {
      let price = TradingSystem.calculatePrice(
        goodType,
        system,
        currentDay,
        activeEvents,
        marketConditions
      );

      // Sometimes the intelligence is unreliable - prices are manipulated
      // to show false profit opportunities
      if (rng.next() < INTELLIGENCE_CONFIG.RELIABILITY.MANIPULATION_CHANCE) {
        const manipulationMultiplier =
          INTELLIGENCE_CONFIG.RELIABILITY.MIN_MANIPULATION_MULTIPLIER +
          rng.next() *
            (INTELLIGENCE_CONFIG.RELIABILITY.MAX_MANIPULATION_MULTIPLIER -
              INTELLIGENCE_CONFIG.RELIABILITY.MIN_MANIPULATION_MULTIPLIER);
        price = Math.round(price * manipulationMultiplier);
      }

      currentPrices[goodType] = price;
    }

    // Deduct credits
    gameState.player.credits -= cost;

    // Update price knowledge
    gameState.world.priceKnowledge[systemId] = {
      lastVisit: 0, // Intelligence is "current"
      prices: currentPrices,
      source: INTELLIGENCE_CONFIG.SOURCES.INTELLIGENCE_BROKER,
    };

    return { success: true, reason: null };
  }

  /**
   * Clean up old intelligence data
   *
   * Removes market data older than INTELLIGENCE_MAX_AGE days to prevent
   * stale information from cluttering the player's knowledge base.
   *
   * lastVisit represents days since last visit and is incremented automatically
   * as time passes, so we just check if it exceeds the threshold.
   *
   * @param {Object} priceKnowledge - Player's price knowledge database
   * @returns {number} Number of systems cleaned up
   */
  static cleanupOldIntelligence(priceKnowledge) {
    let cleanedCount = 0;

    for (const systemId in priceKnowledge) {
      const knowledge = priceKnowledge[systemId];

      if (
        knowledge.lastVisit > INTELLIGENCE_CONFIG.MAX_AGE &&
        knowledge.source !== INTELLIGENCE_CONFIG.SOURCES.ORBIT
      ) {
        delete priceKnowledge[systemId];
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * Generate a market rumor with hints about prices or events
   *
   * Uses seeded random based on current day for deterministic behavior.
   * This ensures rumors are consistent for the same game state, making
   * testing reliable while still providing variety across different days.
   *
   * @param {Object} gameState - Current game state
   * @param {Array} starData - Star system data
   * @param {number} purchaseCount - Number of rumors already purchased (for seed variation)
   * @returns {string} Rumor text
   */
  static generateRumor(gameState, starData, purchaseCount = 0) {
    const currentDay = gameState.player.daysElapsed;
    const activeEvents = gameState.world.activeEvents || [];

    // Use seeded random for deterministic rumor generation
    const seed = `rumor_${currentDay}_${purchaseCount}`;
    const rng = new SeededRandom(seed);

    // Conditional Tanaka hint for mid-game players
    const visitedCount = gameState.world.visitedSystems?.length ?? 0;
    const tanakaFlag = gameState.world.narrativeEvents?.flags?.tanaka_met;
    if (
      !tanakaFlag &&
      visitedCount >= ENDGAME_CONFIG.BARNARDS_ENGINEER_RUMOR_SYSTEMS &&
      rng.next() < ENDGAME_CONFIG.INFO_BROKER_TANAKA_CHANCE
    ) {
      return "바너드 항성에 엔지니어가 하나 있어요. 타나카. 알려진 항로 너머로 배를 보낼 수 있는 구동 기술을 다루죠. 아무하고나 말하진 않지만요.";
    }

    // If there are active events, 50% chance to hint about one
    if (activeEvents.length > 0 && rng.next() < 0.5) {
      const marketDisruption = rng.pickRandom(activeEvents);
      const system = starData.find((s) => s.id === marketDisruption.systemId);

      if (system) {
        // Get event type name from the event object or use generic description
        const eventDescriptions = {
          mining_strike: '노동 분쟁',
          medical_emergency: '보건 위기',
          festival: '축제',
        };

        const description =
          eventDescriptions[marketDisruption.type] ||
          '이례적인 시장 상황';
        return `${system.name}에 ${description}${iga(description)} 있다고 들었습니다. 가 볼 만할지도 모릅니다.`;
      }
    }

    // Otherwise, hint about a good price somewhere
    const rumorCommodity = rng.pickRandom(COMMODITY_TYPES);
    const marketConditions = gameState.world.marketConditions || {};

    // Find a system with a good price for this commodity
    let bestSystem = null;
    let bestPrice = Infinity;

    for (const system of starData) {
      const price = TradingSystem.calculatePrice(
        rumorCommodity,
        system,
        currentDay,
        activeEvents,
        marketConditions
      );
      if (price < bestPrice) {
        bestPrice = price;
        bestSystem = system;
      }
    }

    if (bestSystem) {
      return `거리에선 지금 ${bestSystem.name}에서 ${formatCargoDisplayName(rumorCommodity)} 가격이 꽤 좋다는 소문입니다.`;
    }

    // Fallback generic rumor
    return `시장은 늘 변합니다. 기회를 놓치지 않도록 눈을 크게 뜨세요.`;
  }

  /**
   * Validate intelligence purchase
   *
   * @param {number} cost - Intelligence cost
   * @param {number} credits - Player credits
   * @returns {Object} { valid: boolean, reason: string }
   */
  static validatePurchase(cost, credits) {
    if (credits < cost) {
      return {
        valid: false,
        reason: '정보를 사기엔 크레딧이 부족합니다',
      };
    }

    return { valid: true, reason: null };
  }

  /**
   * Get all systems with their intelligence costs
   *
   * Used for displaying the information broker interface.
   * Only returns systems connected to the current system via wormholes.
   *
   * When Advanced Sensor Array upgrade is installed, includes active economic
   * events for connected systems.
   *
   * @param {Object} priceKnowledge - Player's price knowledge database
   * @param {Array} starData - Star system data
   * @param {number} currentSystemId - Current system ID
   * @param {Object} navigationSystem - NavigationSystem instance for checking connections
   * @param {Array} activeEvents - Active economic events (optional)
   * @param {boolean} hasAdvancedSensors - Whether Advanced Sensor Array is installed (optional)
   * @returns {Array} Array of { systemId, systemName, cost, lastVisit, event? }
   */
  static listAvailableIntelligence(
    priceKnowledge,
    starData,
    currentSystemId,
    navigationSystem,
    activeEvents = [],
    hasAdvancedSensors = false
  ) {
    // Get systems connected to current system
    const connectedSystemIds =
      navigationSystem.getConnectedSystems(currentSystemId);

    // Filter to only connected systems and map to intelligence data
    return starData
      .filter((system) => connectedSystemIds.includes(system.id))
      .map((system) => {
        const knowledge = priceKnowledge[system.id];
        const cost = InformationBroker.getIntelligenceCost(
          system.id,
          priceKnowledge
        );
        const lastVisit = knowledge ? knowledge.lastVisit : null;

        const result = {
          systemId: system.id,
          systemName: system.name,
          cost: cost,
          lastVisit: lastVisit,
          source: knowledge ? knowledge.source : null,
        };

        // Add event information if Advanced Sensor Array is installed
        if (hasAdvancedSensors && activeEvents.length > 0) {
          const systemEvent = activeEvents.find(
            (event) => event.systemId === system.id
          );
          if (systemEvent) {
            const eventTypeDef = Object.hasOwn(
              EconomicEventsSystem.EVENT_TYPES,
              systemEvent.type
            )
              ? EconomicEventsSystem.EVENT_TYPES[systemEvent.type]
              : null;
            if (eventTypeDef) {
              result.event = {
                name: eventTypeDef.name,
                commodities: Object.keys(systemEvent.modifiers),
                modifiers: systemEvent.modifiers,
              };
            }
          }
        }

        return result;
      });
  }
}
import {
  COMMODITY_TYPES,
  INTELLIGENCE_CONFIG,
  ENDGAME_CONFIG,
} from './constants.js';
import { TradingSystem } from './game-trading.js';
import { EconomicEventsSystem } from './game-events.js';
import { SeededRandom } from './utils/seeded-random.js';

/**
 * InformationBroker - Handles market intelligence purchases and rumor generation
 *
 * Provides players with price data for systems they haven't visited recently,
 * creating a strategic layer around information gathering and trading decisions.
 */
export class InformationBroker {
  /**
   * Calculate intelligence cost for a system based on visit history
   *
   * @param {number} systemId - Target system ID
   * @param {Object} priceKnowledge - Player's price knowledge database
   * @returns {number} Cost in credits
   */
  static getIntelligenceCost(systemId, priceKnowledge) {
    const knowledge = priceKnowledge[systemId];

    // Never visited or orbit-only (no price data)
    if (!knowledge || knowledge.source === INTELLIGENCE_CONFIG.SOURCES.ORBIT) {
      return INTELLIGENCE_CONFIG.PRICES.NEVER_VISITED;
    }

    // Recently visited (within threshold)
    if (knowledge.lastVisit <= INTELLIGENCE_CONFIG.RECENT_THRESHOLD) {
      return INTELLIGENCE_CONFIG.PRICES.RECENT_VISIT;
    }

    // Stale visit (beyond threshold)
    return INTELLIGENCE_CONFIG.PRICES.STALE_VISIT;
  }

  /**
   * Purchase market intelligence for a system
   *
   * Deducts credits and updates price knowledge with current prices.
   * Intelligence data is sometimes unreliable - prices may be manipulated
   * to show false profit opportunities.
   *
   * @param {Object} gameState - Current game state
   * @param {number} systemId - Target system ID
   * @param {Array} starData - Star system data
   * @param {number} discount - Discount fraction (0-1), e.g. 0.15 for 15% off
   * @returns {Object} { success: boolean, reason: string }
   */
  static purchaseIntelligence(gameState, systemId, starData, discount = 0) {
    const priceKnowledge = gameState.world.priceKnowledge || {};
    const credits = gameState.player.credits;

    // Calculate cost
    let cost = InformationBroker.getIntelligenceCost(systemId, priceKnowledge);
    if (discount > 0) {
      cost = Math.ceil(cost * (1 - discount));
    }

    // Validate purchase
    const validation = InformationBroker.validatePurchase(cost, credits);
    if (!validation.valid) {
      return { success: false, reason: validation.reason };
    }

    // Find target system
    const system = starData.find((s) => s.id === systemId);
    if (!system) {
      return { success: false, reason: 'System not found' };
    }

    // Calculate current prices for the system
    const currentDay = gameState.player.daysElapsed;
    const activeEvents = gameState.world.activeEvents || [];
    const currentPrices = {};

    // Use seeded random for deterministic price manipulation
    // Seed includes system ID and day to ensure consistency
    const seed = `intel_${systemId}_${currentDay}`;
    const rng = new SeededRandom(seed);
    const marketConditions = gameState.world.marketConditions || {};

    for (const goodType of COMMODITY_TYPES) {
      let price = TradingSystem.calculatePrice(
        goodType,
        system,
        currentDay,
        activeEvents,
        marketConditions
      );

      // Sometimes the intelligence is unreliable - prices are manipulated
      // to show false profit opportunities
      if (rng.next() < INTELLIGENCE_CONFIG.RELIABILITY.MANIPULATION_CHANCE) {
        const manipulationMultiplier =
          INTELLIGENCE_CONFIG.RELIABILITY.MIN_MANIPULATION_MULTIPLIER +
          rng.next() *
            (INTELLIGENCE_CONFIG.RELIABILITY.MAX_MANIPULATION_MULTIPLIER -
              INTELLIGENCE_CONFIG.RELIABILITY.MIN_MANIPULATION_MULTIPLIER);
        price = Math.round(price * manipulationMultiplier);
      }

      currentPrices[goodType] = price;
    }

    // Deduct credits
    gameState.player.credits -= cost;

    // Update price knowledge
    gameState.world.priceKnowledge[systemId] = {
      lastVisit: 0, // Intelligence is "current"
      prices: currentPrices,
      source: INTELLIGENCE_CONFIG.SOURCES.INTELLIGENCE_BROKER,
    };

    return { success: true, reason: null };
  }

  /**
   * Clean up old intelligence data
   *
   * Removes market data older than INTELLIGENCE_MAX_AGE days to prevent
   * stale information from cluttering the player's knowledge base.
   *
   * lastVisit represents days since last visit and is incremented automatically
   * as time passes, so we just check if it exceeds the threshold.
   *
   * @param {Object} priceKnowledge - Player's price knowledge database
   * @returns {number} Number of systems cleaned up
   */
  static cleanupOldIntelligence(priceKnowledge) {
    let cleanedCount = 0;

    for (const systemId in priceKnowledge) {
      const knowledge = priceKnowledge[systemId];

      if (
        knowledge.lastVisit > INTELLIGENCE_CONFIG.MAX_AGE &&
        knowledge.source !== INTELLIGENCE_CONFIG.SOURCES.ORBIT
      ) {
        delete priceKnowledge[systemId];
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * Generate a market rumor with hints about prices or events
   *
   * Uses seeded random based on current day for deterministic behavior.
   * This ensures rumors are consistent for the same game state, making
   * testing reliable while still providing variety across different days.
   *
   * @param {Object} gameState - Current game state
   * @param {Array} starData - Star system data
   * @param {number} purchaseCount - Number of rumors already purchased (for seed variation)
   * @returns {string} Rumor text
   */
  static generateRumor(gameState, starData, purchaseCount = 0) {
    const currentDay = gameState.player.daysElapsed;
    const activeEvents = gameState.world.activeEvents || [];

    // Use seeded random for deterministic rumor generation
    const seed = `rumor_${currentDay}_${purchaseCount}`;
    const rng = new SeededRandom(seed);

    // Conditional Tanaka hint for mid-game players
    const visitedCount = gameState.world.visitedSystems?.length ?? 0;
    const tanakaFlag = gameState.world.narrativeEvents?.flags?.tanaka_met;
    if (
      !tanakaFlag &&
      visitedCount >= ENDGAME_CONFIG.BARNARDS_ENGINEER_RUMOR_SYSTEMS &&
      rng.next() < ENDGAME_CONFIG.INFO_BROKER_TANAKA_CHANCE
    ) {
      return "바너드 항성에 엔지니어가 하나 있어요. 타나카. 알려진 항로 너머로 배를 보낼 수 있는 구동 기술을 다루죠. 아무하고나 말하진 않지만요.";
    }

    // If there are active events, 50% chance to hint about one
    if (activeEvents.length > 0 && rng.next() < 0.5) {
      const marketDisruption = rng.pickRandom(activeEvents);
      const system = starData.find((s) => s.id === marketDisruption.systemId);

      if (system) {
        // Get event type name from the event object or use generic description
        const eventDescriptions = {
          mining_strike: '노동 분쟁',
          medical_emergency: '보건 위기',
          festival: 'celebrations',
        };

        const description =
          eventDescriptions[marketDisruption.type] ||
          '이례적인 시장 상황';
        return `${system.name}에 ${description}이(가) 있다고 들었습니다. 가 볼 만할지도 모릅니다.`;
      }
    }

    // Otherwise, hint about a good price somewhere
    const rumorCommodity = rng.pickRandom(COMMODITY_TYPES);
    const marketConditions = gameState.world.marketConditions || {};

    // Find a system with a good price for this commodity
    let bestSystem = null;
    let bestPrice = Infinity;

    for (const system of starData) {
      const price = TradingSystem.calculatePrice(
        rumorCommodity,
        system,
        currentDay,
        activeEvents,
        marketConditions
      );
      if (price < bestPrice) {
        bestPrice = price;
        bestSystem = system;
      }
    }

    if (bestSystem) {
      return `거리에선 지금 ${bestSystem.name}에서 ${rumorCommodity} 가격이 꽤 좋다는 소문입니다.`;
    }

    // Fallback generic rumor
    return `시장은 늘 변합니다. 기회를 놓치지 않도록 눈을 크게 뜨세요.`;
  }

  /**
   * Validate intelligence purchase
   *
   * @param {number} cost - Intelligence cost
   * @param {number} credits - Player credits
   * @returns {Object} { valid: boolean, reason: string }
   */
  static validatePurchase(cost, credits) {
    if (credits < cost) {
      return {
        valid: false,
        reason: '정보를 사기엔 크레딧이 부족합니다',
      };
    }

    return { valid: true, reason: null };
  }

  /**
   * Get all systems with their intelligence costs
   *
   * Used for displaying the information broker interface.
   * Only returns systems connected to the current system via wormholes.
   *
   * When Advanced Sensor Array upgrade is installed, includes active economic
   * events for connected systems.
   *
   * @param {Object} priceKnowledge - Player's price knowledge database
   * @param {Array} starData - Star system data
   * @param {number} currentSystemId - Current system ID
   * @param {Object} navigationSystem - NavigationSystem instance for checking connections
   * @param {Array} activeEvents - Active economic events (optional)
   * @param {boolean} hasAdvancedSensors - Whether Advanced Sensor Array is installed (optional)
   * @returns {Array} Array of { systemId, systemName, cost, lastVisit, event? }
   */
  static listAvailableIntelligence(
    priceKnowledge,
    starData,
    currentSystemId,
    navigationSystem,
    activeEvents = [],
    hasAdvancedSensors = false
  ) {
    // Get systems connected to current system
    const connectedSystemIds =
      navigationSystem.getConnectedSystems(currentSystemId);

    // Filter to only connected systems and map to intelligence data
    return starData
      .filter((system) => connectedSystemIds.includes(system.id))
      .map((system) => {
        const knowledge = priceKnowledge[system.id];
        const cost = InformationBroker.getIntelligenceCost(
          system.id,
          priceKnowledge
        );
        const lastVisit = knowledge ? knowledge.lastVisit : null;

        const result = {
          systemId: system.id,
          systemName: system.name,
          cost: cost,
          lastVisit: lastVisit,
          source: knowledge ? knowledge.source : null,
        };

        // Add event information if Advanced Sensor Array is installed
        if (hasAdvancedSensors && activeEvents.length > 0) {
          const systemEvent = activeEvents.find(
            (event) => event.systemId === system.id
          );
          if (systemEvent) {
            const eventTypeDef = Object.hasOwn(
              EconomicEventsSystem.EVENT_TYPES,
              systemEvent.type
            )
              ? EconomicEventsSystem.EVENT_TYPES[systemEvent.type]
              : null;
            if (eventTypeDef) {
              result.event = {
                name: eventTypeDef.name,
                commodities: Object.keys(systemEvent.modifiers),
                modifiers: systemEvent.modifiers,
              };
            }
          }
        }

        return result;
      });
  }
}
