/**
 * @fileoverview Faction Reputation and Karma Dialogue Conditions
 *
 * Helper functions for dialogue conditions that check faction reputation and karma.
 * These functions can be used in dialogue choice conditions to unlock/lock options
 * based on the player's standing with different factions and moral alignment.
 *
 * All functions that need game state accept a context object with:
 * - karma {number} - Player's current karma value
 * - factionReps {object} - Faction reputation values keyed by faction name
 *   (authorities, traders, outlaws, civilians)
 *
 * @module dialogue/faction-karma-conditions
 */

import { FACTION_CONFIG, KARMA_CONFIG } from '../../constants.js';

/**
 * Check if player has minimum faction reputation
 *
 * @param {string} faction - Faction name (authorities, traders, outlaws, civilians)
 * @param {number} minRep - Minimum reputation required
 * @param {object} context - Context object with karma and factionReps
 * @param {number} context.karma - Player's current karma
 * @param {object} context.factionReps - Faction reputation values keyed by faction name
 * @returns {boolean} True if player meets minimum faction reputation
 */
export function hasFactionRep(faction, minRep, context) {
  if (!FACTION_CONFIG.FACTIONS.includes(faction)) {
    console.warn(`Invalid faction in dialogue condition: ${faction}`);
    return false;
  }

  const factionRep = context.factionReps[faction] || 0;
  return factionRep >= minRep;
}

/**
 * Check if player has minimum karma level
 *
 * @param {number} minKarma - Minimum karma required
 * @param {object} context - Context object with karma and factionReps
 * @param {number} context.karma - Player's current karma
 * @returns {boolean} True if player meets minimum karma level
 */
export function hasKarma(minKarma, context) {
  return context.karma >= minKarma;
}

/**
 * Check if player has maximum karma level (for negative karma checks)
 *
 * @param {number} maxKarma - Maximum karma allowed
 * @param {object} context - Context object with karma and factionReps
 * @param {number} context.karma - Player's current karma
 * @returns {boolean} True if player is at or below maximum karma level
 */
export function hasMaxKarma(maxKarma, context) {
  return context.karma <= maxKarma;
}

/**
 * Check if player is trusted by authorities (high authority reputation)
 *
 * @param {object} context - Context object with karma and factionReps
 * @returns {boolean} True if player has high authority reputation (>=50)
 */
export function isTrustedByAuthorities(context) {
  return hasFactionRep(
    'authorities',
    FACTION_CONFIG.REPUTATION_THRESHOLDS.HIGH,
    context
  );
}

/**
 * Check if player is known to outlaws (high outlaw reputation)
 *
 * @param {object} context - Context object with karma and factionReps
 * @returns {boolean} True if player has high outlaw reputation (>=50)
 */
export function isKnownToOutlaws(context) {
  return hasFactionRep(
    'outlaws',
    FACTION_CONFIG.REPUTATION_THRESHOLDS.HIGH,
    context
  );
}

/**
 * Check if player is a friend to civilians (high civilian reputation)
 *
 * @param {object} context - Context object with karma and factionReps
 * @returns {boolean} True if player has high civilian reputation (>=50)
 */
export function isFriendToCivilians(context) {
  return hasFactionRep(
    'civilians',
    FACTION_CONFIG.REPUTATION_THRESHOLDS.HIGH,
    context
  );
}

/**
 * Check if player has good karma (positive moral alignment)
 *
 * @param {object} context - Context object with karma and factionReps
 * @returns {boolean} True if player has good karma (>=25)
 */
export function hasGoodKarma(context) {
  return hasKarma(KARMA_CONFIG.THRESHOLDS.GOOD, context);
}

/**
 * Check if player has bad karma (negative moral alignment)
 *
 * @param {object} context - Context object with karma and factionReps
 * @returns {boolean} True if player has bad karma (<=-25)
 */
export function hasBadKarma(context) {
  return hasMaxKarma(KARMA_CONFIG.THRESHOLDS.BAD, context);
}

/**
 * Check if player is wanted by authorities (low authority reputation)
 *
 * @param {object} context - Context object with karma and factionReps
 * @returns {boolean} True if player has low authority reputation (<=-25)
 */
export function isWantedByAuthorities(context) {
  const authorityRep = context.factionReps.authorities || 0;
  return authorityRep <= FACTION_CONFIG.REPUTATION_THRESHOLDS.LOW;
}

/**
 * Check if player has mixed reputation (high with one faction, low with opposing faction)
 *
 * @param {string} highFaction - Faction that should have high reputation
 * @param {string} lowFaction - Faction that should have low reputation
 * @param {object} context - Context object with karma and factionReps
 * @returns {boolean} True if player has high rep with one faction and low with the other
 */
export function hasMixedReputation(highFaction, lowFaction, context) {
  const highRep = context.factionReps[highFaction] || 0;
  const lowRep = context.factionReps[lowFaction] || 0;
  return (
    highRep >= FACTION_CONFIG.REPUTATION_THRESHOLDS.MODERATE &&
    lowRep <= FACTION_CONFIG.REPUTATION_THRESHOLDS.LOW
  );
}

/**
 * Karma-based first impression modifier for NPC text
 *
 * Returns a modifier string that can be appended to NPC greeting text
 * to reflect the NPC's first impression based on the player's karma.
 *
 * @param {number} karma - Player's current karma
 * @param {string} npcPersonality - NPC personality type ('lawful', 'neutral', 'chaotic')
 * @returns {string} Text modifier to append to greeting
 */
export function getKarmaFirstImpression(karma, npcPersonality = 'neutral') {
  if (karma >= KARMA_CONFIG.THRESHOLDS.VERY_GOOD) {
    // Very good karma
    switch (npcPersonality) {
      case 'lawful':
        return ' 정직해 보이는 분이군요.';
      case 'chaotic':
        return ' 이 동네치고는... 너무 깨끗해 보이는군요.';
      default:
        return ' 믿음직한 분위기가 있군요.';
    }
  } else if (karma >= KARMA_CONFIG.THRESHOLDS.GOOD) {
    // Good karma
    switch (npcPersonality) {
      case 'lawful':
        return ' 괜찮은 사람 같군요.';
      case 'chaotic':
        return ' 규칙을 잘 지킬 것 같은 분이군요.';
      default:
        return ' 믿을 만해 보이는군요.';
    }
  } else if (karma <= KARMA_CONFIG.THRESHOLDS.VERY_BAD) {
    // Very bad karma
    switch (npcPersonality) {
      case 'lawful':
        return ' 눈에 말썽이 보이는군요.';
      case 'chaotic':
        return " 이제야 섹터가 실제로 어떻게 돌아가는지 아는 사람이 왔군요.";
      default:
        return ' 위험한 기운이 느껴지는군요.';
    }
  } else if (karma <= KARMA_CONFIG.THRESHOLDS.BAD) {
    // Bad karma
    switch (npcPersonality) {
      case 'lawful':
        return ' 조심해야 할 사람 같아 보이는군요.';
      case 'chaotic':
        return ' 규칙을 구부릴 줄 아는 사람 같아 보이는군요.';
      default:
        return " 힘든 시절을 겪은 사람 같군요.";
    }
  }

  // Neutral karma - no modifier
  return '';
}

/**
 * Faction reputation-based attitude modifier for NPC text
 *
 * Returns a modifier string that can be appended to NPC text to reflect
 * their attitude based on the player's faction standing.
 *
 * @param {string} npcFaction - The faction this NPC belongs to or sympathizes with
 * @param {object} context - Context object with karma and factionReps
 * @returns {string} Text modifier to append to dialogue
 */
export function getFactionAttitudeModifier(npcFaction, context) {
  const factionRep = context.factionReps[npcFaction] || 0;

  if (factionRep >= FACTION_CONFIG.REPUTATION_THRESHOLDS.VERY_HIGH) {
    return " 당신은 우리 대의의 진정한 친구입니다.";
  } else if (factionRep >= FACTION_CONFIG.REPUTATION_THRESHOLDS.HIGH) {
    return ' 당신의 지지에 감사드립니다.';
  } else if (factionRep <= FACTION_CONFIG.REPUTATION_THRESHOLDS.EXTREME_LOW) {
    return " 당신의 평판이 앞서 오는군요, 좋지 않은 쪽으로요.";
  } else if (factionRep <= FACTION_CONFIG.REPUTATION_THRESHOLDS.VERY_LOW) {
    return ' 당신의 활동이... 우려스럽습니다.';
  }

  return '';
}
