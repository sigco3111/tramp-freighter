import { INTELLIGENCE_CONFIG } from '../../game/constants';

/**
 * Validate intelligence purchase
 *
 * @param {number} cost - Intelligence cost
 * @param {number} credits - Player credits
 * @returns {Object} { valid: boolean, reason: string }
 */
export function validateIntelligencePurchase(cost, credits) {
  if (credits < cost) {
    return {
      valid: false,
      reason: '정보를 구매할 크레딧이 부족합니다',
    };
  }

  return { valid: true, reason: null };
}

/**
 * Validate rumor purchase
 *
 * @param {number} credits - Player credits
 * @returns {Object} { valid: boolean, reason: string }
 */
export function validateRumorPurchase(credits) {
  const rumorCost = INTELLIGENCE_CONFIG.PRICES.RUMOR;

  if (credits < rumorCost) {
    return {
      valid: false,
      reason: '소문을 구매할 크레딧이 부족합니다',
    };
  }

  return { valid: true, reason: null };
}

/**
 * Calculate discounted rumor cost
 *
 * @param {number} discountPercentage - Discount as decimal (e.g., 0.15 for 15%)
 * @returns {number} Discounted rumor cost
 */
export function calculateDiscountedRumorCost(discountPercentage) {
  const baseCost = INTELLIGENCE_CONFIG.PRICES.RUMOR;
  return Math.ceil(baseCost * (1 - discountPercentage));
}

/**
 * Calculate discounted intelligence cost
 *
 * @param {number} baseCost - Base intelligence cost
 * @param {number} discountPercentage - Discount as decimal (e.g., 0.15 for 15%)
 * @returns {number} Discounted intelligence cost
 */
export function calculateDiscountedIntelligenceCost(
  baseCost,
  discountPercentage
) {
  return Math.ceil(baseCost * (1 - discountPercentage));
}

/**
 * Get intelligence priority for sorting
 *
 * Prioritizes systems where intelligence is most valuable:
 * never visited → stale → recent → current
 *
 * @param {Object} option - Intelligence option with lastVisit property
 * @returns {number} Priority value (lower = higher priority)
 */
export function getIntelligencePriority(option) {
  if (option.lastVisit === null) return 0; // Never visited - highest priority
  if (option.lastVisit === 0) return 3; // Current - lowest priority (already have data)
  if (option.lastVisit > INTELLIGENCE_CONFIG.RECENT_THRESHOLD) return 1; // Stale
  return 2; // Recent
}

/**
 * Format source information for price knowledge display
 *
 * Converts source identifier into human-readable text.
 *
 * @param {string} source - Source identifier ('visited' or 'intelligence_broker')
 * @returns {string} Human-readable source text
 */
export function formatSource(source) {
  if (source === INTELLIGENCE_CONFIG.SOURCES.VISITED) {
    return '방문함';
  } else if (source === INTELLIGENCE_CONFIG.SOURCES.INTELLIGENCE_BROKER) {
    return '정보 중개인';
  } else if (source === INTELLIGENCE_CONFIG.SOURCES.ORBIT) {
    return '궤도만 통과';
  } else {
    // Fallback for old saves without source field
    return '알 수 없음';
  }
}

/**
 * Format staleness information for price knowledge display
 *
 * Converts lastVisit days into human-readable text with appropriate CSS class.
 * Centralizes staleness display logic to ensure consistency across UI.
 *
 * @param {number} lastVisit - Days since last visit (0 = current)
 * @returns {Object} { text: string, cssClass: string }
 */
export function formatStaleness(lastVisit) {
  if (lastVisit === 0) {
    return { text: '현재', cssClass: '' };
  } else if (lastVisit === 1) {
    return { text: '1일 경과', cssClass: '' };
  } else if (lastVisit <= INTELLIGENCE_CONFIG.STALENESS_THRESHOLDS.RECENT) {
    return { text: `${lastVisit}일 경과`, cssClass: '' };
  } else if (lastVisit <= INTELLIGENCE_CONFIG.STALENESS_THRESHOLDS.STALE) {
    return { text: `${lastVisit}일 경과`, cssClass: 'stale' };
  } else {
    return { text: `${lastVisit}일 경과`, cssClass: 'very-stale' };
  }
}

/**
 * Format visit information for intelligence list
 *
 * @param {number|null} lastVisit - Days since last visit (null = never visited, 0 = current)
 * @returns {string} Human-readable visit information
 */
export function formatVisitInfo(lastVisit, source) {
  if (source === INTELLIGENCE_CONFIG.SOURCES.ORBIT) {
    return '방문했지만 도킹한 적 없음';
  }
  if (lastVisit === null) {
    return '방문한 적 없음';
  } else if (lastVisit === 0) {
    return '현재 가격';
  } else if (lastVisit === 1) {
    return '마지막 방문: 1일 전';
  } else {
    return `마지막 방문: ${lastVisit}일 전`;
  }
}

/**
 * Sort intelligence options by priority
 *
 * @param {Array} options - Array of intelligence options
 * @returns {Array} Sorted array (highest priority first)
 */
export function sortIntelligenceByPriority(options) {
  return [...options].sort(
    (a, b) => getIntelligencePriority(a) - getIntelligencePriority(b)
  );
}

/**
 * Get systems with known prices sorted by staleness
 *
 * @param {Object} priceKnowledge - Player's price knowledge database
 * @param {Array} starData - Star system data
 * @returns {Array} Array of { system, knowledge } sorted by staleness (current first)
 */
export function getKnownSystemsSortedByStaleness(priceKnowledge, starData) {
  const knownSystemIds = Object.keys(priceKnowledge)
    .map(Number)
    .filter((id) => priceKnowledge[id].prices !== null);

  if (knownSystemIds.length === 0) {
    return [];
  }

  // Sort by staleness (current first, then recent, then stale)
  const sortedIds = knownSystemIds.sort((a, b) => {
    const aLastVisit = priceKnowledge[a].lastVisit;
    const bLastVisit = priceKnowledge[b].lastVisit;
    return aLastVisit - bLastVisit;
  });

  return sortedIds
    .map((systemId) => {
      const system = starData.find((s) => s.id === systemId);
      if (!system) return null;

      return {
        system,
        knowledge: priceKnowledge[systemId],
      };
    })
    .filter((item) => item !== null);
}
