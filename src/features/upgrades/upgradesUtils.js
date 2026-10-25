/**
 * Upgrades Utility Functions
 *
 * Pure functions for upgrade validation and calculations.
 * These functions are separated from React components for testability
 * and reusability.
 */

import { SHIP_CONFIG } from '../../game/constants.js';

/**
 * Validates an upgrade purchase.
 *
 * @param {string} upgradeId - Upgrade identifier
 * @param {Object} state - Current game state
 * @returns {Object} { valid: boolean, reason: string }
 */
export function validateUpgradePurchase(upgradeId, state) {
  const upgrade = SHIP_CONFIG.UPGRADES[upgradeId];

  if (!upgrade) {
    return { valid: false, reason: '잘못된 업그레이드 ID입니다' };
  }

  // Check if already installed
  const installedUpgrades = state.ship.upgrades || [];
  if (installedUpgrades.includes(upgradeId)) {
    return { valid: false, reason: '이미 설치된 업그레이드입니다' };
  }

  // Check if player has enough credits
  if (state.player.credits < upgrade.cost) {
    return { valid: false, reason: '크레딧이 부족합니다' };
  }

  return { valid: true };
}

/**
 * Formats upgrade effects for display.
 *
 * Converts effect object into human-readable strings.
 *
 * @param {Object} effects - Upgrade effects object
 * @returns {string[]} Array of formatted effect strings
 */
export function formatUpgradeEffects(effects) {
  const formatted = [];

  // Helper to format reduction/increase effects (multipliers)
  const formatReduction = (label, multiplier) => {
    const percent = Math.round((1 - multiplier) * 100);
    if (percent > 0) {
      return `${label}: -${percent}%`;
    } else if (percent < 0) {
      return `${label}: +${Math.abs(percent)}%`;
    }
    return null;
  };

  for (const [attr, value] of Object.entries(effects)) {
    if (attr === 'fuelCapacity') {
      formatted.push(`연료 용량: ${value}%`);
    } else if (attr === 'cargoCapacity') {
      formatted.push(`화물 용량: ${value}단위`);
    } else if (attr === 'hiddenCargoCapacity') {
      formatted.push(`은닉 화물: ${value}단위`);
    } else if (attr === 'fuelConsumption') {
      const text = formatReduction('연료 소비', value);
      if (text) formatted.push(text);
    } else if (attr === 'hullDegradation') {
      const text = formatReduction('선체 노후화', value);
      if (text) formatted.push(text);
    } else if (attr === 'lifeSupportDrain') {
      const text = formatReduction('생명 유지 소모', value);
      if (text) formatted.push(text);
    } else if (attr === 'eventVisibility') {
      formatted.push('연결된 항성계의 경제 이벤트 확인');
    }
  }

  return formatted;
}

/**
 * Gets available (unpurchased) upgrades.
 *
 * @param {Object} state - Current game state
 * @returns {string[]} Array of available upgrade IDs
 */
export function getAvailableUpgrades(state) {
  const installedUpgrades = state.ship.upgrades || [];
  const allUpgradeIds = Object.keys(SHIP_CONFIG.UPGRADES);

  return allUpgradeIds.filter((id) => !installedUpgrades.includes(id));
}

/**
 * Gets installed upgrades.
 *
 * @param {Object} state - Current game state
 * @returns {string[]} Array of installed upgrade IDs
 */
export function getInstalledUpgrades(state) {
  return state.ship.upgrades || [];
}

/**
 * Calculates credits after purchase.
 *
 * @param {string} upgradeId - Upgrade identifier
 * @param {number} currentCredits - Player's current credits
 * @returns {number} Credits after purchase
 */
export function calculateCreditsAfterPurchase(upgradeId, currentCredits) {
  const upgrade = SHIP_CONFIG.UPGRADES[upgradeId];
  if (!upgrade) {
    return currentCredits;
  }

  return currentCredits - upgrade.cost;
}
