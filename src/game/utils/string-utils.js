const DISPLAY_KO = {
  grain: '곡물',
  ore: '광석',
  tritium: '트리튬',
  parts: '부품',
  medicine: '의약품',
  electronics: '전자제품',
  business: '사업가',
  wealthy: '부유층',
  scientist: '과학자',
  family: '가족',
  registered_freight: '등록 화물',
  diplomatic_pouches: '외교 행낭',
  scientific_samples: '과학 시료',
  unmarked_crates: '무표기 상자',
  prohibited_tech: '금지 기술',
  black_market_goods: '암시장 물품',
};

/**
 * String utility functions for text formatting and display
 *
 * Centralizes common string operations used across UI components to ensure
 * consistent formatting and avoid duplication.
 */

import { SHIP_CONFIG } from '../constants.js';

/**
 * Sanitize ship name input
 *
 * Removes HTML tags, trims whitespace, and limits length to prevent display issues.
 * Returns default ship name if input is empty after sanitization.
 *
 * @param {string} name - User input for ship name
 * @returns {string} Sanitized name or default
 */
export function sanitizeShipName(name) {
  if (!name || name.trim().length === 0) {
    return SHIP_CONFIG.DEFAULT_NAME;
  }

  // Remove HTML tags, limit length, then trim (order matters for edge cases)
  const sanitized = name
    .replace(/<[^>]*>/g, '')
    .substring(0, SHIP_CONFIG.MAX_NAME_LENGTH)
    .trim();

  return sanitized || SHIP_CONFIG.DEFAULT_NAME;
}

/**
 * Capitalize first letter of a string for display purposes
 *
 * Used consistently across UI for commodity names, system types, and labels
 * to ensure uniform presentation.
 *
 * @param {string} str - String to capitalize
 * @returns {string} String with first letter capitalized
 */
export function capitalizeFirst(str) {
  if (!str || typeof str !== 'string') return String(str ?? '');
  const ko = DISPLAY_KO[str.toLowerCase()];
  if (ko) return ko;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format a quantity with "unit" or "units" based on count
 *
 * @param {number} count - The quantity
 * @returns {string} Formatted string like "1 unit" or "3 units"
 */
export function pluralizeUnit(count) {
  return `${count}단위`;
}

/**
 * Convert an underscored cargo ID to a title-cased display name
 *
 * @param {string} id - Cargo type ID (e.g., 'registered_freight')
 * @returns {string} Display name (e.g., 'Registered Freight')
 */
export function formatCargoDisplayName(id) {
  if (!id || typeof id !== 'string') return '';
  if (DISPLAY_KO[id]) return DISPLAY_KO[id];
  return id
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Map a ship condition percentage to a CSS class name
 *
 * @param {number} condition - Condition percentage (0-100)
 * @returns {string} CSS class name: 'good', 'fair', 'poor', or 'critical'
 */
export function getConditionClass(condition) {
  const thresholds = SHIP_CONFIG.UI_CONDITION_DISPLAY_THRESHOLDS;
  if (condition >= thresholds.EXCELLENT) return 'good';
  if (condition >= thresholds.FAIR) return 'fair';
  if (condition >= thresholds.POOR) return 'poor';
  return 'critical';
}

// 받침 유무를 보고 이/가 조사를 고른다
export function josaIga(word) {
  const w = String(word ?? '').trim();
  const ch = w.charCodeAt(w.length - 1);
  const batchim = ch >= 0xac00 && ch <= 0xd7a3 && (ch - 0xac00) % 28 !== 0;
  return batchim ? '이' : '가';
}

// 받침 유무를 보고 을/를 조사를 고른다
export function josaEulreul(word) {
  const w = String(word ?? '').trim();
  const ch = w.charCodeAt(w.length - 1);
  const batchim = ch >= 0xac00 && ch <= 0xd7a3 && (ch - 0xac00) % 28 !== 0;
  return batchim ? '을' : '를';
}
